/*
 * ==============================================================================
 * Project: Smart Water Monitor (IoT-Based Leakage & Abnormal Consumption Detection)
 * Target Hardware: Virtual ESP32 (Wokwi Simulator) & Physical ESP32 DevKit
 * Communication: WiFi + MQTT over TCP (Port 1883)
 * Topics:
 *   - water/demo/telemetry (Publish flow telemetry JSON)
 *   - water/demo/command   (Subscribe to remote scenario commands)
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
// Using public broker.emqx.io (TCP port 1883, matching WSS port 8084 on the app)
const char* MQTT_BROKER     = "broker.emqx.io";
const int   MQTT_PORT       = 1883;
const char* TOPIC_TELEMETRY = "water/demo/telemetry";
const char* TOPIC_COMMAND   = "water/demo/command";
const char* TOPIC_ACK       = "water/demo/ack";

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ----------------- State & Calibration -------------
const char* DEVICE_ID = "ESP32_WOKWI_01";
unsigned long lastPublishTime = 0;
const unsigned long PUBLISH_INTERVAL_MS = 2000; // Publish every 2 seconds

// Scenario override mode from remote app commands
String activeScenario = "hardware"; // "hardware" = read pots, "manual", "suspected_leak", etc.
bool alarmActive = false;
float manualInlet = 8.0;
float manualOutlet = 8.0;
float tankLevel1 = 2.89; // meters
float tankLevel2 = 2.89; // meters
String valve1State = "OPEN";
String valve2State = "OPEN";
String scadaMode = "REMOTE"; // "LOCAL", "REMOTE", "AUTO"
String lastRequestId = "";

// Function Prototypes
void setupWiFi();
void reconnectMQTT();
void onMqttMessage(char* topic, byte* payload, unsigned int length);
float readFlowSensor(int pin);
void publishAck(String reqId, String status, float inVal, float outVal);
void publishTelemetryNow();
void getCurrentFlow(float &inletLpm, float &outletLpm, String &statusNote);

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
  mqttClient.setBufferSize(512);
}

void getCurrentFlow(float &inletLpm, float &outletLpm, String &statusNote) {
  if (activeScenario == "hardware") {
    // Read simulated analog sensors (0-4095 ADC mapped to 0-35.0 L/min)
    inletLpm = readFlowSensor(PIN_POT_INLET);
    outletLpm = readFlowSensor(PIN_POT_OUTLET);
    statusNote = "Hardware Potentiometer Tracking";
  } else if (activeScenario == "manual") {
    inletLpm = manualInlet;
    outletLpm = manualOutlet;
    statusNote = "Manual Flow (" + String(manualInlet, 1) + "/" + String(manualOutlet, 1) + " L/min)";
  } else if (activeScenario == "suspected_leak") {
    inletLpm = 16.5;
    outletLpm = 10.8;
    statusNote = "Remote Command: Injected Pipe Leak (-5.7 L/min)";
  } else if (activeScenario == "abnormal_consumption") {
    inletLpm = 31.0;
    outletLpm = 31.0;
    statusNote = "Remote Command: High Consumption Draw (31.0 L/min)";
  } else if (activeScenario == "night_time_flow") {
    inletLpm = 4.5;
    outletLpm = 4.5;
    statusNote = "Remote Command: Continuous Night Quiescent Flow (4.5 L/min)";
  } else if (activeScenario == "sensor_anomaly") {
    inletLpm = 9.0;
    outletLpm = 15.2;
    statusNote = "Remote Command: Reversed Mismatch Anomaly (-6.2 L/min)";
  } else if (activeScenario == "recovery") {
    inletLpm = 12.5;
    outletLpm = 12.3;
    statusNote = "Remote Command: Recovered Balanced Baseline";
  } else {
    // Default balanced baseline (normal)
    inletLpm = 12.5;
    outletLpm = 12.3;
    statusNote = "Remote Command: Balanced Steady State";
  }
}

void publishTelemetryNow() {
  float inletLpm = 0.0;
  float outletLpm = 0.0;
  String statusNote = "";
  getCurrentFlow(inletLpm, outletLpm, statusNote);

  float mismatch = inletLpm - outletLpm;

  // Trigger local LED and Buzzer if leak is severe (> 2.0 L/min deficit)
  if (mismatch >= 2.0) {
    digitalWrite(PIN_LED_ALERT, HIGH);
    tone(PIN_BUZZER, 1000, 100);
    alarmActive = true;
  } else {
    digitalWrite(PIN_LED_ALERT, LOW);
    noTone(PIN_BUZZER);
    alarmActive = false;
  }

  // Build JSON Telemetry Payload
  StaticJsonDocument<512> doc;
  doc["deviceId"]    = DEVICE_ID;
  doc["ts"]          = (unsigned long)(millis() / 1000);
  doc["inlet"]       = serialized(String(inletLpm, 2));
  doc["outlet"]      = serialized(String(outletLpm, 2));
  doc["isValid"]     = true;
  doc["isSimulated"] = true;
  doc["notes"]       = statusNote;
  doc["scenario"]    = activeScenario;
  doc["tank1"]       = serialized(String(tankLevel1, 2));
  doc["tank2"]       = serialized(String(tankLevel2, 2));
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
    Serial.printf("[TELEMETRY] In: %.1f L/m | Out: %.1f L/m | T1: %.2fm | T2: %.2fm | V1: %s | V2: %s | Mqtt: OK\n",
                  inletLpm, outletLpm, tankLevel1, tankLevel2, valve1State.c_str(), valve2State.c_str());
  } else {
    Serial.println("[MQTT] Telemetry publish failed!");
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
  ackDoc["inlet"]     = serialized(String(inVal, 2));
  ackDoc["outlet"]    = serialized(String(outVal, 2));
  ackDoc["tank1"]     = serialized(String(tankLevel1, 2));
  ackDoc["tank2"]     = serialized(String(tankLevel2, 2));
  ackDoc["valve1"]    = valve1State;
  ackDoc["valve2"]    = valve2State;
  ackDoc["mode"]      = scadaMode;
  ackDoc["timestamp"] = (unsigned long)(millis() / 1000);

  char ackBuf[384];
  serializeJson(ackDoc, ackBuf);
  mqttClient.publish(TOPIC_ACK, ackBuf);
  Serial.printf("[ACK] Published to %s: %s\n", TOPIC_ACK, ackBuf);
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

  // Periodic Telemetry Publish
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

// Handle Inbound Commands from Mobile App
void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  char msg[length + 1];
  memcpy(msg, payload, length);
  msg[length] = '\0';

  Serial.printf("[MQTT] Received on %s: %s\n", topic, msg);

  // Check JSON format or plain-text fallback
  StaticJsonDocument<384> doc;
  DeserializationError error = deserializeJson(doc, msg);
  if (error) {
    String textCmd = String(msg);
    textCmd.trim();
    if (textCmd.equalsIgnoreCase("normal")) {
      manualInlet = 8.0; manualOutlet = 8.0; activeScenario = "manual"; lastRequestId = "";
      publishAck("", "applied", 8.0, 8.0);
      publishTelemetryNow();
      Serial.println("[COMMAND] Plain-text: Applied normal (8.0/8.0)");
    } else if (textCmd.equalsIgnoreCase("leak")) {
      manualInlet = 8.0; manualOutlet = 3.0; activeScenario = "manual"; lastRequestId = "";
      publishAck("", "applied", 8.0, 3.0);
      publishTelemetryNow();
      Serial.println("[COMMAND] Plain-text: Applied leak (8.0/3.0)");
    } else if (textCmd.equalsIgnoreCase("high")) {
      manualInlet = 30.0; manualOutlet = 30.0; activeScenario = "manual"; lastRequestId = "";
      publishAck("", "applied", 30.0, 30.0);
      publishTelemetryNow();
      Serial.println("[COMMAND] Plain-text: Applied high consumption (30.0/30.0)");
    } else if (textCmd.equalsIgnoreCase("reversed")) {
      manualInlet = 3.0; manualOutlet = 8.0; activeScenario = "manual"; lastRequestId = "";
      publishAck("", "applied", 3.0, 8.0);
      publishTelemetryNow();
      Serial.println("[COMMAND] Plain-text: Applied reversed mismatch (3.0/8.0)");
    } else if (textCmd.equalsIgnoreCase("night")) {
      manualInlet = 2.0; manualOutlet = 2.0; activeScenario = "manual"; lastRequestId = "";
      publishAck("", "applied", 2.0, 2.0);
      publishTelemetryNow();
      Serial.println("[COMMAND] Plain-text: Applied night flow (2.0/2.0)");
    } else {
      Serial.println("[MQTT] Failed to parse command JSON or recognized text");
    }
    return;
  }

  const char* cmd = doc["command"];
  if (cmd) {
    if (strcmp(cmd, "set_flow") == 0 || strcmp(cmd, "set_scada") == 0) {
      float inVal = doc.containsKey("inlet") ? doc["inlet"].as<float>() : manualInlet;
      float outVal = doc.containsKey("outlet") ? doc["outlet"].as<float>() : manualOutlet;
      const char* reqIdC = doc["requestId"] | "";
      String reqId = String(reqIdC);

      // Validate bounds 0.0 to 100.0 L/min
      if (isnan(inVal) || isnan(outVal) || inVal < 0.0 || inVal > 100.0 || outVal < 0.0 || outVal > 100.0) {
        publishAck(reqId, "rejected_range", inVal, outVal);
        Serial.println("[COMMAND] Rejected set_flow/set_scada: out of range (0-100 L/min)");
      } else {
        manualInlet = inVal;
        manualOutlet = outVal;
        if (doc.containsKey("tank1")) {
          tankLevel1 = doc["tank1"].as<float>();
        }
        if (doc.containsKey("tank2")) {
          tankLevel2 = doc["tank2"].as<float>();
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
        activeScenario = "manual";
        publishAck(reqId, "applied", inVal, outVal);
        publishTelemetryNow();
        Serial.printf("[COMMAND] Applied %s: In=%.2f, Out=%.2f, T1=%.2fm, T2=%.2fm, V1=%s, V2=%s, Mode=%s, ReqId=%s\n",
                      cmd, inVal, outVal, tankLevel1, tankLevel2, valve1State.c_str(), valve2State.c_str(), scadaMode.c_str(), reqId.c_str());
      }
    } else if (strcmp(cmd, "set_scenario") == 0) {
      const char* sc = doc["scenario"];
      if (sc) {
        activeScenario = String(sc);
        lastRequestId = "";
        Serial.printf("[COMMAND] Switched active scenario to: %s\n", sc);
        publishTelemetryNow();
      }
    } else if (strcmp(cmd, "reset") == 0) {
      activeScenario = "hardware";
      lastRequestId = "";
      manualInlet = 8.0;
      manualOutlet = 8.0;
      tankLevel1 = 2.89;
      tankLevel2 = 2.89;
      valve1State = "OPEN";
      valve2State = "OPEN";
      scadaMode = "REMOTE";
      digitalWrite(PIN_LED_ALERT, LOW);
      noTone(PIN_BUZZER);
      Serial.println("[COMMAND] Reset to baseline / hardware tracking");
      publishAck(doc["requestId"] | "", "reset_applied", 8.0, 8.0);
      publishTelemetryNow();
    } else if (strcmp(cmd, "ack_alarm") == 0) {
      alarmActive = false;
      digitalWrite(PIN_LED_ALERT, LOW);
      noTone(PIN_BUZZER);
      Serial.println("[COMMAND] Alarm silenced remotely from mobile app");
    }
  }
}
