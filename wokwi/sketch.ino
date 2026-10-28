/*
 * ==============================================================================
 * Project: Smart Water Monitor (IoT-Based Leakage & Abnormal Consumption Detection)
 * Target Hardware: Virtual ESP32 (Wokwi Simulator) & Physical ESP32 DevKit
 * Communication: WiFi + MQTT over TCP (Port 1883)
 * Topics:
 *   - water/demo/telemetry (Publish flow telemetry JSON)
 *   - water/demo/command   (Subscribe to remote scenario / SCADA commands)
 *   - water/demo/ack       (Publish command execution confirmations)
 * ==============================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ----------------- Pin Definitions -----------------
#define PIN_POT_INLET   34  // Analog Input: Simulated Flow Sensor 1
#define PIN_POT_OUTLET  35  // Analog Input: Simulated Flow Sensor 2
#define PIN_LED_ALERT   2   // Red Alert LED
#define PIN_BUZZER      25  // Hardware Alert Buzzer

// ----------------- WiFi Configuration --------------
// Wokwi virtual WiFi network requires no password
const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASS = "";

// ----------------- MQTT Broker ---------------------
// Using public broker.emqx.io (TCP port 1883, matching WSS port 8084 on the web dashboard)
const char* MQTT_BROKER     = "broker.emqx.io";
const int   MQTT_PORT       = 1883;
const char* TOPIC_TELEMETRY = "water/demo/telemetry";
const char* TOPIC_COMMAND   = "water/demo/command";
const char* TOPIC_ACK       = "water/demo/ack";

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ----------------- State & Calibration -------------
const char* DEVICE_ID = "waterguard-wokwi-esp32";
const char* SOURCE    = "wokwi";
unsigned long lastPublishTime = 0;
const unsigned long PUBLISH_INTERVAL_MS = 2000; // Publish every 2 seconds
unsigned long telemetrySequence = 0;

// Persistent simulated sensor readings (persists across all loop iterations)
float currentInlet = 8.00;
float currentOutlet = 8.00;
float currentTank1 = 2.89;
float currentTank2 = 2.89;
String valve1State = "OPEN";
String valve2State = "OPEN";
String scadaMode = "REMOTE"; // "LOCAL", "REMOTE", "AUTO"
String currentScenario = "normal";
String lastRequestId = "";
bool alarmActive = false;

// Function Prototypes
void setupWiFi();
void reconnectMQTT();
void onMqttMessage(char* topic, byte* payload, unsigned int length);
float readFlowSensor(int pin);
void publishAck(String reqId, String status, float inVal, float outVal);
void publishTelemetryNow();

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n========================================================");
  Serial.println("  Smart Water Monitor - Virtual ESP32 Node Initializing ");
  Serial.println("========================================================");

  pinMode(PIN_POT_INLET, INPUT);
  pinMode(PIN_POT_OUTLET, INPUT);
  pinMode(PIN_LED_ALERT, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  digitalWrite(PIN_LED_ALERT, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  setupWiFi();

  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(onMqttMessage);
  mqttClient.setBufferSize(1024);
}

void publishTelemetryNow() {
  telemetrySequence++;

  // Read strictly from persistent in-memory variables (never overwritten by analog ADC noise)
  float inletLpm = currentInlet;
  float outletLpm = currentOutlet;
  float mismatch = inletLpm - outletLpm;

  // Trigger local LED and Buzzer on alarm edge if leak is severe (>= 2.0 L/min deficit)
  if (mismatch >= 2.0) {
    digitalWrite(PIN_LED_ALERT, HIGH);
    if (!alarmActive) {
      tone(PIN_BUZZER, 1000, 100);
      alarmActive = true;
    }
  } else {
    digitalWrite(PIN_LED_ALERT, LOW);
    if (alarmActive) {
      noTone(PIN_BUZZER);
      alarmActive = false;
    }
  }

  // Derive accurate scenario state based on current persistent flow rates
  String scenarioToSend = currentScenario;
  if (mismatch >= 2.0) {
    scenarioToSend = "suspected_leak";
  } else if (mismatch <= -2.0) {
    scenarioToSend = "sensor_anomaly";
  } else if (inletLpm >= 25.0) {
    scenarioToSend = "abnormal_consumption";
  } else if (currentScenario.length() > 0 && currentScenario != "normal") {
    scenarioToSend = currentScenario;
  } else {
    scenarioToSend = "normal";
  }

  // Build JSON Telemetry Payload cleanly without temporary String dangling pointers
  StaticJsonDocument<512> doc;
  doc["deviceId"]    = DEVICE_ID;
  doc["source"]      = SOURCE;
  doc["sequence"]    = telemetrySequence;
  doc["ts"]          = (unsigned long)(millis() / 1000);
  doc["inlet"]       = inletLpm;
  doc["inletFlow"]   = inletLpm;
  doc["outlet"]      = outletLpm;
  doc["outletFlow"]  = outletLpm;
  doc["isValid"]     = true;
  doc["isSimulated"] = true;
  doc["scenario"]    = scenarioToSend;
  doc["notes"]       = "Inlet: " + String(inletLpm, 2) + " L/min, Outlet: " + String(outletLpm, 2) + " L/min";
  doc["tank1"]       = currentTank1;
  doc["tank2"]       = currentTank2;
  doc["valve1"]      = valve1State;
  doc["valve2"]      = valve2State;
  doc["scadaMode"]   = scadaMode;
  if (lastRequestId.length() > 0) {
    doc["requestId"] = lastRequestId;
  }

  char buffer[512];
  serializeJson(doc, buffer);

  bool pubOk = mqttClient.publish(TOPIC_TELEMETRY, buffer);
  if (pubOk) {
    Serial.printf("[STAGE 3: WOKWI TELEMETRY PUBLISHED #%lu] %s\n", telemetrySequence, buffer);
  } else {
    Serial.println("[MQTT ERROR] Telemetry publish failed!");
  }
  lastPublishTime = millis();
}

void publishAck(String reqId, String status, float inVal, float outVal) {
  StaticJsonDocument<384> ackDoc;
  ackDoc["type"]      = "ack";
  ackDoc["command"]   = "set_flow";
  ackDoc["status"]    = status;
  if (reqId.length() > 0) {
    ackDoc["requestId"] = reqId;
  }
  ackDoc["inlet"]     = inVal;
  ackDoc["inletFlow"] = inVal;
  ackDoc["outlet"]    = outVal;
  ackDoc["outletFlow"]= outVal;
  ackDoc["tank1"]     = currentTank1;
  ackDoc["tank2"]     = currentTank2;
  ackDoc["valve1"]    = valve1State;
  ackDoc["valve2"]    = valve2State;
  ackDoc["mode"]      = scadaMode;
  ackDoc["timestamp"] = (unsigned long)(millis() / 1000);

  char ackBuf[384];
  serializeJson(ackDoc, ackBuf);
  mqttClient.publish(TOPIC_ACK, ackBuf);
  Serial.printf("[STAGE 3: WOKWI ACK PUBLISHED] to %s: %s\n", TOPIC_ACK, ackBuf);
}

void loop() {
  // Ensure WiFi remains connected
  if (WiFi.status() != WL_CONNECTED) {
    setupWiFi();
  }

  // Ensure MQTT client is connected
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  // Periodic Telemetry Publish (reads currentInlet / currentOutlet persistently)
  unsigned long now = millis();
  if (now - lastPublishTime >= PUBLISH_INTERVAL_MS) {
    publishTelemetryNow();
  }
}

// Map ADC pin reading (0-4095) to realistic flow rate (0.0 - 35.0 L/min)
float readFlowSensor(int pin) {
  int raw = analogRead(pin);
  float lpm = (raw / 4095.0) * 35.0;
  return lpm;
}

// WiFi Setup
void setupWiFi() {
  Serial.print("[WiFi] Connecting to ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected successfully! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[WiFi] Connection timed out. Running in offline loop.");
  }
}

// MQTT Reconnection
void reconnectMQTT() {
  int retries = 0;
  while (!mqttClient.connected() && retries < 3) {
    String clientId = "ESP32_Wokwi_" + String(random(0xffff), HEX);
    Serial.printf("[MQTT] Connecting to %s:%d as %s...\n", MQTT_BROKER, MQTT_PORT, clientId.c_str());

    if (mqttClient.connect(clientId.c_str())) {
      Serial.println("[MQTT] Connected to broker successfully!");
      mqttClient.subscribe(TOPIC_COMMAND);
      Serial.printf("[MQTT] Subscribed to command topic: %s\n", TOPIC_COMMAND);
    } else {
      Serial.printf("[MQTT] Connect failed, rc=%d. Retrying in 2 seconds...\n", mqttClient.state());
      delay(2000);
      retries++;
    }
  }
}

// Handle Inbound Commands from SCADA Controller or Mobile App
void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  char msg[length + 1];
  memcpy(msg, payload, length);
  msg[length] = '\0';

  Serial.printf("[STAGE 1: WOKWI RECEIVED COMMAND] Topic: %s | Payload: %s\n", topic, msg);

  // Check JSON format or plain-text fallback
  StaticJsonDocument<768> doc;
  DeserializationError error = deserializeJson(doc, msg);
  if (error) {
    String textCmd = String(msg);
    textCmd.trim();
    if (textCmd.equalsIgnoreCase("normal")) {
      currentInlet = 8.0; currentOutlet = 8.0; currentScenario = "normal"; lastRequestId = "";
      Serial.println("[STAGE 2: WOKWI PARSED] Plain-text: Applied normal (8.0/8.0)");
      publishAck("", "applied", currentInlet, currentOutlet);
      publishTelemetryNow();
    } else if (textCmd.equalsIgnoreCase("leak")) {
      currentInlet = 8.0; currentOutlet = 3.0; currentScenario = "suspected_leak"; lastRequestId = "";
      Serial.println("[STAGE 2: WOKWI PARSED] Plain-text: Applied leak (8.0/3.0)");
      publishAck("", "applied", currentInlet, currentOutlet);
      publishTelemetryNow();
    } else if (textCmd.equalsIgnoreCase("high")) {
      currentInlet = 30.0; currentOutlet = 30.0; currentScenario = "abnormal_consumption"; lastRequestId = "";
      Serial.println("[STAGE 2: WOKWI PARSED] Plain-text: Applied high consumption (30.0/30.0)");
      publishAck("", "applied", currentInlet, currentOutlet);
      publishTelemetryNow();
    } else if (textCmd.equalsIgnoreCase("reversed")) {
      currentInlet = 3.0; currentOutlet = 8.0; currentScenario = "sensor_anomaly"; lastRequestId = "";
      Serial.println("[STAGE 2: WOKWI PARSED] Plain-text: Applied reversed mismatch (3.0/8.0)");
      publishAck("", "applied", currentInlet, currentOutlet);
      publishTelemetryNow();
    } else if (textCmd.equalsIgnoreCase("night")) {
      currentInlet = 2.0; currentOutlet = 2.0; currentScenario = "night_time_flow"; lastRequestId = "";
      Serial.println("[STAGE 2: WOKWI PARSED] Plain-text: Applied night flow (2.0/2.0)");
      publishAck("", "applied", currentInlet, currentOutlet);
      publishTelemetryNow();
    } else {
      Serial.printf("[STAGE 2 ERROR] Failed to parse command JSON: %s\n", error.c_str());
    }
    return;
  }

  const char* cmd = doc["command"];
  bool hasFlowFields = doc.containsKey("inlet") || doc.containsKey("inletFlow") || doc.containsKey("outlet") || doc.containsKey("outletFlow");
  bool isFlowCommand = (cmd && (strcmp(cmd, "set_flow") == 0 || strcmp(cmd, "set_scada") == 0 || strcmp(cmd, "set_manual_flow") == 0 || strcmp(cmd, "flow") == 0)) || (!cmd && hasFlowFields);

  if (isFlowCommand) {
    float inVal = currentInlet;
    if (doc.containsKey("inlet")) {
      inVal = doc["inlet"].as<float>();
    } else if (doc.containsKey("inletFlow")) {
      inVal = doc["inletFlow"].as<float>();
    }

    float outVal = currentOutlet;
    if (doc.containsKey("outlet")) {
      outVal = doc["outlet"].as<float>();
    } else if (doc.containsKey("outletFlow")) {
      outVal = doc["outletFlow"].as<float>();
    }

    const char* reqIdC = doc["requestId"] | doc["reqId"] | doc["id"] | "";
    String reqId = String(reqIdC);

    // Validate bounds 0.0 to 100.0 L/min
    if (isnan(inVal) || isnan(outVal) || inVal < 0.0 || inVal > 100.0 || outVal < 0.0 || outVal > 100.0) {
      publishAck(reqId, "rejected_range", inVal, outVal);
      Serial.printf("[STAGE 2 REJECTED] Flow values out of range (0-100 L/min): In=%.2f, Out=%.2f\n", inVal, outVal);
    } else {
      // STORE PERSISTENTLY IN MEMORY (Will never be overwritten by analog ADC noise)
      currentInlet = inVal;
      currentOutlet = outVal;

      if (doc.containsKey("tank1")) {
        currentTank1 = doc["tank1"].as<float>();
      }
      if (doc.containsKey("tank2")) {
        currentTank2 = doc["tank2"].as<float>();
      }
      if (doc.containsKey("valve1")) {
        valve1State = String((const char*)doc["valve1"]);
      }
      if (doc.containsKey("valve2")) {
        valve2State = String((const char*)doc["valve2"]);
      }
      if (doc.containsKey("mode")) {
        scadaMode = String((const char*)doc["mode"]);
      }

      lastRequestId = reqId;
      float diff = currentInlet - currentOutlet;
      if (diff >= 2.0) {
        currentScenario = "suspected_leak";
      } else if (diff <= -2.0) {
        currentScenario = "sensor_anomaly";
      } else if (currentInlet >= 25.0) {
        currentScenario = "abnormal_consumption";
      } else {
        currentScenario = "normal";
      }

      Serial.printf("[STAGE 2: WOKWI PARSED & PERSISTED] In=%.2f, Out=%.2f, Scenario=%s, ReqId=%s\n",
                    currentInlet, currentOutlet, currentScenario.c_str(), reqId.c_str());

      publishAck(reqId, "applied", currentInlet, currentOutlet);
      publishTelemetryNow();
    }
  } else if (cmd && strcmp(cmd, "set_scenario") == 0) {
    const char* sc = doc["scenario"];
    if (sc) {
      currentScenario = String(sc);
      if (currentScenario == "normal") {
        currentInlet = 8.0; currentOutlet = 8.0;
      } else if (currentScenario == "suspected_leak") {
        currentInlet = 8.0; currentOutlet = 3.0;
      } else if (currentScenario == "abnormal_consumption") {
        currentInlet = 30.0; currentOutlet = 30.0;
      } else if (currentScenario == "sensor_anomaly") {
        currentInlet = 3.0; currentOutlet = 8.0;
      } else if (currentScenario == "night_time_flow") {
        currentInlet = 2.0; currentOutlet = 2.0;
      } else if (currentScenario == "recovery") {
        currentInlet = 8.0; currentOutlet = 8.0;
      }
      lastRequestId = doc["requestId"] | "";
      Serial.printf("[STAGE 2: WOKWI PARSED] Scenario command: %s (In=%.1f, Out=%.1f)\n", sc, currentInlet, currentOutlet);
      publishAck(lastRequestId, "applied", currentInlet, currentOutlet);
      publishTelemetryNow();
    }
  } else if (cmd && (strcmp(cmd, "reset") == 0 || strcmp(cmd, "reset_baseline") == 0)) {
    // Explicit user reset only
    currentInlet = 8.0;
    currentOutlet = 8.0;
    currentTank1 = 2.89;
    currentTank2 = 2.89;
    valve1State = "OPEN";
    valve2State = "OPEN";
    scadaMode = "REMOTE";
    currentScenario = "normal";
    lastRequestId = doc["requestId"] | "";
    digitalWrite(PIN_LED_ALERT, LOW);
    noTone(PIN_BUZZER);
    alarmActive = false;
    Serial.println("[STAGE 2: WOKWI PARSED] Explicit reset to baseline (8.0/8.0)");
    publishAck(lastRequestId, "reset_applied", currentInlet, currentOutlet);
    publishTelemetryNow();
  } else if (cmd && strcmp(cmd, "ack_alarm") == 0) {
    alarmActive = false;
    digitalWrite(PIN_LED_ALERT, LOW);
    noTone(PIN_BUZZER);
    Serial.println("[STAGE 2: WOKWI PARSED] Alarm silenced remotely from app");
  } else {
    Serial.printf("[STAGE 2 UNHANDLED] Unrecognized command JSON: %s\n", msg);
  }
}
