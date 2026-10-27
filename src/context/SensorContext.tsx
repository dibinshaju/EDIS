import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { TelemetryReading, ThresholdConfig, ScenarioType, DataSource } from '../types/sensor';
import { DEFAULT_THRESHOLDS } from '../constants/thresholds';
import { useMqtt } from './MqttContext';
import { LeakDetectionEngine, DetectionResult, EngineStatusState } from '../utils/leakDetection';

export interface PrototypeEvent {
  id: string;
  t: string;
  message: string;
}

export type PrototypeStatusState = EngineStatusState;

interface SensorContextType {
  // HTML Prototype Core Variables
  inFlow: number;
  outFlow: number;
  inVol: number;
  outVol: number;
  mismatch: number;
  elapsed: number;
  suspicious: number;
  needIntervals: number;
  mismatchThreshold: number;
  statusState: PrototypeStatusState;
  statusDetail: string;
  events: PrototypeEvent[];
  history: TelemetryReading[];
  
  // Authoritative Detection Result from LeakDetectionEngine
  detectionResult: DetectionResult;
  
  // Controls
  setScenario: (s: ScenarioType) => void;
  manualFlow: (inlet: number, outlet: number) => void;
  setMismatchThreshold: (val: number) => void;
  setNeedIntervals: (val: number) => void;
  resetDemo: () => void;
  resetSimulator: () => void;
  
  // App Infrastructure Compatibility
  currentReading: TelemetryReading;
  totalVolumeLiters: number;
  dataSource: DataSource;
  setDataSource: (s: DataSource) => void;
  activeScenario: ScenarioType;
  thresholds: ThresholdConfig;
  updateThresholds: (partial: Partial<ThresholdConfig>) => void;
  isSimulated: boolean;
}

const SensorContext = createContext<SensorContextType | undefined>(undefined);

const INTERVAL_SECONDS = 10; // Each simulation interval represents 10 simulated seconds

