import { TelemetryReading, ThresholdConfig } from '../types/sensor';
import { AlertCategory, AlertSeverity } from '../types/alert';

export interface AlertCandidate {
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  explanation: string;
  durationSec: number;
}

export type EngineStatusState = 'normal' | 'checking' | 'leak' | 'high' | 'datacheck';

export interface DetectionResult {
  hasAlert: boolean;
  alertCandidate: AlertCandidate | null;
  diagnosticNotes: string[];
  isRecovered: boolean;
  recoveredCategory?: AlertCategory;
  state: EngineStatusState;
  activeCategory: AlertCategory | null;
}

/**
 * Stateful Leak Detection Engine
 * 
 * Evaluates telemetry streams against configured thresholds with persistence filtering.
 * NOTE: Dual-sensor flow mismatch indicates a SUSPECTED leak, not definitive physical proof.
 * Plumbing branches, hot-water storage tanks, accumulator tanks, unmonitored branches,
 * and sensor calibration tolerances can introduce apparent differences.
 */
export class LeakDetectionEngine {
  private positiveMismatchStartTime: number | null = null;
  private reversedMismatchStartTime: number | null = null;
  private highConsumptionStartTime: number | null = null;
  private nightFlowStartTime: number | null = null;
  private lastReadingTimestamp: number | null = null;
  
  // Track current active incident to handle recovery transitions
  private currentActiveIncident: AlertCategory | null = null;

  /**
   * Reset all internal state timers and tracking.
   */
  public reset(): void {
    this.positiveMismatchStartTime = null;
    this.reversedMismatchStartTime = null;
    this.highConsumptionStartTime = null;
    this.nightFlowStartTime = null;
    this.lastReadingTimestamp = null;
    this.currentActiveIncident = null;
  }

