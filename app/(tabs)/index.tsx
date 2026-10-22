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
      {/* 1. TOP ASYMMETRICAL WHITE HERO CARD (Matching Reference Image Typography & Hierarchy) */}
      <View style={styles.topHeroCard}>
        {/* Top Header Bar: "AquaGuard" on left, "01 of 04" counter pill on right */}
        <View style={styles.heroTopBar}>
          <View style={styles.brandRow}>
            <View style={styles.logoCircle}>
              <Ionicons name="water" size={14} color="#0D0E11" />
            </View>
            <Text style={styles.brandLogoText}>AquaGuard</Text>
          </View>

          <View style={styles.carouselCounterPill}>
            <View style={styles.carouselCounterActiveBox}>
              <Text style={styles.carouselCounterActiveText}>01</Text>
            </View>
            <Text style={styles.carouselCounterSub}>of 04</Text>
          </View>
        </View>

        {/* Resources / Context Tag (Matching "Resources" pill in image) */}
        <View style={styles.categoryPill}>
          <Text style={styles.categoryPillText}>Water Telemetry</Text>
        </View>

        {/* Massive Hero Heading exactly matching Reference Image Typography */}
        <View style={styles.massiveHeadingWrap}>
          <Text style={styles.massiveHeadingDark}>Smart Water</Text>
          <View style={styles.massiveHeadingLine2}>
            <Text style={styles.massiveHeadingDark}>monitor for </Text>
            <Text style={styles.massiveHeadingAccent}>tech</Text>
          </View>
          <Text style={styles.massiveHeadingAccent}>pipelines</Text>

          {/* Interactive Cursor Pointer & Badge Tag (Matching "Inayat Naqvi" badge in image) */}
          <View style={styles.cursorBadgeWrap}>
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="#0D0E11" style={styles.cursorSvg}>
              <Path d="M4 0l16 12.279-6.951 1.17 4.325 8.817-3.596 1.734-4.35-8.879-5.428 5.428z" />
            </Svg>
            <View style={styles.cursorPill}>
              <View style={styles.cursorAvatar}>
                <Ionicons name="hardware-chip" size={11} color="#FFFFFF" />
              </View>
              <Text style={styles.cursorPillText}>ESP32 Virtual Node</Text>
            </View>
          </View>
        </View>

        {/* Slanted Floating Tags Row (Matching "Inlet S1", "Outlet S2", "Delta") */}
        <View style={styles.slantedTagsWrap}>
          <View style={[styles.slantedTag, { transform: [{ rotate: '-3deg' }] }]}>
            <Text style={styles.slantedTagText}>Inlet S1: {formatFlow(inFlow)} L/m</Text>
          </View>

          <View style={[styles.slantedTag, { transform: [{ rotate: '2deg' }], marginTop: 4 }]}>
            <Text style={styles.slantedTagText}>Outlet S2: {formatFlow(outFlow)} L/m</Text>
          </View>

          <View style={[styles.slantedTag, { transform: [{ rotate: '-2deg' }] }]}>
            <Text style={styles.slantedTagText}>Delta: {flowDifference >= 0 ? '+' : ''}{formatFlow(flowDifference)} L/m</Text>
          </View>
        </View>

        {/* Pipeline Simulation Pills */}
        <View style={styles.simControlRow}>
          <Text style={styles.simControlLabel}>SIMULATE PIPELINE:</Text>
          <View style={styles.miniDotRow}>
            <TouchableOpacity
              onPress={() => setScenario('normal')}
              style={[styles.scenarioDotBtn, activeScenario === 'normal' && styles.scenarioDotBtnActive]}
            >
              <Ionicons name="checkmark" size={12} color={activeScenario === 'normal' ? '#FFFFFF' : '#0D0E11'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setScenario('suspected_leak')}
              style={[styles.scenarioDotBtn, activeScenario === 'suspected_leak' && { backgroundColor: COLORS.danger }]}
            >
              <Ionicons name="alert" size={12} color={activeScenario === 'suspected_leak' ? '#FFFFFF' : '#0D0E11'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setScenario('abnormal_consumption')}
              style={[styles.scenarioDotBtn, activeScenario === 'abnormal_consumption' && { backgroundColor: '#F59E0B' }]}
            >
              <Ionicons name="speedometer" size={12} color={activeScenario === 'abnormal_consumption' ? '#FFFFFF' : '#0D0E11'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Hero Row: Creator meta on left, button on right (Matching image footer) */}
        <View style={styles.heroBottomRow}>
          <View style={styles.creatorMetaWrap}>
            <Text style={styles.creatorHandle}>@aquaguard.iot</Text>
            <Text style={styles.creatorRole}>Autonomous Leak Detection</Text>
          </View>

          <TouchableOpacity
            style={styles.saveForLaterBtn}
            onPress={() => router.push('/wokwi-guide')}
            activeOpacity={0.85}
          >
            <Text style={styles.saveForLaterBtnText}>Wokwi Bridge &rarr;</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. MANIFESTO HEADLINE SECTION (On Dark Canvas) */}
      <View style={styles.manifestoSection}>
        {/* Centered Small Starburst Icon */}
        <View style={styles.miniStarburstWrap}>
          <Svg width="32" height="32" viewBox="0 0 100 100">
            <Path
              d="M 50 0 L 61 14 L 79 7 L 82 25 L 98 29 L 91 46 L 100 61 L 86 69 L 88 87 L 70 85 L 61 99 L 46 91 L 31 99 L 29 82 L 11 81 L 16 64 L 0 53 L 12 40 L 4 23 L 22 22 L 27 5 L 43 14 Z"
              fill={COLORS.accentPurple}
            />
          </Svg>
        </View>

        <Text style={styles.manifestoHeadline}>
          PRECISION WATER TELEMETRY ENGINE.{'\n'}
          <Text style={{ color: COLORS.accentVermilion }}>REAL-TIME PERSISTENCE FILTERING</Text> FOR PIPELINE INTEGRITY.
        </Text>
      </View>

      <View style={styles.bodyContent}>
        {/* 3. SIGNATURE 2x2 CUT-CORNER GRID BOXES (Exact match to Reference 01, 02, 03, 04) */}
        <View style={styles.gridContainer}>
          {/* BOX 01: SIGNATURE ELECTRIC LIME-YELLOW CARD WITH CUT CORNER */}
          <TouchableOpacity
            style={[styles.gridCard, styles.gridCardYellow]}
            onPress={() => router.push('/history')}
            activeOpacity={0.9}
          >
            <Text style={styles.gridNumberDark}>01</Text>
            <Text style={styles.gridTitleDark}>Inlet Flow (S1)</Text>
            <Text style={styles.gridValueDark}>
              {formatFlow(inFlow)} <Text style={styles.gridUnitDark}>L/MIN</Text>
            </Text>
            <Text style={styles.gridSubDark}>
              Municipal supply entry baseline.
            </Text>
            <View style={styles.gridActionPillDark}>
              <Text style={styles.gridActionTextDark}>Details &rarr;</Text>
            </View>
          </TouchableOpacity>

          {/* BOX 02: WHITE CARD WITH CUT CORNER */}
          <TouchableOpacity
            style={[styles.gridCard, styles.gridCardWhite]}
            onPress={() => router.push('/history')}
            activeOpacity={0.9}
          >
            <Text style={styles.gridNumberLight}>02</Text>
            <Text style={styles.gridTitleLight}>Outlet Flow (S2)</Text>
            <Text style={styles.gridValueLight}>
              {formatFlow(outFlow)} <Text style={styles.gridUnitLight}>L/MIN</Text>
            </Text>
            <Text style={styles.gridSubLight}>
              Distribution point discharge rate.
            </Text>
            <View style={styles.gridActionPillLight}>
              <Text style={styles.gridActionTextLight}>Inspect &rarr;</Text>
            </View>
          </TouchableOpacity>

          {/* BOX 03: WHITE CARD WITH CUT CORNER */}
          <TouchableOpacity
            style={[styles.gridCard, styles.gridCardWhite]}
            onPress={() => router.push('/alerts')}
            activeOpacity={0.9}
          >
            <Text style={[styles.gridNumberLight, flowDifference > 1.5 && { color: COLORS.danger }]}>03</Text>
            <Text style={styles.gridTitleLight}>Flow Delta</Text>
            <Text style={[styles.gridValueLight, flowDifference > 1.5 && { color: COLORS.danger }]}>
              {flowDifference >= 0 ? '+' : ''}{formatFlow(flowDifference)} <Text style={styles.gridUnitLight}>L/MIN</Text>
            </Text>
            <Text style={styles.gridSubLight}>
              {flowDifference > 1.5 ? 'Deficit deficit detected.' : 'Balanced stream.'}
            </Text>
            <View style={styles.gridActionPillLight}>
              <Text style={styles.gridActionTextLight}>Audit &rarr;</Text>
            </View>
          </TouchableOpacity>

          {/* BOX 04: WHITE CARD WITH CUT CORNER */}
          <TouchableOpacity
            style={[styles.gridCard, styles.gridCardWhite]}
            onPress={() => router.push('/history')}
            activeOpacity={0.9}
          >
            <Text style={styles.gridNumberLight}>04</Text>
            <Text style={styles.gridTitleLight}>Cumulative Usage</Text>
            <Text style={styles.gridValueLight}>
              {totalVolumeLiters.toFixed(1)} <Text style={styles.gridUnitLight}>LITERS</Text>
            </Text>
            <Text style={styles.gridSubLight}>
              Metered volume recorded today.
            </Text>
            <View style={styles.gridActionPillLight}>
              <Text style={styles.gridActionTextLight}>Analytics &rarr;</Text>
            </View>
          </TouchableOpacity>
        </View>

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
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: 0.5,
  },
  heroNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroNavItem: {
    fontSize: 11,
    fontWeight: '800',
    color: '#66655E',
    letterSpacing: 0.5,
  },

  /* Title & Starburst Row */
  heroTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroTitleLeft: {
    flex: 1,
    paddingRight: 12,
  },
  heroTitleBig: {
    fontSize: 38,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: -1,
    lineHeight: 40,
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#66655E',
    marginTop: 8,
    lineHeight: 18,
  },
  starburstWrapper: {
    width: 88,
    height: 88,
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
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  starburstSub: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  /* Slanted Tags */
  slantedTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
    paddingVertical: 4,
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

  /* Bottom Hero Row */
  heroBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
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
  heroRightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8D6CE',
  },
  heroRightActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D0E11',
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
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 24,
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
    fontSize: 38,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: -1,
  },
  gridTitleDark: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  gridValueDark: {
    fontSize: 25,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: -0.5,
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
    fontSize: 38,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: -1,
  },
  gridTitleLight: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  gridValueLight: {
    fontSize: 25,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: -0.5,
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