export const SensorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status: mqttStatus, setOnTelemetryReceived, publishCommand } = useMqtt();

  const [dataSource, setDataSource] = useState<DataSource>('demo');
  const [activeScenario, setActiveScenario] = useState<ScenarioType>('normal');
  
  // Core Prototype State
  const [inFlow, setInFlow] = useState<number>(5.0);
  const [outFlow, setOutFlow] = useState<number>(5.0);
  const [inVol, setInVol] = useState<number>(0.0);
  const [outVol, setOutVol] = useState<number>(0.0);
  const [mismatch, setMismatch] = useState<number>(0.0);
  const [elapsed, setElapsed] = useState<number>(0);
  const [suspicious, setSuspicious] = useState<number>(0);
  const [needIntervals, setNeedIntervals] = useState<number>(3);
  const [mismatchThreshold, setMismatchThreshold] = useState<number>(1.0);
  const [alarmed, setAlarmed] = useState<boolean>(false);
  
  const [statusState, setStatusState] = useState<PrototypeStatusState>('normal');
  const [statusDetail, setStatusDetail] = useState<string>('The inlet and outlet readings are balanced.');
  
  const [events, setEvents] = useState<PrototypeEvent[]>([
    { id: 'ev-0', t: 'T+0s', message: 'System ready. Choose a scenario or adjust flow rates manually.' },
  ]);

  const [history, setHistory] = useState<TelemetryReading[]>([
    {
      deviceId: 'ESP32_METER_01',
      timestamp: Date.now(),
      inletFlow: 5.0,
      outletFlow: 5.0,
      flowDifference: 0.0,
      isValid: true,
      isSimulated: true,
      status: 'online',
    },
  ]);

  const [thresholds, setThresholds] = useState<ThresholdConfig>(DEFAULT_THRESHOLDS);

  const addEvent = useCallback((message: string, currentElapsed: number) => {
    const t = `T+${currentElapsed}s`;
    const newEv: PrototypeEvent = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      t,
      message,
    };
    setEvents((prev) => [newEv, ...prev.slice(0, 19)]);
  }, []);

  // Set scenario function matching the HTML prototype
  const setScenario = useCallback((s: ScenarioType) => {
    setActiveScenario(s);
    let newIn = 5.0;
    let newOut = 5.0;

    if (s === 'normal' || s === 'recovery') {
      newIn = 5.0;
      newOut = 5.0;
      addEvent('Scenario selected: balanced normal flow.', elapsed);
    } else if (s === 'suspected_leak') {
      newIn = 5.0;
      newOut = 3.0;
      addEvent('Scenario selected: inlet exceeds outlet; mismatch should accumulate.', elapsed);
    } else if (s === 'abnormal_consumption') {
      newIn = 12.0;
      newOut = 12.0;
      addEvent('Scenario selected: high flow with balanced inlet/outlet; high consumption, not a leak.', elapsed);
    } else if (s === 'sensor_anomaly') {
      newIn = 3.0;
      newOut = 5.0;
      addEvent('Scenario selected: diagnostic check; outlet exceeds inlet.', elapsed);
    }

    setInFlow(newIn);
    setOutFlow(newOut);

    if (mqttStatus === 'connected') {
      publishCommand({
        command: 'set_scenario',
        scenario: s,
        timestamp: Date.now(),
      });
    }
  }, [elapsed, mqttStatus, publishCommand, addEvent]);

  const manualFlow = useCallback((inlet: number, outlet: number) => {
    setInFlow(inlet);
    setOutFlow(outlet);
    setActiveScenario('idle');
  }, []);

  const resetDemo = useCallback(() => {
    setInFlow(5.0);
    setOutFlow(5.0);
    setInVol(0.0);
    setOutVol(0.0);
    setMismatch(0.0);
    setElapsed(0);
    setSuspicious(0);
    setAlarmed(false);
    setStatusState('normal');
    setStatusDetail('The inlet and outlet readings are balanced.');
    setHistory([]);
    setEvents([
      { id: 'ev-reset', t: 'T+0s', message: 'Demo reset. Ready for a new scenario.' },
    ]);
    setActiveScenario('normal');

    if (mqttStatus === 'connected') {
      publishCommand({ command: 'reset', timestamp: Date.now() });
    }
  }, [mqttStatus, publishCommand]);

  // Simulation Step execution (ticks every 3 real seconds = 10 simulated seconds)
  useEffect(() => {
    if (dataSource !== 'demo') return;

    const timer = setInterval(() => {
      setElapsed((prevElapsed) => {
        const inDelta = (inFlow * INTERVAL_SECONDS) / 60;
        const outDelta = (outFlow * INTERVAL_SECONDS) / 60;

        setInVol((prevInVol) => {
          const nextInVol = prevInVol + inDelta;
          setOutVol((prevOutVol) => {
            const nextInVol = prevInVol + inDelta;
            const nextOutVol = prevOutVol + outDelta;
            const currentMismatch = nextInVol - nextOutVol;
            const intervalMismatch = inDelta - outDelta;

            setMismatch(Number(currentMismatch.toFixed(2)));

            setSuspicious((prevSuspicious) => {
              let nextSuspicious = prevSuspicious;

              if (intervalMismatch > 0.0001 && currentMismatch > mismatchThreshold) {
                nextSuspicious += 1;
              } else if (currentMismatch <= mismatchThreshold) {
                nextSuspicious = 0;
              }

              // Evaluate High Consumption
              if (inFlow > 10 && Math.abs(inFlow - outFlow) < 0.25) {
                addEvent('High consumption pattern detected; inlet/outlet remain balanced. No leak inferred.', nextElapsed);
              }

              // Evaluate Possible Leak
              if (nextSuspicious >= needIntervals && !alarmed) {
                setAlarmed(true);
                addEvent('POSSIBLE LEAK: persistent inlet/outlet volume mismatch exceeded threshold.', nextElapsed);
              }

              // Determine Status State and Detail
              if (nextInVol - nextOutVol < -mismatchThreshold) {
                setStatusState('datacheck');
                setStatusDetail('DATA CHECK: outlet exceeds inlet. Check sensor calibration or auxiliary feeds.');
              } else if (alarmed || nextSuspicious >= needIntervals) {
                setStatusState('leak');
                setStatusDetail('POSSIBLE LEAK: simulated inlet volume exceeds outlet volume beyond threshold.');
              } else if (inFlow > 10 && Math.abs(inFlow - outFlow) < 0.25) {
                setStatusState('high');
                setStatusDetail('HIGH CONSUMPTION: high flow is not treated as a leak when sensors remain balanced.');
              } else if (currentMismatch > mismatchThreshold) {
                setStatusState('checking');
                setStatusDetail('CHECKING: mismatch detected; waiting for configured suspicious intervals.');
              } else {
                setStatusState('normal');
                setStatusDetail('NORMAL: no persistent mismatch above configured threshold.');
              }

              return nextSuspicious;
            });

            return Number(nextOutVol.toFixed(2));
          });
          return Number(nextInVol.toFixed(2));
        });
        const nextElapsed = prevElapsed + INTERVAL_SECONDS;

        // Append to history buffer
        const reading: TelemetryReading = {
          deviceId: 'ESP32_METER_01',
          timestamp: Date.now(),
          inletFlow: inFlow,
          outletFlow: outFlow,
          flowDifference: Number((inFlow - outFlow).toFixed(2)),
          isValid: true,
          isSimulated: true,
          status: 'online',
        };
        setHistory((prev) => [...prev.slice(-25), reading]);

        return nextElapsed;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [dataSource, inFlow, outFlow, mismatchThreshold, needIntervals, alarmed, addEvent]);

  // Handle MQTT Telemetry when live hardware is active
  const handleLiveTelemetry = useCallback((reading: TelemetryReading) => {
    if (dataSource === 'wokwi') {
      setInFlow(reading.inletFlow);
      setOutFlow(reading.outletFlow);
      setHistory((prev) => [...prev.slice(-25), reading]);
    }
  }, [dataSource]);

  useEffect(() => {
    setOnTelemetryReceived(handleLiveTelemetry);
  }, [setOnTelemetryReceived, handleLiveTelemetry]);

  const currentReading: TelemetryReading = {
    deviceId: 'ESP32_METER_01',
    timestamp: Date.now(),
    inletFlow: inFlow,
    outletFlow: outFlow,
    flowDifference: Number((inFlow - outFlow).toFixed(2)),
    isValid: true,
    isSimulated: dataSource === 'demo',
    status: 'online',
    notes: statusDetail,
  };

  const updateThresholds = useCallback((partial: Partial<ThresholdConfig>) => {
    setThresholds((prev) => ({ ...prev, ...partial }));
  }, []);

  return (
    <SensorContext.Provider
      value={{
        inFlow,
        outFlow,
        inVol,
        outVol,
        mismatch,
        elapsed,
        suspicious,
        needIntervals,
        mismatchThreshold,
        statusState,
        statusDetail,
        events,
        history,
        setScenario,
        manualFlow,
        setMismatchThreshold,
        setNeedIntervals,
        resetDemo,
        resetSimulator: resetDemo,
        currentReading,
        totalVolumeLiters: inVol,
        dataSource,
        setDataSource,
        activeScenario,
        thresholds,
        updateThresholds,
        isSimulated: dataSource === 'demo',
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
