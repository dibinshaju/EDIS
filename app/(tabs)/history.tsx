import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS } from '../../src/constants/theme';
import { useSensor } from '../../src/context/SensorContext';
import { useAlerts } from '../../src/context/AlertContext';
import { WaveformChart } from '../../src/components/WaveformChart';
import { formatFlow, formatTime } from '../../src/utils/format';
import { Ionicons } from '@expo/vector-icons';

type DayItem = {
  dayNum: string;
  dayName: string;
  dateKey: string;
};

const DAYS_STRIP: DayItem[] = [
  { dayNum: '10', dayName: 'Mon', dateKey: '10-mon' },
  { dayNum: '11', dayName: 'Tue', dateKey: '11-tue' },
  { dayNum: '12', dayName: 'Wed', dateKey: '12-wed' },
  { dayNum: '13', dayName: 'Thu', dateKey: '13-thu' },
  { dayNum: '14', dayName: 'Fri', dateKey: '14-fri' },
  { dayNum: '15', dayName: 'Sat', dateKey: '15-sat' },
  { dayNum: '16', dayName: 'Sun', dateKey: '16-sun' },
];

export default function AnalyticsScreen() {
  const { history, totalVolumeLiters, currentReading, dataSource, inFlow, outFlow } = useSensor();
  const { alerts } = useAlerts();
  const [selectedDay, setSelectedDay] = useState<string>('13-thu');
  const [timeRange, setTimeRange] = useState<'1H' | '24H' | '7D'>('24H');

  const isDemo = dataSource === 'demo';
  const samplePoints = history.slice(-30);
  const peakFlow = samplePoints.reduce((max, d) => Math.max(max, d.inletFlow), inFlow);
  const avgFlow =
    samplePoints.length > 0
      ? samplePoints.reduce((sum, d) => sum + d.inletFlow, 0) / samplePoints.length
      : inFlow;
  const mismatchCount = samplePoints.filter((d) => Math.abs(d.flowDifference) > 1.5).length;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. TOP HEADER (Structure Image 1) */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.dateBadge}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.darkCharcoal} />
            <Text style={styles.dateBadgeText}>Today, Oct 24</Text>
          </View>
          <Text style={styles.headerTitle}>Flow Analytics</Text>
          <Text style={styles.headerSubtitle}>Usage Trends & Telemetry History</Text>
        </View>

        <View style={[styles.modePill, isDemo ? styles.modePillDemo : styles.modePillLive]}>
          <Text style={[styles.modePillText, isDemo ? styles.modeTextDemo : styles.modeTextLive]}>
            {isDemo ? 'DEMO ARCHIVE' : 'LIVE ARCHIVE'}
          </Text>
        </View>
      </View>

      {/* 2. HORIZONTAL DAY SELECTOR STRIP (Signature Structure from Image 1) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dayStripScroll}
        contentContainerStyle={styles.dayStripContent}
      >
        {DAYS_STRIP.map((item) => {
          const isActive = selectedDay === item.dateKey;
          return (
            <TouchableOpacity
              key={item.dateKey}
              style={[styles.dayPill, isActive && styles.dayPillActive]}
              onPress={() => setSelectedDay(item.dateKey)}
              activeOpacity={0.8}
            >
              <Text style={[styles.dayNumText, isActive && styles.dayNumTextActive]}>
                {item.dayNum}
              </Text>
              <Text style={[styles.dayNameText, isActive && styles.dayNameTextActive]}>
                {item.dayName}
              </Text>
              {isActive && <View style={styles.dayActiveDot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 3. VERTICAL TIMELINE WIRE WITH CIRCULAR NODES (Signature Structure from Image 1) */}
      <View style={styles.timelineSection}>
        <Text style={styles.sectionHeaderTitle}>Telemetry Event Timeline</Text>

        <View style={styles.timelineContainer}>
          {/* Vertical Wire Line */}
          <View style={styles.verticalWire} />

          {/* Node 1: Active Featured Dark Card (Image 1 signature!) */}
          <View style={styles.timelineRow}>
            {/* Left Time Column */}
            <View style={styles.timeColumn}>
              <Text style={styles.timeTextPrimary}>09:00</Text>
              <Text style={styles.timeTextSecondary}>AM</Text>
            </View>

            {/* Circular Node on Wire */}
            <View style={styles.nodeWrapper}>
              <View style={styles.nodeActiveOuter}>
                <View style={styles.nodeActiveInner} />
              </View>
            </View>

            {/* Card Content: Featured Dark Card */}
            <View style={styles.featuredDarkCard}>
              <View style={styles.darkCardTopRow}>
                <View style={styles.darkCardTag}>
                  <Text style={styles.darkCardTagText}>S1 INLET {formatFlow(inFlow)} L/M</Text>
                </View>
                <View style={styles.darkCardTagSubtle}>
                  <Text style={styles.darkCardTagSubtleText}>BALANCED</Text>
                </View>
              </View>

              <Text style={styles.darkCardTitle}>Municipal Inflow Intake</Text>
              <Text style={styles.darkCardSubtitle}>
                Continuous steady pipeline intake recorded with zero detected loss.
              </Text>

              <View style={styles.darkCardFooter}>
                <Text style={styles.darkCardMeta}>S2 Outlet: {formatFlow(outFlow)} L/min</Text>
                <View style={styles.darkCardCheckBtn}>
                  <Ionicons name="checkmark" size={14} color={COLORS.darkCharcoal} />
                </View>
              </View>
            </View>
          </View>

          {/* Node 2: Telemetry Audit Interval (White Card) */}
          <View style={styles.timelineRow}>
            <View style={styles.timeColumn}>
              <Text style={styles.timeTextPrimary}>11:30</Text>
              <Text style={styles.timeTextSecondary}>AM</Text>
            </View>

            <View style={styles.nodeWrapper}>
              <View style={styles.nodeInactive} />
            </View>

            <View style={styles.whiteEventCard}>
              <View style={styles.whiteCardTopRow}>
                <Text style={styles.whiteCardTitle}>Calibration Delta Check</Text>
                <View style={styles.whiteCardTag}>
                  <Text style={styles.whiteCardTagText}>AUDIT VERIFIED</Text>
                </View>
              </View>
              <Text style={styles.whiteCardSub}>
                Differential delta evaluated at {Math.abs(inFlow - outFlow).toFixed(1)} L/min. Safe certification intact.
              </Text>
            </View>
          </View>

          {/* Node 3: Consumption Milestone (White Card) */}
          <View style={styles.timelineRow}>
            <View style={styles.timeColumn}>
              <Text style={styles.timeTextPrimary}>02:15</Text>
              <Text style={styles.timeTextSecondary}>PM</Text>
            </View>

            <View style={styles.nodeWrapper}>
              <View style={styles.nodeInactive} />
            </View>

            <View style={styles.whiteEventCard}>
              <View style={styles.whiteCardTopRow}>
                <Text style={styles.whiteCardTitle}>Cumulative Milestone</Text>
                <Text style={styles.whiteCardValueText}>{totalVolumeLiters.toFixed(1)} L</Text>
              </View>
              <Text style={styles.whiteCardSub}>
                Total volume metered across today’s active pipeline interval.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 4. KEY SUMMARY METRICS (4 Cards) */}
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Metered</Text>
          <Text style={styles.summaryVal}>
            {totalVolumeLiters.toFixed(1)} <Text style={styles.unit}>L</Text>
          </Text>
          <Text style={styles.summaryFooter}>Cumulative volume</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Average Inflow</Text>
          <Text style={styles.summaryVal}>
            {formatFlow(avgFlow)} <Text style={styles.unit}>L/m</Text>
          </Text>
          <Text style={styles.summaryFooter}>Steady baseline</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Peak Demand</Text>
          <Text style={styles.summaryVal}>
            {formatFlow(peakFlow)} <Text style={styles.unit}>L/m</Text>
          </Text>
          <Text style={styles.summaryFooter}>Highest recorded</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Discrepancies</Text>
          <Text style={[styles.summaryVal, mismatchCount > 0 && { color: COLORS.danger }]}>
            {mismatchCount}
          </Text>
          <Text style={styles.summaryFooter}>Deficit intervals</Text>
        </View>
      </View>

      {/* 5. WAVEFORM CURVE PANEL */}
      <View style={styles.chartPanel}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.sectionHeaderTitle}>Inlet vs Outlet Flow Curve</Text>
            <Text style={styles.chartSubtitle}>
              {isDemo
                ? 'Sample data generated by simulation engine'
                : 'Validated historical telemetry packets from MQTT'}
            </Text>
          </View>
        </View>

        <View style={styles.waveformWrap}>
          <WaveformChart
            title="Intake vs Distribution Curve"
            currentValue={currentReading.inletFlow}
            averageValue={avgFlow}
            deltaValue={currentReading.flowDifference}
          />
        </View>
      </View>

      {/* 6. TELEMETRY PACKET TABLE */}
      <View style={styles.tableCard}>
        <View style={styles.tableHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Recorded Telemetry Packets</Text>
          <Text style={styles.tableSubtitle}>{samplePoints.length} packets</Text>
        </View>

        <View style={styles.tableColHeader}>
          <Text style={[styles.th, { flex: 1.2 }]}>Timestamp</Text>
          <Text style={[styles.th, { flex: 1 }]}>Inlet</Text>
          <Text style={[styles.th, { flex: 1 }]}>Outlet</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>Delta</Text>
          <Text style={[styles.th, { flex: 0.9 }]}>Audit</Text>
        </View>

        {samplePoints
          .slice()
          .reverse()
          .slice(0, 6)
          .map((row, idx) => {
            const hasDeficit = row.flowDifference > 1.5;
            const hasReversed = row.flowDifference < -1.5;
            return (
              <View
                key={row.timestamp + '-' + idx}
                style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}
              >
                <Text style={[styles.td, { flex: 1.2, color: '#8F959E' }]}>
                  {formatTime(row.timestamp)}
                </Text>
                <Text style={[styles.td, { flex: 1, fontWeight: '700' }]}>
                  {formatFlow(row.inletFlow)}
                </Text>
                <Text style={[styles.td, { flex: 1, fontWeight: '700', color: '#8F959E' }]}>
                  {formatFlow(row.outletFlow)}
                </Text>
                <Text
                  style={[
                    styles.td,
                    {
                      flex: 1.2,
                      fontWeight: '800',
                      color: hasDeficit ? COLORS.danger : COLORS.darkCharcoal,
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
                      {hasDeficit ? 'DEFICIT' : hasReversed ? 'REVERSED' : 'BALANCED'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.canvasBg, // Warm putty grey canvas (#E9E7E1)
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 110, // Clearance for floating bottom dock
  },

  /* 1. Header */
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.darkCharcoal,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.darkCharcoal,
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6E737B',
    marginTop: 2,
  },
  modePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  modePillDemo: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  modePillLive: {
    backgroundColor: '#D1FAE5',
  },
  modePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modeTextDemo: {
    color: COLORS.darkCharcoal,
  },
  modeTextLive: {
    color: '#065F46',
  },

  /* 2. Horizontal Day Strip (Structure Image 1) */
  dayStripScroll: {
    marginBottom: 20,
    marginHorizontal: -18,
  },
  dayStripContent: {
    paddingHorizontal: 18,
    gap: 8,
  },
  dayPill: {
    width: 58,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  dayPillActive: {
    backgroundColor: COLORS.darkCharcoal, // Deep charcoal active pill (#16181B)
    borderColor: COLORS.darkCharcoal,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  dayNumText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.darkCharcoal,
    letterSpacing: -0.5,
  },
  dayNumTextActive: {
    color: '#FFFFFF',
  },
  dayNameText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8F959E',
    marginTop: 2,
  },
  dayNameTextActive: {
    color: '#8F959E',
  },
  dayActiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.accentOrange, // Tech orange dot
    marginTop: 4,
  },

  /* 3. Vertical Timeline Wire & Nodes (Structure Image 1) */
  timelineSection: {
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.darkCharcoal,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  timelineContainer: {
    position: 'relative',
  },
  verticalWire: {
    position: 'absolute',
    left: 48,
    top: 8,
    bottom: 20,
    width: 2,
    backgroundColor: '#D8D5CD', // Wire line
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  timeColumn: {
    width: 40,
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  timeTextPrimary: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.darkCharcoal,
  },
  timeTextSecondary: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8F959E',
  },
  nodeWrapper: {
    width: 18,
    alignItems: 'center',
    paddingTop: 6,
  },
  nodeActiveOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.darkCharcoal,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  nodeActiveInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentOrange, // Tech orange core
  },
  nodeInactive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D8D5CD',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  /* Featured Dark Card (Image 1 signature!) */
  featuredDarkCard: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: COLORS.darkCharcoal, // #16181B
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  darkCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  darkCardTag: {
    backgroundColor: 'rgba(255, 85, 34, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  darkCardTagText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.accentOrange, // Vibrant tech orange (#FF5522)
    letterSpacing: 0.3,
  },
  darkCardTagSubtle: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  darkCardTagSubtleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  darkCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  darkCardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8F959E',
    marginTop: 3,
    lineHeight: 18,
  },
  darkCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  darkCardMeta: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  darkCardCheckBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* White Event Cards */
  whiteEventCard: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  whiteCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  whiteCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.darkCharcoal,
  },
  whiteCardTag: {
    backgroundColor: COLORS.cardSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  whiteCardTagText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.darkCharcoal,
  },
  whiteCardValueText: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.darkCharcoal,
  },
  whiteCardSub: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6E737B',
    lineHeight: 18,
  },

  /* 4. Summary Grid */
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8F959E',
    marginBottom: 4,
  },
  summaryVal: {
    fontSize: 23,
    fontWeight: '900',
    color: COLORS.darkCharcoal,
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8F959E',
  },
  summaryFooter: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8F959E',
    marginTop: 4,
  },

  /* 5. Waveform Panel */
  chartPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  chartHeader: {
    marginBottom: 10,
  },
  chartSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6E737B',
    marginTop: 2,
  },
  waveformWrap: {
    alignItems: 'center',
    marginTop: 4,
  },

  /* 6. Telemetry Table */
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tableSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8F959E',
  },
  tableColHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    marginBottom: 4,
  },
  th: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8F959E',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
  },
  tableRowAlt: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  td: {
    fontSize: 13,
    color: COLORS.darkCharcoal,
  },
  statusTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusTagOk: {
    backgroundColor: '#D1FAE5',
  },
  statusTagLeak: {
    backgroundColor: '#FEE2E2',
  },
  statusTagDiag: {
    backgroundColor: '#F0FDFA',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '900',
  },
  statusTagTextOk: {
    color: '#065F46',
  },
  statusTagTextLeak: {
    color: '#991B1B',
  },
  statusTagTextDiag: {
    color: '#0D9488',
  },
});
