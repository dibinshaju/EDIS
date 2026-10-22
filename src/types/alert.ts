export type AlertCategory =
  | 'SUSPECTED_LEAK'
  | 'ABNORMAL_CONSUMPTION'
  | 'NIGHT_FLOW'
  | 'SENSOR_ANOMALY'
  | 'STALE_READING'
  | 'RECOVERED';

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface AlertEvent {
  id: string; // Unique event identifier
  category: AlertCategory;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  explanation: string;
  timestamp: number;
  inletFlow: number;
  outletFlow: number;
  flowDifference: number; // positive = inlet > outlet
  durationSec: number;
  isSimulated: boolean;
  source: 'wokwi' | 'demo' | 'mqtt';
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  resolvedAt?: number;
  occurrenceCount: number;
}
