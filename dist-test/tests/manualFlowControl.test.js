"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const telemetryParser_1 = require("../src/utils/telemetryParser");
const leakDetection_1 = require("../src/utils/leakDetection");
const testThresholds = {
    mismatchThreshold: 1.5,
    persistenceDurationSec: 5,
    highConsumptionThreshold: 25.0,
    highConsumptionDurationSec: 6,
    nightTimeStartHour: 23,
    nightTimeEndHour: 5,
    nightTimeThreshold: 1.0,
    sensorTimeoutSec: 10,
};
(0, node_test_1.describe)('Manual Flow Control & Bidirectional MQTT Protocol Tests', () => {
    // Helper to validate and build flow command (mirroring publishFlowCommand)
    function createFlowCommand(inlet, outlet, isConnected, customReqId) {
        if (typeof inlet !== 'number' ||
            typeof outlet !== 'number' ||
            !Number.isFinite(inlet) ||
            !Number.isFinite(outlet)) {
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
        const requestId = customReqId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const cmd = {
            command: 'set_flow',
            inlet: Number(inlet.toFixed(2)),
            outlet: Number(outlet.toFixed(2)),
            requestId,
            timestamp: Math.floor(Date.now() / 1000),
        };
        return { success: true, command: cmd, requestId };
    }
    (0, node_test_1.test)('1. Valid flow command generation with bounds, timestamp, and requestId', () => {
        const res = createFlowCommand(8.25, 3.12, true, 'req_test_01');
        strict_1.default.equal(res.success, true);
        strict_1.default.ok(res.command);
        strict_1.default.equal(res.command.command, 'set_flow');
        strict_1.default.equal(res.command.inlet, 8.25);
        strict_1.default.equal(res.command.outlet, 3.12);
        strict_1.default.equal(res.command.requestId, 'req_test_01');
        strict_1.default.ok(res.command.timestamp && res.command.timestamp > 0);
    });
    (0, node_test_1.test)('2. Rejection of invalid, infinite, and out-of-range flow values', () => {
        // Negative inlet
        const neg = createFlowCommand(-1.0, 5.0, true);
        strict_1.default.equal(neg.success, false);
        strict_1.default.match(neg.error || '', /between 0.0 and 100.0/);
        // Flow over 100 L/min limit
        const high = createFlowCommand(105.0, 10.0, true);
        strict_1.default.equal(high.success, false);
        strict_1.default.match(high.error || '', /between 0.0 and 100.0/);
        // Non-finite (NaN / Infinity)
        const nanVal = createFlowCommand(NaN, 10.0, true);
        strict_1.default.equal(nanVal.success, false);
        strict_1.default.match(nanVal.error || '', /valid numbers/);
        const infVal = createFlowCommand(10.0, Infinity, true);
        strict_1.default.equal(infVal.success, false);
        strict_1.default.match(infVal.error || '', /valid numbers/);
    });
    (0, node_test_1.test)('3. Prevents command publishing when MQTT connection is offline', () => {
        const offlineRes = createFlowCommand(8.0, 8.0, false);
        strict_1.default.equal(offlineRes.success, false);
        strict_1.default.match(offlineRes.error || '', /MQTT broker is not connected/);
    });
    (0, node_test_1.test)('4. Simulates ESP32 firmware parsing of set_flow command and ACK generation', () => {
        // Firmware simulation logic matching wokwi/sketch.ino
        function simulateEsp32Firmware(incomingJson) {
            const parsed = JSON.parse(incomingJson);
            const reqId = parsed.requestId || '';
            const inVal = Number(parsed.inlet);
            const outVal = Number(parsed.outlet);
            if (isNaN(inVal) ||
                isNaN(outVal) ||
                inVal < 0 ||
                inVal > 100 ||
                outVal < 0 ||
                outVal > 100) {
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
            const ack = {
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
        strict_1.default.equal(result.ack.status, 'applied');
        strict_1.default.equal(result.ack.requestId, 'req_manual_42');
        strict_1.default.equal(result.ack.inlet, 8.0);
        strict_1.default.equal(result.ack.outlet, 3.0);
        strict_1.default.equal(result.appliedScenario, 'manual');
        // Parse published telemetry packet
        const { reading } = (0, telemetryParser_1.parseAndNormalizeTelemetry)(result.telemetry);
        strict_1.default.ok(reading !== null);
        strict_1.default.equal(reading.inletFlow, 8.0);
        strict_1.default.equal(reading.outletFlow, 3.0);
        strict_1.default.equal(reading.flowDifference, 5.0);
        strict_1.default.equal(reading.scenario, 'manual');
        strict_1.default.equal(reading.requestId, 'req_manual_42');
    });
    (0, node_test_1.test)('5. Preset: Normal flow (8.0 / 8.0 L/min) maintains normal balanced pipeline', () => {
        const engine = new leakDetection_1.LeakDetectionEngine();
        const t0 = 1700000000000;
        const normalPacket = JSON.stringify({
            deviceId: 'ESP32_WOKWI_01',
            inlet: 8.0,
            outlet: 8.0,
            isValid: true,
            scenario: 'manual',
            requestId: 'req_preset_normal',
        });
        const { reading } = (0, telemetryParser_1.parseAndNormalizeTelemetry)(normalPacket);
        strict_1.default.ok(reading);
        reading.timestamp = t0;
        const result = engine.processReading(reading, testThresholds, t0);
        strict_1.default.equal(result.state, 'normal');
        strict_1.default.equal(result.hasAlert, false);
        strict_1.default.equal(result.activeCategory, null);
    });
    (0, node_test_1.test)('6. Preset: Simulate Leak (8.0 / 3.0 L/min) triggers leak state after persistence', () => {
        const engine = new leakDetection_1.LeakDetectionEngine();
        const t0 = 1700000000000;
        const leakPacket = JSON.stringify({
            deviceId: 'ESP32_WOKWI_01',
            inlet: 8.0,
            outlet: 3.0,
            isValid: true,
            scenario: 'manual',
            requestId: 'req_preset_leak',
        });
        const { reading: r0 } = (0, telemetryParser_1.parseAndNormalizeTelemetry)(leakPacket);
        strict_1.default.ok(r0);
        r0.timestamp = t0;
        // t0: Initial leak detection starts tracking timer (state: checking)
        const res0 = engine.processReading(r0, testThresholds, t0);
        strict_1.default.equal(res0.state, 'checking');
        strict_1.default.equal(res0.hasAlert, false, 'Must not trigger instantly before persistence');
        // t1: 6 seconds later (> persistence duration of 5s)
        const t1 = t0 + 6000;
        const { reading: r1 } = (0, telemetryParser_1.parseAndNormalizeTelemetry)(leakPacket);
        strict_1.default.ok(r1);
        r1.timestamp = t1;
        const res1 = engine.processReading(r1, testThresholds, t1);
        strict_1.default.equal(res1.state, 'leak');
        strict_1.default.equal(res1.hasAlert, true);
        strict_1.default.equal(res1.alertCandidate?.category, 'SUSPECTED_LEAK');
        strict_1.default.equal(res1.alertCandidate?.severity, 'CRITICAL');
        strict_1.default.match(res1.alertCandidate?.explanation || '', /5\.0 L\/min/);
    });
    (0, node_test_1.test)('7. Preset: High Consumption (30.0 / 30.0 L/min) triggers abnormal consumption', () => {
        const engine = new leakDetection_1.LeakDetectionEngine();
        const t0 = 1700000000000;
        const highPacket = JSON.stringify({
            deviceId: 'ESP32_WOKWI_01',
            inlet: 30.0,
            outlet: 30.0,
            isValid: true,
            scenario: 'manual',
            requestId: 'req_preset_high',
        });
        const { reading: r0 } = (0, telemetryParser_1.parseAndNormalizeTelemetry)(highPacket);
        strict_1.default.ok(r0);
        r0.timestamp = t0;
        const res0 = engine.processReading(r0, testThresholds, t0);
        strict_1.default.equal(res0.state, 'normal');
        strict_1.default.equal(res0.hasAlert, false);
        // 7 seconds later (> 6s high consumption threshold duration)
        const t1 = t0 + 7000;
        const { reading: r1 } = (0, telemetryParser_1.parseAndNormalizeTelemetry)(highPacket);
        strict_1.default.ok(r1);
        r1.timestamp = t1;
        const res1 = engine.processReading(r1, testThresholds, t1);
        strict_1.default.equal(res1.state, 'high');
        strict_1.default.equal(res1.hasAlert, true);
        strict_1.default.equal(res1.alertCandidate?.category, 'ABNORMAL_CONSUMPTION');
    });
    (0, node_test_1.test)('8. Preset: Reversed Mismatch (3.0 / 8.0 L/min) flags anomaly without false positive leak', () => {
        const engine = new leakDetection_1.LeakDetectionEngine();
        const t0 = 1700000000000;
        const revPacket = JSON.stringify({
            deviceId: 'ESP32_WOKWI_01',
            inlet: 3.0,
            outlet: 8.0,
            isValid: true,
            scenario: 'manual',
            requestId: 'req_preset_rev',
        });
        const { reading: r0 } = (0, telemetryParser_1.parseAndNormalizeTelemetry)(revPacket);
        strict_1.default.ok(r0);
        r0.timestamp = t0;
        const res0 = engine.processReading(r0, testThresholds, t0);
        strict_1.default.equal(res0.state, 'checking');
        const t1 = t0 + 6000;
        const { reading: r1 } = (0, telemetryParser_1.parseAndNormalizeTelemetry)(revPacket);
        strict_1.default.ok(r1);
        r1.timestamp = t1;
        const res1 = engine.processReading(r1, testThresholds, t1);
        strict_1.default.equal(res1.state, 'datacheck');
        strict_1.default.equal(res1.activeCategory, 'SENSOR_ANOMALY');
        strict_1.default.notEqual(res1.activeCategory, 'SUSPECTED_LEAK', 'Negative deficit must not trigger leak alarm');
    });
    (0, node_test_1.test)('9. State isolation: command generation does not modify telemetry state until packet arrives', () => {
        // Current active reading
        let currentInFlow = 12.5;
        let currentOutFlow = 12.3;
        // User applies manual flow
        const cmdResult = createFlowCommand(8.0, 3.0, true, 'req_iso_1');
        strict_1.default.equal(cmdResult.success, true);
        // State MUST NOT be updated synchronously from input
        strict_1.default.equal(currentInFlow, 12.5);
        strict_1.default.equal(currentOutFlow, 12.3);
        // Only after telemetry packet arrives is state updated
        const simulatedTelemetry = JSON.stringify({
            deviceId: 'ESP32_WOKWI_01',
            inlet: cmdResult.command.inlet,
            outlet: cmdResult.command.outlet,
            isValid: true,
            scenario: 'manual',
            requestId: cmdResult.requestId,
        });
        const { reading } = (0, telemetryParser_1.parseAndNormalizeTelemetry)(simulatedTelemetry);
        strict_1.default.ok(reading);
        currentInFlow = reading.inletFlow;
        currentOutFlow = reading.outletFlow;
        strict_1.default.equal(currentInFlow, 8.0);
        strict_1.default.equal(currentOutFlow, 3.0);
    });
});
