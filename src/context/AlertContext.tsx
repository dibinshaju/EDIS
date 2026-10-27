import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AlertEvent, AlertCategory } from '../types/alert';
import { AlertDeduplicator } from '../utils/alertDedup';
import { buzzerService } from '../utils/sound';
import { useSensor } from './SensorContext';
import { useAuth } from './AuthContext';
import { useMqtt } from './MqttContext';

interface AlertContextType {
  alerts: AlertEvent[];
  activeAlert: AlertEvent | null;
  activeCount: number;
  diagnosticNotes: string[];
  isBuzzerEnabled: boolean;
  toggleBuzzer: () => void;
  playTestBuzzer: () => void;
  acknowledgeAlert: (alertId: string) => void;
  resolveAlert: (alertId: string) => void;
  clearAllAlerts: () => void;
  triggerDemoAlert: (category?: AlertCategory) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentReading, detectionResult } = useSensor();
  const { user } = useAuth();
  const { status: mqttStatus, publishCommand } = useMqtt();

  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [activeAlert, setActiveAlert] = useState<AlertEvent | null>(null);
  const [diagnosticNotes, setDiagnosticNotes] = useState<string[]>([]);
  const [isBuzzerEnabled, setIsBuzzerEnabled] = useState<boolean>(true);

  const dedupRef = useRef<AlertDeduplicator>(new AlertDeduplicator(30));

  // Process authoritative detection results from the unified engine
  useEffect(() => {
    if (!currentReading || !detectionResult) return;

    setDiagnosticNotes(detectionResult.diagnosticNotes);

    if (detectionResult.hasAlert && detectionResult.alertCandidate) {
      const processed = dedupRef.current.processCandidate(
        detectionResult.alertCandidate,
        currentReading,
        currentReading.timestamp || Date.now()
      );

      if (processed) {
        const { isNew, event } = processed;
        
        setAlerts((prev) => {
          const index = prev.findIndex((a) => a.id === event.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = event;
            return updated;
          }
          return [event, ...prev.slice(0, 49)];
        });

        if (event.status === 'ACTIVE') {
          setActiveAlert(event);

          // Play buzzer on brand new active alert
          if (isNew && event.severity === 'CRITICAL' && isBuzzerEnabled) {
            buzzerService.playAlarm();
          }
        }
      }
    } else if (detectionResult.isRecovered) {
      // Condition recovered
      if (detectionResult.recoveredCategory) {
        const resolved = dedupRef.current.resolveCategory(detectionResult.recoveredCategory);
        if (resolved) {
          setAlerts((prev) =>
            prev.map((a) => (a.id === resolved.id ? { ...a, status: 'RESOLVED', resolvedAt: Date.now() } : a))
          );
        }
      }
      setActiveAlert(null);
    } else {
      // If system cleared condition and no alert candidate exists
      if (activeAlert && activeAlert.status === 'ACTIVE') {
        const resolved = dedupRef.current.resolveCategory(activeAlert.category);
        if (resolved) {
          setAlerts((prev) =>
            prev.map((a) => (a.id === resolved.id ? { ...a, status: 'RESOLVED', resolvedAt: Date.now() } : a))
          );
        }
        setActiveAlert(null);
      }
    }
  }, [currentReading, detectionResult, isBuzzerEnabled, activeAlert]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    // Silence audio immediately
    buzzerService.stop();

    if (mqttStatus === 'connected') {
      publishCommand({
        command: 'ack_alarm',
        timestamp: Math.floor(Date.now() / 1000),
      });
    }

    const ackName = user?.displayName || 'Administrator';
    dedupRef.current.acknowledgeAlert(alertId, ackName);

    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? { ...a, status: 'ACKNOWLEDGED', acknowledgedAt: Date.now(), acknowledgedBy: ackName }
          : a
      )
    );

    setActiveAlert((prev) => (prev?.id === alertId ? { ...prev, status: 'ACKNOWLEDGED' } : prev));
  }, [user, mqttStatus, publishCommand]);

  const resolveAlert = useCallback((alertId: string) => {
    buzzerService.stop();

    if (mqttStatus === 'connected') {
      publishCommand({
        command: 'ack_alarm',
        timestamp: Math.floor(Date.now() / 1000),
      });
    }

    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'RESOLVED', resolvedAt: Date.now() } : a))
    );
    setActiveAlert((prev) => (prev?.id === alertId ? null : prev));
  }, [mqttStatus, publishCommand]);

  const clearAllAlerts = useCallback(() => {
    buzzerService.stop();
    dedupRef.current.clear();
    setAlerts([]);
    setActiveAlert(null);
  }, []);

  const toggleBuzzer = useCallback(() => {
    setIsBuzzerEnabled((prev) => {
      const next = !prev;
      buzzerService.setSoundEnabled(next);
      return next;
    });
  }, []);

  const playTestBuzzer = useCallback(() => {
    buzzerService.playAlarm();
  }, []);

  const triggerDemoAlert = useCallback((category: AlertCategory = 'SUSPECTED_LEAK') => {
    const now = Date.now();
    const demoEvent: AlertEvent = {
      id: `DEMO-${category}-${now}`,
      category,
      severity: category === 'SUSPECTED_LEAK' ? 'CRITICAL' : 'WARNING',
      status: 'ACTIVE',
      title: category === 'SUSPECTED_LEAK'
        ? '[DEMO] Suspected Water Leakage Detected'
        : '[DEMO] Simulated System Alert',
      explanation: 'Manual demonstration alert triggered via Admin Alert Center for expo testing.',
      timestamp: now,
      inletFlow: 18.5,
      outletFlow: 11.2,
      flowDifference: 7.3,
      durationSec: 12,
      isSimulated: true,
      source: 'demo',
      occurrenceCount: 1,
    };

    setAlerts((prev) => [demoEvent, ...prev]);
    setActiveAlert(demoEvent);

    if (isBuzzerEnabled) {
      buzzerService.playAlarm();
    }
  }, [isBuzzerEnabled]);

  const activeCount = alerts.filter((a) => a.status === 'ACTIVE').length;

  return (
    <AlertContext.Provider
      value={{
        alerts,
        activeAlert,
        activeCount,
        diagnosticNotes,
        isBuzzerEnabled,
        toggleBuzzer,
        playTestBuzzer,
        acknowledgeAlert,
        resolveAlert,
        clearAllAlerts,
        triggerDemoAlert,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};
