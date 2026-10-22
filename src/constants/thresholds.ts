import { ThresholdConfig } from '../types/sensor';

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  mismatchThreshold: 1.5, // L/min (difference = inlet - outlet)
  persistenceDurationSec: 6, // Seconds sustained mismatch required
  highConsumptionThreshold: 25.0, // L/min (high single/total flow)
  highConsumptionDurationSec: 8, // Seconds sustained high flow
  nightTimeStartHour: 23, // 11 PM
  nightTimeEndHour: 5, // 5 AM
  nightTimeThreshold: 1.0, // Any flow > 1.0 L/min during night hours
  sensorTimeoutSec: 12, // Stale if no telemetry within 12 seconds
};
