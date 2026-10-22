export const MQTT_CONFIG = {
  // Public EMQX broker supports both secure wss (8084) and ws (8083)
  defaultWsBrokerUrl: 'wss://broker.emqx.io:8084/mqtt',
  fallbackWsBrokerUrl: 'ws://broker.emqx.io:8083/mqtt',
  
  // For ESP32 firmware running in Wokwi
  defaultTcpBrokerHost: 'broker.emqx.io',
  defaultTcpBrokerPort: 1883,
  
  // Topics required by spec
  topics: {
    telemetry: 'water/demo/telemetry',
    command: 'water/demo/command',
  },
  
  clientIdPrefix: 'edis_app_',
  keepalive: 60,
  reconnectPeriod: 4000,
  connectTimeout: 10000,
};
