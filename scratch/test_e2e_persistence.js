const assert = require('assert');
const { parseAndNormalizeTelemetry } = require('./dist-test/src/utils/telemetryParser.js');
const { LeakDetectionEngine } = require('./dist-test/src/utils/leakDetection.js');

// 1. Compile test check for telemetry parsing & persistence
const sampleTelemetryLeak = JSON.stringify({
  deviceId: "waterguard-wokwi-esp32",
  source: "wokwi",
  sequence: 42,
  ts: Math.floor(Date.now() / 1000),
  inlet: 8.00,
  outlet: 3.00,
  isValid: true,
  isSimulated: true,
  scenario: "suspected_leak",
  notes: "Inlet: 8.00 L/min, Outlet: 3.00 L/min",
  tank1: 2.89,
  tank2: 2.89,
  valve1: "OPEN",
  valve2: "OPEN",
  scadaMode: "REMOTE"
});

console.log("=== RUNNING E2E TELEMETRY & PERSISTENCE VERIFICATION ===");

// Test 1: Telemetry Parsing
const parsed = parseAndNormalizeTelemetry(sampleTelemetryLeak);
assert.equal(parsed.error, undefined, "Parsed successfully without error");
assert.ok(parsed.reading !== null, "Reading is not null");
assert.equal(parsed.reading.deviceId, "waterguard-wokwi-esp32");
assert.equal(parsed.reading.inletFlow, 8.0);
assert.equal(parsed.reading.outletFlow, 3.0);
assert.equal(parsed.reading.flowDifference, 5.0);
assert.equal(parsed.reading.sequence, 42);
assert.equal(parsed.reading.source, "wokwi");
console.log("✔ Test 1: Firmware telemetry payload parsing and normalization passed.");

// Test 2: Detection Engine Persistence across multiple cycles
const engine = new LeakDetectionEngine();
const thresholds = {
  mismatchThreshold: 1.5,
  persistenceDurationSec: 5,
  highConsumptionThreshold: 25.0,
  highConsumptionDurationSec: 6,
  nightTimeStartHour: 23,
  nightTimeEndHour: 5,
  nightTimeThreshold: 1.0,
  sensorTimeoutSec: 10,
};

let now = 1000000;
// Cycle 1: First deficit reading (t = 0s)
let res1 = engine.processReading(parsed.reading, thresholds, now);
assert.equal(res1.state, 'checking', "First cycle is checking");
assert.equal(res1.hasAlert, false, "No premature alert before persistence");
console.log("✔ Test 2A: Cycle 1 at t=0s is 'checking' without premature false alert.");

// Subsequent telemetry cycles (simulating periodic publish every 2s)
// Cycle 2: t = 2s
now += 2000;
let res2 = engine.processReading({ ...parsed.reading, sequence: 43 }, thresholds, now);
assert.equal(res2.state, 'checking');
console.log("✔ Test 2B: Cycle 2 at t=2s continues checking with persistent 8/3 values.");

// Cycle 3: t = 4s
now += 2000;
let res3 = engine.processReading({ ...parsed.reading, sequence: 44 }, thresholds, now);
assert.equal(res3.state, 'checking');
console.log("✔ Test 2C: Cycle 3 at t=4s continues checking with persistent 8/3 values.");

// Cycle 4: t = 6s (> 5s persistence threshold)
now += 2000;
let res4 = engine.processReading({ ...parsed.reading, sequence: 45 }, thresholds, now);
assert.equal(res4.state, 'leak', "State transitioned to leak after persistence duration");
assert.equal(res4.hasAlert, true, "Alert triggered after persistence satisfied");
assert.equal(res4.activeCategory, 'SUSPECTED_LEAK');
console.log("✔ Test 2D: Cycle 4 at t=6s correctly triggers verified SUSPECTED_LEAK alert!");

// Test 3: Recovery flow (inlet = 8.0, outlet = 8.0)
const sampleTelemetryRecovered = {
  deviceId: "waterguard-wokwi-esp32",
  source: "wokwi",
  sequence: 46,
  timestamp: now + 2000,
  inletFlow: 8.00,
  outletFlow: 8.00,
  flowDifference: 0.00,
  isValid: true,
  isSimulated: true,
  scenario: "normal",
  status: "online"
};
now += 2000;
let recRes = engine.processReading(sampleTelemetryRecovered, thresholds, now);
assert.equal(recRes.state, 'normal', "State returned to normal");
assert.equal(recRes.isRecovered, true, "Recovery event emitted");
assert.equal(recRes.recoveredCategory, 'SUSPECTED_LEAK');
console.log("✔ Test 3: Balanced 8.0 / 8.0 telemetry successfully triggers RECOVERY event!");

console.log("\nALL VERIFICATION CHECKS PASSED SUCCESSFULLY!");
