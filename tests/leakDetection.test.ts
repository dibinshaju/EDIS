import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { LeakDetectionEngine } from '../src/utils/leakDetection';
import { TelemetryReading, ThresholdConfig } from '../src/types/sensor';

const testThresholds: ThresholdConfig = {
  mismatchThreshold: 1.5,
  persistenceDurationSec: 5, // 5 seconds
  highConsumptionThreshold: 25.0,
  highConsumptionDurationSec: 6,
  nightTimeStartHour: 23,
  nightTimeEndHour: 5,
  nightTimeThreshold: 1.0,
  sensorTimeoutSec: 10,
};

function makeReading(inlet: number, outlet: number, timestamp: number, isValid: boolean = true): TelemetryReading {
  return {
    deviceId: 'ESP32_WOKWI_TEST',
    timestamp,
    inletFlow: inlet,
    outletFlow: outlet,
    flowDifference: inlet - outlet,
    isValid,
    isSimulated: true,
    status: 'online',
  };
}

describe('LeakDetectionEngine Unit Tests', () => {
  test('1. Normal flow readings do not trigger alerts', () => {
    const engine = new LeakDetectionEngine();
    const t0 = 1700000000000;
    
    // Both inlet and outlet match closely (12.0 L/min and 11.8 L/min => diff 0.2 < 1.5)
    const result = engine.processReading(makeReading(12.0, 11.8, t0), testThresholds, t0);
    assert.equal(result.hasAlert, false);
    assert.equal(result.alertCandidate, null);
  });

  test('2. Brief transient spike below persistence duration does NOT trigger a leak alert', () => {
    const engine = new LeakDetectionEngine();
    const t0 = 1700000000000;
    
    // T0: Sudden mismatch of 3.0 L/min (15.0 inlet, 12.0 outlet)
    let res = engine.processReading(makeReading(15.0, 12.0, t0), testThresholds, t0);
    assert.equal(res.hasAlert, false, 'Should not alert immediately on first reading');

    // T0 + 2s: Mismatch continues for only 2 seconds (< 5s persistence requirement)
    res = engine.processReading(makeReading(15.0, 12.0, t0 + 2000), testThresholds, t0 + 2000);
    assert.equal(res.hasAlert, false, 'Should not alert while within persistence window');

    // T0 + 3s: Flows equalize back to normal
    res = engine.processReading(makeReading(12.0, 12.0, t0 + 3000), testThresholds, t0 + 3000);
    assert.equal(res.hasAlert, false, 'Spike cleared before persistence duration, no alert should trigger');
  });

  test('3. Sustained positive mismatch (Inlet > Outlet) triggers SUSPECTED_LEAK alert', () => {
    const engine = new LeakDetectionEngine();
    const t0 = 1700000000000;
    
    // T0: Start of mismatch
    engine.processReading(makeReading(14.0, 10.0, t0), testThresholds, t0);

    // T0 + 3s: Still under persistence
    let res = engine.processReading(makeReading(14.0, 10.0, t0 + 3000), testThresholds, t0 + 3000);
    assert.equal(res.hasAlert, false);

    // T0 + 5.5s: Exceeded 5-second persistence threshold
    res = engine.processReading(makeReading(14.0, 10.0, t0 + 5500), testThresholds, t0 + 5500);
    assert.equal(res.hasAlert, true);
    assert.notEqual(res.alertCandidate, null);
    assert.equal(res.alertCandidate?.category, 'SUSPECTED_LEAK');
    assert.equal(res.alertCandidate?.severity, 'CRITICAL');
  });

  test('4. Reversed mismatch (Outlet > Inlet) triggers SENSOR_ANOMALY, NOT a leak', () => {
    const engine = new LeakDetectionEngine();
    const t0 = 1700000000000;

    // Outlet reads 16.0 while Inlet reads 10.0 (Difference = -6.0 L/min)
    engine.processReading(makeReading(10.0, 16.0, t0), testThresholds, t0);
    
    // After 6 seconds
    const res = engine.processReading(makeReading(10.0, 16.0, t0 + 6000), testThresholds, t0 + 6000);
    assert.equal(res.hasAlert, true);
    assert.notEqual(res.alertCandidate, null);
    assert.equal(res.alertCandidate?.category, 'SENSOR_ANOMALY', 'Must be SENSOR_ANOMALY, not leak');
    assert.notEqual(res.alertCandidate?.category, 'SUSPECTED_LEAK', 'Must NEVER declare leak when outlet > inlet');
  });

  test('5. Invalid or non-numeric sensor reading triggers immediate SENSOR_ANOMALY', () => {
    const engine = new LeakDetectionEngine();
    const t0 = 1700000000000;

    const res = engine.processReading(makeReading(NaN, 10.0, t0, false), testThresholds, t0);
    assert.equal(res.hasAlert, true);
    assert.equal(res.alertCandidate?.category, 'SENSOR_ANOMALY');
  });

  test('6. Sustained High Consumption triggers ABNORMAL_CONSUMPTION', () => {
    const engine = new LeakDetectionEngine();
    const t0 = 1700000000000;

    // Inlet and outlet are high (30 L/min >= 25.0 threshold)
    engine.processReading(makeReading(30.0, 30.0, t0), testThresholds, t0);
    
    // After 7 seconds (exceeding highConsumptionDurationSec 6s)
    const res = engine.processReading(makeReading(30.0, 30.0, t0 + 7000), testThresholds, t0 + 7000);
    assert.equal(res.hasAlert, true);
    assert.equal(res.alertCandidate?.category, 'ABNORMAL_CONSUMPTION');
  });

  test('7. Recovery transition emits RECOVERED alert when flow normalizes', () => {
    const engine = new LeakDetectionEngine();
    // Use explicit daytime timestamp (2:00 PM) to isolate daytime leak recovery
    const t0 = new Date('2026-10-22T14:00:00Z').getTime();

    // Step 1: Induce leak for 6 seconds
    engine.processReading(makeReading(15.0, 10.0, t0), testThresholds, t0);
    const leakRes = engine.processReading(makeReading(15.0, 10.0, t0 + 6000), testThresholds, t0 + 6000);
    assert.equal(leakRes.alertCandidate?.category, 'SUSPECTED_LEAK');

    // Step 2: Repair/restore normal flows
    const recoveryRes = engine.processReading(makeReading(10.0, 10.0, t0 + 8000), testThresholds, t0 + 8000);
    assert.equal(recoveryRes.isRecovered, true);
    assert.equal(recoveryRes.alertCandidate?.category, 'RECOVERED');
    assert.equal(recoveryRes.recoveredCategory, 'SUSPECTED_LEAK');
  });
});
