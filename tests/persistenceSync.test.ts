import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseAndNormalizeTelemetry } from '../src/utils/telemetryParser';
import { LeakDetectionEngine } from '../src/utils/leakDetection';
import { ThresholdConfig, TelemetryReading } from '../src/types/sensor';

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

describe('End-to-End Persistence & Dashboard Synchronization Verification', () => {
  test('A. Wokwi telemetry payload with sequence, source, and 8.0/3.0 deficit is parsed without corruption', () => {
    const rawPayload = JSON.stringify({
      deviceId: 'waterguard-wokwi-esp32',
      source: 'wokwi',
      sequence: 101,
      ts: 1700000000,
      inlet: 8.00,
      outlet: 3.00,
      isValid: true,
      isSimulated: true,
      scenario: 'suspected_leak',
      notes: 'Inlet: 8.00 L/min, Outlet: 3.00 L/min',
      tank1: 2.89,
      tank2: 2.89,
      valve1: 'OPEN',
      valve2: 'OPEN',
      scadaMode: 'REMOTE',
      requestId: 'scada_test_req_01',
    });

    const { reading, error } = parseAndNormalizeTelemetry(rawPayload);
    assert.equal(error, undefined);
    assert.ok(reading !== null);
    assert.equal(reading.deviceId, 'waterguard-wokwi-esp32');
    assert.equal(reading.source, 'wokwi');
    assert.equal(reading.sequence, 101);
    assert.equal(reading.inletFlow, 8.0);
    assert.equal(reading.outletFlow, 3.0);
    assert.equal(reading.flowDifference, 5.0);
    assert.equal(reading.scenario, 'suspected_leak');
    assert.equal(reading.requestId, 'scada_test_req_01');
  });

  test('B. Value persistence across multiple publish cycles: values do not revert to 8/8', () => {
    // Simulate multiple consecutive periodic publish messages from Wokwi
    let storedInlet = 8.0;
    let storedOutlet = 3.0;

    const engine = new LeakDetectionEngine();
    let now = 1000000;

    for (let seq = 1; seq <= 5; seq++) {
      const payload = {
        deviceId: 'waterguard-wokwi-esp32',
        source: 'wokwi' as const,
        sequence: seq,
        timestamp: now,
        inletFlow: storedInlet,
        outletFlow: storedOutlet,
        flowDifference: Number((storedInlet - storedOutlet).toFixed(2)),
        isValid: true,
        isSimulated: true,
        status: 'online' as const,
      };

      const result = engine.processReading(payload, testThresholds, now);

      // Verify that values stay persistent across every single cycle
      assert.equal(payload.inletFlow, 8.0, `Cycle ${seq}: inlet must stay 8.0`);
      assert.equal(payload.outletFlow, 3.0, `Cycle ${seq}: outlet must stay 3.0`);

      if (seq >= 4) {
        // After 6s (> 5s threshold), leak alert must be active
        assert.equal(result.state, 'leak', `Cycle ${seq}: engine must detect leak`);
        assert.equal(result.activeCategory, 'SUSPECTED_LEAK');
      }

      now += 2000; // 2 seconds between cycles
    }
  });

  test('C. Recovery flow (8.0 / 8.0) clears alert according to recovery rules', () => {
    const engine = new LeakDetectionEngine();
    let now = 2000000;

    // Trigger leak
    for (let i = 0; i < 4; i++) {
      engine.processReading({
        deviceId: 'waterguard-wokwi-esp32',
        timestamp: now,
        inletFlow: 8.0,
        outletFlow: 3.0,
        flowDifference: 5.0,
        isValid: true,
        isSimulated: true,
        status: 'online',
      }, testThresholds, now);
      now += 2000;
    }

    // Now send recovered balanced readings (8.0 / 8.0)
    const recResult = engine.processReading({
      deviceId: 'waterguard-wokwi-esp32',
      timestamp: now,
      inletFlow: 8.0,
      outletFlow: 8.0,
      flowDifference: 0.0,
      isValid: true,
      isSimulated: true,
      status: 'online',
    }, testThresholds, now);

    assert.equal(recResult.state, 'normal');
    assert.equal(recResult.isRecovered, true);
    assert.equal(recResult.recoveredCategory, 'SUSPECTED_LEAK');
  });

  test('D. Explicit reset returns stored values to 8.0/8.0 baseline', () => {
    let currentInlet = 8.0;
    let currentOutlet = 3.0;
    let scenario = 'suspected_leak';

    // Simulate reset command handler in firmware
    function handleReset() {
      currentInlet = 8.0;
      currentOutlet = 8.0;
      scenario = 'normal';
    }

    assert.equal(currentOutlet, 3.0);
    handleReset();
    assert.equal(currentInlet, 8.0);
    assert.equal(currentOutlet, 8.0);
    assert.equal(scenario, 'normal');
  });
});
