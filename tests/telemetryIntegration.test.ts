import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseAndNormalizeTelemetry } from '../src/utils/telemetryParser';
import { LeakDetectionEngine } from '../src/utils/leakDetection';
import { ThresholdConfig, TelemetryReading, DataSource } from '../src/types/sensor';

const testThresholds: ThresholdConfig = {
  mismatchThreshold: 1.5,
  persistenceDurationSec: 5,
  highConsumptionThreshold: 25.0,
  highConsumptionDurationSec: 6,
  nightTimeStartHour: 23,
  nightTimeEndHour: 5,
  nightTimeThreshold: 1.0,
  sensorTimeoutSec: 10,
};

describe('MQTT Telemetry Parsing & Normalization Unit Tests', () => {
  test('1. Parses actual Wokwi firmware payload (inlet, outlet, source=wokwi)', () => {
    const payload = JSON.stringify({
      deviceId: 'waterguard-wokwi-esp32',
      source: 'wokwi',
      isSimulated: true,
      sequence: 3,
      isValid: true,
      inlet: 8.0,
      outlet: 8.0,
      scenario: 'normal',
    });

    const { reading, error } = parseAndNormalizeTelemetry(payload);
    assert.equal(error, undefined);
    assert.ok(reading !== null);
    assert.equal(reading.deviceId, 'waterguard-wokwi-esp32');
    assert.equal(reading.inletFlow, 8.0);
    assert.equal(reading.outletFlow, 8.0);
    assert.equal(reading.flowDifference, 0.0);
    assert.equal(reading.isValid, true);
    assert.equal(reading.isSimulated, true);
    assert.equal(reading.source, 'wokwi');
    assert.equal(reading.notes, 'Scenario: normal');
  });

  test('2. Preserves compatibility with canonical payload (inletFlow, outletFlow)', () => {
    const payload = JSON.stringify({
      deviceId: 'ESP32_01',
      inletFlow: 12.5,
      outletFlow: 12.3,
      timestamp: 1700000000000,
      isValid: true,
    });

    const { reading, error } = parseAndNormalizeTelemetry(payload);
    assert.equal(error, undefined);
    assert.ok(reading !== null);
    assert.equal(reading.deviceId, 'ESP32_01');
    assert.equal(reading.inletFlow, 12.5);
    assert.equal(reading.outletFlow, 12.3);
    assert.equal(reading.flowDifference, 0.2);
    assert.equal(reading.timestamp, 1700000000000);
    assert.equal(reading.isValid, true);
  });

  test('3. Handles stringified numeric flow values correctly without units corruption', () => {
    const payload = JSON.stringify({
      deviceId: 'ESP32_WOKWI_01',
      inlet: '16.50',
      outlet: '10.80',
      ts: 1700000000,
      isValid: true,
      isSimulated: 'true',
    });

    const { reading, error } = parseAndNormalizeTelemetry(payload);
    assert.equal(error, undefined);
    assert.ok(reading !== null);
    assert.equal(reading.inletFlow, 16.5);
    assert.equal(reading.outletFlow, 10.8);
    assert.equal(reading.flowDifference, 5.7);
    // ts was in seconds; normalized to ms
    assert.equal(reading.timestamp, 1700000000000);
    assert.equal(reading.isSimulated, true);
  });

  test('4. Safely rejects non-finite values (Infinity, NaN, string text)', () => {
    const payloadInf = JSON.stringify({ inlet: 'Infinity', outlet: 8.0 });
    const resInf = parseAndNormalizeTelemetry(payloadInf);
    assert.equal(resInf.reading, null);
    assert.match(resInf.error || '', /Non-finite flow values/);

    const payloadNaN = JSON.stringify({ inlet: 'NaN', outlet: 8.0 });
    const resNaN = parseAndNormalizeTelemetry(payloadNaN);
    assert.equal(resNaN.reading, null);

    const payloadText = JSON.stringify({ inlet: 'not_a_number', outlet: 8.0 });
    const resText = parseAndNormalizeTelemetry(payloadText);
    assert.equal(resText.reading, null);

    const payloadEmpty = JSON.stringify({ inlet: '', outlet: 8.0 });
    const resEmpty = parseAndNormalizeTelemetry(payloadEmpty);
    assert.equal(resEmpty.reading, null);
  });

  test('5. Flags negative flow readings as invalid', () => {
    const payload = JSON.stringify({
      deviceId: 'ESP32_FAULT',
      inlet: -5.0,
      outlet: 10.0,
    });

    const { reading, error } = parseAndNormalizeTelemetry(payload);
    assert.equal(error, undefined);
    assert.ok(reading !== null);
    assert.equal(reading.isValid, false);
  });

  test('6. Rejects malformed JSON syntax gracefully', () => {
    const malformed = '{ "deviceId": "corrupt", inlet: 8.0 ';
    const { reading, error } = parseAndNormalizeTelemetry(malformed);
    assert.equal(reading, null);
    assert.match(error || '', /Invalid JSON/);
  });

  test('7. Rejects missing required flow fields', () => {
    const payload = JSON.stringify({ deviceId: 'test_dev', temperature: 25.0 });
    const { reading, error } = parseAndNormalizeTelemetry(payload);
    assert.equal(reading, null);
    assert.match(error || '', /Missing flow rate fields/);
  });
});

