import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Easing,
  LayoutChangeEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../src/constants/theme';
import { useSensor } from '../../src/context/SensorContext';
import { useMqtt } from '../../src/context/MqttContext';
import { useAlerts } from '../../src/context/AlertContext';
import { formatFlow } from '../../src/utils/format';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const router = useRouter();
  const [showScenarioModal, setShowScenarioModal] = useState<boolean>(false);
  const [activePage, setActivePage] = useState<number>(0);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 396,
    height: 750,
  });

  const scrollRef = useRef<ScrollView>(null);

  const {
    inFlow,
    outFlow,
    totalVolumeLiters,
    statusState,
    setScenario,
    resetDemo,
    activeScenario,
    dataSource,
  } = useSensor();

  const { status: mqttStatus } = useMqtt();
  const { activeCount } = useAlerts();

  const flowDifference = inFlow - outFlow;
  const isAlert =
    statusState === 'leak' || (dataSource === 'wokwi' && mqttStatus === 'disconnected');

  const getStatusText = () => {
    if (dataSource === 'wokwi' && mqttStatus === 'disconnected') return 'OFFLINE';
    if (statusState === 'leak') return 'LEAK';
    if (statusState === 'datacheck') return 'FAULT';
    if (statusState === 'high') return 'HIGH';
    return 'NORMAL';
  };

  // =========================================================================
  // ANIMATIONS FOR THE "BELOWED SECTION" (Requested by user)
  // =========================================================================
  // 1. Traveling water pulse along Steps 1 -> 2 -> 3
  const stepPulseAnim = useRef(new Animated.Value(0)).current;
  // 2. Giant 'g' watermark subtle breathing
  const watermarkScale = useRef(new Animated.Value(1)).current;
  // 3. Status beacon pulsation
  const beaconAnim = useRef(new Animated.Value(0.4)).current;
  // 4. Page 3 concentric ring breathing
  const ringScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Continuous wave down the 3 steps (2.6s cycle)
    const stepLoop = Animated.loop(
      Animated.timing(stepPulseAnim, {
        toValue: 1,
        duration: 2600,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      })
    );
    stepLoop.start();

    // 2. Watermark gentle breathing (4.4s cycle)
    const watermarkLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(watermarkScale, {
          toValue: 1.05,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(watermarkScale, {
          toValue: 1.0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    watermarkLoop.start();

    // 3. Live Beacon rapid pulse
    const beaconLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(beaconAnim, {
          toValue: 1.0,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(beaconAnim, {
          toValue: 0.35,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    beaconLoop.start();

    // 4. Page 3 ring breathing
    const ringLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ringScaleAnim, {
          toValue: 1.08,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ringScaleAnim, {
          toValue: 0.96,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    ringLoop.start();

    return () => {
      stepLoop.stop();
      watermarkLoop.stop();
      beaconLoop.stop();
      ringLoop.stop();
    };
  }, []);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setContainerSize({ width, height });
    }
  };

  const goToPage = (pageIndex: number) => {
    setActivePage(pageIndex);
    scrollRef.current?.scrollTo({
      x: pageIndex * containerSize.width,
      animated: true,
    });
  };

  const handleScrollEnd = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const page = Math.round(x / containerSize.width);
    if (page !== activePage && page >= 0 && page <= 2) {
      setActivePage(page);
    }
  };

  // Interpolated animation offsets for step flow line
  const waveTranslateY = stepPulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 150],
  });

  const waveOpacity = stepPulseAnim.interpolate({
    inputRange: [0, 0.15, 0.85, 1],
    outputRange: [0, 0.75, 0.75, 0],
  });

  return (
    <View style={styles.screen} onLayout={handleLayout}>
      {/* ==============================================================
          TOP PAGINATION BAR (01 • 02 • 03 Switcher)
         ============================================================== */}
      <View style={styles.topPaginationPill}>
        <TouchableOpacity
          style={[styles.pageTab, activePage === 0 && styles.pageTabActive]}
          onPress={() => goToPage(0)}
          activeOpacity={0.8}
        >
          <Text style={[styles.pageTabText, activePage === 0 && styles.pageTabTextActive]}>
            01 Flow
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pageTab, activePage === 1 && styles.pageTabActive]}
          onPress={() => goToPage(1)}
          activeOpacity={0.8}
        >
          <Text style={[styles.pageTabText, activePage === 1 && styles.pageTabTextActive]}>
            02 Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pageTab, activePage === 2 && styles.pageTabActive]}
          onPress={() => goToPage(2)}
          activeOpacity={0.8}
        >
          <Text style={[styles.pageTabText, activePage === 2 && styles.pageTabTextActive]}>
            03 Defense
          </Text>
        </TouchableOpacity>
      </View>

      {/* ==============================================================
          PAGED HORIZONTAL VIEW (CLONING 3 PHONES FROM media_1792698296443)
         ============================================================== */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        style={styles.pagerScrollView}
        contentContainerStyle={{ width: containerSize.width * 3 }}
      >
        {/* ############################################################
            PHONE 1: DARK TOP + LIME BOTTOM (STEPS 1, 2, 3 ANIMATED)
           ############################################################ */}
        <View style={[styles.pageWrapper, { width: containerSize.width }]}>
          {/* Top Section: Deep Forest Charcoal */}
          <View style={styles.phone1Top}>
            {/* Header: AquaGuard® + MENU */}
            <View style={styles.p1HeaderRow}>
              <Text style={styles.brandTitleWhite}>AquaGuard®</Text>
              <TouchableOpacity
                style={styles.menuBtnLight}
                onPress={() => setShowScenarioModal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.menuLinesLight}>
                  <View style={styles.menuLineWhite} />
                  <View style={styles.menuLineWhite} />
                </View>
                <Text style={styles.menuTextWhite}>MENU</Text>
              </TouchableOpacity>
            </View>

            {/* Title Row: Water flow Monitoring + Round Action Button */}
            <View style={styles.p1TitleRow}>
              <View style={styles.p1TitleGroup}>
                <Text style={styles.p1TitleWhite}>Water flow</Text>
                <Text style={styles.p1TitleSubGreen}>Telemetry</Text>
              </View>
              <TouchableOpacity
                style={styles.roundActionLimeBtn}
                onPress={() => setShowScenarioModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-up" size={17} color="#0D140D" style={{ transform: [{ rotate: '45deg' }] }} />
              </TouchableOpacity>
            </View>

            {/* 3-Column Stats Row with Vertical Dividers */}
            <View style={styles.p1StatsRow}>
              <View style={styles.p1StatCol}>
                <Text style={styles.p1StatLabel}>Inlet Flow</Text>
                <Text style={styles.p1StatValue}>{formatFlow(inFlow)}</Text>
                <Text style={styles.p1StatUnit}>L/min</Text>
              </View>

              <View style={styles.p1StatDivider} />

              <View style={styles.p1StatCol}>
                <Text style={styles.p1StatLabel}>Outlet Flow</Text>
                <Text style={styles.p1StatValue}>{formatFlow(outFlow)}</Text>
                <Text style={styles.p1StatUnit}>L/min</Text>
              </View>

              <View style={styles.p1StatDivider} />

              <View style={styles.p1StatCol}>
                <Text style={styles.p1StatLabel}>Flow Delta</Text>
                <Text
                  style={[
                    styles.p1StatValue,
                    flowDifference > 1.5 && { color: COLORS.danger },
                  ]}
                >
                  {flowDifference >= 0 ? '+' : ''}
                  {formatFlow(flowDifference)}
                </Text>
                <Text style={styles.p1StatUnit}>L/min</Text>
              </View>
            </View>
          </View>

          {/* Below Section: Vibrant Lime Green with Step 1, 2, 3 & ANIMATIONS */}
          <View style={styles.phone1BottomLime}>
            {/* Giant Background 'g' Watermark with Breathing Animation */}
            <Animated.View
              style={[
                styles.giantWatermarkWrap,
                {
                  transform: [{ scale: watermarkScale }],
                },
              ]}
              pointerEvents="none"
            >
              <Text style={styles.giantWatermarkG}>g</Text>
            </Animated.View>

            {/* Live Traveling Animation Beam across Steps */}
            <Animated.View
              style={[
                styles.stepScanBeam,
                {
                  transform: [{ translateY: waveTranslateY }],
                  opacity: waveOpacity,
                },
              ]}
              pointerEvents="none"
            />

            {/* Stacked Step 1, Step 2, Step 3 */}
            <View style={styles.stepsContainer}>
              {/* Step 1 */}
              <View style={styles.p1StepRow}>
                <View style={styles.stepLeftGroup}>
                  <Text style={styles.stepNumText}>Step 1</Text>
                  <Text style={styles.stepDescText}>Intake Calibration</Text>
                </View>
                <View style={styles.stepRightGroup}>
                  <Text style={styles.stepMetricText}>{formatFlow(inFlow)} L/m</Text>
                  <View style={styles.stepLiveDot} />
                </View>
              </View>

              <View style={styles.stepHairlineDivider} />

              {/* Step 2 */}
              <View style={styles.p1StepRow}>
                <View style={styles.stepLeftGroup}>
                  <Text style={styles.stepNumText}>Step 2</Text>
                  <Text style={styles.stepDescText}>Node Balance Check</Text>
                </View>
                <View style={styles.stepRightGroup}>
                  <Text style={styles.stepMetricText}>{formatFlow(outFlow)} L/m</Text>
                  <View style={styles.stepLiveDot} />
                </View>
              </View>

              <View style={styles.stepHairlineDivider} />

              {/* Step 3 */}
              <View style={styles.p1StepRow}>
                <View style={styles.stepLeftGroup}>
                  <Text style={styles.stepNumText}>Step 3</Text>
                  <Text style={styles.stepDescText}>Persistence Filter</Text>
                </View>
                <View style={styles.stepRightGroup}>
                  <View
                    style={[
                      styles.stepBadgePill,
                      isAlert && { backgroundColor: COLORS.danger },
                    ]}
                  >
                    <Animated.View
                      style={[
                        styles.badgePulseBeacon,
                        { opacity: beaconAnim },
                        isAlert && { backgroundColor: '#FFFFFF' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.stepBadgeText,
                        isAlert && { color: '#FFFFFF' },
                      ]}
                    >
                      {isAlert ? 'DEFICIT ALERT' : 'CERTIFIED'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Subtle Bottom Status Bar */}
            <View style={styles.p1FooterBar}>
              <Text style={styles.p1FooterText}>Realtime Telemetry Active</Text>
              <View style={styles.p1FooterDot} />
            </View>
          </View>
        </View>

        {/* ############################################################
            PHONE 2: TAUPE TOP (HEADLINE) + 2 COLOR BLOCKS + FOOTER
           ############################################################ */}
        <View style={[styles.pageWrapper, { width: containerSize.width }]}>
          {/* Top Section: Taupe Neutral with Large Headline */}
          <View style={styles.phone2TopTaupe}>
            {/* Header: AquaGuard® + MENU */}
            <View style={styles.p2HeaderRow}>
              <Text style={styles.brandTitleDark}>AquaGuard®</Text>
              <TouchableOpacity
                style={styles.menuBtnDark}
                onPress={() => setShowScenarioModal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.menuLinesDark}>
                  <View style={styles.menuLineDark} />
                  <View style={styles.menuLineDark} />
                </View>
                <Text style={styles.menuTextDark}>MENU</Text>
              </TouchableOpacity>
            </View>

            {/* Massive Display Headline */}
            <View style={styles.p2HeadlineWrap}>
              <Text style={styles.p2GiantHeadline}>Easily monitor</Text>
              <Text style={styles.p2GiantHeadline}>your water pipeline</Text>
              <Text style={styles.p2GiantHeadline}>telemetry</Text>
            </View>

            {/* Subtitle */}
            <Text style={styles.p2Subtitle}>
              Streamline your dual-flow verification workflow
            </Text>

            {/* Floating text bottom-right */}
            <View style={styles.p2RightFloatText}>
              <Text style={styles.p2FloatLine}>Water audit</Text>
              <Text style={styles.p2FloatLine}>made</Text>
              <Text style={styles.p2FloatLineBold}>simple</Text>
            </View>
          </View>

          {/* Bottom Section: 2 Side-by-Side Blocks + Dark Footer Bar */}
          <View style={styles.phone2BottomContainer}>
            <View style={styles.p2TwoBlocksRow}>
              {/* Left Block: Electric Lime (Daily Volume) */}
              <View style={styles.p2BlockLime}>
                <Text style={styles.p2BlockLabelDark}>Daily Volume</Text>
                <Text style={styles.p2BlockValueDark}>
                  {totalVolumeLiters.toFixed(1)}
                  <Text style={styles.p2BlockUnitDark}> L</Text>
                </Text>
              </View>

              {/* Right Block: Dark Charcoal (System Health) */}
              <View style={styles.p2BlockDark}>
                <Text style={styles.p2BlockLabelLight}>System Health</Text>
                <Text
                  style={[
                    styles.p2BlockValueLight,
                    isAlert && { color: COLORS.danger },
                  ]}
                >
                  {isAlert ? 'LEAK' : '99.4%'}
                </Text>
              </View>
            </View>

            {/* Dark Footer Bar (Details + ▶) */}
            <View style={styles.p2FooterBar}>
              <TouchableOpacity
                onPress={() => router.push('/history')}
                activeOpacity={0.7}
              >
                <Text style={styles.p2DetailsText}>Details</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.p2PlayBtn}
                onPress={() => setShowScenarioModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="play" size={15} color="#D4FF32" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ############################################################
            PHONE 3: LIME TOP (GIANT 'O') + TAUPE PLAN BLOCK + FOOTER
           ############################################################ */}
        <View style={[styles.pageWrapper, { width: containerSize.width }]}>
          {/* Top Section: Lime Green with Giant 'O' Graphic */}
          <View style={styles.phone3TopLime}>
            {/* Header: AquaGuard® + MENU */}
            <View style={styles.p3HeaderRow}>
              <Text style={styles.brandTitleDark}>AquaGuard®</Text>
              <TouchableOpacity
                style={styles.menuBtnDark}
                onPress={() => setShowScenarioModal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.menuLinesDark}>
                  <View style={styles.menuLineDark} />
                  <View style={styles.menuLineDark} />
                </View>
                <Text style={styles.menuTextDark}>MENU</Text>
              </TouchableOpacity>
            </View>

            {/* Giant Graphic 'O' with Concentric Dual-Flow Pulse */}
            <View style={styles.p3GraphicContainer}>
              <Animated.View
                style={[
                  styles.p3ConcentricRing,
                  {
                    transform: [{ scale: ringScaleAnim }],
                  },
                ]}
              >
                <Text style={styles.giantLetterO}>O</Text>
              </Animated.View>
            </View>
          </View>

          {/* Bottom Section: Taupe Body with Plan Level + Footer */}
          <View style={styles.phone3BottomTaupe}>
            <View style={styles.p3ContentWrap}>
              <Text style={styles.p3SubLabel}>PIPELINE SECURITY LEVEL</Text>
              <Text style={styles.p3PlanTitle}>Guardian Pro</Text>

              <View style={styles.p3FeatureBox}>
                <Ionicons name="shield-checkmark" size={18} color="#0D140D" />
                <Text style={styles.p3FeatureText}>Autonomous dual-flow balance engine</Text>
              </View>

              <Text style={styles.p3BottomNote}>
                Maximize your water system efficiency and prevent municipal loss
              </Text>
            </View>

            {/* Dark Footer Bar */}
            <View style={styles.p3FooterBar}>
              <TouchableOpacity
                onPress={() => router.push('/history')}
                activeOpacity={0.7}
              >
                <Text style={styles.p3DetailsText}>Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ==============================================================
          SIMULATION & DEMO CONTROLS MODAL (Interactive ESP32 Bridge)
         ============================================================== */}
      <Modal
        visible={showScenarioModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowScenarioModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleGroup}>
                <Ionicons name="hardware-chip-outline" size={20} color={COLORS.darkCharcoal} />
                <Text style={styles.modalTitle}>Wokwi ESP32 Bridge</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowScenarioModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={COLORS.darkCharcoal} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Simulate dual-flow pipeline conditions in real time:
            </Text>

            <View style={styles.scenarioList}>
              <TouchableOpacity
                style={[
                  styles.scenarioBtn,
                  activeScenario === 'normal' && styles.scenarioBtnActive,
                ]}
                onPress={() => {
                  setScenario('normal');
                  setShowScenarioModal(false);
                }}
              >
                <View style={styles.scenarioBtnContent}>
                  <Text style={styles.scenarioNumber}>01</Text>
                  <View>
                    <Text style={styles.scenarioName}>Normal Balanced Flow</Text>
                    <Text style={styles.scenarioDesc}>Inlet 12.0 L/m • Outlet 12.0 L/m (Zero Deficit)</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#8F959E" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.scenarioBtn,
                  activeScenario === 'leak' && styles.scenarioBtnDanger,
                ]}
                onPress={() => {
                  setScenario('leak');
                  setShowScenarioModal(false);
                }}
              >
                <View style={styles.scenarioBtnContent}>
                  <Text style={[styles.scenarioNumber, { color: COLORS.danger }]}>02</Text>
                  <View>
                    <Text style={[styles.scenarioName, { color: COLORS.danger }]}>Pipe Rupture / Leak</Text>
                    <Text style={styles.scenarioDesc}>Inlet 14.0 L/m • Outlet 7.0 L/m (+7.0 L/m Deficit)</Text>
                  </View>
                </View>
                <Ionicons name="warning" size={18} color={COLORS.danger} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.scenarioBtn,
                  activeScenario === 'high' && styles.scenarioBtnActive,
                ]}
                onPress={() => {
                  setScenario('high');
                  setShowScenarioModal(false);
                }}
              >
                <View style={styles.scenarioBtnContent}>
                  <Text style={styles.scenarioNumber}>03</Text>
                  <View>
                    <Text style={styles.scenarioName}>High Demand Consumption</Text>
                    <Text style={styles.scenarioDesc}>Both sensors rise to 26.0 L/m symmetrically</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#8F959E" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.scenarioBtn,
                  activeScenario === 'datacheck' && styles.scenarioBtnActive,
                ]}
                onPress={() => {
                  setScenario('datacheck');
                  setShowScenarioModal(false);
                }}
              >
                <View style={styles.scenarioBtnContent}>
                  <Text style={styles.scenarioNumber}>04</Text>
                  <View>
                    <Text style={styles.scenarioName}>Sensor Calibration Fault</Text>
                    <Text style={styles.scenarioDesc}>Reversed mismatch / sensor defect flag</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#8F959E" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalResetBtn}
              onPress={() => {
                resetDemo();
                setShowScenarioModal(false);
              }}
            >
              <Text style={styles.modalResetText}>Reset to Live Sensor Baseline</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0D140D',
    position: 'relative',
    overflow: 'hidden',
  },

  // -------------------------------------------------------------
  // Top Floating Pager Switcher Pill (01 • 02 • 03)
  // -------------------------------------------------------------
  topPaginationPill: {
    position: 'absolute',
    top: 6,
    alignSelf: 'center',
    zIndex: 100,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 24,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  pageTab: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 18,
  },
  pageTabActive: {
    backgroundColor: '#D4FF32',
  },
  pageTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A0A4AB',
    letterSpacing: 0.3,
  },
  pageTabTextActive: {
    color: '#0D140D',
    fontWeight: '900',
  },

  pagerScrollView: {
    flex: 1,
  },
  pageWrapper: {
    flex: 1,
    height: '100%',
    paddingBottom: 86, // Space for floating bottom tab bar
  },

  // =============================================================
  // PHONE 1 STYLES: Dark Top + Lime Bottom with Steps
  // =============================================================
  phone1Top: {
    flex: 0.95,
    backgroundColor: '#0F1A12',
    paddingHorizontal: 20,
    paddingTop: 44, // below pagination bar
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  p1HeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandTitleWhite: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  menuBtnLight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  menuLinesLight: {
    gap: 3.5,
  },
  menuLineWhite: {
    width: 17,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  menuTextWhite: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  p1TitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  p1TitleGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  p1TitleWhite: {
    fontSize: 27,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  p1TitleSubGreen: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A0B898',
  },
  roundActionLimeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D4FF32',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 3-Column Stats Row
  p1StatsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 12,
    marginTop: 4,
  },
  p1StatCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  p1StatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8A9B85',
    marginBottom: 4,
  },
  p1StatValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  p1StatUnit: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A9B85',
    marginTop: 1,
  },
  p1StatDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: 10,
  },

  // Phone 1 Bottom: Lime Green with Steps
  phone1BottomLime: {
    flex: 1.05,
    backgroundColor: '#D4FF32',
    position: 'relative',
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    justifyContent: 'space-between',
  },
  giantWatermarkWrap: {
    position: 'absolute',
    bottom: -35,
    right: 5,
    opacity: 0.22,
  },
  giantWatermarkG: {
    fontSize: 220,
    fontWeight: '900',
    color: '#0F1A12',
    lineHeight: 220,
  },
  stepScanBeam: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 20,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 14,
  },
  stepsContainer: {
    zIndex: 10,
  },
  p1StepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  stepLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D140D',
  },
  stepDescText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2A3626',
  },
  stepRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepMetricText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D140D',
  },
  stepLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0D140D',
  },
  stepHairlineDivider: {
    height: 1,
    backgroundColor: 'rgba(13, 20, 13, 0.12)',
  },
  stepBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D140D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  badgePulseBeacon: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4FF32',
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#D4FF32',
    letterSpacing: 0.5,
  },

  p1FooterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
    paddingTop: 6,
  },
  p1FooterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2A3626',
    letterSpacing: 0.3,
  },
  p1FooterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0D140D',
  },

  // =============================================================
  // PHONE 2 STYLES: Taupe Top + 2 Split Blocks + Footer
  // =============================================================
  phone2TopTaupe: {
    flex: 1.15,
    backgroundColor: '#E5E2DE',
    paddingHorizontal: 20,
    paddingTop: 44,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  p2HeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandTitleDark: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0D0E11',
    letterSpacing: -0.5,
  },
  menuBtnDark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  menuLinesDark: {
    gap: 3.5,
  },
  menuLineDark: {
    width: 17,
    height: 2,
    backgroundColor: '#0D0E11',
    borderRadius: 1,
  },
  menuTextDark: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D0E11',
    letterSpacing: 0.5,
  },

  p2HeadlineWrap: {
    marginTop: 8,
  },
  p2GiantHeadline: {
    fontSize: 34,
    fontWeight: '900',
    color: '#554E4B',
    lineHeight: 35,
    letterSpacing: -1.6,
  },
  p2Subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7E7873',
    marginTop: 6,
  },

  p2RightFloatText: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  p2FloatLine: {
    fontSize: 13,
    fontWeight: '600',
    color: '#554E4B',
    lineHeight: 16,
  },
  p2FloatLineBold: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0D0E11',
    lineHeight: 17,
  },

  // Phone 2 Bottom Section
  phone2BottomContainer: {
    flex: 0.85,
    backgroundColor: '#0F1A12',
    justifyContent: 'space-between',
  },
  p2TwoBlocksRow: {
    flexDirection: 'row',
    flex: 1,
  },
  p2BlockLime: {
    flex: 1,
    backgroundColor: '#D4FF32',
    padding: 16,
    justifyContent: 'center',
  },
  p2BlockLabelDark: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D140D',
    marginBottom: 4,
  },
  p2BlockValueDark: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0D140D',
    letterSpacing: -1,
  },
  p2BlockUnitDark: {
    fontSize: 18,
    fontWeight: '700',
  },

  p2BlockDark: {
    flex: 1,
    backgroundColor: '#35302E',
    padding: 16,
    justifyContent: 'center',
  },
  p2BlockLabelLight: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A8A19D',
    marginBottom: 4,
  },
  p2BlockValueLight: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },

  p2FooterBar: {
    height: 48,
    backgroundColor: '#0F1A12',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  p2DetailsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D4FF32',
  },
  p2PlayBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // =============================================================
  // PHONE 3 STYLES: Lime Top (Giant 'O') + Taupe Plan + Footer
  // =============================================================
  phone3TopLime: {
    flex: 1.1,
    backgroundColor: '#D4FF32',
    paddingHorizontal: 20,
    paddingTop: 44,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  p3HeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  p3GraphicContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  p3ConcentricRing: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  giantLetterO: {
    fontSize: 180,
    fontWeight: '900',
    color: '#0F1A12',
    lineHeight: 180,
    letterSpacing: -6,
  },

  phone3BottomTaupe: {
    flex: 0.9,
    backgroundColor: '#E5E2DE',
    justifyContent: 'space-between',
  },
  p3ContentWrap: {
    padding: 20,
  },
  p3SubLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#706B66',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  p3PlanTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: -1.5,
    marginBottom: 12,
  },
  p3FeatureBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  p3FeatureText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D0E11',
  },
  p3BottomNote: {
    fontSize: 12,
    fontWeight: '500',
    color: '#706B66',
  },

  p3FooterBar: {
    height: 48,
    backgroundColor: '#0F1A12',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  p3DetailsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D4FF32',
  },

  // =============================================================
  // MODAL STYLES (ESP32 Simulation Controls)
  // =============================================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.darkCharcoal,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  scenarioList: {
    gap: 10,
    marginBottom: 16,
  },
  scenarioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F4F0',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EAE8DE',
  },
  scenarioBtnActive: {
    borderColor: '#D4FF32',
    backgroundColor: '#FBFFDC',
  },
  scenarioBtnDanger: {
    borderColor: COLORS.danger,
    backgroundColor: '#FEF2F2',
  },
  scenarioBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  scenarioNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.darkCharcoal,
  },
  scenarioName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.darkCharcoal,
  },
  scenarioDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  modalResetBtn: {
    backgroundColor: COLORS.darkCharcoal,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalResetText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
