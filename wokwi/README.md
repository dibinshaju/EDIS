# Wokwi Virtual ESP32 Simulation Setup Guide
## IoT-Based Smart Water Leakage & Abnormal Consumption Detection System

This directory contains the complete virtual hardware implementation for running an ESP32 micro-controller simulation directly inside your web browser using **Wokwi**, with real-time MQTT telemetry communicating with the Smart Water Monitor mobile application.

---

## Hardware Overview & Circuit Topology

The simulated circuit models an IoT dual-sensor municipal pipe monitoring setup:
- **MCU**: ESP32 DevKit v1 (30-pin / 38-pin compatible)
- **Sensor 1 (Inflow Meter)**: Simulated via analog potentiometer on **GPIO 34** (0.0 – 35.0 L/min)
- **Sensor 2 (Outflow Meter)**: Simulated via analog potentiometer on **GPIO 35** (0.0 – 35.0 L/min)
- **Local Visual Indicator**: Red Alarm LED on **GPIO 2** (illuminates when flow deficit exceeds threshold)
- **Physical Annunciator**: Piezo Buzzer on **GPIO 25** (sound alarm on leakage)

---

## Step-by-Step Instructions

### Step 1: Open Wokwi
1. Open your web browser and navigate to: **[https://wokwi.com](https://wokwi.com)**
2. Click **"ESP32"** and choose the **ESP32 DevKit** template.

### Step 2: Load the Firmware (`sketch.ino`)
1. In the Wokwi code editor tab (named `sketch.ino`), select all existing code and delete it.
2. Copy and paste the entire contents of `wokwi/sketch.ino` into the editor.

### Step 3: Load the Circuit Topology (`diagram.json`)
1. Click on the tab named `diagram.json` in Wokwi (or create one using the `+` file icon if not present).
2. Replace all its content with the contents of `wokwi/diagram.json`.
3. You will immediately see the ESP32 board, two rotary potentiometers labeled **Inlet Flow** and **Outlet Flow**, an Alert LED, and a buzzer.

### Step 4: Add Arduino Libraries
1. Click on the **"Library Manager"** icon or tab on the left sidebar in Wokwi.
2. In the search box, install the following two libraries:
   - `PubSubClient` (by Nick O'Leary)
   - `ArduinoJson` (by Benoît Blanchon, version 6.x or 7.x)

### Step 5: Start the Simulation
1. Click the green **Play (▶ Start Simulation)** button at the top of Wokwi.
2. Open the **Serial Monitor** at the bottom of the simulation window.
3. Observe the startup sequence:
   ```text
   [WiFi] Connecting to Wokwi-GUEST...
   [WiFi] Connected successfully! IP: 10.0.1.2
   [MQTT] Connecting to broker.emqx.io:1883...
   [MQTT] Connected to broker successfully!
   [MQTT] Subscribed to command topic: water/demo/command
   [TELEMETRY] In: 12.5 L/m | Out: 12.4 L/m | Diff: +0.1 | Mqtt: OK
   ```

### Step 6: Connect the Mobile App
1. Open the Smart Water Monitor app in your browser (or scan the Expo Go QR code on your iPhone).
2. Go to the **Admin** tab or tap the **Wokwi Live** badge in the header.
3. Confirm the broker URL is set to `wss://broker.emqx.io:8084/mqtt` (or `ws://broker.emqx.io:8083/mqtt`).
4. Tap **"Connect App to MQTT"** and toggle the data source to **WOKWI**.
5. The live flow rate will now mirror the Wokwi telemetry packets!

### Step 7: Demonstrate Live Leak Detection to Evaluators
1. In Wokwi, rotate the **Sensor 1 (Inlet)** potentiometer clockwise to increase inflow, or rotate **Sensor 2 (Outlet)** counter-clockwise to reduce outflow.
2. Watch the positive flow difference appear in the Wokwi Serial Monitor:
   ```text
   [TELEMETRY] In: 18.2 L/m | Out: 11.5 L/m | Diff: +6.7 | Mqtt: OK
   ```
3. The virtual ESP32's **Red LED (GPIO 2)** will turn ON.
4. On the mobile app, after the persistence filter duration (default 6 seconds), the **CRITICAL LEAK ALERT** banner will slide down, the audible buzzer will sound, and the event will be logged in the **Alerts** tab!
5. Tap **"Acknowledge & Silence"** on the app to silence the alert buzzer.

---

## Telemetry & Command Topic Schema

### 1. Telemetry Topic (`water/demo/telemetry`)
Published by ESP32 every 2 seconds:
```json
{
  "deviceId": "ESP32_WOKWI_01",
  "ts": 1729600000,
  "inlet": 14.50,
  "outlet": 11.20,
  "isValid": true,
  "isSimulated": true,
  "notes": "Hardware Potentiometer Tracking"
}
```

### 2. Command Topic (`water/demo/command`)
Published by the mobile app when the presenter selects a demo scenario:
```json
{
  "command": "set_scenario",
  "scenario": "suspected_leak",
  "timestamp": 1729600010
}
```
Available scenarios: `normal`, `suspected_leak`, `abnormal_consumption`, `sensor_anomaly`, `recovery`, `reset`.
