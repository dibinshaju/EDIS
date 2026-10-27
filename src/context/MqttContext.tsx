import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import mqtt, { MqttClient } from 'mqtt';
import { MQTT_CONFIG } from '../constants/mqtt';
import { TelemetryReading, SimulatorCommand, CommandAck } from '../types/sensor';
import { parseAndNormalizeTelemetry } from '../utils/telemetryParser';

export type MqttConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface MqttContextType {
  status: MqttConnectionStatus;
  brokerUrl: string;
  setBrokerUrl: (url: string) => void;
  lastMessageTime: number | null;
  lastRawPayload: string | null;
  lastReading: TelemetryReading | null;
  lastAck: CommandAck | null;
  logs: string[];
  connect: () => void;
  disconnect: () => void;
  publishCommand: (cmd: SimulatorCommand) => boolean;
  publishFlowCommand: (
    inlet: number,
    outlet: number,
    requestId?: string
  ) => { success: boolean; error?: string; requestId: string };
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
  const [lastAck, setLastAck] = useState<CommandAck | null>(null);
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

        // Subscribe to command ACK topic
        client.subscribe(MQTT_CONFIG.topics.ack, { qos: 0 }, (err) => {
          if (err) {
            addLog(`Subscription error on ${MQTT_CONFIG.topics.ack}: ${err.message}`);
          } else {
            addLog(`Subscribed to topic: ${MQTT_CONFIG.topics.ack}`);
          }
        });
      });

      client.on('message', (topic, payload) => {
        const raw = payload.toString();
        setLastRawPayload(raw);
        setLastMessageTime(Date.now());

        if (topic === MQTT_CONFIG.topics.telemetry) {
          const { reading, error } = parseAndNormalizeTelemetry(raw);
          if (reading) {
            setLastReading(reading);
            addLog(
              `[Telemetry] Rcv In=${reading.inletFlow.toFixed(1)} L/m, Out=${reading.outletFlow.toFixed(1)} L/m (${reading.deviceId})`
            );
            if (telemetryCallbackRef.current) {
              telemetryCallbackRef.current(reading);
            } else {
              addLog('[Telemetry Warning] Telemetry received but no callback registered.');
            }
          } else {
            addLog(`[Telemetry Rejected] ${error || 'Unknown parsing error'}`);
          }
        } else if (topic === MQTT_CONFIG.topics.ack) {
          try {
            const parsedAck = JSON.parse(raw) as CommandAck;
            setLastAck(parsedAck);
            addLog(
              `[ACK] ESP32 confirmed ${parsedAck.command || 'command'} (${parsedAck.status || 'applied'}) req=${parsedAck.requestId || 'n/a'}`
            );
          } catch (e: any) {
            addLog(`[ACK Parse Error] Invalid ACK format: ${raw}`);
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

  const publishFlowCommand = useCallback(
    (
      inlet: number,
      outlet: number,
      reqId?: string
    ): { success: boolean; error?: string; requestId: string } => {
      if (
        typeof inlet !== 'number' ||
        typeof outlet !== 'number' ||
        !Number.isFinite(inlet) ||
        !Number.isFinite(outlet)
      ) {
        return {
          success: false,
          error: 'Inlet and Outlet flow rates must be valid numbers.',
          requestId: '',
        };
      }

      if (inlet < 0 || inlet > 100 || outlet < 0 || outlet > 100) {
        return {
          success: false,
          error: 'Flow rates must be between 0.0 and 100.0 L/min.',
          requestId: '',
        };
      }

      if (!clientRef.current || status !== 'connected') {
        return {
          success: false,
          error: 'MQTT broker is not connected. Please connect first.',
          requestId: '',
        };
      }

      const requestId =
        reqId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const cmd: SimulatorCommand = {
        command: 'set_flow',
        inlet: Number(inlet.toFixed(2)),
        outlet: Number(outlet.toFixed(2)),
        requestId,
        timestamp: Math.floor(Date.now() / 1000),
      };

      const published = publishCommand(cmd);
      if (!published) {
        return {
          success: false,
          error: 'Failed to send command over MQTT connection.',
          requestId,
        };
      }

      return { success: true, requestId };
    },
    [status, publishCommand]
  );

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
        lastReading,
        lastAck,
        logs,
        connect,
        disconnect,
        publishCommand,
        publishFlowCommand,
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