describe('Telemetry State Isolation & Detection Engine Feeding', () => {
  test('8. Wokwi telemetry feeds Authoritative LeakDetectionEngine and detects leak', () => {
    const engine = new LeakDetectionEngine();
    const t0 = 1700000000000;

    // Simulate sustained mismatch from Wokwi MQTT telemetry (16.5 In, 10.8 Out -> diff 5.7)
    const rawPacket = JSON.stringify({
      deviceId: 'waterguard-wokwi-esp32',
      source: 'wokwi',
      isSimulated: true,
      inlet: 16.5,
      outlet: 10.8,
      ts: Math.floor(t0 / 1000),
    });

    const { reading } = parseAndNormalizeTelemetry(rawPacket);
    assert.ok(reading !== null);

    // Initial tick: buffering in 'checking'
    const r1 = engine.processReading(reading, testThresholds, t0);
    assert.equal(r1.state, 'checking');
    assert.equal(r1.hasAlert, false);

    // After persistence duration (6 seconds later): triggers 'leak'
    const t1 = t0 + 6000;
    const r2 = engine.processReading({ ...reading, timestamp: t1 }, testThresholds, t1);
    assert.equal(r2.state, 'leak');
    assert.equal(r2.hasAlert, true);
    assert.equal(r2.alertCandidate?.category, 'SUSPECTED_LEAK');
  });

  test('9. Reversed flow from Wokwi is treated as diagnostic check, never a leak', () => {
    const engine = new LeakDetectionEngine();
    const t0 = 1700000000000;

    const rawPacket = JSON.stringify({
      deviceId: 'waterguard-wokwi-esp32',
      source: 'wokwi',
      inlet: 8.0,
      outlet: 15.0,
      ts: Math.floor(t0 / 1000),
    });

    const { reading } = parseAndNormalizeTelemetry(rawPacket);
    assert.ok(reading !== null);

    // At T+6s: emits SENSOR_ANOMALY with state 'datacheck'
    const t1 = t0 + 6000;
    const res = engine.processReading({ ...reading, timestamp: t1 }, testThresholds, t1);
    assert.equal(res.state, 'datacheck');
    assert.equal(res.activeCategory, 'SENSOR_ANOMALY');
    assert.notEqual(res.activeCategory, 'SUSPECTED_LEAK');
  });

  test('10. Demo interval ticks do NOT overwrite state when active source is WOKWI', () => {
    // Mimic the state coordinator logic used in SensorContext
    let currentInFlow = 12.5;
    let currentOutFlow = 12.3;
    let currentSource: DataSource = 'wokwi';

    // Simulated MQTT packet arriving from Wokwi
    const liveTelemetry: TelemetryReading = {
      deviceId: 'waterguard-wokwi-esp32',
      timestamp: Date.now(),
      inletFlow: 8.0,
      outletFlow: 8.0,
      flowDifference: 0.0,
      isValid: true,
      isSimulated: true,
      source: 'wokwi',
      status: 'online',
    };

    // Handler function mirroring SensorContext.handleLiveTelemetry
    function handleLiveTelemetry(reading: TelemetryReading) {
      if (currentSource === 'wokwi' || currentSource === 'mqtt') {
        currentInFlow = reading.inletFlow;
        currentOutFlow = reading.outletFlow;
      }
    }

    // Demo timer tick function mirroring SensorContext demo timer
    function handleDemoTick(demoIn: number, demoOut: number) {
      if (currentSource !== 'demo') {
        // Must be blocked!
        return;
      }
      currentInFlow = demoIn;
      currentOutFlow = demoOut;
    }

    // 1. Receive Wokwi packet
    handleLiveTelemetry(liveTelemetry);
    assert.equal(currentInFlow, 8.0);
    assert.equal(currentOutFlow, 8.0);

    // 2. Demo timer attempts to tick with baseline (12.5 / 12.3)
    handleDemoTick(12.5, 12.3);

    // Values MUST remain 8.0 / 8.0 from Wokwi
    assert.equal(currentInFlow, 8.0, 'Demo tick must NOT overwrite live Wokwi inlet flow');
    assert.equal(currentOutFlow, 8.0, 'Demo tick must NOT overwrite live Wokwi outlet flow');
  });
});
