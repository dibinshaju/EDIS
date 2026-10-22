import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../src/constants/theme';
import { useSensor } from '../../src/context/SensorContext';
import { WaveformChart } from '../../src/components/WaveformChart';
import { formatFlow, formatTime } from '../../src/utils/format';

export default function HistoryScreen() {
  const { history, totalVolumeLiters, currentReading } = useSensor();

  const samplePoints = history.slice(-20);
  const peakFlow = samplePoints.reduce((max, d) => Math.max(max, d.inletFlow), 0);
  const avgFlow =
    samplePoints.length > 0
      ? samplePoints.reduce((sum, d) => sum + d.inletFlow, 0) / samplePoints.length
      : 0;
  const mismatchCount = samplePoints.filter((d) => Math.abs(d.flowDifference) > 1.5).length;

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Editorial Header */}
        <View style={styles.header}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Telemetry Log</Text>
            <View style={styles.indexPill}>
              <Text style={styles.indexPillText}>03 of 04</Text>
            </View>
          </View>

          <View style={styles.tagPill}>
            <Text style={styles.tagPillText}>Historical Trends</Text>
          </View>

          <View style={styles.heroTitleWrap}>
            <Text style={styles.heroTitlePrimary}>Sensor Data &</Text>
            <Text style={styles.heroTitleAccent}>Flow Analytics</Text>
          </View>
        </View>

        {/* 4 Summary Metric Pills */}
        <View style={styles.summaryCard}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Average</Text>
            <Text style={styles.metricVal}>
              {formatFlow(avgFlow)} <Text style={styles.unit}>L/m</Text>
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Peak</Text>
            <Text style={styles.metricVal}>
              {formatFlow(peakFlow)} <Text style={styles.unit}>L/m</Text>
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Volume</Text>
            <Text style={styles.metricVal}>
              {formatFlow(totalVolumeLiters)} <Text style={styles.unit}>L</Text>
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Deficits</Text>
            <Text style={[styles.metricVal, mismatchCount > 0 && { color: COLORS.danger }]}>
              {mismatchCount}
            </Text>
          </View>
        </View>

        {/* Waveform Visualization */}
        <View style={styles.chartWrap}>
          <WaveformChart
            title="Intake vs Distribution Curve"
            currentValue={currentReading.inletFlow}
            averageValue={avgFlow}
            deltaValue={currentReading.flowDifference}
          />
        </View>

        {/* Chronological Table Card */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.tableTitle}>Recent Telemetry Packets</Text>
            <Text style={styles.tableSubtitle}>{samplePoints.length} records</Text>
          </View>

          {/* Table Column Headers */}
          <View style={styles.tableColHeader}>
            <Text style={[styles.th, { flex: 1.2 }]}>Time</Text>
            <Text style={[styles.th, { flex: 1 }]}>Inlet</Text>
            <Text style={[styles.th, { flex: 1 }]}>Outlet</Text>
            <Text style={[styles.th, { flex: 1.2 }]}>Delta</Text>
            <Text style={[styles.th, { flex: 0.9 }]}>State</Text>
          </View>

          {/* Rows */}
          {samplePoints
            .slice()
            .reverse()
            .slice(0, 10)
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
                  <Text
                    style={[
                      styles.td,
                      { flex: 1, fontWeight: '700', color: COLORS.textSecondary },
                    ]}
                  >
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
                        styles.statusTag,
                        hasDeficit
                          ? styles.statusTagLeak
                          : hasReversed
                          ? styles.statusTagDiag
                          : styles.statusTagOk,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusTagText,
                          hasDeficit
                            ? styles.statusTagTextLeak
                            : hasReversed
                            ? styles.statusTagTextDiag
                            : styles.statusTagTextOk,
                        ]}
                      >
                        {hasDeficit ? 'LEAK' : hasReversed ? 'REV' : 'OK'}
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
  scroll: {
    flex: 1,
  },
  content: {
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
    color: COLORS.accentOrange,
    lineHeight: 36,
    letterSpacing: -1.2,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111215',
  },
  unit: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#EDEBE4',
  },
  chartWrap: {
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
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tableTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111215',
    letterSpacing: -0.2,
  },
  tableSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  tableColHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EDEBE4',
    marginBottom: 4,
  },
  th: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
  },
  tableRowAlt: {
    backgroundColor: '#FBFBFA',
  },
  td: {
    fontSize: 11,
    color: '#111215',
  },
  statusTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  statusTagOk: {
    backgroundColor: '#ECFDF5',
  },
  statusTagLeak: {
    backgroundColor: '#FEF2F2',
  },
  statusTagDiag: {
    backgroundColor: '#F0FDFA',
  },
  statusTagText: {
    fontSize: 8,
    fontWeight: '800',
  },
  statusTagTextOk: {
    color: '#065F46',
  },
  statusTagTextLeak: {
    color: '#991B1B',
  },
  statusTagTextDiag: {
    color: '#0F766E',
  },
});
