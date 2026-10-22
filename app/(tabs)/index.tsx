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
import Svg, { Path } from 'react-native-svg';

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
      {/* 1. TOP ENGAGEPRO MODULAR CARD (Matching Reference Image media_1792696244517.jpg) */}
      <View style={styles.topModularCard}>
        {/* Header: AquaGuard® on left, = MENU + Quick Nav on right */}
        <View style={styles.headerBar}>
          <View style={styles.brandGroup}>
            <View style={styles.brandIconCircle}>
              <Ionicons name="water" size={14} color="#0D0E11" />
            </View>
            <Text style={styles.brandTitleText}>AquaGuard®</Text>
          </View>

          <View style={styles.headerRightGroup}>
            {/* Nav symbols */}
            <TouchableOpacity onPress={() => router.push('/')} style={[styles.miniNavBtn, styles.miniNavBtnActive]}>
              <Ionicons name="home" size={13} color="#0D0E11" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/scenarios')} style={styles.miniNavBtn}>
              <Ionicons name="construct-outline" size={13} color="#0D0E11" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/alerts')} style={styles.miniNavBtn}>
              <Ionicons name="notifications-outline" size={13} color="#0D0E11" />
              {activeCount > 0 && <View style={styles.miniDotAlert} />}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/admin')} style={styles.miniNavBtn}>
              <Ionicons name="shield-checkmark-outline" size={13} color="#0D0E11" />
            </TouchableOpacity>

            {/* "= MENU" button from reference */}
            <TouchableOpacity onPress={() => router.push('/admin')} style={styles.menuBtn} activeOpacity={0.8}>
              <View style={styles.menuLines}>
                <View style={styles.menuLine} />
                <View style={styles.menuLine} />
              </View>
              <Text style={styles.menuText}>MENU</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Category Title Row with Circular Arrow Button (Exact match to Screen 1: "Social media Management ( ↗ )") */}
        <View style={styles.categoryActionRow}>
          <View style={styles.categoryTitleGroup}>
            <Text style={styles.categoryTitleBold}>Water pipeline</Text>
            <Text style={styles.categoryTitleItalic}>Monitoring</Text>
          </View>
          <TouchableOpacity
            style={styles.circleArrowBtn}
            onPress={() => router.push('/history')}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-up-outline" size={18} color="#0D0E11" style={{ transform: [{ rotate: '45deg' }] }} />
          </TouchableOpacity>
        </View>

        {/* Hero Big Display Headline (Screen 2: "Easily boost your social media engagement") */}
        <View style={styles.headlineBlock}>
          <Text style={styles.displayHeading}>Easily detect</Text>
          <Text style={styles.displayHeading}>pipeline leaks &</Text>
          <Text style={styles.displayHeading}>consumption</Text>
          <Text style={styles.headlineSubtitle}>
            Autonomous IoT telemetry & deficit persistence analytics
          </Text>
        </View>

        {/* 3-COLUMN METRIC ROW (Exact match to Screen 1: User Growth 56.3% | RIO 75% | Engagement 30%) */}
        <View style={styles.threeColMetricCard}>
          <View style={styles.colMetricItem}>
            <Text style={styles.colMetricLabel}>Inlet Flow</Text>
            <View style={styles.colMetricValRow}>
              <Text style={styles.colMetricValue}>{formatFlow(inFlow)}</Text>
              <Text style={styles.colMetricUnit}>L/m</Text>
            </View>
          </View>

          <View style={styles.colMetricDivider} />

          <View style={styles.colMetricItem}>
            <Text style={styles.colMetricLabel}>Outlet Flow</Text>
            <View style={styles.colMetricValRow}>
              <Text style={styles.colMetricValue}>{formatFlow(outFlow)}</Text>
              <Text style={styles.colMetricUnit}>L/m</Text>
            </View>
          </View>

          <View style={styles.colMetricDivider} />

          <View style={[styles.colMetricItem, flowDifference > 1.5 && { backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}>
            <Text style={[styles.colMetricLabel, flowDifference > 1.5 && { color: COLORS.danger }]}>Flow Delta</Text>
            <View style={styles.colMetricValRow}>
              <Text style={[styles.colMetricValue, flowDifference > 1.5 && { color: COLORS.danger }]}>
                {flowDifference >= 0 ? '+' : ''}{formatFlow(flowDifference)}
              </Text>
              <Text style={[styles.colMetricUnit, flowDifference > 1.5 && { color: COLORS.danger }]}>L/m</Text>
            </View>
          </View>
        </View>

        {/* STACKED STEP STRIP CARDS WITH GIANT MONOGRAM (Exact match to Screen 1: Step 1, Step 2, Step 3 over giant letterform) */}
        <View style={styles.stepStripsContainer}>
          {/* Giant Background Monogram ("W" for Water) */}
          <View style={styles.monogramBackdrop} pointerEvents="none">
            <Text style={styles.monogramText}>W</Text>
          </View>

          <View style={styles.stepStripRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>Step 1</Text>
            </View>
            <View style={styles.stepContentWrap}>
              <Text style={styles.stepTitle}>Municipal Intake Baseline</Text>
              <Text style={styles.stepDesc}>S1 Ultrasonic metering: {formatFlow(inFlow)} L/min baseline</Text>
            </View>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.accentYellow} />
          </View>

          <View style={styles.stepStripDivider} />

          <View style={styles.stepStripRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>Step 2</Text>
            </View>
            <View style={styles.stepContentWrap}>
              <Text style={styles.stepTitle}>Deficit Persistence Evaluation</Text>
              <Text style={styles.stepDesc}>
                {flowDifference > 1.5 ? 'Deficit persistence exceeded (>1.5 L/min)' : 'Real-time 3.0s window: Certified Normal'}
              </Text>
            </View>
            <Ionicons
              name={flowDifference > 1.5 ? 'alert-circle' : 'checkmark-circle'}
              size={16}
              color={flowDifference > 1.5 ? COLORS.danger : COLORS.accentYellow}
            />
          </View>

          <View style={styles.stepStripDivider} />

          <View style={styles.stepStripRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>Step 3</Text>
            </View>
            <View style={styles.stepContentWrap}>
              <Text style={styles.stepTitle}>Autonomous Solenoid Isolation</Text>
              <Text style={styles.stepDesc}>Valve State: Open • Pipeline Health 100%</Text>
            </View>
            <Ionicons name="shield-checkmark" size={16} color={COLORS.accentYellow} />
          </View>
        </View>

        {/* SPLIT 2-BLOCK METRIC CARDS (Exact match to Screen 2: Left Yellow "Audience Reach 56.3%", Right "Audience Online 86.5%") */}
        <View style={styles.splitBlockContainer}>
          {/* Left Block: Electric Canary Yellow */}
          <TouchableOpacity
            style={styles.splitBlockYellow}
            onPress={() => router.push('/history')}
            activeOpacity={0.88}
          >
            <Text style={styles.splitBlockLabelDark}>Audience Reach • Today's Volume</Text>
            <View style={styles.splitValueRow}>
              <Text style={styles.splitValueDark}>{totalVolumeLiters.toFixed(1)}</Text>
              <Text style={styles.splitUnitDark}>L</Text>
            </View>
            <Text style={styles.splitSubDark}>Metered municipal consumption</Text>
          </TouchableOpacity>

          {/* Right Block: Paper White Technical Surface */}
          <TouchableOpacity
            style={styles.splitBlockWhite}
            onPress={() => router.push('/alerts')}
            activeOpacity={0.88}
          >
            <Text style={styles.splitBlockLabelLight}>System Integrity • Telemetry</Text>
            <View style={styles.splitValueRow}>
              <Text style={[styles.splitValueLight, statusState === 'leak' && { color: COLORS.danger }]}>
                {statusState === 'leak' ? 'DEFICIT' : '98.5%'}
              </Text>
            </View>
            <Text style={styles.splitSubLight}>
              {statusState === 'leak' ? 'Suspected Leak Active' : 'Dual-node calibrated'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* BOTTOM FULL-WIDTH ACTION BANNER (Exact match to Screen 2: "Details ▶") */}
        <TouchableOpacity
          style={styles.detailsActionBanner}
          onPress={() => router.push('/wokwi-guide')}
          activeOpacity={0.85}
        >
          <View style={styles.detailsBannerLeft}>
            <Ionicons name="hardware-chip-outline" size={16} color={COLORS.accentYellow} />
            <Text style={styles.detailsBannerText}>Details • Wokwi Virtual Hardware Suite</Text>
          </View>
          <View style={styles.playTriangleWrap}>
            <Ionicons name="play" size={14} color={COLORS.accentYellow} />
          </View>
        </TouchableOpacity>

        {/* Simulation Scenario Pill */}
        <View style={styles.heroSimulateRow}>
          <Text style={styles.heroSimulateLabel}>Quick Scenario Test:</Text>
          <View style={styles.miniDotRow}>
            <TouchableOpacity
              onPress={() => setScenario('normal')}
              style={[styles.scenarioDotBtn, activeScenario === 'normal' && styles.scenarioDotBtnActive]}
            >
              <Ionicons name="checkmark" size={11} color="#0D0E11" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setScenario('suspected_leak')}
              style={[styles.scenarioDotBtn, activeScenario === 'suspected_leak' && { backgroundColor: COLORS.danger }]}
            >
              <Ionicons name="alert" size={11} color={activeScenario === 'suspected_leak' ? '#FFFFFF' : '#0D0E11'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setScenario('abnormal_consumption')}
              style={[styles.scenarioDotBtn, activeScenario === 'abnormal_consumption' && { backgroundColor: '#F59E0B' }]}
            >
              <Ionicons name="speedometer" size={11} color={activeScenario === 'abnormal_consumption' ? '#FFFFFF' : '#0D0E11'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.bodyContent}>

        {/* 4. SYSTEM STATUS BANNER */}
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

        {/* 5. FLOW COMPARISON & WAVEFORM CARD */}
        <View style={styles.comparisonCard}>
          <View style={styles.comparisonHeader}>
            <Text style={styles.sectionTitleDark}>INLET VS OUTLET DUAL COMPARISON</Text>
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
                      backgroundColor: '#FFFFFF',
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

        {/* 6. PIPELINE MONITORING TASKS */}
        <View style={styles.tasksSection}>
          <View style={styles.tasksHeaderRow}>
            <Text style={styles.sectionTitleDark}>MONITORING PIPELINE SCENARIOS</Text>
            <TouchableOpacity onPress={resetDemo} style={styles.resetBtn}>
              <Text style={styles.resetBtnText}>RESET DEMO</Text>
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
              <View style={[styles.taskIndexBox, activeScenario === 'normal' && { backgroundColor: COLORS.accentYellow }]}>
                <Text style={styles.taskIndexText}>01</Text>
              </View>
              <View>
                <Text style={styles.taskTitle}>NORMAL FLOW VERIFICATION</Text>
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
              <View style={[styles.taskIndexBox, { backgroundColor: COLORS.danger }]}>
                <Text style={[styles.taskIndexText, { color: '#FFFFFF' }]}>02</Text>
              </View>
              <View>
                <Text style={styles.taskTitle}>PIPE RUPTURE & LEAK DEFICIT</Text>
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
              <View style={[styles.taskIndexBox, { backgroundColor: '#F59E0B' }]}>
                <Text style={[styles.taskIndexText, { color: '#FFFFFF' }]}>03</Text>
              </View>
              <View>
                <Text style={styles.taskTitle}>HIGH CONSUMPTION DEMAND</Text>
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
              <View style={[styles.taskIndexBox, { backgroundColor: '#0D9488' }]}>
                <Text style={[styles.taskIndexText, { color: '#FFFFFF' }]}>04</Text>
              </View>
              <View>
                <Text style={styles.taskTitle}>SENSOR CALIBRATION ANOMALY</Text>
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

        {/* 7. HARDWARE CARD WITH ELECTRIC CANARY YELLOW BANNER */}
        <View style={styles.hardwareCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.hardwareTitleGroup}>
              <Ionicons name="hardware-chip-outline" size={16} color="#FFFFFF" />
              <Text style={styles.sectionTitleDark}>TELEMETRY & HARDWARE BRIDGE</Text>
            </View>
            <View style={styles.sourcePillDark}>
              <Text style={styles.sourcePillTextDark}>{isDemo ? 'LOCAL ENGINE' : 'WOKWI MQTT'}</Text>
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
    backgroundColor: COLORS.canvasBg, // Deep dark canvas #121316
  },
  scrollContent: {
    paddingBottom: 110, // Clearance for bottom dock
  },

  /* 1. TOP ASYMMETRICAL WHITE HERO CARD */
  topHeroCard: {
    backgroundColor: '#F3F2EB',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingTop: 16,
    paddingBottom: 22,
    paddingHorizontal: 20,
    position: 'relative',
  },
  heroTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: 0.2,
  },
  topNavSymbolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topNavIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EAE8DE',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  topNavIconBtnActive: {
    backgroundColor: COLORS.accentYellow,
    borderWidth: 1,
    borderColor: '#E2EA00',
  },
  topNavDotBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.danger,
  },
  heroPagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAE8DE',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
  },
  heroPagePillBold: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0D0E11',
  },
  heroPagePillLight: {
    fontSize: 12,
    fontWeight: '600',
    color: '#66655E',
  },

  /* Category Tag Pill (matching "Resources" in reference) */
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAE8DE',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 12,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D0E11',
    letterSpacing: 0.3,
  },

  /* Massive Headline Block (matching "Best Google fonts for tech websites") */
  heroTitleBlock: {
    marginBottom: 12,
  },
  heroTitleGiant: {
    fontSize: 48,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: -2,
    lineHeight: 48,
  },
  heroTitleLastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  starburstInline: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  starburstTextWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starburstNumber: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  starburstSub: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  /* Floating Black Cursor Badge (matching "Inayat Naqvi" badge in reference) */
  floatingCursorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#0D0E11',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 6,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  cursorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#282A30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cursorBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  cursorArrow: {
    transform: [{ rotate: '-45deg' }],
  },

  /* Slanted Tags */
  slantedTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 2,
  },
  slantedTag: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D8D6CE',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  slantedTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D0E11',
    letterSpacing: 0.2,
  },

  /* Bottom Hero Meta Row (matching "@ui.inayat" and "Save for later" in reference) */
  heroFooterMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 6,
    marginBottom: 12,
  },
  heroAuthorHandle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: -0.2,
  },
  heroAuthorSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#66655E',
    marginTop: 2,
  },
  saveForLaterPill: {
    backgroundColor: '#EAE8DE',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  saveForLaterText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D0E11',
  },

  /* Bottom Hero Row (Simulation pills) */
  heroBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  overhangingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.accentYellow, // Bright canary yellow
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2EA00',
  },
  overhangingPillLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: 0.2,
  },
  miniDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scenarioDotBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scenarioDotBtnActive: {
    backgroundColor: '#0D0E11',
  },

  /* 2. MANIFESTO HEADLINE SECTION */
  manifestoSection: {
    paddingHorizontal: 22,
    paddingVertical: 24,
    alignItems: 'center',
  },
  miniStarburstWrap: {
    marginBottom: 12,
  },
  manifestoHeadline: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 28,
  },

  /* Body Content */
  bodyContent: {
    paddingHorizontal: 16,
  },

  /* 3. SIGNATURE 2x2 CUT-CORNER GRID BOXES */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  gridCard: {
    width: '48%',
    padding: 16,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 4, // Stylized cut-corner shape from reference!
    minHeight: 180,
    justifyContent: 'space-between',
  },
  gridCardYellow: {
    backgroundColor: COLORS.accentYellow, // #F7FF00 electric canary yellow
    borderWidth: 1,
    borderColor: '#E2EA00',
  },
  gridCardWhite: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D6CE',
  },

  /* Dark text styles for Card 01 */
  gridNumberDark: {
    fontSize: 48,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: -2,
  },
  gridTitleDark: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  gridValueDark: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: -0.8,
    marginTop: 4,
  },
  gridUnitDark: {
    fontSize: 13,
    fontWeight: '800',
    color: '#333333',
  },
  gridSubDark: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    lineHeight: 16,
    marginTop: 4,
  },
  gridActionPillDark: {
    borderWidth: 1,
    borderColor: '#0D0E11',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  gridActionTextDark: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0D0E11',
  },

  /* Light text styles for Cards 02, 03, 04 */
  gridNumberLight: {
    fontSize: 48,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: -2,
  },
  gridTitleLight: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  gridValueLight: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: -0.8,
    marginTop: 4,
  },
  gridUnitLight: {
    fontSize: 13,
    fontWeight: '800',
    color: '#66655E',
  },
  gridSubLight: {
    fontSize: 12,
    fontWeight: '600',
    color: '#66655E',
    lineHeight: 16,
    marginTop: 4,
  },
  gridActionPillLight: {
    borderWidth: 1,
    borderColor: '#D8D6CE',
    backgroundColor: '#F3F2EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  gridActionTextLight: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0D0E11',
  },

  /* 4. System Status Card */
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D8D6CE',
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
    fontSize: 13,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#0D0E11',
    lineHeight: 20,
  },

  /* 5. Flow Comparison & Waveform */
  comparisonCard: {
    backgroundColor: '#1C1D22',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#282A30',
  },
  comparisonHeader: {
    marginBottom: 12,
  },
  sectionTitleDark: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  comparisonSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9E9FA5',
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
    width: 66,
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  barValue: {
    width: 38,
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  waveformWrap: {
    alignItems: 'center',
    marginTop: 4,
  },

  /* 6. Pipeline Monitoring Tasks */
  tasksSection: {
    marginBottom: 12,
  },
  tasksHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resetBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  resetBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
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
    borderColor: '#D8D6CE',
  },
  taskCardActive: {
    borderColor: COLORS.accentYellow,
    borderWidth: 2,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  taskIndexBox: {
    backgroundColor: '#F3F2EB',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  taskIndexText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0D0E11',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: 0.3,
  },
  taskSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#66655E',
    marginTop: 1,
  },
  taskCheckBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D8D6CE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckBtnActive: {
    backgroundColor: COLORS.accentYellow,
    borderColor: '#0D0E11',
  },

  /* 7. Hardware Card */
  hardwareCard: {
    backgroundColor: '#1C1D22',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#282A30',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  hardwareTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourcePillDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sourcePillTextDark: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.accentYellow,
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
    fontSize: 11,
    fontWeight: '800',
    color: '#9E9FA5',
    marginBottom: 2,
  },
  hwInfoVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  yellowBannerBtn: {
    backgroundColor: COLORS.accentYellow,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yellowBannerBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
