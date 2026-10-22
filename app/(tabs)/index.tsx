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
import { useAlerts } from '../../src/context/AlertContext';
import { FlowGauge } from '../../src/components/FlowGauge';
import { FlowChart } from '../../src/components/FlowChart';
import { StatCard } from '../../src/components/StatCard';
import { StatusDot } from '../../src/components/StatusDot';
import { DemoBadge } from '../../src/components/DemoBadge';
import { AlertBanner } from '../../src/components/AlertBanner';
import { formatFlow, formatVolume } from '../../src/utils/format';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const router = useRouter();
  const { currentReading, history, totalVolumeLiters, isSimulated, activeScenario, setScenario, dataSource } = useSensor();
  const { status: mqttStatus } = useMqtt();
  const { diagnosticNotes, activeAlert } = useAlerts();

  const isLeak = activeAlert?.category === 'SUSPECTED_LEAK';
  const flowDiff = currentReading.flowDifference;

  return (
    <View style={styles.screen}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <Ionicons name="water" size={22} color={COLORS.tealPrimary} />
            <Text style={styles.appTitle}>Smart Water Monitor</Text>
          </View>
          <Text style={styles.appSubtitle}>Dual-Sensor IoT Leakage Detection</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.connectionBadge}
            onPress={() => router.push('/wokwi-guide')}
          >
            <StatusDot status={mqttStatus} size={8} />
            <Text style={styles.connectionText}>
              {mqttStatus === 'connected' ? 'Wokwi Live' : 'Demo Sim'}
            </Text>
            <Ionicons name="information-circle-outline" size={13} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Alert Banner */}
        <AlertBanner />

        {/* Mode / Demo Ticker */}
        <View style={styles.demoTickerRow}>
          <DemoBadge isSimulated={isSimulated} label={isSimulated ? 'DEMO SIMULATION' : 'WOKWI HARDWARE STREAM'} />
          <TouchableOpacity
            style={styles.scenarioPill}
            onPress={() => router.push('/(tabs)/scenarios')}
          >
            <Text style={styles.scenarioPillText}>
              Scenario: <Text style={styles.scenarioPillBold}>{activeScenario.toUpperCase()}</Text>
            </Text>
            <Ionicons name="chevron-forward" size={12} color={COLORS.tealPrimary} />
          </TouchableOpacity>
        </View>

        {/* Dual Flow Gauges */}
        <View style={styles.gaugeRow}>
          <FlowGauge
            label="Inlet Sensor (S1)"
            flowValue={currentReading.inletFlow}
            color={COLORS.tealPrimary}
            subtitle="Main municipal inflow"
          />
          <FlowGauge
            label="Outlet Sensor (S2)"
            flowValue={currentReading.outletFlow}
            color="#84CC16"
            subtitle="Distribution downstream"
          />
        </View>

        {/* Key Metrics Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Flow Mismatch"
            value={`${flowDiff >= 0 ? '+' : ''}${formatFlow(flowDiff)}`}
            unit="L/min"
            subtitle={
              flowDiff > 1.5
                ? 'Possible deficit between sensors'
                : flowDiff < -1.5
                ? 'Outlet > Inlet (Calibration check)'
                : 'Balanced flow within tolerance'
            }
            iconName="git-compare-outline"
            iconColor={isLeak ? COLORS.danger : COLORS.tealPrimary}
            accentColor={isLeak ? COLORS.danger : undefined}
            isWarning={isLeak}
          />
          <StatCard
            title="Total Volume"
            value={formatVolume(totalVolumeLiters)}
            subtitle="Cumulative water drawn"
            iconName="bar-chart-outline"
            iconColor="#3B82F6"
          />
        </View>

        {/* Real-Time Dual Sensor Telemetry Line Chart */}
        <View style={styles.chartSection}>
          <FlowChart data={history} height={170} />
        </View>

        {/* Diagnostics & Sensor Health Card */}
        <View style={styles.diagnosticsCard}>
          <View style={styles.diagHeader}>
            <View style={styles.diagTitleRow}>
              <Ionicons name="hardware-chip-outline" size={16} color={COLORS.textDark} />
              <Text style={styles.diagTitle}>Telemetry & Diagnostic Stream</Text>
            </View>
            <View style={styles.devicePill}>
              <Text style={styles.devicePillText}>{currentReading.deviceId}</Text>
            </View>
          </View>

          <View style={styles.diagBody}>
            <View style={styles.diagRow}>
              <Text style={styles.diagLabel}>Telemetry Source:</Text>
              <Text style={styles.diagValue}>
                {dataSource === 'wokwi' && mqttStatus === 'connected'
                  ? 'Virtual ESP32 via MQTT'
                  : 'Deterministic Academic Simulator'}
              </Text>
            </View>
            <View style={styles.diagRow}>
              <Text style={styles.diagLabel}>Sensor Readings Valid:</Text>
              <Text style={[styles.diagValue, { color: currentReading.isValid ? COLORS.success : COLORS.danger }]}>
                {currentReading.isValid ? 'YES (Numeric OK)' : 'NO (Stale / Corrupt)'}
              </Text>
            </View>
            <View style={styles.diagRow}>
              <Text style={styles.diagLabel}>Pipeline Notes:</Text>
              <Text style={styles.diagValue} numberOfLines={1}>
                {currentReading.notes || 'Normal steady state'}
              </Text>
            </View>
          </View>

          {diagnosticNotes.length > 0 && (
            <View style={styles.activeNotesBox}>
              <Ionicons name="information-circle" size={14} color={COLORS.info} />
              <Text style={styles.activeNotesText}>{diagnosticNotes[0]}</Text>
            </View>
          )}
        </View>

        {/* Quick Demo Scenarios Shortcut Bar */}
        <View style={styles.quickBar}>
          <Text style={styles.quickBarTitle}>Quick Expo Test Actions:</Text>
          <View style={styles.quickButtons}>
            <TouchableOpacity
              style={[styles.quickBtn, activeScenario === 'normal' && styles.quickBtnActive]}
              onPress={() => setScenario('normal')}
            >
              <Text style={styles.quickBtnText}>Normal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickBtn, styles.quickBtnDanger, activeScenario === 'suspected_leak' && styles.quickBtnDangerActive]}
              onPress={() => setScenario('suspected_leak')}
            >
              <Text style={[styles.quickBtnText, { color: COLORS.dangerText }]}>Leak Demo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickBtn, styles.quickBtnWarning, activeScenario === 'abnormal_consumption' && styles.quickBtnWarningActive]}
              onPress={() => setScenario('abnormal_consumption')}
            >
              <Text style={[styles.quickBtnText, { color: COLORS.warningText }]}>High Draw</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickBtn, styles.quickBtnSuccess]}
              onPress={() => setScenario('recovery')}
            >
              <Text style={[styles.quickBtnText, { color: COLORS.successText }]}>Recover</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.navyDark,
  },
  appSubtitle: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.bgLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  connectionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: SPACING.md,
  },
  demoTickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  scenarioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  scenarioPillText: {
    fontSize: 10,
    color: COLORS.navyDark,
  },
  scenarioPillBold: {
    fontWeight: '800',
    color: COLORS.tealDark,
  },
  gaugeRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  chartSection: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  diagnosticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  diagHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  diagTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  diagTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  devicePill: {
    backgroundColor: COLORS.bgLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  devicePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  diagBody: {
    gap: 4,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  diagLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  diagValue: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  activeNotesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.infoBg,
    padding: 8,
    borderRadius: RADIUS.sm,
    marginTop: 8,
  },
  activeNotesText: {
    fontSize: 11,
    color: COLORS.infoText,
    flex: 1,
  },
  quickBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  quickBarTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  quickButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickBtnActive: {
    borderColor: COLORS.tealPrimary,
    backgroundColor: '#E0F2FE',
  },
  quickBtnDanger: {
    backgroundColor: COLORS.dangerBg,
    borderColor: '#FECACA',
  },
  quickBtnDangerActive: {
    borderColor: COLORS.danger,
    borderWidth: 1.5,
  },
  quickBtnWarning: {
    backgroundColor: COLORS.warningBg,
    borderColor: '#FDE68A',
  },
  quickBtnWarningActive: {
    borderColor: COLORS.warning,
    borderWidth: 1.5,
  },
  quickBtnSuccess: {
    backgroundColor: COLORS.successBg,
    borderColor: '#A7F3D0',
  },
  quickBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textDark,
  },
});
