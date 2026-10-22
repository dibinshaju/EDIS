import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { TelemetryReading, ThresholdConfig, ScenarioType, DataSource } from '../types/sensor';
import { DEFAULT_THRESHOLDS } from '../constants/thresholds';
import { useMqtt } from './MqttContext';

interface SensorContextType {
  currentReading: TelemetryReading;
  history: TelemetryReading[];
  totalVolumeLiters: number;
  dataSource: DataSource;
  setDataSource: (source: DataSource) => void;
  activeScenario: ScenarioType;
  setScenario: (scenario: ScenarioType) => void;
  thresholds: ThresholdConfig;
  updateThresholds: (partial: Partial<ThresholdConfig>) => void;
  resetSimulator: () => void;
  isSimulated: boolean;
}

const INITIAL_READING: TelemetryReading = {
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

const SensorContext = createContext<SensorContextType | undefined>(undefined);

export const SensorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status: mqttStatus, setOnTelemetryReceived, publishCommand } = useMqtt();
  
  const [dataSource, setDataSource] = useState<DataSource>('demo');
  const [activeScenario, setActiveScenario] = useState<ScenarioType>('normal');
  const [thresholds, setThresholds] = useState<ThresholdConfig>(DEFAULT_THRESHOLDS);
  const [currentReading, setCurrentReading] = useState<TelemetryReading>(INITIAL_READING);
  const [history, setHistory] = useState<TelemetryReading[]>([INITIAL_READING]);
  const [totalVolumeLiters, setTotalVolumeLiters] = useState<number>(142.5);

  const scenarioTimerRef = useRef<NodeJS.Timeout | null>(null);
  const simulationStepRef = useRef<number>(0);

  const updateThresholds = useCallback((partial: Partial<ThresholdConfig>) => {
    setThresholds((prev) => ({ ...prev, ...partial }));
  }, []);

  // When live telemetry arrives via MQTT
  const handleLiveTelemetry = useCallback((reading: TelemetryReading) => {
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

  useEffect(() => {
    setOnTelemetryReceived(handleLiveTelemetry);
  }, [setOnTelemetryReceived, handleLiveTelemetry]);

  // If MQTT connects and user hasn't explicitly locked to Demo mode, suggest Wokwi
  useEffect(() => {
    if (mqttStatus === 'connected' && dataSource === 'demo') {
      // Keep demo as default but user can switch freely
    }
  }, [mqttStatus, dataSource]);

  // Deterministic Demo Simulation Loop
  const tickDemoSimulation = useCallback(() => {
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

    const reading: TelemetryReading = {
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
  useEffect(() => {
    if (dataSource === 'demo') {
      scenarioTimerRef.current = setInterval(tickDemoSimulation, 1500);
    } else {
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

  const setScenario = useCallback((scenario: ScenarioType) => {
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

  const resetSimulator = useCallback(() => {
    setActiveScenario('normal');
    simulationStepRef.current = 0;
    setTotalVolumeLiters(142.5);
    if (mqttStatus === 'connected') {
      publishCommand({ command: 'reset', timestamp: Date.now() });
    }
  }, [mqttStatus, publishCommand]);

  return (
    <SensorContext.Provider
      value={{
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
      }}
    >
      {children}
    </SensorContext.Provider>
  );
};

export const useSensor = () => {
  const context = useContext(SensorContext);
  if (!context) {
    throw new Error('useSensor must be used within a SensorProvider');
  }
  return context;
};
