import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS } from '../../src/constants/theme';
import { useSensor } from '../../src/context/SensorContext';
import { useMqtt } from '../../src/context/MqttContext';
import { useAlerts } from '../../src/context/AlertContext';
import { WaveformChart } from '../../src/components/WaveformChart';
import { formatFlow, formatTime } from '../../src/utils/format';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const router = useRouter();
  const {
    inFlow,
    outFlow,
    totalVolumeLiters,
    elapsed,
    statusState,
    setScenario,
    resetDemo,
    activeScenario,
    dataSource,
    currentReading,
  } = useSensor();

  const { status: mqttStatus } = useMqtt();
  const { activeCount } = useAlerts();

  // Determine system status
  const getSystemStatus = () => {
    if (dataSource === 'wokwi' && mqttStatus === 'disconnected') {
      return {
        title: 'Connection Lost',
        color: COLORS.danger,
        bgColor: '#FEF2F2',
        borderColor: '#FCA5A5',
        icon: 'cloud-offline-outline' as const,
        explanation: 'MQTT telemetry link lost. Check Wokwi virtual bridge.',
      };
    }

    switch (statusState) {
      case 'leak':
        return {
          title: 'Suspected Leak',
          color: COLORS.danger,
          bgColor: '#FEF2F2',
          borderColor: '#FCA5A5',
          icon: 'alert-circle-outline' as const,
          explanation: 'Inlet significantly exceeds outlet. Persistent deficit detected.',
        };
      case 'datacheck':
        return {
          title: 'Sensor Anomaly',
          color: '#0D9488',
          bgColor: '#F0FDFA',
          borderColor: '#99F6E4',
          icon: 'hardware-chip-outline' as const,
          explanation: 'Outlet exceeds inlet flow. Calibration check advised.',
        };
      case 'high':
        return {
          title: 'High Consumption',
          color: '#D97706',
          bgColor: '#FFFBEB',
          borderColor: '#FDE68A',
          icon: 'speedometer-outline' as const,
          explanation: 'Heavy demand (>25.0 L/min). Flow balanced across nodes.',
        };
      case 'checking':
        return {
          title: 'Checking Deficit',
          color: '#D97706',
          bgColor: '#FFFBEB',
          borderColor: '#FDE68A',
          icon: 'time-outline' as const,
          explanation: 'Transient mismatch under evaluation against persistence filter.',
        };
      case 'normal':
      default:
        return {
          title: 'Normal Flow',
          color: '#0D0E11',
          bgColor: COLORS.accentYellow,
          borderColor: '#E5EE00',
          icon: 'checkmark-circle' as const,
          explanation: 'Inlet and outlet flows match within certified safe margins.',
        };
    }
  };

  const sysStatus = getSystemStatus();
  const flowDifference = inFlow - outFlow;
  const isDemo = dataSource === 'demo';

  const todayDateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. TOP EDITORIAL HERO CARD (Industrial Condensed Typography & Canary Yellow Highlighter) */}
      <View style={styles.editorialHeaderCard}>
        {/* Top technical meta bar */}
        <View style={styles.topMetaBar}>
          <View style={styles.brandTitleWrap}>
            <Text style={styles.topBrandName}>AQUAGUARD</Text>
            <Text style={styles.topBrandSub}>/ TELEMETRY</Text>
          </View>

          <View style={styles.indexPillBadge}>
            <Text style={styles.indexPillText}>01 <Text style={styles.indexPillSub}>/ 04</Text></Text>
          </View>
        </View>

        {/* Technical Sub-label & Date */}
        <View style={styles.categoryPillWrap}>
          <Text style={styles.categoryTechLabel}>IOT WATER MONITORING // SYSTEM V1.0</Text>
          <Text style={styles.headerDateLabel}>{todayDateStr}</Text>
        </View>

        {/* GIANT CONDENSED HEADLINE (Matching "GOOD UI MAKES THE NEXT STEP OBVIOUS.") */}
        <View style={styles.giantHeadlineWrap}>
          <Text style={styles.giantHeadlineCondensed}>SMART WATER</Text>
          <Text style={styles.giantHeadlineCondensed}>MONITOR FOR</Text>
          <Text style={styles.giantHeadlineCondensed}>NEXT-STEP</Text>
          
          {/* Highlighter Yellow Block behind LEAK DETECTION */}
          <View style={styles.highlighterBox}>
            <Text style={styles.highlighterText}>LEAK DETECTION.</Text>
          </View>
        </View>

        {/* Technical sub-rule note */}
        <View style={styles.headlineNoteRow}>
          <Text style={styles.headlineNoteText}>
            Dual flow differential metering • Real-time pipeline safety engine
          </Text>
          <View style={styles.authorBadgePill}>
            <View style={styles.authorAvatarCircle}>
              <Ionicons name="hardware-chip" size={12} color="#0D0E11" />
            </View>
            <Text style={styles.authorBadgeName}>
              {isDemo ? 'VIRTUAL ESP32' : 'WOKWI LIVE'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bodyContent}>
        {/* 2. SYSTEM STATUS CARD */}
        <View style={styles.statusCard}>
          <View style={styles.statusCardHeader}>
            <View
              style={[
                styles.statusBadgePill,
                { backgroundColor: sysStatus.bgColor, borderColor: sysStatus.borderColor },
              ]}
            >
              <Ionicons name={sysStatus.icon} size={15} color={sysStatus.color} />
              <Text style={[styles.statusBadgeText, { color: sysStatus.color }]}>
                {sysStatus.title.toUpperCase()}
              </Text>
            </View>

            <View
              style={[
                styles.statusCheckCircle,
                { backgroundColor: sysStatus.title === 'Normal Flow' ? COLORS.accentYellow : sysStatus.color },
              ]}
            >
              <Ionicons
                name="checkmark"
                size={14}
                color={sysStatus.title === 'Normal Flow' ? '#0D0E11' : '#FFFFFF'}
              />
            </View>
          </View>

          <Text style={styles.statusExplanationText}>{sysStatus.explanation}</Text>
        </View>

        {/* 3. HERO SENSOR CARD (Numbered 01 / S1 INLET FLOW with Giant Condensed Number) */}
        <View style={styles.heroSensorCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.numberedHeaderWrap}>
              <View style={styles.yellowNumberBox}>
                <Text style={styles.yellowNumberText}>01</Text>
              </View>
              <Text style={styles.numberedSectionTitle}>/ S1 INLET FLOW</Text>
            </View>
            <Text style={styles.sensorMetaText}>MUNICIPAL MAIN</Text>
          </View>

          <View style={styles.valueRow}>
            <Text style={styles.heroValueCondensed}>{formatFlow(inFlow)}</Text>
            <Text style={styles.heroUnitCondensed}>L/MIN</Text>
          </View>

          {/* Flow progress track with canary yellow fill */}
          <View style={styles.flowTrack}>
            <View
              style={[
                styles.flowTrackFill,
                { width: Math.min(100, Math.max(5, (inFlow / 35) * 100)) + '%' },
              ]}
            />
          </View>

          <View style={styles.sensorCardFooter}>
            <Text style={styles.sensorFooterText}>Intake baseline 12.0 L/min • Pressure balanced</Text>
            <Ionicons name="arrow-forward" size={14} color="#0D0E11" />
          </View>
        </View>

        {/* 4. SUPPORTING METRICS ROW (02 S2 OUTLET, 03 FLOW DELTA, 04 CONSUMPTION) */}
        <View style={styles.metricRow}>
          {/* S2 Outlet */}
          <View style={styles.subMetricCard}>
            <View style={styles.subMetricTop}>
              <View style={styles.yellowMiniBox}>
                <Text style={styles.yellowMiniBoxText}>02</Text>
              </View>
              <Text style={styles.subMetricLabel}>OUTLET</Text>
            </View>
            <Text style={styles.subMetricValueCondensed}>
              {formatFlow(outFlow)} <Text style={styles.subMetricUnit}>L/M</Text>
            </Text>
            <Text style={styles.subMetricFoot}>Distribution</Text>
          </View>

          {/* Flow Delta */}
          <View style={[styles.subMetricCard, flowDifference > 1.5 && styles.subMetricAlert]}>
            <View style={styles.subMetricTop}>
              <View style={[styles.yellowMiniBox, flowDifference > 1.5 && { backgroundColor: COLORS.danger }]}>
                <Text style={[styles.yellowMiniBoxText, flowDifference > 1.5 && { color: '#FFFFFF' }]}>03</Text>
              </View>
              <Text style={styles.subMetricLabel}>DELTA</Text>
            </View>
            <Text
              style={[
                styles.subMetricValueCondensed,
                flowDifference > 1.5 && { color: COLORS.danger },
              ]}
            >
              {flowDifference >= 0 ? '+' : ''}
              {formatFlow(flowDifference)} <Text style={styles.subMetricUnit}>L/M</Text>
            </Text>
            <Text style={styles.subMetricFoot}>
              {flowDifference > 1.5 ? 'Deficit' : 'Inlet - Outlet'}
            </Text>
          </View>

          {/* Today Consumption */}
          <View style={styles.subMetricCard}>
            <View style={styles.subMetricTop}>
              <View style={styles.yellowMiniBox}>
                <Text style={styles.yellowMiniBoxText}>04</Text>
              </View>
              <Text style={styles.subMetricLabel}>TOTAL</Text>
            </View>
            <Text style={styles.subMetricValueCondensed}>
              {totalVolumeLiters.toFixed(1)} <Text style={styles.subMetricUnit}>L</Text>
            </Text>
            <Text style={styles.subMetricFoot}>Today Total</Text>
          </View>
        </View>

        {/* 5. INLET VS OUTLET DUAL COMPARISON & WAVEFORM */}
        <View style={styles.comparisonCard}>
          <View style={styles.comparisonHeader}>
            <View style={styles.numberedHeaderWrap}>
              <View style={styles.yellowNumberBox}>
                <Text style={styles.yellowNumberText}>05</Text>
              </View>
              <Text style={styles.numberedSectionTitle}>/ FLOW COMPARISON</Text>
            </View>
            <Text style={styles.comparisonSubtitle}>
              {Math.abs(flowDifference) < 0.2
                ? 'Balanced Pipeline Stream'
                : flowDifference > 0
                ? flowDifference.toFixed(1) + ' L/min Deficit'
                : Math.abs(flowDifference).toFixed(1) + ' L/min Reversed'}
            </Text>
          </View>

          {/* Dual Bar Track */}
          <View style={styles.barCompareWrap}>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>Inlet S1</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: Math.min(100, (inFlow / 35) * 100) + '%',
                      backgroundColor: '#0D0E11',
                    },
                  ]}
                />
              </View>
              <Text style={styles.barValue}>{inFlow.toFixed(1)}</Text>
            </View>

            <View style={styles.barRow}>
              <Text style={styles.barLabel}>Outlet S2</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: Math.min(100, (outFlow / 35) * 100) + '%',
                      backgroundColor: COLORS.accentYellow,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barValue}>{outFlow.toFixed(1)}</Text>
            </View>
          </View>

          {/* Waveform Component */}
          <View style={styles.waveformWrap}>
            <WaveformChart
              title="Intake vs Distribution Curve"
              currentValue={inFlow}
              averageValue={outFlow}
              deltaValue={flowDifference}
              isAlert={statusState === 'leak'}
            />
          </View>
        </View>

        {/* 6. PIPELINE MONITORING TASKS (Numbered Checklist) */}
        <View style={styles.tasksSection}>
          <View style={styles.tasksHeaderRow}>
            <Text style={styles.sectionTitleCondensed}>MONITORING PIPELINE TASKS</Text>
            <TouchableOpacity onPress={resetDemo} style={styles.resetPillBtn}>
              <Text style={styles.resetPillBtnText}>RESET DEMO</Text>
            </TouchableOpacity>
          </View>

          {/* Task 1: Normal Flow */}
          <TouchableOpacity
            style={[
              styles.taskCard,
              activeScenario === 'normal' && styles.taskCardActive,
            ]}
            onPress={() => setScenario('normal')}
            activeOpacity={0.8}
          >
            <View style={styles.taskLeft}>
              <View style={[styles.taskYellowIndexBox, activeScenario === 'normal' && { backgroundColor: COLORS.accentYellow }]}>
                <Text style={styles.taskYellowIndexText}>01</Text>
              </View>
              <View>
                <Text style={styles.taskTitleCondensed}>NORMAL FLOW VERIFICATION</Text>
                <Text style={styles.taskSubtitle}>Inlet matches outlet (&lt; 0.2 L/min delta)</Text>
              </View>
            </View>
            <View
              style={[
                styles.taskCheckBtn,
                activeScenario === 'normal' && styles.taskCheckBtnActive,
              ]}
            >
              <Ionicons
                name="checkmark"
                size={14}
                color={activeScenario === 'normal' ? '#0D0E11' : '#8F959E'}
              />
            </View>
          </TouchableOpacity>

          {/* Task 2: Pipe Rupture / Leak */}
          <TouchableOpacity
            style={[
              styles.taskCard,
              activeScenario === 'suspected_leak' && styles.taskCardActive,
            ]}
            onPress={() => setScenario('suspected_leak')}
            activeOpacity={0.8}
          >
            <View style={styles.taskLeft}>
              <View style={[styles.taskYellowIndexBox, { backgroundColor: COLORS.danger }]}>
                <Text style={[styles.taskYellowIndexText, { color: '#FFFFFF' }]}>02</Text>
              </View>
              <View>
                <Text style={styles.taskTitleCondensed}>PIPE RUPTURE & LEAK DEFICIT</Text>
                <Text style={styles.taskSubtitle}>Inlet exceeds outlet (&gt; 1.5 L/min sustained)</Text>
              </View>
            </View>
            <View
              style={[
                styles.taskCheckBtn,
                activeScenario === 'suspected_leak' && [styles.taskCheckBtnActive, { backgroundColor: COLORS.danger }],
              ]}
            >
              <Ionicons
                name="checkmark"
                size={14}
                color={activeScenario === 'suspected_leak' ? '#FFFFFF' : '#8F959E'}
              />
            </View>
          </TouchableOpacity>

          {/* Task 3: High Demand Consumption */}
          <TouchableOpacity
            style={[
              styles.taskCard,
              activeScenario === 'abnormal_consumption' && styles.taskCardActive,
            ]}
            onPress={() => setScenario('abnormal_consumption')}
            activeOpacity={0.8}
          >
            <View style={styles.taskLeft}>
              <View style={[styles.taskYellowIndexBox, { backgroundColor: '#F59E0B' }]}>
                <Text style={[styles.taskYellowIndexText, { color: '#FFFFFF' }]}>03</Text>
              </View>
              <View>
                <Text style={styles.taskTitleCondensed}>HIGH CONSUMPTION DEMAND</Text>
                <Text style={styles.taskSubtitle}>Heavy demand (&gt; 25.0 L/min balanced)</Text>
              </View>
            </View>
            <View
              style={[
                styles.taskCheckBtn,
                activeScenario === 'abnormal_consumption' && [
                  styles.taskCheckBtnActive,
                  { backgroundColor: '#F59E0B' },
                ],
              ]}
            >
              <Ionicons
                name="checkmark"
                size={14}
                color={activeScenario === 'abnormal_consumption' ? '#FFFFFF' : '#8F959E'}
              />
            </View>
          </TouchableOpacity>

          {/* Task 4: Sensor Anomaly */}
          <TouchableOpacity
            style={[
              styles.taskCard,
              activeScenario === 'sensor_anomaly' && styles.taskCardActive,
            ]}
            onPress={() => setScenario('sensor_anomaly')}
            activeOpacity={0.8}
          >
            <View style={styles.taskLeft}>
              <View style={[styles.taskYellowIndexBox, { backgroundColor: '#0D9488' }]}>
                <Text style={[styles.taskYellowIndexText, { color: '#FFFFFF' }]}>04</Text>
              </View>
              <View>
                <Text style={styles.taskTitleCondensed}>SENSOR CALIBRATION ANOMALY</Text>
                <Text style={styles.taskSubtitle}>Outlet exceeds inlet (negative deficit check)</Text>
              </View>
            </View>
            <View
              style={[
                styles.taskCheckBtn,
                activeScenario === 'sensor_anomaly' && [
                  styles.taskCheckBtnActive,
                  { backgroundColor: '#0D9488' },
                ],
              ]}
            >
              <Ionicons
                name="checkmark"
                size={14}
                color={activeScenario === 'sensor_anomaly' ? '#FFFFFF' : '#8F959E'}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* 7. HARDWARE CARD WITH ELECTRIC CANARY YELLOW BANNER BUTTON */}
        <View style={styles.hardwareCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.hardwareTitleGroup}>
              <Ionicons name="hardware-chip-outline" size={16} color="#0D0E11" />
              <Text style={styles.sectionTitleCondensed}>TELEMETRY & HARDWARE BRIDGE</Text>
            </View>
            <View style={styles.sourcePill}>
              <Text style={styles.sourcePillText}>{isDemo ? 'LOCAL ENGINE' : 'WOKWI MQTT'}</Text>
            </View>
          </View>

          <View style={styles.hardwareInfoGrid}>
            <View style={styles.hwInfoItem}>
              <Text style={styles.hwInfoLabel}>VIRTUAL ESP32</Text>
              <Text style={styles.hwInfoVal}>
                {isDemo ? 'SIMULATED' : mqttStatus === 'connected' ? 'ONLINE' : 'STANDBY'}
              </Text>
            </View>

            <View style={styles.hwInfoItem}>
              <Text style={styles.hwInfoLabel}>MQTT BROKER</Text>
              <Text style={styles.hwInfoVal}>
                {mqttStatus === 'connected' ? 'CONNECTED' : isDemo ? 'DEMO ACTIVE' : 'DISCONNECTED'}
              </Text>
            </View>

            <View style={styles.hwInfoItem}>
              <Text style={styles.hwInfoLabel}>UPTIME</Text>
              <Text style={styles.hwInfoVal}>T+{elapsed}S</Text>
            </View>
          </View>

          {/* Electric Canary Yellow CTA button matching "-> RUN THE 5-POINT CHECK ->" */}
          <TouchableOpacity
            style={styles.yellowBannerBtn}
            onPress={() => router.push('/wokwi-guide')}
            activeOpacity={0.85}
          >
            <Text style={styles.yellowBannerBtnText}>
              &rarr; RUN WOKWI VIRTUAL HARDWARE CHECK &rarr;
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.canvasBg, // Warm technical parchment (#ECEBE4)
  },
  scrollContent: {
    paddingBottom: 110, // Clearance for bottom floating dock
  },

  /* 1. TOP EDITORIAL HERO CARD */
  editorialHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingTop: 18,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  topMetaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topBrandName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: 0.5,
  },
  topBrandSub: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  indexPillBadge: {
    backgroundColor: COLORS.cardSubtle,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  indexPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: 0.3,
  },
  indexPillSub: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  categoryPillWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryTechLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  headerDateLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.3,
  },

  /* GIANT CONDENSED HEADLINE */
  giantHeadlineWrap: {
    marginVertical: 4,
  },
  giantHeadlineCondensed: {
    fontSize: 42,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: -1,
    lineHeight: 44,
    textTransform: 'uppercase',
  },
  highlighterBox: {
    backgroundColor: COLORS.accentYellow, // #F7FF00 Canary yellow
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
    borderRadius: 4,
  },
  highlighterText: {
    fontSize: 38,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: -0.8,
    lineHeight: 42,
    textTransform: 'uppercase',
  },
  headlineNoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  headlineNoteText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    flex: 1,
    marginRight: 10,
  },
  authorBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D0E11',
    borderRadius: 14,
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: 8,
    gap: 6,
  },
  authorAvatarCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorBadgeName: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  /* Body Content */
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  /* 2. System Status Card */
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statusCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statusCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusExplanationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D0E11',
    lineHeight: 18,
  },

  /* 3. Hero Sensor Card */
  heroSensorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  numberedHeaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  yellowNumberBox: {
    backgroundColor: COLORS.accentYellow, // #F7FF00
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  yellowNumberText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0D0E11',
  },
  numberedSectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: 0.3,
  },
  sensorMetaText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginVertical: 4,
  },
  heroValueCondensed: {
    fontSize: 54,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: -1.5,
    lineHeight: 56,
  },
  heroUnitCondensed: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  flowTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.cardSubtle,
    marginVertical: 10,
    overflow: 'hidden',
  },
  flowTrackFill: {
    height: '100%',
    backgroundColor: COLORS.accentYellow, // Canary yellow fill
    borderRadius: 4,
  },
  sensorCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  sensorFooterText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  /* 4. Supporting Metrics Row */
  metricRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  subMetricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  subMetricAlert: {
    borderColor: COLORS.danger,
    backgroundColor: '#FFF5F5',
  },
  subMetricTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  yellowMiniBox: {
    backgroundColor: COLORS.accentYellow,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  yellowMiniBoxText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0D0E11',
  },
  subMetricLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: 0.3,
  },
  subMetricValueCondensed: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: -0.5,
  },
  subMetricUnit: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  subMetricFoot: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
  },

  /* 5. Dual Flow Comparison & Waveform */
  comparisonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  comparisonHeader: {
    marginBottom: 12,
  },
  comparisonSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  barCompareWrap: {
    gap: 8,
    marginBottom: 12,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barLabel: {
    width: 62,
    fontSize: 11,
    fontWeight: '800',
    color: '#0D0E11',
    textTransform: 'uppercase',
  },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.cardSubtle,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  barValue: {
    width: 34,
    fontSize: 12,
    fontWeight: '900',
    color: '#0D0E11',
    textAlign: 'right',
  },
  waveformWrap: {
    alignItems: 'center',
    marginTop: 4,
  },

  /* 6. Pipeline Tasks */
  tasksSection: {
    marginBottom: 12,
  },
  tasksHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitleCondensed: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  resetPillBtn: {
    backgroundColor: COLORS.cardSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  resetPillBtnText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: 0.3,
  },
  taskCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  taskCardActive: {
    borderColor: '#0D0E11',
    borderWidth: 2,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  taskYellowIndexBox: {
    backgroundColor: COLORS.cardSubtle,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  taskYellowIndexText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0D0E11',
  },
  taskTitleCondensed: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: 0.3,
  },
  taskSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  taskCheckBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckBtnActive: {
    backgroundColor: COLORS.accentYellow,
    borderColor: '#0D0E11',
  },

  /* 7. Hardware Card */
  hardwareCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  hardwareTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourcePill: {
    backgroundColor: COLORS.cardSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sourcePillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: 0.5,
  },
  hardwareInfoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  hwInfoItem: {
    flex: 1,
  },
  hwInfoLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  hwInfoVal: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0D0E11',
  },

  /* Electric Canary Yellow CTA button matching "-> RUN THE 5-POINT CHECK ->" */
  yellowBannerBtn: {
    backgroundColor: COLORS.accentYellow, // #F7FF00 Canary yellow
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2EA00',
  },
  yellowBannerBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
