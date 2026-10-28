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

#define PIN_POT_1       12  // Hardware Potentiometer (Wokwi pot1:SIG -> esp:12)
#define PIN_LED_ALERT   2   // On-board Alert LED (GPIO 2 on ESP32 DevKit-C v4)
#define PIN_BUZZER      25  // Alert Buzzer (optional expansion)

const char* WIFI_SSID       = "Wokwi-GUEST";
const char* WIFI_PASS       = "";
const char* MQTT_BROKER     = "broker.emqx.io";
const int   MQTT_PORT       = 1883;
const char* TOPIC_TELEMETRY = "water/demo/telemetry";
const char* TOPIC_COMMAND   = "water/demo/command";
const char* TOPIC_ACK       = "water/demo/ack";

WiFiClient espClient;
PubSubClient mqtt(espClient);

float currentInlet     = 8.00;
float currentOutlet    = 8.00;
float currentTank1     = 2.89;
float currentTank2     = 2.89;
String valve1State     = "OPEN";
String valve2State     = "OPEN";
String scadaMode       = "REMOTE";
String currentScenario = "normal";
String lastRequestId   = "";
bool alarmActive       = false;
unsigned long lastPublish   = 0;
unsigned long lastWiFiCheck = 0;
unsigned long seq           = 0;

void publishTelemetry() {
  if (!mqtt.connected()) return;
  seq++;

  float inVal = currentInlet;
  float outVal = currentOutlet;
  float diff = inVal - outVal;

  if (diff >= 2.0) {
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

  String scn = currentScenario;
  if (diff >= 2.0) scn = "suspected_leak";
  else if (diff <= -2.0) scn = "sensor_anomaly";
  else if (inVal >= 25.0) scn = "abnormal_consumption";
  else if (currentScenario.length() == 0 || currentScenario == "normal") scn = "normal";

  StaticJsonDocument<512> doc;
  doc["deviceId"]    = "waterguard-wokwi-esp32";
  doc["source"]      = "wokwi";
  doc["sequence"]    = seq;
  doc["ts"]          = (unsigned long)(millis() / 1000);
  doc["inlet"]       = inVal;
  doc["inletFlow"]   = inVal;
  doc["outlet"]      = outVal;
  doc["outletFlow"]  = outVal;
  doc["isValid"]     = true;
  doc["isSimulated"] = true;
  doc["scenario"]    = scn;
  doc["notes"]       = "Inlet: " + String(inVal, 2) + " L/m, Outlet: " + String(outVal, 2) + " L/m";
  doc["tank1"]       = currentTank1;
  doc["tank2"]       = currentTank2;
  doc["valve1"]      = valve1State;
  doc["valve2"]      = valve2State;
  doc["scadaMode"]   = scadaMode;
  if (lastRequestId.length() > 0) doc["requestId"] = lastRequestId;

  char buf[512];
  serializeJson(doc, buf);
  mqtt.publish(TOPIC_TELEMETRY, buf);
  Serial.printf("[TELEMETRY #%lu] %s\n", seq, buf);
  lastPublish = millis();
}

void publishAck(String reqId, String status) {
  if (!mqtt.connected()) return;
  StaticJsonDocument<256> doc;
  doc["type"]       = "ack";
  doc["status"]     = status;
  if (reqId.length() > 0) doc["requestId"] = reqId;
  doc["inlet"]      = currentInlet;
  doc["inletFlow"]  = currentInlet;
  doc["outlet"]     = currentOutlet;
  doc["outletFlow"] = currentOutlet;
  doc["tank1"]      = currentTank1;
  doc["tank2"]      = currentTank2;
  doc["valve1"]     = valve1State;
  doc["valve2"]     = valve2State;
  doc["mode"]       = scadaMode;
  doc["timestamp"]  = (unsigned long)(millis() / 1000);

  char buf[256];
  serializeJson(doc, buf);
  mqtt.publish(TOPIC_ACK, buf);
  Serial.printf("[ACK] %s\n", buf);
}

void onMessage(char* topic, byte* payload, unsigned int len) {
  char msg[len + 1];
  memcpy(msg, payload, len);
  msg[len] = "\0";
  Serial.printf("[CMD] %s\n", msg);

  StaticJsonDocument<512> doc;
  if (deserializeJson(doc, msg)) {
    String c = String(msg);
    c.trim();
    if (c == "normal" || c == "reset") {
      currentInlet = 8.0; currentOutlet = 8.0; currentScenario = "normal";
    } else if (c == "leak") {
      currentInlet = 8.0; currentOutlet = 3.0; currentScenario = "suspected_leak";
    } else if (c == "high") {
      currentInlet = 30.0; currentOutlet = 30.0; currentScenario = "abnormal_consumption";
    } else if (c == "reversed") {
      currentInlet = 3.0; currentOutlet = 8.0; currentScenario = "sensor_anomaly";
    }
    publishAck("", "applied");
    publishTelemetry();
    return;
  }

  String cmd = doc["command"] | "";
  String reqId = doc["requestId"] | doc["reqId"] | "";
  if (reqId.length() > 0) lastRequestId = reqId;

  if (cmd == "set_scada" || cmd == "set_flow" || doc.containsKey("inlet")) {
    if (doc.containsKey("inlet")) currentInlet = doc["inlet"].as<float>();
    else if (doc.containsKey("inletFlow")) currentInlet = doc["inletFlow"].as<float>();

    if (doc.containsKey("outlet")) currentOutlet = doc["outlet"].as<float>();
    else if (doc.containsKey("outletFlow")) currentOutlet = doc["outletFlow"].as<float>();

    if (doc.containsKey("tank1")) currentTank1 = doc["tank1"].as<float>();
    if (doc.containsKey("tank2")) currentTank2 = doc["tank2"].as<float>();
    if (doc.containsKey("valve1")) valve1State = doc["valve1"].as<String>();
    if (doc.containsKey("valve2")) valve2State = doc["valve2"].as<String>();
    if (doc.containsKey("mode")) scadaMode = doc["mode"].as<String>();

    float diff = currentInlet - currentOutlet;
    if (diff >= 2.0) currentScenario = "suspected_leak";
    else if (diff <= -2.0) currentScenario = "sensor_anomaly";
    else if (currentInlet >= 25.0) currentScenario = "abnormal_consumption";
    else currentScenario = "normal";

    Serial.printf("[PARSED] In=%.2f, Out=%.2f, Scn=%s\n", currentInlet, currentOutlet, currentScenario.c_str());
    publishAck(reqId, "applied");
    publishTelemetry();
  } else if (cmd == "reset" || cmd == "reset_baseline") {
    currentInlet = 8.0; currentOutlet = 8.0; currentTank1 = 2.89; currentTank2 = 2.89;
    valve1State = "OPEN"; valve2State = "OPEN"; scadaMode = "REMOTE"; currentScenario = "normal";
    digitalWrite(PIN_LED_ALERT, LOW); noTone(PIN_BUZZER); alarmActive = false;
    Serial.println("[RESET] Restored 8.00/8.00 L/min baseline");
    publishAck(reqId, "reset_applied");
    publishTelemetry();
  } else if (cmd == "set_scenario") {
    String s = doc["scenario"] | "normal";
    currentScenario = s;
    if (s == "normal" || s == "recovery") { currentInlet = 8.0; currentOutlet = 8.0; }
    else if (s == "suspected_leak") { currentInlet = 8.0; currentOutlet = 3.0; }
    else if (s == "abnormal_consumption") { currentInlet = 30.0; currentOutlet = 30.0; }
    else if (s == "sensor_anomaly") { currentInlet = 3.0; currentOutlet = 8.0; }
    else if (s == "night_time_flow") { currentInlet = 2.0; currentOutlet = 2.0; }
    publishAck(reqId, "applied");
    publishTelemetry();
  } else if (cmd == "ack_alarm") {
    alarmActive = false;
    digitalWrite(PIN_LED_ALERT, LOW);
    noTone(PIN_BUZZER);
  }
}

void connectWiFi() {
  Serial.print("[WiFi] Connecting to Wokwi-GUEST");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS, 6);

  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 60) {
    delay(200);
    Serial.print(".");
    tries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[WiFi] Awaiting gateway...");
  }
}

void connectMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;
  String cid = "ESP32_Wokwi_" + String(random(0xffff), HEX);
  Serial.printf("[MQTT] Connecting as %s...\n", cid.c_str());
  if (mqtt.connect(cid.c_str())) {
    Serial.println("[MQTT] Connected!");
    mqtt.subscribe(TOPIC_COMMAND);
  } else {
    Serial.printf("[MQTT] Failed, rc=%d\n", mqtt.state());
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_POT_1, INPUT);
  pinMode(PIN_LED_ALERT, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_LED_ALERT, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  connectWiFi();
  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
  mqtt.setCallback(onMessage);
  mqtt.setBufferSize(1024);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    if (millis() - lastWiFiCheck >= 20000) {
      lastWiFiCheck = millis();
      Serial.println("[WiFi] Re-initiating connection...");
      WiFi.disconnect();
      delay(100);
      WiFi.begin(WIFI_SSID, WIFI_PASS, 6);
    }
    delay(100);
    return;
  }

  if (!mqtt.connected()) {
    if (millis() - lastWiFiCheck >= 3000) {
      lastWiFiCheck = millis();
      connectMQTT();
    }
  } else {
    mqtt.loop();
  }

  if (millis() - lastPublish >= 2000) {
    if (scadaMode == "LOCAL") {
      float potVal = (analogRead(PIN_POT_1) / 4095.0) * 35.0;
      if (abs(potVal - currentInlet) > 1.0) currentInlet = potVal;
    }
    publishTelemetry();
    lastPublish = millis();
  }
}
