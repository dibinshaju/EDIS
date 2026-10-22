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
import { WaveformChart } from '../../src/components/WaveformChart';
import { TimelineBranch } from '../../src/components/TimelineBranch';
import { AlertBanner } from '../../src/components/AlertBanner';
import { formatFlow } from '../../src/utils/format';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const router = useRouter();
  const { currentReading, activeScenario, setScenario, dataSource } = useSensor();
  const { status: mqttStatus } = useMqtt();
  const { activeAlert } = useAlerts();

  const isLeak = activeAlert?.category === 'SUSPECTED_LEAK';
  const flowDiff = currentReading.flowDifference;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      {/* 1. Header Bar matching "Cardiology" top contour */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.closeCircle}>
            <Ionicons name="close" size={16} color={COLORS.textPrimary} />
          </View>
          <Text style={styles.brandTitle}>Telemetry Dynamics</Text>
        </View>

        {/* Horizontal Navigation Pills (from top right of photo) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topPillsScroll}
        >
          <TouchableOpacity style={[styles.topPill, styles.topPillActive]}>
            <Ionicons name="search" size={12} color={COLORS.textPrimary} />
            <Text style={styles.topPillTextActive}>Flow Dynamics</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.topPill}
            onPress={() => router.push('/(tabs)/history')}
          >
            <Ionicons name="document-text-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.topPillText}>Readings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.topPill}
            onPress={() => router.push('/(tabs)/scenarios')}
          >
            <Ionicons name="git-branch-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.topPillText}>Sensors</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.topPill}
            onPress={() => router.push('/wokwi-guide')}
          >
            <Ionicons name="hardware-chip-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.topPillText}>Wokwi ESP32</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.topPill}
            onPress={() => router.push('/(tabs)/admin')}
          >
            <Ionicons name="settings-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.topPillText}>Config</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Active Alert Notification Banner if active */}
      <AlertBanner />

      {/* 2. Top Summary Card (Matching the huge white rounded card in photo) */}
      <View style={styles.mainSummaryCard}>
        <View style={styles.summaryTopRow}>
          {/* Station Avatar Box (left side of photo) */}
          <View style={styles.stationAvatarBox}>
            <View style={styles.avatarIconCircle}>
              <Ionicons name="business-outline" size={20} color={COLORS.textPrimary} />
            </View>
            <View style={styles.avatarTextCol}>
              <Text style={styles.avatarSub}>Node 01</Text>
              <Text style={styles.avatarName}>Primary Intake</Text>
            </View>
          </View>

          {/* Metric Columns (Diagnosis, Heart Rate, Pressure in photo) */}
          <View style={styles.metricColumnsWrap}>
            <View style={styles.metricCol}>
              <Text style={styles.metricColLabel}>System State</Text>
              <Text
                style={[
                  styles.metricColValueLarge,
                  isLeak && { color: COLORS.danger },
                ]}
              >
                {isLeak ? 'Suspected Leak' : activeScenario === 'abnormal_consumption' ? 'High Demand' : 'Normal Flow'}
              </Text>
            </View>

            <View style={styles.metricCol}>
              <Text style={styles.metricColLabel}>Inlet (S1)</Text>
              <Text style={styles.metricColValue}>
                {formatFlow(currentReading.inletFlow)} <Text style={styles.metricUnit}>L/m</Text>
              </Text>
            </View>

            <View style={styles.metricCol}>
              <Text style={styles.metricColLabel}>Outlet (S2)</Text>
              <Text style={styles.metricColValue}>
                {formatFlow(currentReading.outletFlow)} <Text style={styles.metricUnit}>L/m</Text>
              </Text>
            </View>

            <View style={styles.metricCol}>
              <Text style={styles.metricColLabel}>Deficit</Text>
              <Text
                style={[
                  styles.metricColValue,
                  flowDiff > 1.5 && { color: COLORS.danger },
                ]}
              >
                {flowDiff >= 0 ? '+' : ''}{formatFlow(flowDiff)} <Text style={styles.metricUnit}>L/m</Text>
              </Text>
            </View>

            <View style={styles.metricCol}>
              <Text style={styles.metricColLabel}>Pressure</Text>
              <Text style={styles.metricColValue}>
                4.2 <Text style={styles.metricUnit}>bar</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Sub-Pills Filter Row (bottom of top card in photo) */}
        <View style={styles.summaryBottomRow}>
          <View style={styles.gridIconCircle}>
            <Ionicons name="grid-outline" size={14} color={COLORS.textSecondary} />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subPillsScroll}>
            <TouchableOpacity style={[styles.subPill, styles.subPillActive]}>
              <Text style={styles.subPillTextActive}>All Meters</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.subPill} onPress={() => setScenario('normal')}>
              <Text style={styles.subPillText}>Normal Steady</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.subPill} onPress={() => setScenario('suspected_leak')}>
              <Text style={styles.subPillText}>Leak Incident</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.subPill} onPress={() => setScenario('abnormal_consumption')}>
              <Text style={styles.subPillText}>High Draw</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.subPill} onPress={() => setScenario('sensor_anomaly')}>
              <Text style={styles.subPillText}>Reversed Check</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.subPill} onPress={() => setScenario('recovery')}>
              <Text style={styles.subPillText}>Recovery</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* 3. Horizontal Timeline Canvas with Branching Nodes (from middle of photo) */}
      <View style={styles.timelineSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timelineScroll}>
          {/* Branch 1: Inflow Telemetry */}
          <View style={styles.timelineColumn}>
            <TimelineBranch
              monthOrLabel="Intake Pipeline"
              sublabel="Telemetry Block 1"
              inletFlow={currentReading.inletFlow}
              outletFlow={currentReading.outletFlow}
            />

            {/* Waveform Card 1 (Blood Pressure style from image) */}
            <View style={styles.waveCardWrap}>
              <WaveformChart
                title="Inlet Flow Waveform"
                currentValue={currentReading.inletFlow}
                averageValue={12.4}
                deltaValue={flowDiff}
                isAlert={isLeak}
              />
            </View>
          </View>

          {/* Branch 2: Distribution Outflow */}
          <View style={styles.timelineColumn}>
            <TimelineBranch
              monthOrLabel="Distribution"
              sublabel="Telemetry Block 2"
              inletFlow={currentReading.inletFlow}
              outletFlow={currentReading.outletFlow}
            />

            {/* Waveform Card 2 (Blood Pressure style from image) */}
            <View style={styles.waveCardWrap}>
              <WaveformChart
                title="Outlet Flow Waveform"
                currentValue={currentReading.outletFlow}
                averageValue={12.1}
                deltaValue={-flowDiff}
              />
            </View>
          </View>

          {/* Branch 3: Pipeline Diagnostic Card (Symptoms style from image) */}
          <View style={styles.timelineColumn}>
            <View style={styles.nodeHeaderSimple}>
              <View style={styles.yellowCircleNode}>
                <Ionicons name="pulse-outline" size={14} color={COLORS.darkCharcoal} />
              </View>
              <View style={styles.axisLine} />
            </View>

            <View style={styles.diagnosticCard}>
              <View style={styles.diagHeader}>
                <Text style={styles.diagTitle}>Pipeline State Analysis</Text>
                <View style={[styles.statusDot, { backgroundColor: isLeak ? COLORS.danger : COLORS.success }]} />
              </View>

              <Text style={styles.diagBody}>
                {isLeak
                  ? 'Sustained positive deficit observed. Possible pipe breach or unmetered fixture loss.'
                  : 'Flow velocity and volumetric balance within certified operational boundaries.'}
              </Text>

              <View style={styles.diagMetaRow}>
                <Text style={styles.diagMetaLabel}>Source Mode</Text>
                <Text style={styles.diagMetaVal}>
                  {dataSource === 'wokwi' && mqttStatus === 'connected' ? 'Wokwi ESP32' : 'Deterministic Demo'}
                </Text>
              </View>

              <View style={styles.diagMetaRow}>
                <Text style={styles.diagMetaLabel}>MQTT Bridge</Text>
                <Text style={styles.diagMetaVal}>{mqttStatus.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
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
    paddingBottom: 80, // room for floating dock
  },
  // Top Header Bar
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: COLORS.canvasBg,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  closeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  topPillsScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 2,
  },
  topPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  topPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: COLORS.textPrimary,
  },
  topPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  topPillTextActive: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  // Main Summary Card (matching large card in photo)
  mainSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: 16,
    marginHorizontal: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  stationAvatarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.cardSubtle,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 18,
  },
  avatarIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextCol: {
    paddingRight: 4,
  },
  avatarSub: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  avatarName: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  metricColumnsWrap: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  metricCol: {
    alignItems: 'flex-start',
  },
  metricColLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  metricColValueLarge: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  metricColValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  metricUnit: {
    fontSize: 9,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  // Sub-Pill Filter Row
  summaryBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingTop: 10,
  },
  gridIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.cardSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subPillsScroll: {
    flexDirection: 'row',
    gap: 6,
  },
  subPill: {
    backgroundColor: COLORS.cardSubtle,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  subPillActive: {
    backgroundColor: COLORS.darkCharcoal,
  },
  subPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  subPillTextActive: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Timeline Canvas
  timelineSection: {
    paddingLeft: 14,
    marginBottom: 24,
  },
  timelineScroll: {
    flexDirection: 'row',
    paddingRight: 24,
    gap: 16,
  },
  timelineColumn: {
    width: 260,
  },
  waveCardWrap: {
    marginTop: 10,
  },
  nodeHeaderSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  yellowCircleNode: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accentLime,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C2E012',
  },
  axisLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#D1CABE',
    marginLeft: 8,
  },
  diagnosticCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  diagHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  diagTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  diagBody: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginBottom: 12,
  },
  diagMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.04)',
  },
  diagMetaLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  diagMetaVal: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});
