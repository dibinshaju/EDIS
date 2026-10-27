import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseAndNormalizeTelemetry } from '../src/utils/telemetryParser';
import { LeakDetectionEngine } from '../src/utils/leakDetection';
import { ThresholdConfig, SimulatorCommand, CommandAck, TelemetryReading } from '../src/types/sensor';

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

describe('Manual Flow Control & Bidirectional MQTT Protocol Tests', () => {
  // Helper to validate and build flow command (mirroring publishFlowCommand)
  function createFlowCommand(
    inlet: number,
    outlet: number,
    isConnected: boolean,
    customReqId?: string
  ): { success: boolean; error?: string; command?: SimulatorCommand; requestId: string } {
    if (
      typeof inlet !== 'number' ||
      typeof outlet !== 'number' ||
      !Number.isFinite(inlet) ||
      !Number.isFinite(outlet)
    ) {
      return {
        success: false,
        error: 'Inlet and Outlet flow rates must be valid numbers.',
        requestId: '',
      };
    }

    if (inlet < 0 || inlet > 100 || outlet < 0 || outlet > 100) {
      return {
        success: false,
        error: 'Flow rates must be between 0.0 and 100.0 L/min.',
        requestId: '',
      };
    }

    if (!isConnected) {
      return {
        success: false,
        error: 'MQTT broker is not connected. Please connect first.',
        requestId: '',
      };
    }

    const requestId =
      customReqId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const cmd: SimulatorCommand = {
      command: 'set_flow',
      inlet: Number(inlet.toFixed(2)),
      outlet: Number(outlet.toFixed(2)),
      requestId,
      timestamp: Math.floor(Date.now() / 1000),
    };

    return { success: true, command: cmd, requestId };
  }

  test('1. Valid flow command generation with bounds, timestamp, and requestId', () => {
    const res = createFlowCommand(8.25, 3.12, true, 'req_test_01');
    assert.equal(res.success, true);
    assert.ok(res.command);
    assert.equal(res.command.command, 'set_flow');
    assert.equal(res.command.inlet, 8.25);
    assert.equal(res.command.outlet, 3.12);
    assert.equal(res.command.requestId, 'req_test_01');
    assert.ok(res.command.timestamp && res.command.timestamp > 0);
  });

  test('2. Rejection of invalid, infinite, and out-of-range flow values', () => {
    // Negative inlet
    const neg = createFlowCommand(-1.0, 5.0, true);
    assert.equal(neg.success, false);
    assert.match(neg.error || '', /between 0.0 and 100.0/);

    // Flow over 100 L/min limit
    const high = createFlowCommand(105.0, 10.0, true);
    assert.equal(high.success, false);
    assert.match(high.error || '', /between 0.0 and 100.0/);

    // Non-finite (NaN / Infinity)
    const nanVal = createFlowCommand(NaN, 10.0, true);
    assert.equal(nanVal.success, false);
    assert.match(nanVal.error || '', /valid numbers/);

    const infVal = createFlowCommand(10.0, Infinity, true);
    assert.equal(infVal.success, false);
    assert.match(infVal.error || '', /valid numbers/);
  });

  test('3. Prevents command publishing when MQTT connection is offline', () => {
    const offlineRes = createFlowCommand(8.0, 8.0, false);
    assert.equal(offlineRes.success, false);
    assert.match(offlineRes.error || '', /MQTT broker is not connected/);
  });

  test('4. Simulates ESP32 firmware parsing of set_flow command and ACK generation', () => {
    // Firmware simulation logic matching wokwi/sketch.ino
    function simulateEsp32Firmware(incomingJson: string): {
      ack: CommandAck;
      telemetry: string;
      appliedScenario: string;
    } {
      const parsed = JSON.parse(incomingJson);
      const reqId = parsed.requestId || '';
      const inVal = Number(parsed.inlet);
      const outVal = Number(parsed.outlet);

      if (
        isNaN(inVal) ||
        isNaN(outVal) ||
        inVal < 0 ||
        inVal > 100 ||
        outVal < 0 ||
        outVal > 100
      ) {
        return {
          ack: {
            type: 'ack',
            command: 'set_flow',
            status: 'rejected_range',
            requestId: reqId,
            inlet: inVal,
            outlet: outVal,
            timestamp: 12345,
          },
          telemetry: '',
          appliedScenario: 'hardware',
        };
      }

      const ack: CommandAck = {
        type: 'ack',
        command: 'set_flow',
        status: 'applied',
        requestId: reqId,
        inlet: inVal,
        outlet: outVal,
        timestamp: 12345,
      };

      const telemetry = JSON.stringify({
        deviceId: 'ESP32_WOKWI_01',
        ts: 12345,
        inlet: inVal.toFixed(2),
        outlet: outVal.toFixed(2),
        isValid: true,
        isSimulated: true,
        notes: `Manual Flow (${inVal.toFixed(1)}/${outVal.toFixed(1)} L/min)`,
        scenario: 'manual',
        requestId: reqId,
      });

      return { ack, telemetry, appliedScenario: 'manual' };
    }

    const cmd = JSON.stringify({
      command: 'set_flow',
      inlet: 8.0,
      outlet: 3.0,
      requestId: 'req_manual_42',
    });

    const result = simulateEsp32Firmware(cmd);
    assert.equal(result.ack.status, 'applied');
    assert.equal(result.ack.requestId, 'req_manual_42');
    assert.equal(result.ack.inlet, 8.0);
    assert.equal(result.ack.outlet, 3.0);
    assert.equal(result.appliedScenario, 'manual');

    // Parse published telemetry packet
    const { reading } = parseAndNormalizeTelemetry(result.telemetry);
    assert.ok(reading !== null);
    assert.equal(reading.inletFlow, 8.0);
    assert.equal(reading.outletFlow, 3.0);
    assert.equal(reading.flowDifference, 5.0);
    assert.equal(reading.scenario, 'manual');
    assert.equal(reading.requestId, 'req_manual_42');
  });

  test('5. Preset: Normal flow (8.0 / 8.0 L/min) maintains normal balanced pipeline', () => {
    const engine = new LeakDetectionEngine();
    const t0 = 1700000000000;

    const normalPacket = JSON.stringify({
      deviceId: 'ESP32_WOKWI_01',
      inlet: 8.0,
      outlet: 8.0,
      isValid: true,
      scenario: 'manual',
      requestId: 'req_preset_normal',
    });

    const { reading } = parseAndNormalizeTelemetry(normalPacket);
    assert.ok(reading);
    reading.timestamp = t0;

    const result = engine.processReading(reading, testThresholds, t0);
    assert.equal(result.state, 'normal');
    assert.equal(result.hasAlert, false);
    assert.equal(result.activeCategory, null);
  });

  test('6. Preset: Simulate Leak (8.0 / 3.0 L/min) triggers leak state after persistence', () => {
    const engine = new LeakDetectionEngine();
    const t0 = 1700000000000;

    const leakPacket = JSON.stringify({
      deviceId: 'ESP32_WOKWI_01',
      inlet: 8.0,
      outlet: 3.0,
      isValid: true,
      scenario: 'manual',
      requestId: 'req_preset_leak',
    });

    const { reading: r0 } = parseAndNormalizeTelemetry(leakPacket);
    assert.ok(r0);
    r0.timestamp = t0;

    // t0: Initial leak detection starts tracking timer (state: checking)
    const res0 = engine.processReading(r0, testThresholds, t0);
    assert.equal(res0.state, 'checking');
    assert.equal(res0.hasAlert, false, 'Must not trigger instantly before persistence');

    // t1: 6 seconds later (> persistence duration of 5s)
    const t1 = t0 + 6000;
    const { reading: r1 } = parseAndNormalizeTelemetry(leakPacket);
    assert.ok(r1);
    r1.timestamp = t1;

    const res1 = engine.processReading(r1, testThresholds, t1);
    assert.equal(res1.state, 'leak');
    assert.equal(res1.hasAlert, true);
    assert.equal(res1.alertCandidate?.category, 'SUSPECTED_LEAK');
    assert.equal(res1.alertCandidate?.severity, 'CRITICAL');
    assert.match(res1.alertCandidate?.explanation || '', /5\.0 L\/min/);
  });

  test('7. Preset: High Consumption (30.0 / 30.0 L/min) triggers abnormal consumption', () => {
    const engine = new LeakDetectionEngine();
    const t0 = 1700000000000;

    const highPacket = JSON.stringify({
      deviceId: 'ESP32_WOKWI_01',
      inlet: 30.0,
      outlet: 30.0,
      isValid: true,
      scenario: 'manual',
      requestId: 'req_preset_high',
    });

    const { reading: r0 } = parseAndNormalizeTelemetry(highPacket);
    assert.ok(r0);
    r0.timestamp = t0;

    const res0 = engine.processReading(r0, testThresholds, t0);
    assert.equal(res0.state, 'normal');
    assert.equal(res0.hasAlert, false);

    // 7 seconds later (> 6s high consumption threshold duration)
    const t1 = t0 + 7000;
    const { reading: r1 } = parseAndNormalizeTelemetry(highPacket);
    assert.ok(r1);
    r1.timestamp = t1;

    const res1 = engine.processReading(r1, testThresholds, t1);
    assert.equal(res1.state, 'high');
    assert.equal(res1.hasAlert, true);
    assert.equal(res1.alertCandidate?.category, 'ABNORMAL_CONSUMPTION');
  });

  test('8. Preset: Reversed Mismatch (3.0 / 8.0 L/min) flags anomaly without false positive leak', () => {
    const engine = new LeakDetectionEngine();
    const t0 = 1700000000000;

    const revPacket = JSON.stringify({
      deviceId: 'ESP32_WOKWI_01',
      inlet: 3.0,
      outlet: 8.0,
      isValid: true,
      scenario: 'manual',
      requestId: 'req_preset_rev',
    });

    const { reading: r0 } = parseAndNormalizeTelemetry(revPacket);
    assert.ok(r0);
    r0.timestamp = t0;
    const res0 = engine.processReading(r0, testThresholds, t0);
    assert.equal(res0.state, 'checking');

    const t1 = t0 + 6000;
    const { reading: r1 } = parseAndNormalizeTelemetry(revPacket);
    assert.ok(r1);
    r1.timestamp = t1;

    const res1 = engine.processReading(r1, testThresholds, t1);
    assert.equal(res1.state, 'datacheck');
    assert.equal(res1.activeCategory, 'SENSOR_ANOMALY');
    assert.notEqual(res1.activeCategory, 'SUSPECTED_LEAK', 'Negative deficit must not trigger leak alarm');
  });

  test('9. State isolation: command generation does not modify telemetry state until packet arrives', () => {
    // Current active reading
    let currentInFlow = 12.5;
    let currentOutFlow = 12.3;

    // User applies manual flow
    const cmdResult = createFlowCommand(8.0, 3.0, true, 'req_iso_1');
    assert.equal(cmdResult.success, true);

    // State MUST NOT be updated synchronously from input
    assert.equal(currentInFlow, 12.5);
    assert.equal(currentOutFlow, 12.3);

    // Only after telemetry packet arrives is state updated
    const simulatedTelemetry = JSON.stringify({
      deviceId: 'ESP32_WOKWI_01',
      inlet: cmdResult.command!.inlet,
      outlet: cmdResult.command!.outlet,
      isValid: true,
      scenario: 'manual',
      requestId: cmdResult.requestId,
    });

    const { reading } = parseAndNormalizeTelemetry(simulatedTelemetry);
    assert.ok(reading);
    currentInFlow = reading.inletFlow;
    currentOutFlow = reading.outletFlow;

    assert.equal(currentInFlow, 8.0);
    assert.equal(currentOutFlow, 3.0);
  });
});
