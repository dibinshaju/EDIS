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
          color: COLORS.warning,
          bgColor: '#FFFBEB',
          borderColor: '#FDE68A',
          icon: 'speedometer-outline' as const,
          explanation: 'Heavy demand (>25.0 L/min). Flow balanced across nodes.',
        };
      case 'checking':
        return {
          title: 'Checking Deficit',
          color: COLORS.warning,
          bgColor: '#FFFBEB',
          borderColor: '#FDE68A',
          icon: 'time-outline' as const,
          explanation: 'Transient mismatch under evaluation against persistence filter.',
        };
      case 'normal':
      default:
        return {
          title: 'Normal Flow',
          color: COLORS.success,
          bgColor: '#ECFDF5',
          borderColor: '#A7F3D0',
          icon: 'checkmark-circle-outline' as const,
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
      {/* 1. EDITORIAL HERO SECTION WITH LARGE PAGE-FILLING TYPOGRAPHY (From Uploaded Image) */}
      <View style={styles.editorialHeaderCard}>
        {/* Top bar matching "Carousel" on left and "01 of 10" pill on right */}
        <View style={styles.topMetaBar}>
          <View style={styles.brandTitleWrap}>
            <Text style={styles.topBrandName}>AquaGuard</Text>
            <View style={styles.livePulseDot} />
          </View>

          <View style={styles.indexPillBadge}>
            <Text style={styles.indexPillText}>01 <Text style={styles.indexPillSub}>of 04</Text></Text>
          </View>
        </View>

        {/* Category Pill matching "Resources" pill in uploaded image */}
        <View style={styles.categoryPillWrap}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>Water Telemetry</Text>
          </View>
          <Text style={styles.headerDateLabel}>{todayDateStr}</Text>
        </View>

        {/* GIANT EDITORIAL HEADLINE FILLING THE PAGE (Exact match to "Best Google fonts for tech websites") */}
        <View style={styles.giantHeadlineWrap}>
          <Text style={styles.giantHeadlineDark}>Smart Water</Text>
          <Text style={styles.giantHeadlineDark}>
            monitor for <Text style={styles.giantHeadlineOrange}>pipeline</Text>
          </Text>
          <Text style={styles.giantHeadlineOrange}>leakage</Text>
        </View>

        {/* Floating dark badge matching "Inayat Naqvi" author pill in uploaded photo */}
        <View style={styles.floatingAuthorPillWrap}>
          <View style={styles.authorBadgePill}>
            <View style={styles.authorAvatarCircle}>
              <Ionicons name="hardware-chip" size={13} color={COLORS.darkCharcoal} />
            </View>
            <Text style={styles.authorBadgeName}>
              {isDemo ? 'Virtual Simulation' : 'ESP32 MQTT Link'}
            </Text>
            <View style={[styles.statusDotSmall, { backgroundColor: isDemo ? COLORS.accentOrange : COLORS.success }]} />
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

            <View style={[styles.statusCheckCircle, { backgroundColor: sysStatus.color }]}>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </View>
          </View>

          <Text style={styles.statusExplanationText}>{sysStatus.explanation}</Text>
        </View>

        {/* 3. HERO SENSOR CARD (Massive typography filling the card) */}
        <View style={styles.heroSensorCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.sensorPillTag}>
              <View style={styles.sensorDotOrange} />
              <Text style={styles.sensorPillText}>01 S1 INLET FLOW</Text>
            </View>
            <Text style={styles.sensorMetaText}>MUNICIPAL MAIN</Text>
          </View>

          <View style={styles.valueRow}>
            <Text style={styles.heroValueLarge}>{formatFlow(inFlow)}</Text>
            <Text style={styles.heroUnitOrange}>L/min</Text>
          </View>

          {/* Flow progress track with tech vermillion orange accent */}
          <View style={styles.flowTrack}>
            <View
              style={[
                styles.flowTrackFill,
                { width: Math.min(100, Math.max(5, (inFlow / 35) * 100)) + '%' },
              ]}
            />
          </View>

          <View style={styles.sensorCardFooter}>
            <Text style={styles.sensorFooterText}>Primary pipeline intake • Baseline 12.0 L/m</Text>
            <Ionicons name="arrow-forward" size={14} color={COLORS.darkCharcoal} />
          </View>
        </View>

        {/* 4. SUPPORTING METRICS ROW (3 Cards) */}
        <View style={styles.metricRow}>
          {/* S2 Outlet */}
          <View style={styles.subMetricCard}>
            <View style={styles.subMetricTop}>
              <Ionicons name="arrow-up-circle-outline" size={14} color="#0D9488" />
              <Text style={styles.subMetricLabel}>S2 OUTLET</Text>
            </View>
            <Text style={styles.subMetricValue}>
              {formatFlow(outFlow)} <Text style={styles.subMetricUnit}>L/m</Text>
            </Text>
            <Text style={styles.subMetricFoot}>Distribution</Text>
          </View>

          {/* Flow Delta */}
          <View style={[styles.subMetricCard, flowDifference > 1.5 && styles.subMetricAlert]}>
            <View style={styles.subMetricTop}>
              <Ionicons
                name="git-compare-outline"
                size={14}
                color={flowDifference > 1.5 ? COLORS.danger : COLORS.accentOrange}
              />
              <Text style={styles.subMetricLabel}>FLOW DELTA</Text>
            </View>
            <Text
              style={[
                styles.subMetricValue,
                flowDifference > 1.5 && { color: COLORS.danger },
              ]}
            >
              {flowDifference >= 0 ? '+' : ''}
              {formatFlow(flowDifference)} <Text style={styles.subMetricUnit}>L/m</Text>
            </Text>
            <Text style={styles.subMetricFoot}>
              {flowDifference > 1.5 ? 'Deficit' : 'Inlet - Outlet'}
            </Text>
          </View>

          {/* Today Consumption */}
          <View style={styles.subMetricCard}>
            <View style={styles.subMetricTop}>
              <Ionicons name="water-outline" size={14} color={COLORS.darkCharcoal} />
              <Text style={styles.subMetricLabel}>CONSUMPTION</Text>
            </View>
            <Text style={styles.subMetricValue}>
              {totalVolumeLiters.toFixed(1)} <Text style={styles.subMetricUnit}>L</Text>
            </Text>
            <Text style={styles.subMetricFoot}>Today Total</Text>
          </View>
        </View>

        {/* 5. INLET VS OUTLET DUAL COMPARISON & WAVEFORM */}
        <View style={styles.comparisonCard}>
          <View style={styles.comparisonHeader}>
            <Text style={styles.sectionTitle}>Inlet vs Outlet Comparison</Text>
            <Text style={styles.comparisonSubtitle}>
              {Math.abs(flowDifference) < 0.2
                ? 'Balanced Pipeline Stream'
                : flowDifference > 0
                ? flowDifference.toFixed(1) + ' L/min Deficit Detected'
                : Math.abs(flowDifference).toFixed(1) + ' L/min Reversed Flow'}
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
                      backgroundColor: COLORS.darkCharcoal,
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
                      backgroundColor: COLORS.accentOrange,
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

        {/* 6. PIPELINE MONITORING TASKS (Task Checklist Structure) */}
        <View style={styles.tasksSection}>
          <View style={styles.tasksHeaderRow}>
            <Text style={styles.sectionTitle}>Pipeline Monitoring Tasks</Text>
            <TouchableOpacity onPress={resetDemo} style={styles.resetPillBtn}>
              <Text style={styles.resetPillBtnText}>Reset Demo</Text>
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
              <View style={[styles.taskStatusDot, { backgroundColor: COLORS.success }]} />
              <View>
                <Text style={styles.taskTitle}>Normal Flow Verification</Text>
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
                color={activeScenario === 'normal' ? COLORS.accentOrange : '#8F959E'}
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
              <View style={[styles.taskStatusDot, { backgroundColor: COLORS.danger }]} />
              <View>
                <Text style={styles.taskTitle}>Pipe Rupture & Leak Deficit</Text>
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
              <View style={[styles.taskStatusDot, { backgroundColor: COLORS.warning }]} />
              <View>
                <Text style={styles.taskTitle}>High Consumption Demand</Text>
                <Text style={styles.taskSubtitle}>Heavy demand (&gt; 25.0 L/min balanced)</Text>
              </View>
            </View>
            <View
              style={[
                styles.taskCheckBtn,
                activeScenario === 'abnormal_consumption' && [
                  styles.taskCheckBtnActive,
                  { backgroundColor: COLORS.warning },
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
              <View style={[styles.taskStatusDot, { backgroundColor: '#0D9488' }]} />
              <View>
                <Text style={styles.taskTitle}>Sensor Calibration Anomaly</Text>
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

        {/* 7. HARDWARE & WOKWI LINK (With "Save for later" style pill button) */}
        <View style={styles.hardwareCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.hardwareTitleGroup}>
              <Ionicons name="hardware-chip-outline" size={16} color={COLORS.darkCharcoal} />
              <Text style={styles.sectionTitle}>Telemetry & Virtual Link</Text>
            </View>
            <View style={styles.sourcePill}>
              <Text style={styles.sourcePillText}>{isDemo ? 'Local Engine' : 'Wokwi MQTT'}</Text>
            </View>
          </View>

          <View style={styles.hardwareInfoGrid}>
            <View style={styles.hwInfoItem}>
              <Text style={styles.hwInfoLabel}>Virtual ESP32</Text>
              <Text style={styles.hwInfoVal}>
                {isDemo ? 'Simulated' : mqttStatus === 'connected' ? 'Online' : 'Standby'}
              </Text>
            </View>

            <View style={styles.hwInfoItem}>
              <Text style={styles.hwInfoLabel}>MQTT Broker</Text>
              <Text style={styles.hwInfoVal}>
                {mqttStatus === 'connected' ? 'Connected' : isDemo ? 'Demo Active' : 'Disconnected'}
              </Text>
            </View>

            <View style={styles.hwInfoItem}>
              <Text style={styles.hwInfoLabel}>Active Time</Text>
              <Text style={styles.hwInfoVal}>T+{elapsed}s</Text>
            </View>
          </View>

          {/* Button in the exact style of "Save for later" pill in uploaded photo! */}
          <TouchableOpacity
            style={styles.saveForLaterStyleBtn}
            onPress={() => router.push('/wokwi-guide')}
            activeOpacity={0.8}
          >
            <Ionicons name="link-outline" size={15} color={COLORS.darkCharcoal} />
            <Text style={styles.saveForLaterBtnText}>Open Wokwi Simulation Guide</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.canvasBg, // Warm ivory stone (#EFECE6)
  },
  scrollContent: {
    paddingBottom: 110, // Clearance for bottom floating dock
  },

  /* 1. EDITORIAL HERO SECTION WITH LARGE PAGE-FILLING TYPOGRAPHY */
  editorialHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingTop: 18,
    paddingBottom: 28,
    paddingHorizontal: 22,
    borderBottomWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  topMetaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBrandName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.darkCharcoal,
    letterSpacing: -0.3,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentOrange,
  },
  indexPillBadge: {
    backgroundColor: COLORS.cardSubtle, // #E5E2DA from image ("01 of 10")
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  indexPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.darkCharcoal,
  },
  indexPillSub: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  categoryPillWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  categoryPill: {
    backgroundColor: COLORS.cardSubtle, // #E5E2DA pill from image ("Resources")
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.darkCharcoal,
    letterSpacing: 0.2,
  },
  headerDateLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  /* GIANT EDITORIAL HEADLINE FILLING THE PAGE */
  giantHeadlineWrap: {
    marginVertical: 4,
  },
  giantHeadlineDark: {
    fontSize: 38,
    fontWeight: '900',
    color: COLORS.darkCharcoal, // Jet black (#111215)
    letterSpacing: -1.8,
    lineHeight: 42,
  },
  giantHeadlineOrange: {
    fontSize: 38,
    fontWeight: '900',
    color: COLORS.accentOrange, // Bold vibrant tech orange (#FF5522)
    letterSpacing: -1.8,
    lineHeight: 42,
  },

  /* Floating Author/Node Badge (Matching "Inayat Naqvi" badge in uploaded photo) */
  floatingAuthorPillWrap: {
    marginTop: 18,
    alignItems: 'flex-end',
  },
  authorBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkCharcoal, // Jet black pill (#111215)
    borderRadius: 20,
    paddingVertical: 5,
    paddingLeft: 5,
    paddingRight: 12,
    gap: 7,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  authorAvatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorBadgeName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  statusDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  /* Body Content */
  bodyContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },

  /* 2. System Status Card */
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
    borderRadius: 14,
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
    color: COLORS.textPrimary,
    lineHeight: 18,
  },

  /* 3. Hero Sensor Card */
  heroSensorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sensorPillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.cardSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  sensorDotOrange: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentOrange,
  },
  sensorPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.darkCharcoal,
    letterSpacing: 0.5,
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
  heroValueLarge: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.darkCharcoal,
    letterSpacing: -2,
    lineHeight: 52,
  },
  heroUnitOrange: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.accentOrange,
  },
  flowTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.cardSubtle,
    marginVertical: 10,
    overflow: 'hidden',
  },
  flowTrackFill: {
    height: '100%',
    backgroundColor: COLORS.accentOrange, // Tech vermillion orange
    borderRadius: 3,
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
    marginBottom: 14,
  },
  subMetricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
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
    gap: 4,
    marginBottom: 6,
  },
  subMetricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.3,
  },
  subMetricValue: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.darkCharcoal,
    letterSpacing: -0.5,
  },
  subMetricUnit: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  subMetricFoot: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  /* 5. Dual Flow Comparison & Waveform */
  comparisonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  comparisonHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.darkCharcoal,
    letterSpacing: -0.4,
  },
  comparisonSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
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
    width: 58,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
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
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.darkCharcoal,
    textAlign: 'right',
  },
  waveformWrap: {
    alignItems: 'center',
    marginTop: 4,
  },

  /* 6. Pipeline Tasks */
  tasksSection: {
    marginBottom: 14,
  },
  tasksHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resetPillBtn: {
    backgroundColor: COLORS.cardSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resetPillBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.darkCharcoal,
  },
  taskCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  taskCardActive: {
    borderColor: COLORS.darkCharcoal,
    borderWidth: 1.5,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  taskStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.darkCharcoal,
    letterSpacing: -0.3,
  },
  taskSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  taskCheckBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckBtnActive: {
    backgroundColor: COLORS.darkCharcoal,
    borderColor: COLORS.darkCharcoal,
  },

  /* 7. Hardware Card */
  hardwareCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
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
    borderRadius: 10,
  },
  sourcePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.darkCharcoal,
  },
  hardwareInfoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 14,
  },
  hwInfoItem: {
    flex: 1,
  },
  hwInfoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  hwInfoVal: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.darkCharcoal,
  },

  /* Button matching "Save for later" pill in uploaded photo! */
  saveForLaterStyleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.cardSubtle, // #E5E2DA
    paddingVertical: 11,
    borderRadius: 16,
  },
  saveForLaterBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.darkCharcoal,
  },
});
