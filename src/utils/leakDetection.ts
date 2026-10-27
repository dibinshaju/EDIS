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
   * Get current active incident category
   */
  public getActiveIncident(): AlertCategory | null {
    return this.currentActiveIncident;
  }

  /**
   * Helper to determine if a timestamp or explicit override falls within night window.
   * Accurately supports midnight rollover (e.g. 23:00 to 05:00) as well as same-day windows.
   */
  public isNightWindow(
    now: number,
    startHour: number,
    endHour: number,
    override?: boolean
  ): boolean {
    if (override !== undefined) {
      return override;
    }
    const currentHour = new Date(now).getHours();
    if (startHour > endHour) {
      // Midnight crossing: e.g. 23:00 to 05:00 -> hour >= 23 OR hour < 5
      return currentHour >= startHour || currentHour < endHour;
    } else if (startHour < endHour) {
      // Same day window: e.g. 01:00 to 05:00 -> hour >= 1 AND hour < 5
      return currentHour >= startHour && currentHour < endHour;
    } else {
      // Degenerate case: start == end (0-hour window)
      return false;
    }
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

    // 1. Validate reading integrity and numerical sanity
    const hasValidNumbers =
      typeof reading.inletFlow === 'number' &&
      typeof reading.outletFlow === 'number' &&
      isFinite(reading.inletFlow) &&
      isFinite(reading.outletFlow) &&
      !isNaN(reading.inletFlow) &&
      !isNaN(reading.outletFlow);

    const hasNonNegativeFlows = reading.inletFlow >= 0 && reading.outletFlow >= 0;

    if (!reading.isValid || !hasValidNumbers || !hasNonNegativeFlows) {
      this.positiveMismatchStartTime = null;
      this.reversedMismatchStartTime = null;
      this.highConsumptionStartTime = null;
      this.nightFlowStartTime = null;

      const faultReason = !hasValidNumbers
        ? 'Corrupt or non-numeric/infinite sensor reading received from telemetry interface.'
        : !hasNonNegativeFlows
        ? 'Negative flow reading detected (possible sensor reverse-polarity or hardware wiring fault).'
        : 'Telemetry packet flagged as invalid by device firmware.';

      return {
        hasAlert: true,
        alertCandidate: {
          category: 'SENSOR_ANOMALY',
          severity: 'WARNING',
          title: 'Sensor Reading Invalid',
          explanation: faultReason,
          durationSec: 0,
        },
        diagnosticNotes: ['Invalid payload: inspect sensor wiring, ADC ground, or telemetry parser.'],
        isRecovered: false,
        state: 'datacheck',
        activeCategory: 'SENSOR_ANOMALY',
      };
    }

    // 2. Check for stale data / timing gap if we have a previous reading
    if (this.lastReadingTimestamp !== null) {
      const timeDeltaSec = (now - this.lastReadingTimestamp) / 1000;
      if (timeDeltaSec > thresholds.sensorTimeoutSec) {
        diagnosticNotes.push(`Data transmission delay detected (${timeDeltaSec.toFixed(1)}s gap, timeout: ${thresholds.sensorTimeoutSec}s)`);
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
        diagnosticNotes.push(
          'Outlet > Inlet mismatch detected.',
          'Inspect sensor calibration factors, check-valves, and unmetered auxiliary feeds.'
        );
        return {
          hasAlert: true,
          alertCandidate: {
            category: 'SENSOR_ANOMALY',
            severity: 'WARNING',
            title: 'Diagnostic: Outlet Exceeds Inlet Flow',
            explanation: `Downstream outlet (${outlet.toFixed(1)} L/min) is reading higher than upstream inlet (${inlet.toFixed(1)} L/min) by ${(outlet - inlet).toFixed(1)} L/min. This indicates sensor miscalibration, unmetered auxiliary inlet, or expansion tank release — NOT a pipe leak.`,
            durationSec: Math.round(durationSec),
          },
          diagnosticNotes,
          isRecovered: false,
          state: 'datacheck',
          activeCategory: 'SENSOR_ANOMALY',
        };
      } else {
        diagnosticNotes.push(`Reversed flow mismatch filtering (${durationSec.toFixed(1)}s / ${thresholds.persistenceDurationSec}s)`);
        return {
          hasAlert: false,
          alertCandidate: null,
          diagnosticNotes,
          isRecovered: false,
          state: 'checking',
          activeCategory: this.currentActiveIncident,
        };
      }
    } else {
      if (this.currentActiveIncident === 'SENSOR_ANOMALY') {
        isRecovered = true;
        recoveredCategory = 'SENSOR_ANOMALY';
        this.currentActiveIncident = null;
      }
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
        diagnosticNotes.push(
          `Flow deficit: +${flowDiff.toFixed(1)} L/min loss between metering points.`,
          'Dual-sensor mismatch indicates suspected loss, pending physical inspection.'
        );
        return {
          hasAlert: true,
          alertCandidate: {
            category: 'SUSPECTED_LEAK',
            severity: 'CRITICAL',
            title: 'Suspected Water Leakage Detected',
            explanation: `Inlet flow exceeds outlet flow by ${flowDiff.toFixed(1)} L/min continuously for ${Math.round(durationSec)}s. Possible pipe breach, burst joint, or unmetered fixture loss between monitoring points.`,
            durationSec: Math.round(durationSec),
          },
          diagnosticNotes,
          isRecovered: false,
          state: 'leak',
          activeCategory: 'SUSPECTED_LEAK',
        };
      } else {
        diagnosticNotes.push(`Leak persistence filter active (${durationSec.toFixed(1)}s / ${thresholds.persistenceDurationSec}s)`);
        return {
          hasAlert: false,
          alertCandidate: null,
          diagnosticNotes,
          isRecovered: false,
          state: 'checking',
          activeCategory: this.currentActiveIncident,
        };
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
        diagnosticNotes.push(`High demand: ${inlet.toFixed(1)} L/min sustained with balanced metering.`);
        return {
          hasAlert: true,
          alertCandidate: {
            category: 'ABNORMAL_CONSUMPTION',
            severity: 'WARNING',
            title: 'Abnormal High Consumption',
            explanation: `Water draw rate of ${inlet.toFixed(1)} L/min exceeds maximum threshold (${thresholds.highConsumptionThreshold.toFixed(1)} L/min) for ${Math.round(durationSec)}s. Meters remain balanced; check for stuck commercial valves or open taps.`,
            durationSec: Math.round(durationSec),
          },
          diagnosticNotes,
          isRecovered: false,
          state: 'high',
          activeCategory: 'ABNORMAL_CONSUMPTION',
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
    const isNightTime = this.isNightWindow(
      now,
      thresholds.nightTimeStartHour,
      thresholds.nightTimeEndHour,
      reading.isNightTimeOverride
    );

    if (isNightTime && inlet >= thresholds.nightTimeThreshold && outlet >= thresholds.nightTimeThreshold) {
      if (this.nightFlowStartTime === null) {
        this.nightFlowStartTime = now;
      }

      const durationSec = (now - this.nightFlowStartTime) / 1000;
      // Alert after persistence window during night
      if (durationSec >= thresholds.persistenceDurationSec * 1.5) {
        this.currentActiveIncident = 'NIGHT_FLOW';
        diagnosticNotes.push('Night flow exceeds quiescent baseline.');
        return {
          hasAlert: true,
          alertCandidate: {
            category: 'NIGHT_FLOW',
            severity: 'WARNING',
            title: 'Continuous Night-time Consumption',
            explanation: `Unbroken water flow (${inlet.toFixed(1)} L/min) detected during quiescent night hours (${thresholds.nightTimeStartHour}:00 - ${thresholds.nightTimeEndHour}:00). May indicate running toilet, irrigation leak, or dripping fixtures.`,
            durationSec: Math.round(durationSec),
          },
          diagnosticNotes,
          isRecovered: false,
          state: 'high',
          activeCategory: 'NIGHT_FLOW',
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
      diagnosticNotes.push('Flow stabilized within expected tolerances.');
      return {
        hasAlert: true,
        alertCandidate: {
          category: 'RECOVERED',
          severity: 'INFO',
          title: 'System Conditions Returned to Normal',
          explanation: `Telemetry indicates flow mismatch and consumption rates have normalized. Previous incident (${recoveredCategory}) resolved.`,
          durationSec: 0,
        },
        diagnosticNotes,
        isRecovered: true,
        recoveredCategory,
        state: 'normal',
        activeCategory: null,
      };
    }

    // 8. System is in normal steady-state
    return {
      hasAlert: false,
      alertCandidate: null,
      diagnosticNotes,
      isRecovered: false,
      state: 'normal',
      activeCategory: null,
    };
  }
}
