import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../src/constants/theme';
import { ScenarioController } from '../../src/components/ScenarioController';
import { useSensor } from '../../src/context/SensorContext';
import { formatFlow } from '../../src/utils/format';

export default function ScenariosScreen() {
  const { currentReading } = useSensor();

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Editorial Header */}
        <View style={styles.header}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Scenario Suite</Text>
            <View style={styles.indexPill}>
              <Text style={styles.indexPillText}>02 of 04</Text>
            </View>
          </View>

          <View style={styles.tagPill}>
            <Text style={styles.tagPillText}>Simulation Vectors</Text>
          </View>

          <View style={styles.heroTitleWrap}>
            <Text style={styles.heroTitlePrimary}>Preset Flows &</Text>
            <Text style={styles.heroTitleAccent}>Stress Testing</Text>
          </View>
        </View>

        {/* Live Flow Snapshot Pill */}
        <View style={styles.snapshotCard}>
          <View style={styles.snapshotRow}>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>Inlet S1</Text>
              <Text style={styles.snapshotVal}>
                {formatFlow(currentReading.inletFlow)} <Text style={styles.unit}>L/m</Text>
              </Text>
            </View>

            <View style={styles.snapshotDivider} />

            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>Outlet S2</Text>
              <Text style={styles.snapshotVal}>
                {formatFlow(currentReading.outletFlow)} <Text style={styles.unit}>L/m</Text>
              </Text>
            </View>

            <View style={styles.snapshotDivider} />

            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>Deficit (S1-S2)</Text>
              <Text
                style={[
                  styles.snapshotVal,
                  {
                    color:
                      currentReading.flowDifference > 1.5
                        ? COLORS.danger
                        : COLORS.textPrimary,
                  },
                ]}
              >
                {currentReading.flowDifference >= 0 ? '+' : ''}
                {formatFlow(currentReading.flowDifference)} <Text style={styles.unit}>L/m</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Master Scenario Controller Component */}
        <ScenarioController />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.canvasBg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 110,
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
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.accentLimeDark,
    lineHeight: 36,
    letterSpacing: -1.2,
  },
  snapshotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
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
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  snapshotVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111215',
    marginTop: 2,
  },
  unit: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  snapshotDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#EDEBE4',
  },
});
