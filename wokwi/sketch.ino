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
const char* MQTT_BROKER    = "broker.emqx.io";
const int   MQTT_PORT      = 1883;
const char* TOPIC_TELEMETRY = "water/demo/telemetry";
const char* TOPIC_COMMAND   = "water/demo/command";

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ----------------- State & Calibration -------------
const char* DEVICE_ID = "ESP32_WOKWI_01";
unsigned long lastPublishTime = 0;
const unsigned long PUBLISH_INTERVAL_MS = 2000; // Publish every 2 seconds

// Scenario override mode from remote app commands
String activeScenario = "hardware"; // "hardware" = read pots, or "leak", "high", "anomaly"
bool alarmActive = false;

// Function Prototypes
void setupWiFi();
void reconnectMQTT();
void onMqttMessage(char* topic, byte* payload, unsigned int length);
float readFlowSensor(int pin);

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
    lastPublishTime = now;

    float inletLpm = 0.0;
    float outletLpm = 0.0;
    String statusNote = "Hardware Potentiometer Tracking";

    if (activeScenario == "hardware") {
      // Read simulated analog sensors (0-4095 ADC mapped to 0-35.0 L/min)
      inletLpm = readFlowSensor(PIN_POT_INLET);
      outletLpm = readFlowSensor(PIN_POT_OUTLET);
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

    float mismatch = inletLpm - outletLpm;

    // Trigger local LED and Buzzer if leak is severe (> 2.0 L/min deficit)
    if (mismatch >= 2.0) {
      digitalWrite(PIN_LED_ALERT, HIGH);
      // Gentle buzzer click/pulse
      tone(PIN_BUZZER, 1000, 100);
      alarmActive = true;
    } else {
      digitalWrite(PIN_LED_ALERT, LOW);
      noTone(PIN_BUZZER);
      alarmActive = false;
    }

    // Build JSON Telemetry Payload
    StaticJsonDocument<256> doc;
    doc["deviceId"]    = DEVICE_ID;
    doc["ts"]          = (unsigned long)(millis() / 1000);
    doc["inlet"]       = serialized(String(inletLpm, 2));
    doc["outlet"]      = serialized(String(outletLpm, 2));
    doc["isValid"]     = true;
    doc["isSimulated"] = true;
    doc["notes"]       = statusNote;

    char buffer[256];
    serializeJson(doc, buffer);

    bool pubOk = mqttClient.publish(TOPIC_TELEMETRY, buffer);
    if (pubOk) {
      Serial.printf("[TELEMETRY] In: %.1f L/m | Out: %.1f L/m | Diff: %+.1f | Mqtt: OK\n",
                    inletLpm, outletLpm, mismatch);
    } else {
      Serial.println("[MQTT] Telemetry publish failed!");
    }
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

  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, msg);
  if (error) {
    Serial.println("[MQTT] Failed to parse command JSON");
    return;
  }

  const char* cmd = doc["command"];
  if (cmd) {
    if (strcmp(cmd, "set_scenario") == 0) {
      const char* sc = doc["scenario"];
      if (sc) {
        activeScenario = String(sc);
        Serial.printf("[COMMAND] Switched active scenario to: %s\n", sc);
      }
    } else if (strcmp(cmd, "reset") == 0) {
      activeScenario = "hardware";
      digitalWrite(PIN_LED_ALERT, LOW);
      noTone(PIN_BUZZER);
      Serial.println("[COMMAND] Reset to hardware potentiometer tracking");
    } else if (strcmp(cmd, "ack_alarm") == 0) {
      alarmActive = false;
      digitalWrite(PIN_LED_ALERT, LOW);
      noTone(PIN_BUZZER);
      Serial.println("[COMMAND] Alarm silenced remotely from mobile app");
    }
  }
}
