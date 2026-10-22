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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSensor = exports.SensorProvider = void 0;
const react_1 = __importStar(require("react"));
const thresholds_1 = require("../constants/thresholds");
const MqttContext_1 = require("./MqttContext");
const INITIAL_READING = {
    deviceId: 'SIMULATED_DEMO_ESP32',
    timestamp: Date.now(),
    inletFlow: 12.0,
    outletFlow: 11.9,
    flowDifference: 0.1,
    isValid: true,
    isSimulated: true,
    status: 'online',
    notes: 'Demo mode active',
};
const SensorContext = (0, react_1.createContext)(undefined);
const SensorProvider = ({ children }) => {
    const { status: mqttStatus, setOnTelemetryReceived, publishCommand } = (0, MqttContext_1.useMqtt)();
    const [dataSource, setDataSource] = (0, react_1.useState)('demo');
    const [activeScenario, setActiveScenario] = (0, react_1.useState)('normal');
    const [thresholds, setThresholds] = (0, react_1.useState)(thresholds_1.DEFAULT_THRESHOLDS);
    const [currentReading, setCurrentReading] = (0, react_1.useState)(INITIAL_READING);
    const [history, setHistory] = (0, react_1.useState)([INITIAL_READING]);
    const [totalVolumeLiters, setTotalVolumeLiters] = (0, react_1.useState)(142.5);
    const scenarioTimerRef = (0, react_1.useRef)(null);
    const simulationStepRef = (0, react_1.useRef)(0);
    const updateThresholds = (0, react_1.useCallback)((partial) => {
        setThresholds((prev) => ({ ...prev, ...partial }));
    }, []);
    // When live telemetry arrives via MQTT
    const handleLiveTelemetry = (0, react_1.useCallback)((reading) => {
        // Only accept live telemetry if dataSource is wokwi or mqtt
        if (dataSource !== 'demo') {
            setCurrentReading(reading);
            setHistory((prev) => [...prev.slice(-49), reading]);
            // Integrate flow over interval (assuming ~2s between readings: L/min * (2/60))
            const deltaLiters = (reading.inletFlow / 60) * 2;
            if (!isNaN(deltaLiters) && deltaLiters > 0) {
                setTotalVolumeLiters((v) => Number((v + deltaLiters).toFixed(2)));
            }
        }
    }, [dataSource]);
    (0, react_1.useEffect)(() => {
        setOnTelemetryReceived(handleLiveTelemetry);
    }, [setOnTelemetryReceived, handleLiveTelemetry]);
    // If MQTT connects and user hasn't explicitly locked to Demo mode, suggest Wokwi
    (0, react_1.useEffect)(() => {
        if (mqttStatus === 'connected' && dataSource === 'demo') {
            // Keep demo as default but user can switch freely
        }
    }, [mqttStatus, dataSource]);
    // Deterministic Demo Simulation Loop
    const tickDemoSimulation = (0, react_1.useCallback)(() => {
        simulationStepRef.current += 1;
        const step = simulationStepRef.current;
        const now = Date.now();
        // Slight natural jitter
        const noise = (Math.sin(step * 0.5) * 0.15);
        let inlet = 12.0 + noise;
        let outlet = 11.9 + noise * 0.9;
        let notes = 'Normal flow';
        let isValid = true;
        switch (activeScenario) {
            case 'idle':
                inlet = 0.0;
                outlet = 0.0;
                notes = 'Idle: No water drawn';
                break;
            case 'normal':
                inlet = 12.5 + noise;
                outlet = 12.3 + noise * 0.9;
                notes = 'Normal consistent water flow';
                break;
            case 'suspected_leak':
                // Sustained positive flow difference (inlet > outlet by 5.2 L/min)
                inlet = 16.0 + noise;
                outlet = 10.8 + noise * 0.8;
                notes = 'DEMO: Positive flow mismatch (Inlet > Outlet)';
                break;
            case 'abnormal_consumption':
                // Flow exceeds 25.0 threshold (high draw, e.g. 31.5 L/min)
                inlet = 31.0 + noise * 2;
                outlet = 30.8 + noise * 2;
                notes = 'DEMO: High flow exceeding 25 L/min threshold';
                break;
            case 'night_time_flow':
                // Quiescent flow of 4.5 L/min
                inlet = 4.5 + noise * 0.5;
                outlet = 4.4 + noise * 0.5;
                notes = 'DEMO: Flow active during simulated quiescent period';
                break;
            case 'sensor_anomaly':
                // Outlet reads higher than Inlet (Reversed mismatch)
                inlet = 9.0 + noise;
                outlet = 15.2 + noise;
                notes = 'DEMO: Diagnostic anomaly (Outlet > Inlet)';
                break;
            case 'recovery':
                // Restored to balanced 11.5 L/min
                inlet = 11.5 + noise;
                outlet = 11.4 + noise;
                notes = 'DEMO: Flow stabilized to normal';
                break;
        }
        const reading = {
            deviceId: 'SIMULATED_DEMO_ESP32',
            timestamp: now,
            inletFlow: Number(inlet.toFixed(2)),
            outletFlow: Number(outlet.toFixed(2)),
            flowDifference: Number((inlet - outlet).toFixed(2)),
            isValid,
            isSimulated: true,
            status: 'online',
            notes,
        };
        setCurrentReading(reading);
        setHistory((prev) => [...prev.slice(-49), reading]);
        // Integrate volume
        const deltaLiters = (inlet / 60) * 1.5;
        if (deltaLiters > 0) {
            setTotalVolumeLiters((v) => Number((v + deltaLiters).toFixed(2)));
        }
    }, [activeScenario]);
    // Run demo tick every 1.5 seconds when in demo mode
    (0, react_1.useEffect)(() => {
        if (dataSource === 'demo') {
            scenarioTimerRef.current = setInterval(tickDemoSimulation, 1500);
        }
        else {
            if (scenarioTimerRef.current) {
                clearInterval(scenarioTimerRef.current);
                scenarioTimerRef.current = null;
            }
        }
        return () => {
            if (scenarioTimerRef.current) {
                clearInterval(scenarioTimerRef.current);
            }
        };
    }, [dataSource, tickDemoSimulation]);
    const setScenario = (0, react_1.useCallback)((scenario) => {
        setActiveScenario(scenario);
        simulationStepRef.current = 0;
        // Also broadcast scenario to Wokwi if connected via MQTT
        if (mqttStatus === 'connected') {
            publishCommand({
                command: 'set_scenario',
                scenario,
                timestamp: Date.now(),
            });
        }
    }, [mqttStatus, publishCommand]);
    const resetSimulator = (0, react_1.useCallback)(() => {
        setActiveScenario('normal');
        simulationStepRef.current = 0;
        setTotalVolumeLiters(142.5);
        if (mqttStatus === 'connected') {
            publishCommand({ command: 'reset', timestamp: Date.now() });
        }
    }, [mqttStatus, publishCommand]);
    return (<SensorContext.Provider value={{
            currentReading,
            history,
            totalVolumeLiters,
            dataSource,
            setDataSource,
            activeScenario,
            setScenario,
            thresholds,
            updateThresholds,
            resetSimulator,
            isSimulated: dataSource === 'demo' || currentReading.isSimulated,
        }}>
      {children}
    </SensorContext.Provider>);
};
exports.SensorProvider = SensorProvider;
const useSensor = () => {
    const context = (0, react_1.useContext)(SensorContext);
    if (!context) {
        throw new Error('useSensor must be used within a SensorProvider');
    }
    return context;
};
exports.useSensor = useSensor;
