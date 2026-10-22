import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../src/constants/theme';
import { useSensor } from '../../src/context/SensorContext';
import { WaveformChart } from '../../src/components/WaveformChart';
import { formatFlow, formatTime } from '../../src/utils/format';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen() {
  const { history, totalVolumeLiters, currentReading } = useSensor();

  const samplePoints = history.slice(-30);
  const peakFlow = samplePoints.reduce((max, d) => Math.max(max, d.inletFlow), 0);
  const avgFlow =
    samplePoints.length > 0
      ? samplePoints.reduce((sum, d) => sum + d.inletFlow, 0) / samplePoints.length
      : 0;
  const mismatchCount = samplePoints.filter((d) => Math.abs(d.flowDifference) > 1.5).length;

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="bar-chart-outline" size={16} color={COLORS.textPrimary} />
          </View>
          <Text style={styles.headerTitle}>Readings & Analytics</Text>
        </View>
        <Text style={styles.headerSubtitle}>Historical dual-sensor telemetry archive</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Metric Summary Pill Strip */}
        <View style={styles.summaryCard}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Avg Inflow</Text>
            <Text style={styles.metricVal}>{formatFlow(avgFlow)} <Text style={styles.unit}>L/m</Text></Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Peak Inflow</Text>
            <Text style={styles.metricVal}>{formatFlow(peakFlow)} <Text style={styles.unit}>L/m</Text></Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Total Metered</Text>
            <Text style={styles.metricVal}>{formatFlow(totalVolumeLiters)} <Text style={styles.unit}>L</Text></Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Discrepancies</Text>
            <Text style={[styles.metricVal, mismatchCount > 0 && { color: COLORS.danger }]}>
              {mismatchCount}
            </Text>
          </View>
        </View>

        {/* Waveform Visualization */}
        <View style={styles.chartWrap}>
          <WaveformChart
            title="Intake vs Distribution Waveform"
            currentValue={currentReading.inletFlow}
            averageValue={avgFlow}
            deltaValue={currentReading.flowDifference}
          />
        </View>

        {/* Chronological Table Card */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.tableTitle}>Recent Sensor Samples</Text>
            <Text style={styles.tableSubtitle}>{samplePoints.length} packets</Text>
          </View>

          {/* Table Column Headers */}
          <View style={styles.tableColHeader}>
            <Text style={[styles.th, { flex: 1.2 }]}>Timestamp</Text>
            <Text style={[styles.th, { flex: 1 }]}>Inlet S1</Text>
            <Text style={[styles.th, { flex: 1 }]}>Outlet S2</Text>
            <Text style={[styles.th, { flex: 1.2 }]}>Difference</Text>
            <Text style={[styles.th, { flex: 0.9 }]}>Audit</Text>
          </View>

          {/* Rows */}
          {samplePoints
            .slice()
            .reverse()
            .map((row, idx) => {
              const hasDeficit = row.flowDifference > 1.5;
              const hasReversed = row.flowDifference < -1.5;
              return (
                <View
                  key={row.timestamp + '-' + idx}
                  style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}
                >
                  <Text style={[styles.td, { flex: 1.2, color: COLORS.textSecondary }]}>
                    {formatTime(row.timestamp)}
                  </Text>
                  <Text style={[styles.td, { flex: 1, fontWeight: '700' }]}>
                    {formatFlow(row.inletFlow)}
                  </Text>
                  <Text style={[styles.td, { flex: 1, fontWeight: '700', color: COLORS.textSecondary }]}>
                    {formatFlow(row.outletFlow)}
                  </Text>
                  <Text
                    style={[
                      styles.td,
                      {
                        flex: 1.2,
                        fontWeight: '800',
                        color: hasDeficit ? COLORS.danger : COLORS.textPrimary,
                      },
                    ]}
                  >
                    {row.flowDifference >= 0 ? '+' : ''}
                    {formatFlow(row.flowDifference)}
                  </Text>
                  <View style={{ flex: 0.9 }}>
                    <View
                      style={[
                        styles.badge,
                        hasDeficit
                          ? styles.badgeDanger
                          : hasReversed
                          ? styles.badgeWarn
                          : styles.badgeOk,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          hasDeficit
                            ? styles.badgeTextDanger
                            : hasReversed
                            ? styles.badgeTextWarn
                            : styles.badgeTextOk,
                        ]}
                      >
                        {hasDeficit ? 'DEFICIT' : hasReversed ? 'REVERSED' : 'MATCH'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
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
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  metricLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  unit: {
    fontSize: 9,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  chartWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tableTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  tableSubtitle: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  tableColHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
    marginBottom: 4,
  },
  th: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.03)',
  },
  tableRowAlt: {
    backgroundColor: COLORS.cardSubtle,
  },
  td: {
    fontSize: 10,
    color: COLORS.textPrimary,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeOk: {
    backgroundColor: COLORS.cardSubtle,
  },
  badgeDanger: {
    backgroundColor: COLORS.dangerBg,
  },
  badgeWarn: {
    backgroundColor: COLORS.warningBg,
  },
  badgeText: {
    fontSize: 7,
    fontWeight: '800',
  },
  badgeTextOk: {
    color: COLORS.textSecondary,
  },
  badgeTextDanger: {
    color: COLORS.dangerText,
  },
  badgeTextWarn: {
    color: COLORS.warningText,
  },
});
