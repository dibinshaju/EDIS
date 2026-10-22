"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMqtt = exports.MqttProvider = void 0;
const react_1 = __importStar(require("react"));
const mqtt_1 = __importDefault(require("mqtt"));
const mqtt_2 = require("../constants/mqtt");
const MqttContext = (0, react_1.createContext)(undefined);
const MqttProvider = ({ children }) => {
    const [brokerUrl, setBrokerUrl] = (0, react_1.useState)(mqtt_2.MQTT_CONFIG.defaultWsBrokerUrl);
    const [status, setStatus] = (0, react_1.useState)('disconnected');
    const [lastMessageTime, setLastMessageTime] = (0, react_1.useState)(null);
    const [lastRawPayload, setLastRawPayload] = (0, react_1.useState)(null);
    const [logs, setLogs] = (0, react_1.useState)([]);
    const clientRef = (0, react_1.useRef)(null);
    const telemetryCallbackRef = (0, react_1.useRef)(null);
    const addLog = (0, react_1.useCallback)((msg) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs((prev) => [`[${timestamp}] ${msg}`, ...prev.slice(0, 49)]);
    }, []);
    const setOnTelemetryReceived = (0, react_1.useCallback)((cb) => {
        telemetryCallbackRef.current = cb;
    }, []);
    const disconnect = (0, react_1.useCallback)(() => {
        if (clientRef.current) {
            addLog('Disconnecting from MQTT broker...');
            clientRef.current.end(true);
            clientRef.current = null;
        }
        setStatus('disconnected');
    }, [addLog]);
    const connect = (0, react_1.useCallback)(() => {
        if (clientRef.current) {
            clientRef.current.end(true);
            clientRef.current = null;
        }
        setStatus('connecting');
        addLog(`Initiating WebSocket connection to ${brokerUrl}...`);
        try {
            const clientId = `${mqtt_2.MQTT_CONFIG.clientIdPrefix}${Math.random().toString(16).substring(2, 8)}`;
            const client = mqtt_1.default.connect(brokerUrl, {
                clientId,
                clean: true,
                connectTimeout: mqtt_2.MQTT_CONFIG.connectTimeout,
                reconnectPeriod: mqtt_2.MQTT_CONFIG.reconnectPeriod,
                keepalive: mqtt_2.MQTT_CONFIG.keepalive,
            });
            client.on('connect', () => {
                setStatus('connected');
                addLog(`Connected! Client ID: ${clientId}`);
                // Subscribe to telemetry topic
                client.subscribe(mqtt_2.MQTT_CONFIG.topics.telemetry, { qos: 0 }, (err) => {
                    if (err) {
                        addLog(`Subscription error on ${mqtt_2.MQTT_CONFIG.topics.telemetry}: ${err.message}`);
                    }
                    else {
                        addLog(`Subscribed to topic: ${mqtt_2.MQTT_CONFIG.topics.telemetry}`);
                    }
                });
            });
            client.on('message', (topic, payload) => {
                const raw = payload.toString();
                setLastRawPayload(raw);
                setLastMessageTime(Date.now());
                if (topic === mqtt_2.MQTT_CONFIG.topics.telemetry) {
                    try {
                        const data = JSON.parse(raw);
                        // Validate incoming telemetry schema
                        if (typeof data === 'object' &&
                            data !== null &&
                            typeof data.inlet === 'number' &&
                            typeof data.outlet === 'number') {
                            const reading = {
                                deviceId: data.deviceId || 'WOKWI_ESP32',
                                timestamp: data.ts ? (data.ts > 10000000000 ? data.ts : data.ts * 1000) : Date.now(),
                                inletFlow: Number(data.inlet),
                                outletFlow: Number(data.outlet),
                                flowDifference: Number(data.inlet) - Number(data.outlet),
                                isValid: true,
                                isSimulated: data.isSimulated ?? false,
                                status: 'online',
                                notes: data.notes,
                            };
                            if (telemetryCallbackRef.current) {
                                telemetryCallbackRef.current(reading);
                            }
                        }
                        else {
                            addLog(`Warning: Telemetry schema mismatch: ${raw.slice(0, 60)}`);
                        }
                    }
                    catch (jsonErr) {
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
        }
        catch (err) {
            addLog(`MQTT Connection exception: ${err?.message || err}`);
            setStatus('error');
        }
    }, [brokerUrl, addLog]);
    const publishCommand = (0, react_1.useCallback)((cmd) => {
        if (!clientRef.current || status !== 'connected') {
            addLog(`Cannot publish command: MQTT not connected.`);
            return false;
        }
        try {
            const payload = JSON.stringify(cmd);
            clientRef.current.publish(mqtt_2.MQTT_CONFIG.topics.command, payload, { qos: 0 });
            addLog(`Published command to ${mqtt_2.MQTT_CONFIG.topics.command}: ${payload}`);
            return true;
        }
        catch (err) {
            addLog(`Publish failed: ${err?.message || err}`);
            return false;
        }
    }, [status, addLog]);
    // Clean up on unmount
    (0, react_1.useEffect)(() => {
        return () => {
            if (clientRef.current) {
                clientRef.current.end(true);
            }
        };
    }, []);
    return (<MqttContext.Provider value={{
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
        }}>
      {children}
    </MqttContext.Provider>);
};
exports.MqttProvider = MqttProvider;
const useMqtt = () => {
    const context = (0, react_1.useContext)(MqttContext);
    if (!context) {
        throw new Error('useMqtt must be used within an MqttProvider');
    }
    return context;
};
exports.useMqtt = useMqtt;
