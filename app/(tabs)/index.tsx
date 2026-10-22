import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SPACING } from '../../src/constants/theme';
import { useSensor } from '../../src/context/SensorContext';
import { useMqtt } from '../../src/context/MqttContext';
import { PillSlider } from '../../src/components/PillSlider';
import { WaveformChart } from '../../src/components/WaveformChart';
import { formatFlow } from '../../src/utils/format';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const router = useRouter();
  const {
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
    setScenario,
    manualFlow,
    setMismatchThreshold,
    setNeedIntervals,
    resetDemo,
    activeScenario,
    dataSource,
  } = useSensor();

  const { status: mqttStatus } = useMqtt();

  const getStatusColor = () => {
    switch (statusState) {
      case 'leak':
        return COLORS.danger;
      case 'checking':
      case 'high':
      case 'datacheck':
        return COLORS.warningText;
      case 'normal':
      default:
        return COLORS.success;
    }
  };

  const getStatusTitle = () => {
    switch (statusState) {
      case 'leak':
        return 'POSSIBLE LEAK · persistent mismatch';
      case 'datacheck':
        return 'DATA CHECK · outlet exceeds inlet';
      case 'high':
        return 'HIGH CONSUMPTION · balanced flow';
      case 'checking':
        return 'CHECKING · mismatch detected';
      case 'normal':
      default:
        return 'NORMAL · monitoring';
    }
  };

  const progressPct = Math.min(100, Math.round((Math.min(suspicious, needIntervals) / needIntervals) * 100));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      {/* 1. Top Header Bar (Cardiology UI aesthetic) */}
      <View style={styles.topHeader}>
        <View style={styles.topHeaderLeft}>
          <View style={styles.brandCircle}>
            <Ionicons name="water-outline" size={16} color={COLORS.textPrimary} />
          </View>
          <View>
            <Text style={styles.eyebrow}>IoT • WATER DYNAMICS</Text>
            <Text style={styles.mainTitle}>Smart Water Leakage Detection</Text>
          </View>
        </View>

        <View style={styles.prototypePill}>
          <Text style={styles.prototypePillText}>DIGITAL PROTOTYPE · MOCK DATA</Text>
        </View>
      </View>

      {/* Prototype Disclosure Notice Banner */}
      <View style={styles.noticeBox}>
        <Ionicons name="information-circle-outline" size={16} color={COLORS.textPrimary} />
        <Text style={styles.noticeText}>
          <Text style={styles.bold}>Prototype disclosure: </Text>
          Readings on this page demonstrate dual-sensor comparison and persistence-filtered detection logic.
        </Text>
      </View>

      {/* 2. Top 4 Metric Cards Grid */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Inlet flow · S1</Text>
          <Text style={styles.kpiValue}>
            {formatFlow(inFlow)} <Text style={styles.kpiUnit}>L/min</Text>
          </Text>
          <Text style={styles.kpiSub}>Water entering section</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Outlet flow · S2</Text>
          <Text style={styles.kpiValue}>
            {formatFlow(outFlow)} <Text style={styles.kpiUnit}>L/min</Text>
          </Text>
          <Text style={styles.kpiSub}>Water leaving section</Text>
        </View>

        <View style={[styles.kpiCard, mismatch > mismatchThreshold && styles.kpiCardAlert]}>
          <Text style={styles.kpiLabel}>Volume mismatch</Text>
          <Text
            style={[
              styles.kpiValue,
              mismatch > mismatchThreshold && { color: COLORS.danger },
            ]}
          >
            {mismatch >= 0 ? '+' : ''}{mismatch.toFixed(2)} <Text style={styles.kpiUnit}>L</Text>
          </Text>
          <Text style={styles.kpiSub}>Inlet − Outlet deficit</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Monitoring time</Text>
          <Text style={styles.kpiValue}>
            {elapsed} <Text style={styles.kpiUnit}>sec</Text>
          </Text>
          <Text style={styles.kpiSub}>Simulated runtime</Text>
        </View>
      </View>

      {/* 3. Main Dashboard Panels: Scenario Controls & System Status */}
      <View style={styles.panelsContainer}>
        {/* Panel A: Scenario Controls */}
        <View style={styles.cardPanel}>
          <Text style={styles.panelTitle}>Scenario Controls</Text>

          {/* Scenario Buttons (Normal, Leak, High, Reset) */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.btn, activeScenario === 'normal' && styles.btnActive]}
              onPress={() => setScenario('normal')}
            >
              <Text style={[styles.btnText, activeScenario === 'normal' && styles.btnTextActive]}>
                Normal flow
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, activeScenario === 'suspected_leak' && styles.btnActive]}
              onPress={() => setScenario('suspected_leak')}
            >
              <Text style={[styles.btnText, activeScenario === 'suspected_leak' && styles.btnTextActive]}>
                Simulate leak
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, activeScenario === 'abnormal_consumption' && styles.btnActive]}
              onPress={() => setScenario('abnormal_consumption')}
            >
              <Text style={[styles.btnText, activeScenario === 'abnormal_consumption' && styles.btnTextActive]}>
                High draw
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnReset} onPress={resetDemo}>
              <Text style={styles.btnResetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* Interactive Flow Sliders */}
          <PillSlider
            label="Inlet flow (S1)"
            value={inFlow}
            min={0}
            max={15}
            step={0.5}
            unit="L/min"
            onChange={(val) => manualFlow(val, outFlow)}
            color={COLORS.darkCharcoal}
          />

          <PillSlider
            label="Outlet flow (S2)"
            value={outFlow}
            min={0}
            max={15}
            step={0.5}
            unit="L/min"
            onChange={(val) => manualFlow(inFlow, val)}
            color={COLORS.textSecondary}
          />

          <PillSlider
            label="Mismatch threshold"
            value={mismatchThreshold}
            min={0.2}
            max={3.0}
            step={0.1}
            unit="L"
            onChange={(val) => setMismatchThreshold(val)}
            color={COLORS.accentLimeDark}
          />

          <PillSlider
            label="Required suspicious intervals"
            value={needIntervals}
            min={1}
            max={6}
            step={1}
            unit="intervals"
            onChange={(val) => setNeedIntervals(val)}
            color={COLORS.darkCharcoal}
          />

          <Text style={styles.smallNote}>
            Each interval represents 10 simulated seconds. Use the scenario buttons for a repeatable demonstration, or adjust flows manually.
          </Text>

          {/* Cumulative Volumes (Mini boxes from prototype) */}
          <View style={styles.twoColMini}>
            <View style={styles.miniBox}>
              <Text style={styles.miniTag}>Inlet Volume</Text>
              <Text style={styles.miniValue}>{inVol.toFixed(2)} L</Text>
              <Text style={styles.miniSub}>Cumulative metered</Text>
            </View>

            <View style={styles.miniBox}>
              <Text style={styles.miniTag}>Outlet Volume</Text>
              <Text style={styles.miniValue}>{outVol.toFixed(2)} L</Text>
              <Text style={styles.miniSub}>Cumulative metered</Text>
            </View>
          </View>
        </View>

        {/* Panel B: System Status & Live History */}
        <View style={styles.cardPanel}>
          <Text style={styles.panelTitle}>System Status</Text>

          {/* Status Box */}
          <View style={styles.statusBox}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusTitle()}
            </Text>
          </View>
          <Text style={styles.statusDetail}>{statusDetail}</Text>

          {/* Suspicious Intervals Progress Bar */}
          <View style={styles.barLabelRow}>
            <Text style={styles.barLabel}>Suspicious intervals</Text>
            <Text style={styles.barCountText}>
              {Math.min(suspicious, needIntervals)} / {needIntervals}
            </Text>
          </View>

          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${progressPct}%`,
                  backgroundColor: progressPct >= 100 ? COLORS.danger : COLORS.accentLimeDark,
                },
              ]}
            />
          </View>

          {/* Layered Medical Waveform Chart */}
          <View style={styles.chartWrap}>
            <Text style={styles.chartTitle}>Recent Flow Telemetry</Text>
            <WaveformChart
              title="Dual-Sensor Stream"
              currentValue={inFlow}
              averageValue={outFlow}
              deltaValue={inFlow - outFlow}
              isAlert={statusState === 'leak'}
            />
          </View>

          {/* Event Log */}
          <Text style={styles.eventsHeading}>Event Log</Text>
          <View style={styles.eventListBox}>
            {events.map((ev) => (
              <View key={ev.id} style={styles.eventRow}>
                <Text style={styles.eventTime}>{ev.t}</Text>
                <Text style={styles.eventMsg}>{ev.message}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Engineering Note at Bottom */}
      <View style={styles.footNote}>
        <Text style={styles.footNoteText}>
          <Text style={styles.bold}>Engineering note: </Text>
          A persistent mismatch suggests possible water loss only if both sensors are calibrated, measurements are time-aligned, and there are no unmeasured branches or storage tanks between them. Reversed mismatch is treated as a sensor/calibration check, not a pipe breach.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.canvasBg, // Soft warm stone/putty grey
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 80,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  prototypePill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  prototypePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  noticeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 15,
  },
  bold: {
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  // 4 KPI Cards Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%' as any,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  kpiCardAlert: {
    borderColor: COLORS.danger,
    backgroundColor: '#FFF8F8',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginVertical: 4,
  },
  kpiUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  kpiSub: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  // 2-Column or Stacked Panels
  panelsContainer: {
    gap: 12,
  },
  cardPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  panelTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  controlsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: COLORS.cardSubtle,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  btnActive: {
    backgroundColor: COLORS.darkCharcoal,
  },
  btnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  btnTextActive: {
    color: '#FFFFFF',
  },
  btnReset: {
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
  },
  btnResetText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  smallNote: {
    fontSize: 10,
    color: COLORS.textSecondary,
    lineHeight: 14,
    marginTop: 6,
    marginBottom: 12,
  },
  twoColMini: {
    flexDirection: 'row',
    gap: 8,
  },
  miniBox: {
    flex: 1,
    backgroundColor: COLORS.cardSubtle,
    borderRadius: RADIUS.md,
    padding: 10,
  },
  miniTag: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  miniValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginVertical: 2,
  },
  miniSub: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  // Status Box
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '800',
  },
  statusDetail: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  barCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  barTrack: {
    height: 8,
    backgroundColor: COLORS.cardSubtle,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  chartWrap: {
    alignItems: 'center',
    marginVertical: 6,
  },
  chartTitle: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  eventsHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 10,
    marginBottom: 6,
  },
  eventListBox: {
    backgroundColor: COLORS.cardSubtle,
    borderRadius: RADIUS.md,
    padding: 10,
    maxHeight: 140,
  },
  eventRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  eventTime: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '700',
    width: 50,
  },
  eventMsg: {
    fontSize: 10,
    color: COLORS.textPrimary,
    flex: 1,
  },
  footNote: {
    marginTop: 14,
    paddingHorizontal: 4,
  },
  footNoteText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },
});
