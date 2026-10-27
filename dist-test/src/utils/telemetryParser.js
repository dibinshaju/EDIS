"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAndNormalizeTelemetry = parseAndNormalizeTelemetry;
/**
 * Parses and normalizes incoming MQTT telemetry payloads.
 *
 * Requirements:
 * - Supports both firmware fields (`inlet`, `outlet`) and canonical fields (`inletFlow`, `outletFlow`).
 * - Validates numeric fields and rejects non-finite values (NaN, Infinity, -Infinity).
 * - Safe JSON parsing; handles stringified numbers (e.g. "8.00").
 * - Normalizes `isSimulated` without falsely rejecting Wokwi virtual hardware.
 * - Extracts or infers data source (`wokwi`, `demo`, or `mqtt`).
 * - Normalizes Unix timestamp (converting seconds < 10^10 to milliseconds).
 * - Preserves configured flow units without arbitrary conversion or scaling.
 */
function parseAndNormalizeTelemetry(raw) {
    let data;
    if (typeof raw === 'string') {
        try {
            data = JSON.parse(raw);
        }
        catch (err) {
            return { reading: null, error: `Invalid JSON payload: ${err?.message || err}` };
        }
    }
    else {
        data = raw;
    }
    if (!data || typeof data !== 'object') {
        return { reading: null, error: 'Telemetry payload must be a non-null JSON object.' };
    }
    // 1. Resolve raw inlet and outlet candidates
    const inletCandidate = data.inlet !== undefined ? data.inlet : data.inletFlow;
    const outletCandidate = data.outlet !== undefined ? data.outlet : data.outletFlow;
    if (inletCandidate === undefined || outletCandidate === undefined) {
        return {
            reading: null,
            error: `Missing flow rate fields. Expected 'inlet'/'inletFlow' and 'outlet'/'outletFlow'. Got inlet=${inletCandidate}, outlet=${outletCandidate}`,
        };
    }
    // Handle empty strings or non-numeric types
    if (inletCandidate === '' || outletCandidate === '') {
        return {
            reading: null,
            error: 'Flow rate fields must not be empty strings.',
        };
    }
    const numInlet = typeof inletCandidate === 'number' ? inletCandidate : Number(inletCandidate);
    const numOutlet = typeof outletCandidate === 'number' ? outletCandidate : Number(outletCandidate);
    // Reject non-finite values (NaN, Infinity, -Infinity)
    if (!isFinite(numInlet) || isNaN(numInlet) || !isFinite(numOutlet) || isNaN(numOutlet)) {
        return {
            reading: null,
            error: `Non-finite flow values detected: In=${inletCandidate}, Out=${outletCandidate}`,
        };
    }
    // 2. Validate bounds & explicit flags
    const isExplicitlyInvalid = data.isValid === false;
    const hasNegativeFlow = numInlet < 0 || numOutlet < 0;
    const isValid = !isExplicitlyInvalid && !hasNegativeFlow;
    const inletFlow = Math.max(0, numInlet);
    const outletFlow = Math.max(0, numOutlet);
    // 3. Normalize timestamp (support seconds vs milliseconds)
    let timestamp = Date.now();
    const rawTs = data.timestamp !== undefined ? data.timestamp : data.ts;
    if (rawTs !== undefined && rawTs !== null) {
        const numTs = Number(rawTs);
        if (isFinite(numTs) && numTs > 0) {
            timestamp = numTs < 10000000000 ? Math.round(numTs * 1000) : Math.round(numTs);
        }
    }
    // 4. Normalize isSimulated & source
    const sourceStr = typeof data.source === 'string' ? data.source.toLowerCase() : '';
    const deviceIdStr = typeof data.deviceId === 'string' ? data.deviceId : typeof data.id === 'string' ? data.id : '';
    const isSimulated = typeof data.isSimulated === 'boolean'
        ? data.isSimulated
        : typeof data.isSimulated === 'string'
            ? data.isSimulated.toLowerCase() === 'true'
            : sourceStr === 'wokwi' || sourceStr === 'simulator';
    const source = sourceStr === 'wokwi' || deviceIdStr.toLowerCase().includes('wokwi')
        ? 'wokwi'
        : sourceStr === 'demo'
            ? 'demo'
            : 'mqtt';
    const deviceId = deviceIdStr.trim().length > 0
        ? deviceIdStr.trim()
        : source === 'wokwi'
            ? 'waterguard-wokwi-esp32'
            : 'SIM_METER_01';
    // 5. Calculate or preserve flowDifference (inlet - outlet)
    const flowDifference = data.flowDifference !== undefined && isFinite(Number(data.flowDifference))
        ? Number(Number(data.flowDifference).toFixed(2))
        : Number((inletFlow - outletFlow).toFixed(2));
    const notes = typeof data.notes === 'string'
        ? data.notes
        : typeof data.scenario === 'string'
            ? `Scenario: ${data.scenario}`
            : undefined;
    const scenario = typeof data.scenario === 'string' ? data.scenario : undefined;
    const requestId = typeof data.requestId === 'string' ? data.requestId : undefined;
    const sequence = typeof data.sequence === 'number'
        ? data.sequence
        : typeof data.seq === 'number'
            ? data.seq
            : undefined;
    const reading = {
        deviceId,
        sequence,
        timestamp,
        inletFlow,
        outletFlow,
        flowDifference,
        isValid,
        isSimulated,
        source,
        status: 'online',
        notes,
        scenario,
        requestId,
    };
    return { reading };
}
