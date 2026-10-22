import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../src/constants/theme';
import { useSensor } from '../../src/context/SensorContext';
import { FlowChart } from '../../src/components/FlowChart';
import { StatCard } from '../../src/components/StatCard';
import { formatFlow, formatTime } from '../../src/utils/format';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen() {
  const { history, totalVolumeLiters } = useSensor();

  // Compute aggregate stats from historical buffer
  const samplePoints = history.slice(-40);
  const peakFlow = samplePoints.reduce((max, d) => Math.max(max, d.inletFlow), 0);
  const avgFlow =
    samplePoints.length > 0
      ? samplePoints.reduce((sum, d) => sum + d.inletFlow, 0) / samplePoints.length
      : 0;
  const mismatchCount = samplePoints.filter((d) => Math.abs(d.flowDifference) > 1.5).length;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="stats-chart" size={20} color={COLORS.tealPrimary} />
          <Text style={styles.headerTitle}>Flow History & Analytics</Text>
        </View>
        <Text style={styles.headerSubtitle}>Continuous time-series telemetry buffer</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Metric Summary Cards */}
        <View style={styles.statsRow}>
          <StatCard
            title="Avg Inflow"
            value={formatFlow(avgFlow)}
            unit="L/min"
            iconName="speedometer-outline"
            iconColor={COLORS.tealPrimary}
          />
          <StatCard
            title="Peak Flow"
            value={formatFlow(peakFlow)}
            unit="L/min"
            iconName="trending-up"
            iconColor="#8B5CF6"
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="Mismatch Events"
            value={String(mismatchCount)}
            subtitle="Samples exceeding 1.5 L/min"
            iconName="alert-outline"
            iconColor={mismatchCount > 0 ? COLORS.danger : COLORS.success}
            isWarning={mismatchCount > 3}
          />
          <StatCard
            title="Total Metered"
            value={formatFlow(totalVolumeLiters)}
            unit="Liters"
            subtitle="Cumulative consumption"
            iconName="water-outline"
            iconColor="#3B82F6"
          />
        </View>

        {/* Full-width Flow Chart */}
        <View style={styles.chartWrapper}>
          <FlowChart data={history} height={190} title="Dual-Sensor History (Inlet vs Outlet)" />
        </View>

        {/* Historical Telemetry Data Table */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.tableTitle}>Recent Sensor Readings ({samplePoints.length})</Text>
            <Text style={styles.tableSubtitle}>Latest 40 records</Text>
          </View>

          {/* Table Header */}
          <View style={styles.tableColHeader}>
            <Text style={[styles.th, { flex: 1.2 }]}>Time</Text>
            <Text style={[styles.th, { flex: 1 }]}>Inlet</Text>
            <Text style={[styles.th, { flex: 1 }]}>Outlet</Text>
            <Text style={[styles.th, { flex: 1.2 }]}>Mismatch</Text>
            <Text style={[styles.th, { flex: 1 }]}>Status</Text>
          </View>

          {/* Table Rows (reversed, newest on top) */}
          {samplePoints
            .slice()
            .reverse()
            .map((row, idx) => {
              const hasMismatch = Math.abs(row.flowDifference) > 1.5;
              return (
                <View
                  key={row.timestamp + '-' + idx}
                  style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}
                >
                  <Text style={[styles.td, { flex: 1.2, color: COLORS.textLight }]}>
                    {formatTime(row.timestamp)}
                  </Text>
                  <Text style={[styles.td, { flex: 1, fontWeight: '700', color: COLORS.tealPrimary }]}>
                    {formatFlow(row.inletFlow)}
                  </Text>
                  <Text style={[styles.td, { flex: 1, fontWeight: '700', color: '#65A30D' }]}>
                    {formatFlow(row.outletFlow)}
                  </Text>
                  <Text
                    style={[
                      styles.td,
                      {
                        flex: 1.2,
                        fontWeight: '700',
                        color: hasMismatch ? COLORS.danger : COLORS.textDark,
                      },
                    ]}
                  >
                    {row.flowDifference >= 0 ? '+' : ''}
                    {formatFlow(row.flowDifference)}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: hasMismatch ? COLORS.dangerBg : COLORS.successBg,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          {
                            color: hasMismatch ? COLORS.dangerText : COLORS.successText,
                          },
                        ]}
                      >
                        {hasMismatch ? 'LOSS' : 'OK'}
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  chartWrapper: {
    marginBottom: 16,
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.xl,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tableTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  tableSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  tableColHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
    marginBottom: 4,
  },
  th: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  td: {
    fontSize: 11,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
});
