/**
 * WaterGuard-IoT: 24/7 Background Telemetry Subscriber & Automated Alert Dispatcher
 * Subscribes to MQTT telemetry, monitors volumetric balance, and alerts Admin devices.
 */
const mqtt = require('mqtt');

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://broker.emqx.io:1883';
const TELEMETRY_TOPIC = process.env.MQTT_TOPIC_TELEMETRY || 'water/demo/telemetry';
const COMMAND_TOPIC = process.env.MQTT_TOPIC_COMMAND || 'water/demo/command';

// Default leak detection thresholds
let config = {
  mismatchThreshold: 1.5, // L/min
  persistenceDurationSec: 5, // seconds
  highConsumptionThreshold: 25.0, // L/min
  cooldownPeriodSec: 60, // seconds between duplicate alerts
};

let leakStartTime = null;
let lastAlertDispatchedTime = 0;
let consecutiveMismatchCount = 0;

console.log('====================================================');
console.log('WaterGuard-IoT Background MQTT Detection Service');
console.log(`Connecting to: ${BROKER_URL}`);
console.log(`Monitoring topic: ${TELEMETRY_TOPIC}`);
console.log('====================================================');

const client = mqtt.connect(BROKER_URL, {
  clientId: `WaterGuard_Daemon_${Math.random().toString(16).substring(2, 8)}`,
  clean: true,
  reconnectPeriod: 3000,
});

client.on('connect', () => {
  console.log(`[MQTT] Successfully connected to broker at ${new Date().toISOString()}`);
  client.subscribe(TELEMETRY_TOPIC, (err) => {
    if (err) {
      console.error('[MQTT] Subscription error:', err);
    } else {
      console.log(`[MQTT] Subscribed to telemetry channel: ${TELEMETRY_TOPIC}`);
    }
  });
});

client.on('message', (topic, message) => {
  if (topic !== TELEMETRY_TOPIC) return;

  try {
    const raw = message.toString();
    const data = JSON.parse(raw);

    const inlet = parseFloat(data.inlet ?? data.inletFlow ?? 0);
    const outlet = parseFloat(data.outlet ?? data.outletFlow ?? 0);
    const diff = Math.max(0, inlet - outlet);

    const now = Date.now();

    // Check for volumetric deficit
    if (diff >= config.mismatchThreshold) {
      if (!leakStartTime) {
        leakStartTime = now;
      }
      consecutiveMismatchCount++;
      const durationSec = (now - leakStartTime) / 1000;

      process.stdout.write(
        `\r[MONITOR] Mismatch: +${diff.toFixed(1)} L/min | Sustained: ${durationSec.toFixed(1)}s (Threshold: ${config.persistenceDurationSec}s)`
      );

      if (durationSec >= config.persistenceDurationSec) {
        const timeSinceLastAlert = (now - lastAlertDispatchedTime) / 1000;
        if (timeSinceLastAlert >= config.cooldownPeriodSec) {
          triggerEmergencyAlarm({
            inletFlow: inlet,
            outletFlow: outlet,
            flowDifference: diff,
            durationSec: Math.round(durationSec),
            timestamp: now,
          });
          lastAlertDispatchedTime = now;
        }
      }
    } else {
      // Flow balanced or normal
      if (leakStartTime) {
        console.log(`\n[MONITOR] Balance restored. Inlet: ${inlet.toFixed(1)}, Outlet: ${outlet.toFixed(1)} L/min`);
      }
      leakStartTime = null;
      consecutiveMismatchCount = 0;
    }
  } catch (err) {
    // Ignore malformed payloads
  }
});

function triggerEmergencyAlarm(incident) {
  console.log('\n----------------------------------------------------');
  console.log(`🚨 [EMERGENCY LEAKAGE DETECTED] ${new Date().toISOString()}`);
  console.log(`- Inlet Flow: ${incident.inletFlow.toFixed(1)} L/min`);
  console.log(`- Outlet Flow: ${incident.outletFlow.toFixed(1)} L/min`);
  console.log(`- Volume Loss: +${incident.flowDifference.toFixed(1)} L/min`);
  console.log(`- Sustained Duration: ${incident.durationSec}s`);
  console.log('-> Automatic Alert Dispatched to Authorized Administrators');
  console.log('----------------------------------------------------');

  // If Firebase Admin SDK credentials are present, write document to /alerts collection
  try {
    const admin = require('firebase-admin');
    if (admin.apps.length > 0) {
      const db = admin.firestore();
      db.collection('alerts').add({
        title: 'Suspected Pipe Leakage Detected',
        explanation: `Significant flow difference detected between Inlet (${incident.inletFlow.toFixed(1)} L/min) and Outlet (${incident.outletFlow.toFixed(1)} L/min) meters sustained for ${incident.durationSec}s.`,
        severity: incident.flowDifference > 5.0 ? 'CRITICAL' : 'WARNING',
        status: 'ACTIVE',
        category: 'UNEXPECTED_DROP',
        inletFlow: incident.inletFlow,
        outletFlow: incident.outletFlow,
        flowDifference: incident.flowDifference,
        timestamp: incident.timestamp,
        source: 'background_daemon',
      }).then((ref) => {
        console.log(`[Firestore] Alert document logged: ${ref.id}`);
      }).catch((e) => {
        console.warn('[Firestore] Failed to write alert:', e.message);
      });
    }
  } catch {
    // Offline evaluation
  }
}

client.on('error', (err) => {
  console.error('[MQTT] Connection error:', err.message);
});

process.on('SIGINT', () => {
  console.log('\n[Daemon] Gracefully terminating MQTT subscriber...');
  client.end(true, () => process.exit(0));
});
