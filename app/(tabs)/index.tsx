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
import { COLORS, FONTS } from '../../src/constants/theme';
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
    width: 392,
    height: 832,
  });

  const scrollRef = useRef<any>(null);

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
          toValue: 1.04,
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
          toValue: 1.06,
          duration: 1900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ringScaleAnim, {
          toValue: 0.96,
          duration: 1900,
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
    outputRange: [-10, 180],
  });

  const waveOpacity = stepPulseAnim.interpolate({
    inputRange: [0, 0.15, 0.85, 1],
    outputRange: [0, 0.75, 0.75, 0],
  });

  return (
    <View style={styles.screen} onLayout={handleLayout}>
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
            PHONE 1 (LEFT): 50% DARK TOP + 50% LIME BOTTOM WITH ANIMATIONS
           ############################################################ */}
        <View style={[styles.pageWrapper, { width: containerSize.width }]}>
          {/* Top Half: Deep Forest Charcoal (#0F1A12) */}
          <View style={styles.p1TopDark}>
            {/* iOS Status Bar Row */}
            <View style={styles.iosStatusBarRow}>
              <Text style={styles.statusTimeLight}>9:41</Text>
              <View style={styles.dynamicIslandNotch} />
              <View style={styles.statusIconsGroup}>
                <Ionicons name="cellular" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Ionicons name="wifi" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Ionicons name="battery-full" size={16} color="#FFFFFF" />
              </View>
            </View>

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

            {/* Title Row: Water (50px) on line 1, Flow (50px) below it */}
            <View style={styles.p1TitleRow}>
              <View style={styles.p1TitleGroup}>
                <Text style={styles.p1TitleWater}>Water</Text>
                <View style={styles.p1TitleFlowRow}>
                  <Text style={styles.p1TitleFlow}>Flow</Text>
                  <Text style={styles.p1TitleSubGreen}>Telemetry</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.roundActionLimeBtn}
                onPress={() => setShowScenarioModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="arrow-up"
                  size={16}
                  color="#0F1A12"
                  style={{ transform: [{ rotate: '45deg' }] }}
                />
              </TouchableOpacity>
            </View>

            {/* 3-Column Stats Row with Neon Lime Values */}
            <View style={styles.p1StatsRow}>
              <View style={styles.p1StatCol}>
                <Text style={styles.p1StatLabel}>Inlet Flow</Text>
                <View style={styles.p1StatValueRow}>
                  <Text style={styles.p1StatValueLime}>{formatFlow(inFlow)}</Text>
                  <Text style={styles.p1StatUnitLime}>%</Text>
                </View>
              </View>

              <View style={styles.p1StatDivider} />

              <View style={styles.p1StatCol}>
                <Text style={styles.p1StatLabel}>Outlet Flow</Text>
                <View style={styles.p1StatValueRow}>
                  <Text style={styles.p1StatValueLime}>{formatFlow(outFlow)}</Text>
                  <Text style={styles.p1StatUnitLime}>%</Text>
                </View>
              </View>

              <View style={styles.p1StatDivider} />

              <View style={styles.p1StatCol}>
                <Text style={styles.p1StatLabel}>Flow Delta</Text>
                <View style={styles.p1StatValueRow}>
                  <Text
                    style={[
                      styles.p1StatValueLime,
                      flowDifference > 1.5 && { color: COLORS.danger },
                    ]}
                  >
                    {flowDifference >= 0 ? '+' : ''}
                    {formatFlow(flowDifference)}
                  </Text>
                  <Text style={styles.p1StatUnitLime}>%</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bottom Half: Electric Neon Lime (#D4FF32) with Steps & ANIMATIONS */}
          <View style={styles.p1BottomLime}>
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
                <Text style={styles.stepNumText}>Step 1</Text>
                <View style={styles.stepRightIndicatorGroup}>
                  <Text style={styles.stepMinusDash}>-</Text>
                  <Text style={styles.stepMetricText}>{formatFlow(inFlow)} L/m</Text>
                </View>
              </View>

              <View style={styles.stepHairlineDivider} />

              {/* Step 2 */}
              <View style={styles.p1StepRow}>
                <Text style={styles.stepNumText}>Step 2</Text>
                <View style={styles.stepRightIndicatorGroup}>
                  <Text style={styles.stepMetricText}>{formatFlow(outFlow)} L/m</Text>
                </View>
              </View>

              <View style={styles.stepHairlineDivider} />

              {/* Step 3 */}
              <View style={styles.p1StepRow}>
                <Text style={styles.stepNumText}>Step 3</Text>
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
                    {isAlert ? 'ALERT' : 'CERTIFIED'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Discrete Bottom Footer Indicator */}
            <View style={styles.p1FooterBar}>
              <Text style={styles.p1FooterText}>Realtime Telemetry Active</Text>
              <View style={styles.p1FooterDot} />
            </View>
          </View>
        </View>

        {/* ############################################################
            PHONE 2 (CENTER): TAUPE TOP (HEADLINE) + 2 COLOR BLOCKS + FOOTER
           ############################################################ */}
        <View style={[styles.pageWrapper, { width: containerSize.width }]}>
          {/* Top Section: Light Warm Taupe (#DDD8D5) */}
          <View style={styles.p2TopTaupe}>
            {/* iOS Status Bar Row */}
            <View style={styles.iosStatusBarRow}>
              <Text style={styles.statusTimeDark}>9:41</Text>
              <View style={styles.dynamicIslandNotch} />
              <View style={styles.statusIconsGroup}>
                <Ionicons name="cellular" size={13} color="#1C1918" style={{ marginRight: 4 }} />
                <Ionicons name="wifi" size={13} color="#1C1918" style={{ marginRight: 4 }} />
                <Ionicons name="battery-full" size={16} color="#1C1918" />
              </View>
            </View>

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
              <Text style={styles.p2FloatLine}>Water</Text>
              <Text style={styles.p2FloatLine}>audit made</Text>
              <Text style={styles.p2FloatLineBold}>simple</Text>
            </View>
          </View>

          {/* Bottom Section: 2 Side-by-Side Blocks + Dark Footer Bar */}
          <View style={styles.p2BottomContainer}>
            <View style={styles.p2TwoBlocksRow}>
              {/* Left Block: Electric Neon Lime (#D4FF32) */}
              <View style={styles.p2BlockLime}>
                <Text style={styles.p2BlockLabelDark}>Daily Volume</Text>
                <Text style={styles.p2BlockValueDark}>
                  {totalVolumeLiters.toFixed(1)}
                  <Text style={styles.p2BlockUnitDark}>%</Text>
                </Text>
              </View>

              {/* Right Block: Dark Mauve Charcoal (#4A4240) */}
              <View style={styles.p2BlockDark}>
                <Text style={styles.p2BlockLabelLight}>System Health</Text>
                <Text
                  style={[
                    styles.p2BlockValueLight,
                    isAlert && { color: COLORS.danger },
                  ]}
                >
                  {isAlert ? 'LEAK' : '86.5%'}
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
                <Ionicons name="play" size={14} color="#D4FF32" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ############################################################
            PHONE 3 (RIGHT): LIME TOP (GIANT 'O') + TAUPE PLAN + FOOTER
           ############################################################ */}
        <View style={[styles.pageWrapper, { width: containerSize.width }]}>
          {/* Top Section: Neon Lime (#D4FF32) with Giant 'O' */}
          <View style={styles.p3TopLime}>
            {/* iOS Status Bar Row */}
            <View style={styles.iosStatusBarRow}>
              <Text style={styles.statusTimeDark}>9:41</Text>
              <View style={styles.dynamicIslandNotch} />
              <View style={styles.statusIconsGroup}>
                <Ionicons name="cellular" size={13} color="#0F1A12" style={{ marginRight: 4 }} />
                <Ionicons name="wifi" size={13} color="#0F1A12" style={{ marginRight: 4 }} />
                <Ionicons name="battery-full" size={16} color="#0F1A12" />
              </View>
            </View>

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

            {/* Giant Graphic 'O' with Concentric Pulse Ring */}
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

          {/* Bottom Section: Warm Taupe Body with Plan Level + Footer */}
          <View style={styles.p3BottomTaupe}>
            <View style={styles.p3ContentWrap}>
              <Text style={styles.p3SubLabel}>SUBSCRIPTION LEVEL</Text>
              <Text style={styles.p3PlanTitle}>Guardian Pro</Text>

              <Text style={styles.p3BottomNote}>
                Maximize your water system efficiency and prevent municipal loss
              </Text>
            </View>

            {/* Dark Footer Bar (Details) */}
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
          TOP PAGINATION PILL (Discrete 01 • 02 • 03 Switcher)
         ============================================================== */}
      <View style={styles.topPaginationPill}>
        <TouchableOpacity
          style={[styles.pageTab, activePage === 0 && styles.pageTabActive]}
          onPress={() => goToPage(0)}
          activeOpacity={0.8}
        >
          <Text style={[styles.pageTabText, activePage === 0 && styles.pageTabTextActive]}>
            01
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pageTab, activePage === 1 && styles.pageTabActive]}
          onPress={() => goToPage(1)}
          activeOpacity={0.8}
        >
          <Text style={[styles.pageTabText, activePage === 1 && styles.pageTabTextActive]}>
            02
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pageTab, activePage === 2 && styles.pageTabActive]}
          onPress={() => goToPage(2)}
          activeOpacity={0.8}
        >
          <Text style={[styles.pageTabText, activePage === 2 && styles.pageTabTextActive]}>
            03
          </Text>
        </TouchableOpacity>
      </View>

      {/* ==============================================================
          SIMULATION & DEMO CONTROLS MODAL (Wokwi ESP32 Bridge)
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
                  activeScenario === 'suspected_leak' && styles.scenarioBtnDanger,
                ]}
                onPress={() => {
                  setScenario('suspected_leak');
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
                  activeScenario === 'abnormal_consumption' && styles.scenarioBtnActive,
                ]}
                onPress={() => {
                  setScenario('abnormal_consumption');
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
                  activeScenario === 'sensor_anomaly' && styles.scenarioBtnActive,
                ]}
                onPress={() => {
                  setScenario('sensor_anomaly');
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

            {/* Quick Screen Navigation Links */}
            <View style={styles.quickNavRow}>
              <TouchableOpacity
                style={styles.quickNavBtn}
                onPress={() => {
                  setShowScenarioModal(false);
                  router.push('/history');
                }}
              >
                <Ionicons name="stats-chart" size={16} color="#0D140D" />
                <Text style={styles.quickNavText}>Analytics</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickNavBtn}
                onPress={() => {
                  setShowScenarioModal(false);
                  router.push('/alerts');
                }}
              >
                <Ionicons name="alert-circle" size={16} color="#0D140D" />
                <Text style={styles.quickNavText}>Alerts ({activeCount})</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickNavBtn}
                onPress={() => {
                  setShowScenarioModal(false);
                  router.push('/admin');
                }}
              >
                <Ionicons name="shield-checkmark" size={16} color="#0D140D" />
                <Text style={styles.quickNavText}>Admin</Text>
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
    backgroundColor: '#0F1A12',
    position: 'relative',
    overflow: 'hidden',
  },

  // -------------------------------------------------------------
  // iOS Status Bar Elements
  // -------------------------------------------------------------
  iosStatusBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },
  statusTimeLight: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  statusTimeDark: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: '#1C1918',
    letterSpacing: 0.5,
  },
  dynamicIslandNotch: {
    width: 96,
    height: 25,
    borderRadius: 13,
    backgroundColor: '#000000',
  },
  statusIconsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // -------------------------------------------------------------
  // Top Floating Pager Switcher Pill (01 • 02 • 03)
  // -------------------------------------------------------------
  topPaginationPill: {
    position: 'absolute',
    bottom: 22,
    alignSelf: 'center',
    zIndex: 100,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 24,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  pageTab: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 18,
  },
  pageTabActive: {
    backgroundColor: '#D4FF32',
  },
  pageTabText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: '#A0A4AB',
    letterSpacing: 0.5,
  },
  pageTabTextActive: {
    color: '#0F1A12',
  },

  pagerScrollView: {
    flex: 1,
  },
  pageWrapper: {
    flex: 1,
    height: '100%',
  },

  // =============================================================
  // PHONE 1 STYLES: Dark Top (50%) + Lime Bottom (50%)
  // =============================================================
  p1TopDark: {
    flex: 1,
    backgroundColor: '#0F1A12',
    paddingHorizontal: 22,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  p1HeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  brandTitleWhite: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.5,
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
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  p1TitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  p1TitleGroup: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  p1TitleWater: {
    fontFamily: FONTS.heading,
    fontSize: 50,
    lineHeight: 50,
    color: '#FFFFFF',
    letterSpacing: 3.4,
  },
  p1TitleFlowRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  p1TitleFlow: {
    fontFamily: FONTS.heading,
    fontSize: 50,
    lineHeight: 50,
    color: '#FFFFFF',
    letterSpacing: 3.4,
  },
  p1TitleSubGreen: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: '#8E9F88',
    letterSpacing: 1,
  },
  roundActionLimeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D4FF32',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 3-Column Stats Row with Neon Lime Values
  p1StatsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 10,
    marginBottom: 4,
  },
  p1StatCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  p1StatLabel: {
    fontFamily: FONTS.heading,
    fontSize: 9.5,
    color: '#8E9F88',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  p1StatValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  p1StatValueLime: {
    fontFamily: FONTS.body,
    fontSize: 60,
    lineHeight: 60,
    color: '#D4FF32',
    letterSpacing: 0.5,
  },
  p1StatUnitLime: {
    fontFamily: FONTS.body,
    fontSize: 22,
    color: '#D4FF32',
    marginLeft: 2,
  },
  p1StatDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: 6,
  },

  // Phone 1 Bottom: Neon Lime Green (50%)
  p1BottomLime: {
    flex: 1,
    backgroundColor: '#D4FF32',
    position: 'relative',
    overflow: 'hidden',
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 22,
    justifyContent: 'space-between',
  },
  giantWatermarkWrap: {
    position: 'absolute',
    bottom: -30,
    right: 0,
    left: 0,
    alignItems: 'center',
    opacity: 0.22,
  },
  giantWatermarkG: {
    fontFamily: FONTS.heading,
    fontSize: 250,
    color: '#0F1A12',
    lineHeight: 250,
  },
  stepScanBeam: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 15,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
  },
  stepsContainer: {
    zIndex: 10,
  },
  p1StepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
  },
  stepNumText: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    color: '#0F1A12',
    letterSpacing: 3.4,
  },
  stepRightIndicatorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepMinusDash: {
    fontFamily: FONTS.body,
    fontSize: 18,
    color: '#0F1A12',
    opacity: 0.6,
  },
  stepMetricText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: '#0F1A12',
    letterSpacing: 0.5,
  },
  stepHairlineDivider: {
    height: 1,
    backgroundColor: 'rgba(15, 26, 18, 0.14)',
  },
  stepBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1A12',
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
    fontFamily: FONTS.heading,
    fontSize: 9.5,
    color: '#D4FF32',
    letterSpacing: 0.5,
  },

  p1FooterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  p1FooterText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: '#2A3626',
    letterSpacing: 0.5,
  },
  p1FooterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0F1A12',
  },

  // =============================================================
  // PHONE 2 STYLES: Taupe Top (58%) + 2 Blocks (42%) + Footer
  // =============================================================
  p2TopTaupe: {
    flex: 1.35,
    backgroundColor: '#DDD8D5',
    paddingHorizontal: 22,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  p2HeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  brandTitleDark: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: '#1C1918',
    letterSpacing: 0.5,
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
    backgroundColor: '#1C1918',
    borderRadius: 1,
  },
  menuTextDark: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: '#1C1918',
    letterSpacing: 1,
  },

  p2HeadlineWrap: {
    marginTop: 6,
  },
  p2GiantHeadline: {
    fontFamily: FONTS.heading,
    fontSize: 23,
    color: '#544E4C',
    lineHeight: 27,
    letterSpacing: 0.2,
  },
  p2Subtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: '#7C7571',
    marginTop: 6,
    letterSpacing: 0.3,
  },

  p2RightFloatText: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  p2FloatLine: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: '#544E4C',
    lineHeight: 18,
    letterSpacing: 0.5,
  },
  p2FloatLineBold: {
    fontFamily: FONTS.heading,
    fontSize: 13,
    color: '#1C1918',
    lineHeight: 18,
    letterSpacing: 0.3,
  },

  // Phone 2 Bottom Section
  p2BottomContainer: {
    flex: 0.95,
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
    padding: 18,
    justifyContent: 'center',
  },
  p2BlockLabelDark: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: '#0F1A12',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  p2BlockValueDark: {
    fontFamily: FONTS.body,
    fontSize: 60,
    lineHeight: 60,
    color: '#0F1A12',
    letterSpacing: 0.5,
  },
  p2BlockUnitDark: {
    fontFamily: FONTS.body,
    fontSize: 26,
  },

  p2BlockDark: {
    flex: 1,
    backgroundColor: '#4A4240',
    padding: 18,
    justifyContent: 'center',
  },
  p2BlockLabelLight: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: '#C4BCB8',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  p2BlockValueLight: {
    fontFamily: FONTS.body,
    fontSize: 60,
    lineHeight: 60,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  p2FooterBar: {
    height: 48,
    backgroundColor: '#0F1A12',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  p2DetailsText: {
    fontFamily: FONTS.body,
    fontSize: 17,
    color: '#D4FF32',
    letterSpacing: 0.8,
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
  p3TopLime: {
    flex: 1.35,
    backgroundColor: '#D4FF32',
    paddingHorizontal: 22,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  p3HeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
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
    fontFamily: FONTS.heading,
    fontSize: 210,
    color: '#0F1A12',
    lineHeight: 210,
  },

  p3BottomTaupe: {
    flex: 0.95,
    backgroundColor: '#DDD8D5',
    justifyContent: 'space-between',
  },
  p3ContentWrap: {
    padding: 22,
  },
  p3SubLabel: {
    fontFamily: FONTS.heading,
    fontSize: 9.5,
    color: '#706B66',
    letterSpacing: 1,
    marginBottom: 6,
  },
  p3PlanTitle: {
    fontFamily: FONTS.heading,
    fontSize: 27,
    color: '#1C1918',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  p3BottomNote: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: '#706B66',
    marginTop: 6,
    letterSpacing: 0.3,
  },

  p3FooterBar: {
    height: 48,
    backgroundColor: '#0F1A12',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  p3DetailsText: {
    fontFamily: FONTS.body,
    fontSize: 17,
    color: '#D4FF32',
    letterSpacing: 0.8,
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
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: COLORS.darkCharcoal,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    letterSpacing: 0.3,
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
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: COLORS.darkCharcoal,
  },
  scenarioName: {
    fontFamily: FONTS.heading,
    fontSize: 11,
    color: COLORS.darkCharcoal,
  },
  scenarioDesc: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    letterSpacing: 0.2,
  },

  // Quick navigation buttons inside modal
  quickNavRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  quickNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAE8DE',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  quickNavText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: '#0D140D',
    letterSpacing: 0.3,
  },

  modalResetBtn: {
    backgroundColor: COLORS.darkCharcoal,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalResetText: {
    fontFamily: FONTS.body,
    color: '#FFFFFF',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
