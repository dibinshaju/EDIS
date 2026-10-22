import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../src/constants/theme';
import { ScenarioController } from '../../src/components/ScenarioController';
import { useSensor } from '../../src/context/SensorContext';
import { Ionicons } from '@expo/vector-icons';
import { formatFlow } from '../../src/utils/format';

export default function ScenariosScreen() {
  const { currentReading } = useSensor();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="git-branch-outline" size={16} color={COLORS.textPrimary} />
          </View>
          <Text style={styles.headerTitle}>Evaluation Scenarios</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Deterministic flow vectors for academic demonstration
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Active Telemetry Snapshot */}
        <View style={styles.snapshotCard}>
          <Text style={styles.snapshotTitle}>Current Telemetry Output</Text>
          <View style={styles.snapshotRow}>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>Inlet Flow (S1)</Text>
              <Text style={[styles.snapshotVal, { color: COLORS.textPrimary }]}>
                {formatFlow(currentReading.inletFlow)} L/min
              </Text>
            </View>
            <View style={styles.snapshotDivider} />
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>Outlet Flow (S2)</Text>
              <Text style={[styles.snapshotVal, { color: COLORS.textSecondary }]}>
                {formatFlow(currentReading.outletFlow)} L/min
              </Text>
            </View>
            <View style={styles.snapshotDivider} />
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>Deficit (S1-S2)</Text>
              <Text
                style={[
                  styles.snapshotVal,
                  { color: currentReading.flowDifference > 1.5 ? COLORS.danger : COLORS.textPrimary },
                ]}
              >
                {currentReading.flowDifference >= 0 ? '+' : ''}
                {formatFlow(currentReading.flowDifference)} L/min
              </Text>
            </View>
          </View>
        </View>

        {/* Master Scenario Controller */}
        <ScenarioController />

        {/* Evaluator Demonstration Guide */}
        <View style={styles.guideCard}>
          <View style={styles.guideHeader}>
            <Ionicons name="clipboard-outline" size={16} color={COLORS.textPrimary} />
            <Text style={styles.guideTitle}>Evaluator Demonstration Guide</Text>
          </View>

          <View style={styles.stepBox}>
            <Text style={styles.stepNum}>Step 1</Text>
            <Text style={styles.stepText}>
              Select <Text style={styles.bold}>1. Balanced Baseline Flow</Text>. Observe matching inlet and outlet readings (~5.0 L/min) and steady-state monitoring.
            </Text>
          </View>

          <View style={styles.stepBox}>
            <Text style={styles.stepNum}>Step 2</Text>
            <Text style={styles.stepText}>
              Select <Text style={styles.bold}>2. Suspected Water Leak</Text>. Watch the +2.0 L/min deficit accumulate volume, advance suspicious intervals (3 intervals), and trigger the critical alert.
            </Text>
          </View>

          <View style={styles.stepBox}>
            <Text style={styles.stepNum}>Step 3</Text>
            <Text style={styles.stepText}>
              Select <Text style={styles.bold}>3. Abnormal High Consumption</Text> to prove that high flow (12.0 L/min) when balanced is classified as consumption, not a pipe breach.
            </Text>
          </View>

          <View style={styles.stepBox}>
            <Text style={styles.stepNum}>Step 4</Text>
            <Text style={styles.stepText}>
              Select <Text style={styles.bold}>5. Diagnostic: Reversed Flow</Text> to show that Outlet &gt; Inlet correctly generates a calibration check without false alarm.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.canvasBg,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: COLORS.canvasBg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 14,
    paddingBottom: 80,
  },
  snapshotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  snapshotTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  snapshotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  snapshotItem: {
    flex: 1,
    alignItems: 'center',
  },
  snapshotLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  snapshotVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  snapshotDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  guideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: SPACING.xl,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  stepBox: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  stepNum: {
    backgroundColor: COLORS.cardSubtle,
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stepText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  bold: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});
