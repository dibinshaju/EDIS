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
      {/* 1. TOP CURVED DARK CHARCOAL HEADER (Structure Image 1) */}
      <View style={styles.curvedHeader}>
        {/* Header Top Bar */}
        <View style={styles.headerTopRow}>
          <View style={styles.brandRow}>
            <View style={styles.brandIconBox}>
              <Ionicons name="water" size={18} color={COLORS.accentLime} />
            </View>
            <View>
              <Text style={styles.brandTitle}>AquaGuard</Text>
              <Text style={styles.brandSubtitle}>Smart Water Monitor</Text>
            </View>
          </View>

          <View style={styles.headerRightActions}>
            <View style={[styles.modePill, isDemo ? styles.modePillDemo : styles.modePillLive]}>
              <View style={[styles.modeDot, isDemo ? styles.modeDotDemo : styles.modeDotLive]} />
              <Text style={[styles.modePillText, isDemo ? styles.modeTextDemo : styles.modeTextLive]}>
                {isDemo ? 'DEMO' : 'LIVE'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => router.push('/alerts')}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
              {activeCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{activeCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Date & Sub-headline */}
        <View style={styles.headerMetaRow}>
          <Text style={styles.headerDateText}>{todayDateStr}</Text>
          <Text style={styles.headerTimeText}>
            Updated {formatTime(currentReading.timestamp || Date.now())}
          </Text>
        </View>

        {/* Plus Jakarta Sans Grotesque Headline (Font Image 2) */}
        <View style={styles.headlineWrap}>
          <Text style={styles.headlinePrimary}>Real-Time Telemetry &</Text>
          <Text style={styles.headlineAccent}>Leak Detection</Text>
        </View>
      </View>

      {/* 2. OVERLAPPING FLOATING SEARCH / FILTER BAR (Structure Image 1) */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#8F959E" />
          <Text style={styles.searchPlaceholder}>Search telemetry, alerts, sensors...</Text>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => router.push('/history')}
            activeOpacity={0.7}
          >
            <Ionicons name="options-outline" size={16} color={COLORS.darkCharcoal} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bodyContent}>
        {/* 3. FEATURED ASYMMETRIC "PROJECT" SECTION (Structure Image 1) */}
        {/* Hero Sensor 1 (Inlet) Card */}
        <View style={styles.heroSensorCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.categoryPill}>
              <View style={styles.categoryDot} />
              <Text style={styles.categoryPillText}>01 S1 INLET</Text>
            </View>
            <Text style={styles.cardHeaderMeta}>MUNICIPAL MAIN</Text>
          </View>

          <View style={styles.valueRow}>
            <Text style={styles.heroValueText}>{formatFlow(inFlow)}</Text>
            <Text style={styles.heroValueUnit}>L/min</Text>
          </View>

          {/* Flow progress track with neon lime accent */}
          <View style={styles.flowTrack}>
            <View
              style={[
                styles.flowTrackFill,
                { width: Math.min(100, Math.max(5, (inFlow / 35) * 100)) + '%' },
              ]}
            />
          </View>

          <View style={styles.sensorCardFooter}>
            <Text style={styles.sensorFooterText}>Primary pipeline entry • Baseline 12.0 L/m</Text>
            <Ionicons name="arrow-forward" size={14} color="#8F959E" />
          </View>
        </View>

        {/* System Status Card */}
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

        {/* Supporting Metrics Strip (3 Cards) */}
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
                color={flowDifference > 1.5 ? COLORS.danger : '#8F959E'}
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
              <Text style={styles.subMetricLabel}>TODAY</Text>
            </View>
            <Text style={styles.subMetricValue}>
              {totalVolumeLiters.toFixed(1)} <Text style={styles.subMetricUnit}>L</Text>
            </Text>
            <Text style={styles.subMetricFoot}>Cumulative</Text>
          </View>
        </View>

        {/* 4. DUAL FLOW COMPARISON & WAVEFORM (Color Theme Image 3) */}
        <View style={styles.comparisonCard}>
          <View style={styles.comparisonHeader}>
            <View>
              <Text style={styles.sectionTitle}>Inlet vs Outlet Comparison</Text>
              <Text style={styles.comparisonSubtitle}>
                {Math.abs(flowDifference) < 0.2
                  ? 'Balanced Pipeline'
                  : flowDifference > 0
                  ? flowDifference.toFixed(1) + ' L/min Deficit Detected'
                  : Math.abs(flowDifference).toFixed(1) + ' L/min Reversed Flow'}
              </Text>
            </View>
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
                      backgroundColor: COLORS.accentLimeDark,
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

        {/* 5. ACTIVE MONITORING TASKS (Task Checklist Structure Image 1) */}
        <View style={styles.tasksSection}>
          <View style={styles.tasksHeaderRow}>
            <Text style={styles.sectionTitle}>Pipeline Monitoring Tasks</Text>
            <TouchableOpacity onPress={resetDemo} style={styles.resetPill}>
              <Text style={styles.resetPillText}>Reset Demo</Text>
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
                color={activeScenario === 'normal' ? COLORS.accentLime : '#8F959E'}
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

        {/* 6. HARDWARE & WOKWI TELEMETRY LINK */}
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

          <TouchableOpacity
            style={styles.wokwiGuideBtn}
            onPress={() => router.push('/wokwi-guide')}
            activeOpacity={0.8}
          >
            <Ionicons name="link-outline" size={15} color={COLORS.darkCharcoal} />
            <Text style={styles.wokwiGuideBtnText}>Open Wokwi Simulation Guide</Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 110, // Clearance for floating tab bar
  },

  /* 1. Curved Dark Charcoal Header (Structure Image 1) */
  curvedHeader: {
    backgroundColor: COLORS.darkCharcoal, // #16181B
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingTop: 16,
    paddingBottom: 38,
    paddingHorizontal: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8F959E',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  modePillDemo: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  modePillLive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  modeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modeDotDemo: {
    backgroundColor: COLORS.accentLime,
  },
  modeDotLive: {
    backgroundColor: COLORS.success,
  },
  modePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modeTextDemo: {
    color: COLORS.accentLime,
  },
  modeTextLive: {
    color: '#6EE7B7',
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    marginBottom: 8,
  },
  headerDateText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accentLime,
    letterSpacing: 0.2,
  },
  headerTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8F959E',
  },
  headlineWrap: {
    marginTop: 4,
  },
  headlinePrimary: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    lineHeight: 28,
  },
  headlineAccent: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.accentLime, // Neon yellow-lime accent (#D8FA1E)
    letterSpacing: -1,
    lineHeight: 28,
  },

  /* 2. Overlapping Floating Search Bar (Structure Image 1) */
  searchBarWrapper: {
    marginTop: -22,
    paddingHorizontal: 18,
    zIndex: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#8F959E',
    marginLeft: 10,
  },
  filterBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.cardSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Body Content */
  bodyContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },

  /* 3. Featured Asymmetric Sensor Card (Structure Image 1) */
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
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.cardSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentLimeDark,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.darkCharcoal,
    letterSpacing: 0.5,
  },
  cardHeaderMeta: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8F959E',
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginVertical: 4,
  },
  heroValueText: {
    fontSize: 38,
    fontWeight: '900',
    color: COLORS.darkCharcoal,
    letterSpacing: -1.5,
  },
  heroValueUnit: {
    fontSize: 16,
    fontWeight: '800',
    color: '#8F959E',
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
    backgroundColor: COLORS.accentLimeDark, // Neon lime accent
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
    color: '#6E737B',
  },

  /* System Status Card */
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
    shadowRadius: 10,
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

  /* Supporting Metrics Row */
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
    color: '#8F959E',
    letterSpacing: 0.3,
  },
  subMetricValue: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.darkCharcoal,
    letterSpacing: -0.5,
  },
  subMetricUnit: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8F959E',
  },
  subMetricFoot: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8F959E',
    marginTop: 2,
  },

  /* 4. Dual Flow Comparison & Waveform */
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
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.darkCharcoal,
    letterSpacing: -0.3,
  },
  comparisonSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6E737B',
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
    color: '#6E737B',
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

  /* 5. Pipeline Tasks (Structure Image 1) */
  tasksSection: {
    marginBottom: 14,
  },
  tasksHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resetPill: {
    backgroundColor: COLORS.cardSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resetPillText: {
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
    color: '#8F959E',
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

  /* 6. Hardware Card */
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
    color: '#8F959E',
    marginBottom: 2,
  },
  hwInfoVal: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.darkCharcoal,
  },
  wokwiGuideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.cardSubtle,
    paddingVertical: 10,
    borderRadius: 14,
  },
  wokwiGuideBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.darkCharcoal,
  },
});
