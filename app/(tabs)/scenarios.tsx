import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../src/constants/theme';
import { ScenarioController } from '../../src/components/ScenarioController';
import { useSensor } from '../../src/context/SensorContext';
import { useMqtt } from '../../src/context/MqttContext';
import { Ionicons } from '@expo/vector-icons';
import { formatFlow } from '../../src/utils/format';

export default function ScenariosScreen() {
  const { currentReading, setScenario, activeScenario } = useSensor();
  const { publishCommand, status: mqttStatus } = useMqtt();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="flask" size={20} color={COLORS.tealPrimary} />
          <Text style={styles.headerTitle}>Interactive Demo Scenarios</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Deterministic academic evaluation suite for flow, leaks & recovery
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Active Telemetry Snapshot */}
        <View style={styles.snapshotCard}>
          <Text style={styles.snapshotTitle}>Current Simulation Telemetry Output:</Text>
          <View style={styles.snapshotRow}>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>Inlet Flow (S1)</Text>
              <Text style={[styles.snapshotVal, { color: COLORS.tealPrimary }]}>
                {formatFlow(currentReading.inletFlow)} L/min
              </Text>
            </View>
            <View style={styles.snapshotDivider} />
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>Outlet Flow (S2)</Text>
              <Text style={[styles.snapshotVal, { color: '#84CC16' }]}>
                {formatFlow(currentReading.outletFlow)} L/min
              </Text>
            </View>
            <View style={styles.snapshotDivider} />
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>Deficit (S1-S2)</Text>
              <Text
                style={[
                  styles.snapshotVal,
                  { color: currentReading.flowDifference > 1.5 ? COLORS.danger : COLORS.textDark },
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

        {/* Expo Evaluation Guide */}
        <View style={styles.guideCard}>
          <View style={styles.guideHeader}>
            <Ionicons name="school-outline" size={18} color={COLORS.navyDark} />
            <Text style={styles.guideTitle}>Expo Evaluator Demonstration Guide</Text>
          </View>

          <View style={styles.stepBox}>
            <Text style={styles.stepNum}>Step 1</Text>
            <Text style={styles.stepText}>
              Select <Text style={styles.bold}>1. Normal Balanced Flow</Text>. Observe matching inlet and outlet readings (~12.5 L/min) and steady-state dashboard.
            </Text>
          </View>

          <View style={styles.stepBox}>
            <Text style={styles.stepNum}>Step 2</Text>
            <Text style={styles.stepText}>
              Select <Text style={styles.bold}>2. Suspected Water Leak</Text>. Watch the +5.2 L/min deficit trigger persistence filtering (6s) followed by the critical alert and buzzer sound.
            </Text>
          </View>

          <View style={styles.stepBox}>
            <Text style={styles.stepNum}>Step 3</Text>
            <Text style={styles.stepText}>
              Select <Text style={styles.bold}>6. System Recovery</Text>. Telemetry normalizes, the buzzer ceases, and the system logs a <Text style={styles.bold}>RECOVERED</Text> incident.
            </Text>
          </View>

          <View style={styles.stepBox}>
            <Text style={styles.stepNum}>Step 4</Text>
            <Text style={styles.stepText}>
              Select <Text style={styles.bold}>5. Sensor Anomaly</Text> to prove that Outlet &gt; Inlet correctly generates a diagnostic alert without falsely declaring a pipe breach!
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
    backgroundColor: COLORS.bgLight,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.navyDark,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
  },
  snapshotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
  },
  snapshotTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
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
    color: COLORS.textLight,
    fontWeight: '600',
  },
  snapshotVal: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  snapshotDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  guideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.xl,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.navyDark,
  },
  stepBox: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  stepNum: {
    backgroundColor: COLORS.bgLight,
    color: COLORS.navyDark,
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  stepText: {
    flex: 1,
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
  },
  bold: {
    fontWeight: '700',
    color: COLORS.navyDark,
  },
});
