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
(0, node_test_1.describe)('MQTT Telemetry Parsing & Normalization Unit Tests', () => {
    (0, node_test_1.test)('1. Parses actual Wokwi firmware payload (inlet, outlet, source=wokwi)', () => {
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
        const { reading, error } = (0, telemetryParser_1.parseAndNormalizeTelemetry)(payload);
        strict_1.default.equal(error, undefined);
        strict_1.default.ok(reading !== null);
        strict_1.default.equal(reading.deviceId, 'waterguard-wokwi-esp32');
        strict_1.default.equal(reading.inletFlow, 8.0);
        strict_1.default.equal(reading.outletFlow, 8.0);
        strict_1.default.equal(reading.flowDifference, 0.0);
        strict_1.default.equal(reading.isValid, true);
        strict_1.default.equal(reading.isSimulated, true);
        strict_1.default.equal(reading.source, 'wokwi');
        strict_1.default.equal(reading.notes, 'Scenario: normal');
    });
    (0, node_test_1.test)('2. Preserves compatibility with canonical payload (inletFlow, outletFlow)', () => {
        const payload = JSON.stringify({
            deviceId: 'ESP32_01',
            inletFlow: 12.5,
            outletFlow: 12.3,
            timestamp: 1700000000000,
            isValid: true,
        });
        const { reading, error } = (0, telemetryParser_1.parseAndNormalizeTelemetry)(payload);
        strict_1.default.equal(error, undefined);
        strict_1.default.ok(reading !== null);
        strict_1.default.equal(reading.deviceId, 'ESP32_01');
        strict_1.default.equal(reading.inletFlow, 12.5);
        strict_1.default.equal(reading.outletFlow, 12.3);
        strict_1.default.equal(reading.flowDifference, 0.2);
        strict_1.default.equal(reading.timestamp, 1700000000000);
        strict_1.default.equal(reading.isValid, true);
    });
    (0, node_test_1.test)('3. Handles stringified numeric flow values correctly without units corruption', () => {
        const payload = JSON.stringify({
            deviceId: 'ESP32_WOKWI_01',
            inlet: '16.50',
            outlet: '10.80',
            ts: 1700000000,
            isValid: true,
            isSimulated: 'true',
        });
        const { reading, error } = (0, telemetryParser_1.parseAndNormalizeTelemetry)(payload);
        strict_1.default.equal(error, undefined);
        strict_1.default.ok(reading !== null);
        strict_1.default.equal(reading.inletFlow, 16.5);
        strict_1.default.equal(reading.outletFlow, 10.8);
        strict_1.default.equal(reading.flowDifference, 5.7);
        // ts was in seconds; normalized to ms
        strict_1.default.equal(reading.timestamp, 1700000000000);
        strict_1.default.equal(reading.isSimulated, true);
    });
    (0, node_test_1.test)('4. Safely rejects non-finite values (Infinity, NaN, string text)', () => {
        const payloadInf = JSON.stringify({ inlet: 'Infinity', outlet: 8.0 });
        const resInf = (0, telemetryParser_1.parseAndNormalizeTelemetry)(payloadInf);
        strict_1.default.equal(resInf.reading, null);
        strict_1.default.match(resInf.error || '', /Non-finite flow values/);
        const payloadNaN = JSON.stringify({ inlet: 'NaN', outlet: 8.0 });
        const resNaN = (0, telemetryParser_1.parseAndNormalizeTelemetry)(payloadNaN);
        strict_1.default.equal(resNaN.reading, null);
        const payloadText = JSON.stringify({ inlet: 'not_a_number', outlet: 8.0 });
        const resText = (0, telemetryParser_1.parseAndNormalizeTelemetry)(payloadText);
        strict_1.default.equal(resText.reading, null);
        const payloadEmpty = JSON.stringify({ inlet: '', outlet: 8.0 });
        const resEmpty = (0, telemetryParser_1.parseAndNormalizeTelemetry)(payloadEmpty);
        strict_1.default.equal(resEmpty.reading, null);
    });
    (0, node_test_1.test)('5. Flags negative flow readings as invalid', () => {
        const payload = JSON.stringify({
            deviceId: 'ESP32_FAULT',
            inlet: -5.0,
            outlet: 10.0,
        });
        const { reading, error } = (0, telemetryParser_1.parseAndNormalizeTelemetry)(payload);
        strict_1.default.equal(error, undefined);
        strict_1.default.ok(reading !== null);
        strict_1.default.equal(reading.isValid, false);
    });
    (0, node_test_1.test)('6. Rejects malformed JSON syntax gracefully', () => {
        const malformed = '{ "deviceId": "corrupt", inlet: 8.0 ';
        const { reading, error } = (0, telemetryParser_1.parseAndNormalizeTelemetry)(malformed);
        strict_1.default.equal(reading, null);
        strict_1.default.match(error || '', /Invalid JSON/);
    });
    (0, node_test_1.test)('7. Rejects missing required flow fields', () => {
        const payload = JSON.stringify({ deviceId: 'test_dev', temperature: 25.0 });
        const { reading, error } = (0, telemetryParser_1.parseAndNormalizeTelemetry)(payload);
        strict_1.default.equal(reading, null);
        strict_1.default.match(error || '', /Missing flow rate fields/);
    });
});
(0, node_test_1.describe)('Telemetry State Isolation & Detection Engine Feeding', () => {
    (0, node_test_1.test)('8. Wokwi telemetry feeds Authoritative LeakDetectionEngine and detects leak', () => {
        const engine = new leakDetection_1.LeakDetectionEngine();
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
        const { reading } = (0, telemetryParser_1.parseAndNormalizeTelemetry)(rawPacket);
        strict_1.default.ok(reading !== null);
        // Initial tick: buffering in 'checking'
        const r1 = engine.processReading(reading, testThresholds, t0);
        strict_1.default.equal(r1.state, 'checking');
        strict_1.default.equal(r1.hasAlert, false);
        // After persistence duration (6 seconds later): triggers 'leak'
        const t1 = t0 + 6000;
        const r2 = engine.processReading({ ...reading, timestamp: t1 }, testThresholds, t1);
        strict_1.default.equal(r2.state, 'leak');
        strict_1.default.equal(r2.hasAlert, true);
        strict_1.default.equal(r2.alertCandidate?.category, 'SUSPECTED_LEAK');
    });
    (0, node_test_1.test)('9. Reversed flow from Wokwi is treated as diagnostic check, never a leak', () => {
        const engine = new leakDetection_1.LeakDetectionEngine();
        const t0 = 1700000000000;
        const rawPacket = JSON.stringify({
            deviceId: 'waterguard-wokwi-esp32',
            source: 'wokwi',
            inlet: 8.0,
            outlet: 15.0,
            ts: Math.floor(t0 / 1000),
        });
        const { reading } = (0, telemetryParser_1.parseAndNormalizeTelemetry)(rawPacket);
        strict_1.default.ok(reading !== null);
        // At T+6s: emits SENSOR_ANOMALY with state 'datacheck'
        const t1 = t0 + 6000;
        const res = engine.processReading({ ...reading, timestamp: t1 }, testThresholds, t1);
        strict_1.default.equal(res.state, 'datacheck');
        strict_1.default.equal(res.activeCategory, 'SENSOR_ANOMALY');
        strict_1.default.notEqual(res.activeCategory, 'SUSPECTED_LEAK');
    });
    (0, node_test_1.test)('10. Demo interval ticks do NOT overwrite state when active source is WOKWI', () => {
        // Mimic the state coordinator logic used in SensorContext
        let currentInFlow = 12.5;
        let currentOutFlow = 12.3;
        let currentSource = 'wokwi';
        // Simulated MQTT packet arriving from Wokwi
        const liveTelemetry = {
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
        function handleLiveTelemetry(reading) {
            if (currentSource === 'wokwi' || currentSource === 'mqtt') {
                currentInFlow = reading.inletFlow;
                currentOutFlow = reading.outletFlow;
            }
        }
        // Demo timer tick function mirroring SensorContext demo timer
        function handleDemoTick(demoIn, demoOut) {
            if (currentSource !== 'demo') {
                // Must be blocked!
                return;
            }
            currentInFlow = demoIn;
            currentOutFlow = demoOut;
        }
        // 1. Receive Wokwi packet
        handleLiveTelemetry(liveTelemetry);
        strict_1.default.equal(currentInFlow, 8.0);
        strict_1.default.equal(currentOutFlow, 8.0);
        // 2. Demo timer attempts to tick with baseline (12.5 / 12.3)
        handleDemoTick(12.5, 12.3);
        // Values MUST remain 8.0 / 8.0 from Wokwi
        strict_1.default.equal(currentInFlow, 8.0, 'Demo tick must NOT overwrite live Wokwi inlet flow');
        strict_1.default.equal(currentOutFlow, 8.0, 'Demo tick must NOT overwrite live Wokwi outlet flow');
    });
});