  /**
   * Evaluates an incoming sensor reading.
   * 
   * @param reading Incoming telemetry data
   * @param thresholds Configurable sensitivity and persistence settings
   * @param now Current evaluation timestamp in ms (defaults to reading.timestamp or Date.now())
   */
  public processReading(
    reading: TelemetryReading,
    thresholds: ThresholdConfig,
    now: number = reading.timestamp || Date.now()
  ): DetectionResult {
    const diagnosticNotes: string[] = [];
    let isRecovered = false;
    let recoveredCategory: AlertCategory | undefined;

    // 1. Validate reading integrity
    if (!reading.isValid || isNaN(reading.inletFlow) || isNaN(reading.outletFlow)) {
      this.positiveMismatchStartTime = null;
      this.reversedMismatchStartTime = null;
      return {
        hasAlert: true,
        alertCandidate: {
          category: 'SENSOR_ANOMALY',
          severity: 'WARNING',
          title: 'Sensor Reading Invalid',
          explanation: 'Corrupt or non-numeric sensor reading received from telemetry interface.',
          durationSec: 0,
        },
        diagnosticNotes: ['Invalid payload: check sensor wiring or telemetry parser.'],
        isRecovered: false,
      };
    }

    // 2. Check for stale data / timing gap if we have a previous reading
    if (this.lastReadingTimestamp !== null) {
      const timeDeltaSec = (now - this.lastReadingTimestamp) / 1000;
      if (timeDeltaSec > thresholds.sensorTimeoutSec) {
        diagnosticNotes.push(`Data transmission delay detected (${timeDeltaSec.toFixed(1)}s gap)`);
      }
    }
    this.lastReadingTimestamp = now;

    const inlet = Math.max(0, reading.inletFlow);
    const outlet = Math.max(0, reading.outletFlow);
    const flowDiff = inlet - outlet; // Positive means inlet > outlet

    // 3. Evaluate Reversed Mismatch: Outlet exceeds Inlet
    // Per requirements: MUST NOT declare leak when outlet > inlet.
    // Represents calibration error, branch feed, or accumulator tank discharge.
    if (outlet - inlet > thresholds.mismatchThreshold) {
      this.positiveMismatchStartTime = null; // Clear leak timer
      
      if (this.reversedMismatchStartTime === null) {
        this.reversedMismatchStartTime = now;
      }
      
      const durationSec = (now - this.reversedMismatchStartTime) / 1000;
      if (durationSec >= thresholds.persistenceDurationSec) {
        this.currentActiveIncident = 'SENSOR_ANOMALY';
        return {
          hasAlert: true,
          alertCandidate: {
            category: 'SENSOR_ANOMALY',
            severity: 'WARNING',
            title: 'Diagnostic: Outlet Exceeds Inlet Flow',
            explanation: `Downstream outlet (${outlet.toFixed(1)} L/min) is reading higher than upstream inlet (${inlet.toFixed(1)} L/min). This indicates sensor miscalibration, unmetered auxiliary inlet, or expansion tank release.`,
            durationSec: Math.round(durationSec),
          },
          diagnosticNotes: [
            'Outlet > Inlet mismatch detected.',
            'Inspect sensor calibration factors and reverse-flow check valves.',
          ],
          isRecovered: false,
        };
      } else {
        diagnosticNotes.push(`Reversed flow mismatch filtering (${durationSec.toFixed(1)}s / ${thresholds.persistenceDurationSec}s)`);
      }
    } else {
      this.reversedMismatchStartTime = null;
    }

    // 4. Evaluate Suspected Leak: Positive flow difference (Inlet > Outlet)
    // Positive mismatch sustained for persistence duration indicates water loss between sensors
    if (flowDiff >= thresholds.mismatchThreshold) {
      if (this.positiveMismatchStartTime === null) {
        this.positiveMismatchStartTime = now;
      }

      const durationSec = (now - this.positiveMismatchStartTime) / 1000;
      if (durationSec >= thresholds.persistenceDurationSec) {
        this.currentActiveIncident = 'SUSPECTED_LEAK';
        return {
          hasAlert: true,
          alertCandidate: {
            category: 'SUSPECTED_LEAK',
            severity: 'CRITICAL',
            title: 'Suspected Water Leakage Detected',
            explanation: `Inlet flow exceeds outlet flow by ${flowDiff.toFixed(1)} L/min continuously for ${Math.round(durationSec)}s. Possible pipe breach, burst joint, or unmetered fixture loss.`,
            durationSec: Math.round(durationSec),
          },
          diagnosticNotes: [
            `Flow deficit: +${flowDiff.toFixed(1)} L/min loss between metering points.`,
            'Dual-sensor mismatch indicates suspected loss, pending physical inspection.',
          ],
          isRecovered: false,
        };
      } else {
        diagnosticNotes.push(`Leak persistence filter active (${durationSec.toFixed(1)}s / ${thresholds.persistenceDurationSec}s)`);
      }
    } else {
      // Normal flow difference
      if (this.currentActiveIncident === 'SUSPECTED_LEAK') {
        isRecovered = true;
        recoveredCategory = 'SUSPECTED_LEAK';
        this.currentActiveIncident = null;
      }
      this.positiveMismatchStartTime = null;
    }

    // 5. Evaluate Abnormal High Consumption
    // Extreme total flow exceeding safe ceiling
    if (inlet >= thresholds.highConsumptionThreshold) {
      if (this.highConsumptionStartTime === null) {
        this.highConsumptionStartTime = now;
      }

      const durationSec = (now - this.highConsumptionStartTime) / 1000;
      if (durationSec >= thresholds.highConsumptionDurationSec) {
        this.currentActiveIncident = 'ABNORMAL_CONSUMPTION';
        return {
          hasAlert: true,
          alertCandidate: {
            category: 'ABNORMAL_CONSUMPTION',
            severity: 'WARNING',
            title: 'Abnormal High Consumption',
            explanation: `Water draw rate of ${inlet.toFixed(1)} L/min exceeds maximum threshold (${thresholds.highConsumptionThreshold} L/min) for ${Math.round(durationSec)}s. Check for stuck valves or open taps.`,
            durationSec: Math.round(durationSec),
          },
          diagnosticNotes: [`High demand: ${inlet.toFixed(1)} L/min sustained.`],
          isRecovered: false,
        };
      }
    } else {
      if (this.currentActiveIncident === 'ABNORMAL_CONSUMPTION') {
        isRecovered = true;
        recoveredCategory = 'ABNORMAL_CONSUMPTION';
        this.currentActiveIncident = null;
      }
      this.highConsumptionStartTime = null;
    }

    // 6. Evaluate Continuous Night-time Flow
    const currentHour = new Date(now).getHours();
    const isNightTime = thresholds.nightTimeStartHour > thresholds.nightTimeEndHour
      ? (currentHour >= thresholds.nightTimeStartHour || currentHour < thresholds.nightTimeEndHour)
      : (currentHour >= thresholds.nightTimeStartHour && currentHour < thresholds.nightTimeEndHour);

    if (isNightTime && inlet >= thresholds.nightTimeThreshold && outlet >= thresholds.nightTimeThreshold) {
      if (this.nightFlowStartTime === null) {
        this.nightFlowStartTime = now;
      }

      const durationSec = (now - this.nightFlowStartTime) / 1000;
      // Alert after persistence window during night
      if (durationSec >= thresholds.persistenceDurationSec * 1.5) {
        this.currentActiveIncident = 'NIGHT_FLOW';
        return {
          hasAlert: true,
          alertCandidate: {
            category: 'NIGHT_FLOW',
            severity: 'WARNING',
            title: 'Continuous Night-time Consumption',
            explanation: `Unbroken water flow (${inlet.toFixed(1)} L/min) detected during quiescent night hours (${thresholds.nightTimeStartHour}:00 - ${thresholds.nightTimeEndHour}:00). May indicate running toilet or irrigation leak.`,
            durationSec: Math.round(durationSec),
          },
          diagnosticNotes: ['Night flow exceeds quiescent baseline.'],
          isRecovered: false,
        };
      }
    } else {
      if (this.currentActiveIncident === 'NIGHT_FLOW') {
        isRecovered = true;
        recoveredCategory = 'NIGHT_FLOW';
        this.currentActiveIncident = null;
      }
      this.nightFlowStartTime = null;
    }

    // 7. Check if recovery just took place
    if (isRecovered) {
      return {
        hasAlert: true,
        alertCandidate: {
          category: 'RECOVERED',
          severity: 'INFO',
          title: 'System Conditions Returned to Normal',
          explanation: `Telemetry indicates flow mismatch and consumption rates have normalized. Previous incident (${recoveredCategory}) resolved.`,
          durationSec: 0,
        },
        diagnosticNotes: ['Flow stabilized within expected tolerances.'],
        isRecovered: true,
        recoveredCategory,
      };
    }

    // 8. System is in normal steady-state
    return {
      hasAlert: false,
      alertCandidate: null,
      diagnosticNotes,
      isRecovered: false,
    };
  }
}
