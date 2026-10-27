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

  const [dataSource, setDataSourceState] = useState<DataSource>('demo');
  const setDataSource = useCallback((s: DataSource) => {
    dataSourceRef.current = s;
    setDataSourceState(s);
    if (s === 'wokwi') {
      lastWokwiPacketTimeRef.current = null;
    }
  }, []);
  const [activeScenario, setActiveScenario] = useState<ScenarioType>('normal');
  
  // Baseline initial flow rates (matching certified baseline: 12.5 L/min inlet, 12.3 L/min outlet)
  const [inFlow, setInFlow] = useState<number>(12.5);
  const [outFlow, setOutFlow] = useState<number>(12.3);
  const [inVol, setInVol] = useState<number>(0.0);
  const [outVol, setOutVol] = useState<number>(0.0);
  const [mismatch, setMismatch] = useState<number>(0.2);
  const [elapsed, setElapsed] = useState<number>(0);
  const [suspicious, setSuspicious] = useState<number>(0);
  const [needIntervals, setNeedIntervals] = useState<number>(3);
  const [alarmed, setAlarmed] = useState<boolean>(false);
  
  const [statusState, setStatusState] = useState<PrototypeStatusState>('normal');
  const [statusDetail, setStatusDetail] = useState<string>('The inlet and outlet readings are balanced.');
  
  const [thresholds, setThresholds] = useState<ThresholdConfig>(DEFAULT_THRESHOLDS);
  const [mismatchThreshold, setMismatchThresholdState] = useState<number>(DEFAULT_THRESHOLDS.mismatchThreshold);

  // Single Authoritative Leak Detection Engine instance
  const engineRef = useRef<LeakDetectionEngine>(new LeakDetectionEngine());

  // Refs to guarantee telemetry callbacks and async timers always read the freshest state without stale closures
  const dataSourceRef = useRef<DataSource>(dataSource);
  useEffect(() => {
    dataSourceRef.current = dataSource;
  }, [dataSource]);

  const thresholdsRef = useRef<ThresholdConfig>(thresholds);
  useEffect(() => {
    thresholdsRef.current = thresholds;
  }, [thresholds]);

  const lastWokwiPacketTimeRef = useRef<number | null>(null);

  const [detectionResult, setDetectionResult] = useState<DetectionResult>({
    hasAlert: false,
    alertCandidate: null,
    diagnosticNotes: [],
    isRecovered: false,
    state: 'normal',
    activeCategory: null,
  });

  const [events, setEvents] = useState<PrototypeEvent[]>([
    { id: 'ev-0', t: 'T+0s', message: 'System ready. Choose a scenario or adjust flow rates manually.' },
  ]);

  const [history, setHistory] = useState<TelemetryReading[]>([
    {
      deviceId: 'SIM_METER_01',
      timestamp: Date.now(),
      inletFlow: 12.5,
      outletFlow: 12.3,
      flowDifference: 0.2,
      isValid: true,
      isSimulated: true,
      status: 'online',
    },
  ]);

  const setMismatchThreshold = useCallback((val: number) => {
    setMismatchThresholdState(val);
    setThresholds((prev) => ({ ...prev, mismatchThreshold: val }));
  }, []);

  const addEvent = useCallback((message: string, currentElapsed: number) => {
    const t = `T+${currentElapsed}s`;
    const newEv: PrototypeEvent = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      t,
      message,
    };
    setEvents((prev) => [newEv, ...prev.slice(0, 24)]);
  }, []);

  // Set scenario matching canonical academic demonstration flows
  const setScenario = useCallback((s: ScenarioType) => {
    setActiveScenario(s);
    let newIn = 12.5;
    let newOut = 12.3;

    if (s === 'normal') {
      newIn = 12.5;
      newOut = 12.3;
      addEvent('Scenario: Balanced baseline flow selected (12.5 / 12.3 L/min).', elapsed);
    } else if (s === 'suspected_leak') {
      newIn = 16.5;
      newOut = 10.8;
      addEvent('Scenario: Suspected pipe breach injected (+5.7 L/min deficit).', elapsed);
    } else if (s === 'abnormal_consumption') {
      newIn = 31.0;
      newOut = 31.0;
      addEvent('Scenario: High draw consumption rate selected (31.0 L/min, balanced).', elapsed);
    } else if (s === 'night_time_flow') {
      newIn = 4.5;
      newOut = 4.5;
      addEvent('Scenario: Continuous night flow during quiescent window selected.', elapsed);
    } else if (s === 'sensor_anomaly') {
      newIn = 9.0;
      newOut = 15.2;
      addEvent('Scenario: Diagnostic check; outlet exceeds inlet (-6.2 L/min).', elapsed);
    } else if (s === 'recovery') {
      newIn = 12.5;
      newOut = 12.3;
      addEvent('Scenario: Recovery initiated; normal balanced flows restored.', elapsed);
    }

    setInFlow(newIn);
    setOutFlow(newOut);

    if (mqttStatus === 'connected') {
      publishCommand({
        command: 'set_scenario',
        scenario: s,
        timestamp: Math.floor(Date.now() / 1000),
      });
    }
  }, [elapsed, mqttStatus, publishCommand, addEvent]);

  const manualFlow = useCallback((inlet: number, outlet: number) => {
    const safeInlet = Math.max(0, isFinite(inlet) ? inlet : 0);
    const safeOutlet = Math.max(0, isFinite(outlet) ? outlet : 0);
    setInFlow(safeInlet);
    setOutFlow(safeOutlet);
    setActiveScenario('idle');
  }, []);

  const resetDemo = useCallback(() => {
    engineRef.current.reset();
    setInFlow(12.5);
    setOutFlow(12.3);
    setInVol(0.0);
    setOutVol(0.0);
    setMismatch(0.2);
    setElapsed(0);
    setSuspicious(0);
    setAlarmed(false);
    setStatusState('normal');
    setStatusDetail('The inlet and outlet readings are balanced.');
    setDetectionResult({
      hasAlert: false,
      alertCandidate: null,
      diagnosticNotes: [],
      isRecovered: false,
      state: 'normal',
      activeCategory: null,
    });
    setHistory([]);
    setEvents([
      { id: `ev-reset-${Date.now()}`, t: 'T+0s', message: 'Demo reset. Ready for a new scenario.' },
    ]);
    setActiveScenario('normal');

    if (mqttStatus === 'connected') {
      publishCommand({ command: 'reset', timestamp: Math.floor(Date.now() / 1000) });
    }
  }, [mqttStatus, publishCommand]);

  // Telemetry Evaluation Engine Execution (Ticks every 3s in demo mode)
  useEffect(() => {
    if (dataSource !== 'demo') return;

    const timer = setInterval(() => {
      // Guard against race conditions if source switched asynchronously or live MQTT is active
      if (dataSourceRef.current !== 'demo') return;
      if (lastWokwiPacketTimeRef.current && Date.now() - lastWokwiPacketTimeRef.current < 15000) return;

      setElapsed((prevElapsed) => {
        const nextElapsed = prevElapsed + 3;
        const dtMinutes = 3 / 60; // 3 seconds in minutes
        const inDelta = inFlow * dtMinutes;
        const outDelta = outFlow * dtMinutes;

        setInVol((prevIn) => Number((prevIn + inDelta).toFixed(2)));
        setOutVol((prevOut) => Number((prevOut + outDelta).toFixed(2)));
        setMismatch(Number((inFlow - outFlow).toFixed(2)));

        const now = Date.now();
        const reading: TelemetryReading = {
          deviceId: 'SIM_METER_01',
          timestamp: now,
          inletFlow: inFlow,
          outletFlow: outFlow,
          flowDifference: Number((inFlow - outFlow).toFixed(2)),
          isValid: isFinite(inFlow) && isFinite(outFlow) && inFlow >= 0 && outFlow >= 0,
          isSimulated: true,
          source: 'demo',
          status: 'online',
          isNightTimeOverride: activeScenario === 'night_time_flow' ? true : undefined,
        };

        // Pass reading into the Authoritative LeakDetectionEngine
        const evalResult = engineRef.current.processReading(reading, thresholdsRef.current, now);
        setDetectionResult(evalResult);
        setStatusState(evalResult.state);
        
        const detailText =
          evalResult.alertCandidate?.explanation ||
          (evalResult.diagnosticNotes.length > 0 ? evalResult.diagnosticNotes[0] : null) ||
          'The inlet and outlet readings are balanced.';
        setStatusDetail(detailText);

        if (evalResult.state === 'leak') {
          setAlarmed(true);
          setSuspicious(needIntervals);
        } else if (evalResult.state === 'checking') {
          setSuspicious((prev) => prev + 1);
        } else {
          setSuspicious(0);
          setAlarmed(false);
        }

        // Log events when status changes or alerts emerge
        if (evalResult.hasAlert && evalResult.alertCandidate) {
          addEvent(`${evalResult.alertCandidate.title}: ${evalResult.alertCandidate.explanation}`, nextElapsed);
        } else if (evalResult.isRecovered) {
          addEvent(`RECOVERY: Flow stabilized. Previous incident (${evalResult.recoveredCategory}) resolved.`, nextElapsed);
        }

        setHistory((prev) => [...prev.slice(-29), reading]);
        return nextElapsed;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [dataSource, inFlow, outFlow, activeScenario, needIntervals, addEvent]);

  // Handle Live Telemetry received over MQTT (from virtual Wokwi ESP32 or physical devkit)
  const handleLiveTelemetry = useCallback((reading: TelemetryReading) => {
    const now = reading.timestamp || Date.now();
    const lastTime = lastWokwiPacketTimeRef.current;
    lastWokwiPacketTimeRef.current = now;

    // Automatically transition to 'wokwi' when live telemetry arrives
    if (dataSourceRef.current !== 'wokwi' && reading.source !== 'demo') {
      dataSourceRef.current = 'wokwi';
      setDataSourceState('wokwi');
    }

    // 1. Update shared live flow state immutably for UI re-render
    setInFlow(reading.inletFlow);
    setOutFlow(reading.outletFlow);
    setMismatch(reading.flowDifference);

    // 2. Accumulate live volume for valid telemetry readings
    if (lastTime !== null && reading.isValid) {
      const dtSec = Math.max(0.5, Math.min(10, (now - lastTime) / 1000));
      const dtMinutes = dtSec / 60;
      setInVol((prev) => Number((prev + reading.inletFlow * dtMinutes).toFixed(2)));
      setOutVol((prev) => Number((prev + reading.outletFlow * dtMinutes).toFixed(2)));
    }

    // 3. Process reading in Authoritative LeakDetectionEngine
    const evalResult = engineRef.current.processReading(reading, thresholdsRef.current, now);
    setDetectionResult(evalResult);
    setStatusState(evalResult.state);

    const detailText =
      evalResult.alertCandidate?.explanation ||
      (evalResult.diagnosticNotes.length > 0 ? evalResult.diagnosticNotes[0] : null) ||
      'Wokwi Live: Inlet and outlet flows are balanced.';
    setStatusDetail(detailText);

    if (evalResult.state === 'leak') {
      setAlarmed(true);
      setSuspicious(needIntervals);
    } else if (evalResult.state === 'checking') {
      setSuspicious((prev) => prev + 1);
    } else {
      setSuspicious(0);
      setAlarmed(false);
    }

    if (evalResult.hasAlert && evalResult.alertCandidate) {
      addEvent(`[WOKWI] ${evalResult.alertCandidate.title}: ${evalResult.alertCandidate.explanation}`, elapsed);
    } else if (evalResult.isRecovered) {
      addEvent(`[WOKWI] RECOVERY: Normal flow restored (${evalResult.recoveredCategory} resolved).`, elapsed);
    }

    setHistory((prev) => [...prev.slice(-29), reading]);
  }, [elapsed, needIntervals, addEvent]);

  useEffect(() => {
    setOnTelemetryReceived(handleLiveTelemetry);
    return () => {
      setOnTelemetryReceived(null);
    };
  }, [setOnTelemetryReceived, handleLiveTelemetry]);

  const currentReading: TelemetryReading = {
    deviceId: dataSource === 'demo' ? 'SIM_METER_01' : 'ESP32_WOKWI_01',
    timestamp: Date.now(),
    inletFlow: inFlow,
    outletFlow: outFlow,
    flowDifference: Number((inFlow - outFlow).toFixed(2)),
    isValid: isFinite(inFlow) && isFinite(outFlow) && inFlow >= 0 && outFlow >= 0,
    isSimulated: dataSource === 'demo',
    status: 'online',
    notes: statusDetail,
    isNightTimeOverride: activeScenario === 'night_time_flow' ? true : undefined,
  };

  const updateThresholds = useCallback((partial: Partial<ThresholdConfig>) => {
    setThresholds((prev) => {
      const next = { ...prev, ...partial };
      if (partial.mismatchThreshold !== undefined) {
        setMismatchThresholdState(partial.mismatchThreshold);
      }
      return next;
    });
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
        detectionResult,
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
