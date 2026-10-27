export type SensorStatus = 'online' | 'warning' | 'stale' | 'offline';

export type DataSource = 'wokwi' | 'demo' | 'mqtt';

export interface TelemetryReading {
  deviceId: string;
  timestamp: number; // Unix timestamp in ms
  inletFlow: number; // Liters per minute (L/min)
  outletFlow: number; // Liters per minute (L/min)
  flowDifference: number; // inletFlow - outletFlow (positive = water deficit/loss)
  isValid: boolean;
  isSimulated: boolean;
  source?: DataSource;
  status: SensorStatus;
  notes?: string;
  scenario?: string;
  requestId?: string;
  isNightTimeOverride?: boolean;
}

export type ScenarioType = 
  | 'idle'
  | 'normal'
  | 'suspected_leak'
  | 'abnormal_consumption'
  | 'night_time_flow'
  | 'sensor_anomaly'
  | 'recovery';

export interface ThresholdConfig {
  mismatchThreshold: number; // L/min (default 1.5 L/min)
  persistenceDurationSec: number; // seconds before alert triggers (default 8 sec)
  highConsumptionThreshold: number; // L/min (default 25.0 L/min)
  highConsumptionDurationSec: number; // seconds (default 10 sec)
  nightTimeStartHour: number; // 0-23 (default 23:00 / 11 PM)
  nightTimeEndHour: number; // 0-23 (default 5:00 / 5 AM)
  nightTimeThreshold: number; // L/min threshold during night (default 1.0 L/min)
  sensorTimeoutSec: number; // seconds before reading is considered stale (default 12 sec)
}

export interface SimulatorCommand {
  command: 'set_scenario' | 'set_flow' | 'reset' | 'ack_alarm';
  scenario?: ScenarioType;
  inlet?: number;
  outlet?: number;
  requestId?: string;
  timestamp: number;
}

export interface CommandAck {
  type: string;
  command: string;
  status: 'applied' | 'rejected_range' | 'error';
  requestId?: string;
  inlet?: number;
  outlet?: number;
  timestamp: number;
}
