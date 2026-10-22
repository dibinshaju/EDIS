"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const leakDetection_1 = require("../src/utils/leakDetection");
const testThresholds = {
    mismatchThreshold: 1.5,
    persistenceDurationSec: 5, // 5 seconds
    highConsumptionThreshold: 25.0,
    highConsumptionDurationSec: 6,
    nightTimeStartHour: 23,
    nightTimeEndHour: 5,
    nightTimeThreshold: 1.0,
    sensorTimeoutSec: 10,
};
function makeReading(inlet, outlet, timestamp, isValid = true) {
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
(0, node_test_1.describe)('LeakDetectionEngine Unit Tests', () => {
    (0, node_test_1.test)('1. Normal flow readings do not trigger alerts', () => {
        const engine = new leakDetection_1.LeakDetectionEngine();
        const t0 = 1700000000000;
        // Both inlet and outlet match closely (12.0 L/min and 11.8 L/min => diff 0.2 < 1.5)
        const result = engine.processReading(makeReading(12.0, 11.8, t0), testThresholds, t0);
        strict_1.default.equal(result.hasAlert, false);
        strict_1.default.equal(result.alertCandidate, null);
    });
    (0, node_test_1.test)('2. Brief transient spike below persistence duration does NOT trigger a leak alert', () => {
        const engine = new leakDetection_1.LeakDetectionEngine();
        const t0 = 1700000000000;
        // T0: Sudden mismatch of 3.0 L/min (15.0 inlet, 12.0 outlet)
        let res = engine.processReading(makeReading(15.0, 12.0, t0), testThresholds, t0);
        strict_1.default.equal(res.hasAlert, false, 'Should not alert immediately on first reading');
        // T0 + 2s: Mismatch continues for only 2 seconds (< 5s persistence requirement)
        res = engine.processReading(makeReading(15.0, 12.0, t0 + 2000), testThresholds, t0 + 2000);
        strict_1.default.equal(res.hasAlert, false, 'Should not alert while within persistence window');
        // T0 + 3s: Flows equalize back to normal
        res = engine.processReading(makeReading(12.0, 12.0, t0 + 3000), testThresholds, t0 + 3000);
        strict_1.default.equal(res.hasAlert, false, 'Spike cleared before persistence duration, no alert should trigger');
    });
    (0, node_test_1.test)('3. Sustained positive mismatch (Inlet > Outlet) triggers SUSPECTED_LEAK alert', () => {
        const engine = new leakDetection_1.LeakDetectionEngine();
        const t0 = 1700000000000;
        // T0: Start of mismatch
        engine.processReading(makeReading(14.0, 10.0, t0), testThresholds, t0);
        // T0 + 3s: Still under persistence
        let res = engine.processReading(makeReading(14.0, 10.0, t0 + 3000), testThresholds, t0 + 3000);
        strict_1.default.equal(res.hasAlert, false);
        // T0 + 5.5s: Exceeded 5-second persistence threshold
        res = engine.processReading(makeReading(14.0, 10.0, t0 + 5500), testThresholds, t0 + 5500);
        strict_1.default.equal(res.hasAlert, true);
        strict_1.default.notEqual(res.alertCandidate, null);
        strict_1.default.equal(res.alertCandidate?.category, 'SUSPECTED_LEAK');
        strict_1.default.equal(res.alertCandidate?.severity, 'CRITICAL');
    });
    (0, node_test_1.test)('4. Reversed mismatch (Outlet > Inlet) triggers SENSOR_ANOMALY, NOT a leak', () => {
        const engine = new leakDetection_1.LeakDetectionEngine();
        const t0 = 1700000000000;
        // Outlet reads 16.0 while Inlet reads 10.0 (Difference = -6.0 L/min)
        engine.processReading(makeReading(10.0, 16.0, t0), testThresholds, t0);
        // After 6 seconds
        const res = engine.processReading(makeReading(10.0, 16.0, t0 + 6000), testThresholds, t0 + 6000);
        strict_1.default.equal(res.hasAlert, true);
        strict_1.default.notEqual(res.alertCandidate, null);
        strict_1.default.equal(res.alertCandidate?.category, 'SENSOR_ANOMALY', 'Must be SENSOR_ANOMALY, not leak');
        strict_1.default.notEqual(res.alertCandidate?.category, 'SUSPECTED_LEAK', 'Must NEVER declare leak when outlet > inlet');
    });
    (0, node_test_1.test)('5. Invalid or non-numeric sensor reading triggers immediate SENSOR_ANOMALY', () => {
        const engine = new leakDetection_1.LeakDetectionEngine();
        const t0 = 1700000000000;
        const res = engine.processReading(makeReading(NaN, 10.0, t0, false), testThresholds, t0);
        strict_1.default.equal(res.hasAlert, true);
        strict_1.default.equal(res.alertCandidate?.category, 'SENSOR_ANOMALY');
    });
    (0, node_test_1.test)('6. Sustained High Consumption triggers ABNORMAL_CONSUMPTION', () => {
        const engine = new leakDetection_1.LeakDetectionEngine();
        const t0 = 1700000000000;
        // Inlet and outlet are high (30 L/min >= 25.0 threshold)
        engine.processReading(makeReading(30.0, 30.0, t0), testThresholds, t0);
        // After 7 seconds (exceeding highConsumptionDurationSec 6s)
        const res = engine.processReading(makeReading(30.0, 30.0, t0 + 7000), testThresholds, t0 + 7000);
        strict_1.default.equal(res.hasAlert, true);
        strict_1.default.equal(res.alertCandidate?.category, 'ABNORMAL_CONSUMPTION');
    });
    (0, node_test_1.test)('7. Recovery transition emits RECOVERED alert when flow normalizes', () => {
        const engine = new leakDetection_1.LeakDetectionEngine();
        // Use explicit daytime timestamp (2:00 PM) to isolate daytime leak recovery
        const t0 = new Date('2026-10-22T14:00:00Z').getTime();
        // Step 1: Induce leak for 6 seconds
        engine.processReading(makeReading(15.0, 10.0, t0), testThresholds, t0);
        const leakRes = engine.processReading(makeReading(15.0, 10.0, t0 + 6000), testThresholds, t0 + 6000);
        strict_1.default.equal(leakRes.alertCandidate?.category, 'SUSPECTED_LEAK');
        // Step 2: Repair/restore normal flows
        const recoveryRes = engine.processReading(makeReading(10.0, 10.0, t0 + 8000), testThresholds, t0 + 8000);
        strict_1.default.equal(recoveryRes.isRecovered, true);
        strict_1.default.equal(recoveryRes.alertCandidate?.category, 'RECOVERED');
        strict_1.default.equal(recoveryRes.recoveredCategory, 'SUSPECTED_LEAK');
    });
});
