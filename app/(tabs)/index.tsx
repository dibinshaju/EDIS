import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../src/constants/theme';
import { useSensor } from '../../src/context/SensorContext';
import { PillSlider } from '../../src/components/PillSlider';
import { WaveformChart } from '../../src/components/WaveformChart';
import { formatFlow } from '../../src/utils/format';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
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
    events,
    setScenario,
    manualFlow,
    resetDemo,
    activeScenario,
  } = useSensor();

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
        return 'POSSIBLE LEAK';
      case 'datacheck':
        return 'DATA CHECK';
      case 'high':
        return 'HIGH DRAW';
      case 'checking':
        return 'CHECKING';
      case 'normal':
      default:
        return 'NORMAL';
    }
  };

  const progressPct = Math.min(
    100,
    Math.round((Math.min(suspicious, needIntervals) / needIntervals) * 100)
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      {/* 1. Top Editorial Header (Matching uploaded graphic) */}
      <View style={styles.header}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Telemetry Monitor</Text>
          <View style={styles.indexPill}>
            <Text style={styles.indexPillText}>01 of 04</Text>
          </View>
        </View>

        {/* Category Capsule Tag */}
        <View style={styles.tagPill}>
          <Text style={styles.tagPillText}>Resources</Text>
        </View>

        {/* Hero Title with Graphic Orange Accent */}
        <View style={styles.heroTitleWrap}>
          <Text style={styles.heroTitlePrimary}>Smart Water</Text>
          <Text style={styles.heroTitlePrimary}>
            Flow & <Text style={styles.heroTitleAccent}>Leak Alert</Text>
          </Text>
        </View>
      </View>

      {/* 2. Top 4 Essential KPI Cards */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Inlet S1</Text>
          <Text style={styles.kpiValue}>
            {formatFlow(inFlow)} <Text style={styles.kpiUnit}>L/m</Text>
          </Text>
          <Text style={styles.kpiSub}>Municipal intake</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Outlet S2</Text>
          <Text style={styles.kpiValue}>
            {formatFlow(outFlow)} <Text style={styles.kpiUnit}>L/m</Text>
          </Text>
          <Text style={styles.kpiSub}>Distribution line</Text>
        </View>

        <View style={[styles.kpiCard, mismatch > mismatchThreshold && styles.kpiCardAlert]}>
          <Text style={styles.kpiLabel}>Mismatch</Text>
          <Text
            style={[
              styles.kpiValue,
              mismatch > mismatchThreshold && { color: COLORS.danger },
            ]}
          >
            {mismatch >= 0 ? '+' : ''}{mismatch.toFixed(2)} <Text style={styles.kpiUnit}>L</Text>
          </Text>
          <Text style={styles.kpiSub}>Deficit loss</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Runtime</Text>
          <Text style={styles.kpiValue}>
            {elapsed} <Text style={styles.kpiUnit}>s</Text>
          </Text>
          <Text style={styles.kpiSub}>Active session</Text>
        </View>
      </View>

      {/* 3. Essential Scenario Triggers */}
      <View style={styles.cardPanel}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.sectionTitle}>Simulate Scenarios</Text>
          <TouchableOpacity style={styles.resetBtn} onPress={resetDemo}>
            <Ionicons name="refresh" size={12} color={COLORS.textSecondary} />
            <Text style={styles.resetBtnText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scenarioPillsRow}>
          <TouchableOpacity
            style={[styles.scenarioPill, activeScenario === 'normal' && styles.scenarioPillActive]}
            onPress={() => setScenario('normal')}
          >
            <Text
              style={[
                styles.scenarioPillText,
                activeScenario === 'normal' && styles.scenarioPillTextActive,
              ]}
            >
              Normal
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.scenarioPill,
              activeScenario === 'suspected_leak' && styles.scenarioPillActiveAlert,
            ]}
            onPress={() => setScenario('suspected_leak')}
          >
            <Text
              style={[
                styles.scenarioPillText,
                activeScenario === 'suspected_leak' && styles.scenarioPillTextActive,
              ]}
            >
              Simulate Leak
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.scenarioPill,
              activeScenario === 'abnormal_consumption' && styles.scenarioPillActive,
            ]}
            onPress={() => setScenario('abnormal_consumption')}
          >
            <Text
              style={[
                styles.scenarioPillText,
                activeScenario === 'abnormal_consumption' && styles.scenarioPillTextActive,
              ]}
            >
              High Draw
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sliders: Essential Controls Only */}
        <PillSlider
          label="Inlet Flow S1"
          value={inFlow}
          min={0}
          max={15}
          step={0.5}
          unit="L/min"
          onChange={(val) => manualFlow(val, outFlow)}
          color={COLORS.darkCharcoal}
        />

        <PillSlider
          label="Outlet Flow S2"
          value={outFlow}
          min={0}
          max={15}
          step={0.5}
          unit="L/min"
          onChange={(val) => manualFlow(inFlow, val)}
          color={COLORS.textSecondary}
        />

        {/* Cumulative Volume Meter */}
        <View style={styles.volRow}>
          <View style={styles.volBox}>
            <Text style={styles.volLabel}>Inlet Volume</Text>
            <Text style={styles.volValue}>{inVol.toFixed(2)} L</Text>
          </View>
          <View style={styles.volBox}>
            <Text style={styles.volLabel}>Outlet Volume</Text>
            <Text style={styles.volValue}>{outVol.toFixed(2)} L</Text>
          </View>
        </View>
      </View>

      {/* 4. Status & Diagnostic Verification */}
      <View style={styles.cardPanel}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.sectionTitle}>System Status</Text>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.statusPillText, { color: getStatusColor() }]}>
              {getStatusTitle()}
            </Text>
          </View>
        </View>

        {/* Suspicious Intervals Progress */}
        <View style={styles.barLabelRow}>
          <Text style={styles.barLabel}>Persistence Intervals</Text>
          <Text style={styles.barCount}>
            {Math.min(suspicious, needIntervals)} / {needIntervals}
          </Text>
        </View>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                width: `${progressPct}%`,
                backgroundColor: progressPct >= 100 ? COLORS.danger : COLORS.accentOrange,
              },
            ]}
          />
        </View>

        {/* Waveform Chart */}
        <View style={styles.chartContainer}>
          <WaveformChart
            title="Flow Telemetry Stream"
            currentValue={inFlow}
            averageValue={outFlow}
            deltaValue={inFlow - outFlow}
            isAlert={statusState === 'leak'}
          />
        </View>

        {/* Live Event Feed (Latest 3 events only, crisp and short) */}
        <Text style={styles.feedTitle}>Recent Log</Text>
        <View style={styles.feedBox}>
          {events.slice(0, 3).map((ev) => (
            <View key={ev.id} style={styles.feedRow}>
              <Text style={styles.feedTime}>{ev.t}</Text>
              <Text style={styles.feedMsg} numberOfLines={1}>
                {ev.message}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.canvasBg,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  header: {
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 0.2,
  },
  indexPill: {
    backgroundColor: '#E2DFD8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  indexPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  tagPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E2DFD8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    marginBottom: 10,
  },
  tagPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  heroTitleWrap: {
    marginTop: 2,
    marginBottom: 4,
  },
  heroTitlePrimary: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111215',
    lineHeight: 36,
    letterSpacing: -1.2,
  },
  heroTitleAccent: {
    color: COLORS.accentOrange,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  kpiCardAlert: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FECACA',
    borderWidth: 1,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111215',
    letterSpacing: -0.8,
  },
  kpiUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  kpiSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  cardPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111215',
    letterSpacing: -0.3,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F2EC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  resetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  scenarioPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  scenarioPill: {
    flex: 1,
    backgroundColor: '#F3F2EC',
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  scenarioPillActive: {
    backgroundColor: COLORS.darkCharcoal,
  },
  scenarioPillActiveAlert: {
    backgroundColor: COLORS.danger,
  },
  scenarioPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scenarioPillTextActive: {
    color: '#FFFFFF',
  },
  volRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  volBox: {
    flex: 1,
    backgroundColor: '#F8F7F4',
    padding: 10,
    borderRadius: RADIUS.md,
  },
  volLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  volValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111215',
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F4EE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    marginTop: 4,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  barCount: {
    fontSize: 11,
    fontWeight: '800',
    color: '#111215',
  },
  barTrack: {
    height: 6,
    backgroundColor: '#ECEAE4',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  chartContainer: {
    marginTop: 4,
    marginBottom: 12,
  },
  feedTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  feedBox: {
    backgroundColor: '#F8F7F4',
    borderRadius: RADIUS.md,
    padding: 8,
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#EDEBE4',
  },
  feedTime: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accentOrange,
    minWidth: 42,
  },
  feedMsg: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
});
