import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import mqtt, { MqttClient } from 'mqtt';
import { MQTT_CONFIG } from '../constants/mqtt';
import { TelemetryReading, SimulatorCommand } from '../types/sensor';
import { parseAndNormalizeTelemetry } from '../utils/telemetryParser';

export type MqttConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface MqttContextType {
  status: MqttConnectionStatus;
  brokerUrl: string;
  setBrokerUrl: (url: string) => void;
  lastMessageTime: number | null;
  lastRawPayload: string | null;
  lastReading: TelemetryReading | null;
  logs: string[];
  connect: () => void;
  disconnect: () => void;
  publishCommand: (cmd: SimulatorCommand) => boolean;
  onTelemetryReceived: ((reading: TelemetryReading) => void) | null;
  setOnTelemetryReceived: (cb: ((reading: TelemetryReading) => void) | null) => void;
}

const MqttContext = createContext<MqttContextType | undefined>(undefined);

export const MqttProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brokerUrl, setBrokerUrl] = useState<string>(MQTT_CONFIG.defaultWsBrokerUrl);
  const [status, setStatus] = useState<MqttConnectionStatus>('disconnected');
  const [lastMessageTime, setLastMessageTime] = useState<number | null>(null);
  const [lastRawPayload, setLastRawPayload] = useState<string | null>(null);
  const [lastReading, setLastReading] = useState<TelemetryReading | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  const clientRef = useRef<MqttClient | null>(null);
  const telemetryCallbackRef = useRef<((reading: TelemetryReading) => void) | null>(null);

  const addLog = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${msg}`, ...prev.slice(0, 49)]);
  }, []);

  const setOnTelemetryReceived = useCallback((cb: ((reading: TelemetryReading) => void) | null) => {
    telemetryCallbackRef.current = cb;
  }, []);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      addLog('Disconnecting from MQTT broker...');
      clientRef.current.end(true);
      clientRef.current = null;
    }
    setStatus('disconnected');
  }, [addLog]);

  const connect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.end(true);
      clientRef.current = null;
    }

    setStatus('connecting');
    addLog(`Initiating WebSocket connection to ${brokerUrl}...`);

    try {
      const clientId = `${MQTT_CONFIG.clientIdPrefix}${Math.random().toString(16).substring(2, 8)}`;
      const client = mqtt.connect(brokerUrl, {
        clientId,
        clean: true,
        connectTimeout: MQTT_CONFIG.connectTimeout,
        reconnectPeriod: MQTT_CONFIG.reconnectPeriod,
        keepalive: MQTT_CONFIG.keepalive,
      });

      client.on('connect', () => {
        setStatus('connected');
        addLog(`Connected! Client ID: ${clientId}`);
        
        // Subscribe to telemetry topic
        client.subscribe(MQTT_CONFIG.topics.telemetry, { qos: 0 }, (err) => {
          if (err) {
            addLog(`Subscription error on ${MQTT_CONFIG.topics.telemetry}: ${err.message}`);
          } else {
            addLog(`Subscribed to topic: ${MQTT_CONFIG.topics.telemetry}`);
          }
        });
      });

      client.on('message', (topic, payload) => {
        const raw = payload.toString();
        setLastRawPayload(raw);
        setLastMessageTime(Date.now());

        if (topic === MQTT_CONFIG.topics.telemetry) {
          try {
            const data = JSON.parse(raw);
            
            // Validate incoming telemetry schema
            if (typeof data === 'object' && data !== null) {
              const rawInlet = Number(data.inlet);
              const rawOutlet = Number(data.outlet);
              const hasValidNumbers =
                isFinite(rawInlet) &&
                isFinite(rawOutlet) &&
                !isNaN(rawInlet) &&
                !isNaN(rawOutlet);

              if (hasValidNumbers) {
                const inletVal = Math.max(0, rawInlet);
                const outletVal = Math.max(0, rawOutlet);
                const isExplicitlyInvalid = data.isValid === false;

                const reading: TelemetryReading = {
                  deviceId: typeof data.deviceId === 'string' ? data.deviceId : 'WOKWI_ESP32',
                  timestamp: data.ts
                    ? (Number(data.ts) > 10000000000 ? Number(data.ts) : Number(data.ts) * 1000)
                    : Date.now(),
                  inletFlow: inletVal,
                  outletFlow: outletVal,
                  flowDifference: Number((inletVal - outletVal).toFixed(2)),
                  isValid: !isExplicitlyInvalid && rawInlet >= 0 && rawOutlet >= 0,
                  isSimulated: Boolean(data.isSimulated),
                  status: 'online',
                  notes: typeof data.notes === 'string' ? data.notes : undefined,
                };

                if (telemetryCallbackRef.current) {
                  telemetryCallbackRef.current(reading);
                }
              } else {
                addLog(`Warning: Telemetry non-numeric flow values: In=${data.inlet}, Out=${data.outlet}`);
              }
            } else {
              addLog(`Warning: Malformed telemetry payload: ${raw.slice(0, 60)}`);
            }
          } catch (jsonErr) {
            addLog(`Error parsing JSON message: ${jsonErr}`);
          }
        }
      });

      client.on('error', (err) => {
        addLog(`MQTT Error: ${err.message}`);
        setStatus('error');
      });

      client.on('close', () => {
        addLog('MQTT connection closed.');
        setStatus('disconnected');
      });

      client.on('reconnect', () => {
        addLog('Attempting MQTT reconnect...');
        setStatus('connecting');
      });

      clientRef.current = client;
    } catch (err: any) {
      addLog(`MQTT Connection exception: ${err?.message || err}`);
      setStatus('error');
    }
  }, [brokerUrl, addLog]);

  const publishCommand = useCallback((cmd: SimulatorCommand): boolean => {
    if (!clientRef.current || status !== 'connected') {
      addLog(`Cannot publish command: MQTT not connected.`);
      return false;
    }

    try {
      const payload = JSON.stringify(cmd);
      clientRef.current.publish(MQTT_CONFIG.topics.command, payload, { qos: 0 });
      addLog(`Published command to ${MQTT_CONFIG.topics.command}: ${payload}`);
      return true;
    } catch (err: any) {
      addLog(`Publish failed: ${err?.message || err}`);
      return false;
    }
  }, [status, addLog]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.end(true);
      }
    };
  }, []);

  return (
    <MqttContext.Provider
      value={{
        status,
        brokerUrl,
        setBrokerUrl,
        lastMessageTime,
        lastRawPayload,
        logs,
        connect,
        disconnect,
        publishCommand,
        onTelemetryReceived: telemetryCallbackRef.current,
        setOnTelemetryReceived,
      }}
    >
      {children}
    </MqttContext.Provider>
  );
};

export const useMqtt = () => {
  const context = useContext(MqttContext);
  if (!context) {
    throw new Error('useMqtt must be used within an MqttProvider');
  }
  return context;
};
