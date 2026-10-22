import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
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
  const [viewMode, setViewMode] = useState<'telemetry' | 'overview'>('telemetry');
  const [showScenarioModal, setShowScenarioModal] = useState<boolean>(false);

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

  const isAlert = statusState === 'leak' || (dataSource === 'wokwi' && mqttStatus === 'disconnected');

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {viewMode === 'telemetry' ? (
          /* =======================================================
             SCREEN 1: TELEMETRY SPLIT (Screen 1 in Reference Image)
             ======================================================= */
          <View style={styles.screen1Container}>
            {/* Top Dark Section */}
            <View style={styles.darkTopBlock}>
              {/* Header */}
              <View style={styles.headerRow}>
                <Text style={styles.brandTitleLight}>
                  AquaGuard<Text style={styles.registeredMarkLight}>®</Text>
                </Text>

                <View style={styles.headerRightGroup}>
                  {/* View Switcher 01 / 02 */}
                  <View style={styles.viewSwitchPillDark}>
                    <TouchableOpacity
                      onPress={() => setViewMode('telemetry')}
                      style={[styles.viewSwitchBtn, styles.viewSwitchBtnActiveDark]}
                    >
                      <Text style={styles.viewSwitchTextActiveDark}>01</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setViewMode('overview')}
                      style={styles.viewSwitchBtn}
                    >
                      <Text style={styles.viewSwitchTextDark}>02</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Menu Button */}
                  <TouchableOpacity
                    style={styles.menuBtnDark}
                    onPress={() => setShowScenarioModal(true)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.menuLinesWrap}>
                      <View style={styles.menuLineLight} />
                      <View style={styles.menuLineLight} />
                    </View>
                    <Text style={styles.menuTextLight}>MENU</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Title & Circular Arrow Button */}
              <View style={styles.screen1TitleRow}>
                <View style={styles.screen1TitleLeft}>
                  <Text style={styles.screen1TitleBig}>Water telemetry</Text>
                  <Text style={styles.screen1TitleSub}>Monitoring</Text>
                </View>
                <TouchableOpacity
                  style={styles.circularArrowBtn}
                  onPress={() => setShowScenarioModal(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="arrow-up-outline"
                    size={20}
                    color="#0D0E11"
                    style={{ transform: [{ rotate: '45deg' }] }}
                  />
                </TouchableOpacity>
              </View>

              {/* 3-Column Metric Matrix (Direct from Screen 1!) */}
              <View style={styles.metricMatrixRow}>
                {/* Column 1: Inlet */}
                <View style={styles.metricMatrixCol}>
                  <Text style={styles.matrixLabelLight}>Inlet Flow</Text>
                  <Text style={styles.matrixValueLight}>
                    {formatFlow(inFlow)}
                    <Text style={styles.matrixUnitLight}> L/m</Text>
                  </Text>
                </View>

                <View style={styles.matrixDividerLight} />

                {/* Column 2: Outlet */}
                <View style={styles.metricMatrixCol}>
                  <Text style={styles.matrixLabelLight}>Outlet Flow</Text>
                  <Text style={styles.matrixValueLight}>
                    {formatFlow(outFlow)}
                    <Text style={styles.matrixUnitLight}> L/m</Text>
                  </Text>
                </View>

                <View style={styles.matrixDividerLight} />

                {/* Column 3: Flow Delta */}
                <View style={styles.metricMatrixCol}>
                  <Text style={styles.matrixLabelLight}>Flow Delta</Text>
                  <Text
                    style={[
                      styles.matrixValueLight,
                      flowDifference > 1.5 && { color: COLORS.danger },
                    ]}
                  >
                    {flowDifference >= 0 ? '+' : ''}
                    {formatFlow(flowDifference)}
                    <Text style={styles.matrixUnitLight}> L/m</Text>
                  </Text>
                </View>
              </View>
            </View>

            {/* Bottom Electric Canary Yellow Section */}
            <View style={styles.yellowBottomBlock}>
              {/* Huge stylized watermark letter in background */}
              <View style={styles.watermarkWrap} pointerEvents="none">
                <Text style={styles.watermarkLetter}>g</Text>
              </View>

              {/* Stacked Step 1, Step 2, Step 3 Strips */}
              <View style={styles.stepStrip}>
                <Text style={styles.stepIndexText}>Step 1</Text>
                <Text style={styles.stepTitleText}>Intake Baseline Verification</Text>
                <Text style={styles.stepValueText}>{formatFlow(inFlow)} L/m</Text>
              </View>

              <View style={styles.stepDivider} />

              <View style={styles.stepStrip}>
                <Text style={styles.stepIndexText}>Step 2</Text>
                <Text style={styles.stepTitleText}>Distribution Node Discharge</Text>
                <Text style={styles.stepValueText}>{formatFlow(outFlow)} L/m</Text>
              </View>

              <View style={styles.stepDivider} />

              <View style={styles.stepStrip}>
                <Text style={styles.stepIndexText}>Step 3</Text>
                <Text style={styles.stepTitleText}>Persistence Deficit Filter</Text>
                <View
                  style={[
                    styles.stepBadge,
                    isAlert && { backgroundColor: COLORS.danger },
                  ]}
                >
                  <Text
                    style={[
                      styles.stepBadgeText,
                      isAlert && { color: '#FFFFFF' },
                    ]}
                  >
                    {isAlert ? 'ALERT' : 'NORMAL'}
                  </Text>
                </View>
              </View>

              {/* Bottom Footer Bar */}
              <View style={styles.bottomBarYellow}>
                <TouchableOpacity
                  onPress={() => router.push('/history')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.detailsBtnTextYellow}>Details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.playArrowBtnYellow}
                  onPress={() => setShowScenarioModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="play" size={16} color="#0D0E11" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          /* =======================================================
             SCREEN 2: OVERVIEW SPLIT (Screen 2 in Reference Image)
             ======================================================= */
          <View style={styles.screen2Container}>
            {/* Top Light Neutral Block */}
            <View style={styles.lightTopBlock}>
              {/* Header */}
              <View style={styles.headerRow}>
                <Text style={styles.brandTitleDark}>
                  AquaGuard<Text style={styles.registeredMarkDark}>®</Text>
                </Text>

                <View style={styles.headerRightGroup}>
                  {/* View Switcher 01 / 02 */}
                  <View style={styles.viewSwitchPillLight}>
                    <TouchableOpacity
                      onPress={() => setViewMode('telemetry')}
                      style={styles.viewSwitchBtn}
                    >
                      <Text style={styles.viewSwitchTextLight}>01</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setViewMode('overview')}
                      style={[styles.viewSwitchBtn, styles.viewSwitchBtnActiveLight]}
                    >
                      <Text style={styles.viewSwitchTextActiveLight}>02</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Menu Button */}
                  <TouchableOpacity
                    style={styles.menuBtnLight}
                    onPress={() => setShowScenarioModal(true)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.menuLinesWrap}>
                      <View style={styles.menuLineDark} />
                      <View style={styles.menuLineDark} />
                    </View>
                    <Text style={styles.menuTextDark}>MENU</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Large Headline (matching "Easily boost your social media engagement") */}
              <View style={styles.screen2HeadlineWrap}>
                <Text style={styles.screen2HeadlineBig}>Easily monitor</Text>
                <Text style={styles.screen2HeadlineBig}>your water pipeline</Text>
                <Text style={styles.screen2HeadlineBig}>telemetry</Text>
                <Text style={styles.screen2HeadlineSub}>
                  Streamline dual-flow sensor verification
                </Text>
              </View>

              {/* Right-aligned subtle note */}
              <View style={styles.rightMetaNoteWrap}>
                <Text style={styles.rightMetaNote}>Water audit made</Text>
                <Text style={styles.rightMetaNote}>simple</Text>
              </View>
            </View>

            {/* Bottom Split 2-Box Metric Showcase + Bottom Bar */}
            <View style={styles.screen2BottomArea}>
              <View style={styles.splitBoxRow}>
                {/* Box 1: Electric Canary Yellow */}
                <View style={styles.splitBoxYellow}>
                  <Text style={styles.splitBoxLabelDark}>Daily Volume</Text>
                  <Text style={styles.splitBoxValueDark}>
                    {totalVolumeLiters.toFixed(1)}
                    <Text style={styles.splitBoxUnitDark}> L</Text>
                  </Text>
                </View>

                {/* Box 2: Deep Dark Charcoal Card */}
                <View style={styles.splitBoxDark}>
                  <Text style={styles.splitBoxLabelLight}>System Health</Text>
                  <Text
                    style={[
                      styles.splitBoxValueLight,
                      isAlert && { color: COLORS.danger },
                    ]}
                  >
                    {isAlert ? 'LEAK' : '99.4%'}
                  </Text>
                </View>
              </View>

              {/* Bottom Footer Bar */}
              <View style={styles.bottomBarDark}>
                <TouchableOpacity
                  onPress={() => router.push('/history')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.detailsBtnTextLight}>Details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.playArrowBtnLight}
                  onPress={() => setShowScenarioModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="play" size={16} color={COLORS.accentYellow} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Pipeline Simulation Scenarios Modal */}
      <Modal
        visible={showScenarioModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowScenarioModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pipeline Scenarios</Text>
              <TouchableOpacity
                onPress={() => setShowScenarioModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#0D0E11" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Test autonomous anomaly & leak persistence detection
            </Text>

            {/* Scenario 1: Normal Flow */}
            <TouchableOpacity
              style={[
                styles.scenarioOption,
                activeScenario === 'normal' && styles.scenarioOptionActive,
              ]}
              onPress={() => {
                setScenario('normal');
                setShowScenarioModal(false);
              }}
            >
              <View style={styles.scenarioOptionLeft}>
                <View
                  style={[
                    styles.scenarioNum,
                    { backgroundColor: COLORS.accentYellow },
                  ]}
                >
                  <Text style={styles.scenarioNumText}>01</Text>
                </View>
                <View>
                  <Text style={styles.scenarioOptionTitle}>
                    Normal Balanced Flow
                  </Text>
                  <Text style={styles.scenarioOptionSub}>
                    Inlet matches outlet (&lt; 0.2 L/min delta)
                  </Text>
                </View>
              </View>
              {activeScenario === 'normal' && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#0D0E11"
                />
              )}
            </TouchableOpacity>

            {/* Scenario 2: Suspected Leak */}
            <TouchableOpacity
              style={[
                styles.scenarioOption,
                activeScenario === 'suspected_leak' && styles.scenarioOptionActive,
              ]}
              onPress={() => {
                setScenario('suspected_leak');
                setShowScenarioModal(false);
              }}
            >
              <View style={styles.scenarioOptionLeft}>
                <View
                  style={[
                    styles.scenarioNum,
                    { backgroundColor: COLORS.danger },
                  ]}
                >
                  <Text style={[styles.scenarioNumText, { color: '#FFFFFF' }]}>
                    02
                  </Text>
                </View>
                <View>
                  <Text style={styles.scenarioOptionTitle}>
                    Pipe Rupture / Leak
                  </Text>
                  <Text style={styles.scenarioOptionSub}>
                    Inlet exceeds outlet (&gt; 1.5 L/min sustained)
                  </Text>
                </View>
              </View>
              {activeScenario === 'suspected_leak' && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={COLORS.danger}
                />
              )}
            </TouchableOpacity>

            {/* Scenario 3: High Consumption */}
            <TouchableOpacity
              style={[
                styles.scenarioOption,
                activeScenario === 'abnormal_consumption' &&
                  styles.scenarioOptionActive,
              ]}
              onPress={() => {
                setScenario('abnormal_consumption');
                setShowScenarioModal(false);
              }}
            >
              <View style={styles.scenarioOptionLeft}>
                <View
                  style={[
                    styles.scenarioNum,
                    { backgroundColor: '#F59E0B' },
                  ]}
                >
                  <Text style={[styles.scenarioNumText, { color: '#FFFFFF' }]}>
                    03
                  </Text>
                </View>
                <View>
                  <Text style={styles.scenarioOptionTitle}>
                    High Demand Consumption
                  </Text>
                  <Text style={styles.scenarioOptionSub}>
                    Heavy balanced draw (&gt; 25.0 L/min)
                  </Text>
                </View>
              </View>
              {activeScenario === 'abnormal_consumption' && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#F59E0B"
                />
              )}
            </TouchableOpacity>

            {/* Scenario 4: Sensor Anomaly */}
            <TouchableOpacity
              style={[
                styles.scenarioOption,
                activeScenario === 'sensor_anomaly' && styles.scenarioOptionActive,
              ]}
              onPress={() => {
                setScenario('sensor_anomaly');
                setShowScenarioModal(false);
              }}
            >
              <View style={styles.scenarioOptionLeft}>
                <View
                  style={[
                    styles.scenarioNum,
                    { backgroundColor: '#0D9488' },
                  ]}
                >
                  <Text style={[styles.scenarioNumText, { color: '#FFFFFF' }]}>
                    04
                  </Text>
                </View>
                <View>
                  <Text style={styles.scenarioOptionTitle}>
                    Sensor Calibration Fault
                  </Text>
                  <Text style={styles.scenarioOptionSub}>
                    Negative deficit (Outlet &gt; Inlet)
                  </Text>
                </View>
              </View>
              {activeScenario === 'sensor_anomaly' && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#0D9488"
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalResetBtn}
              onPress={() => {
                resetDemo();
                setShowScenarioModal(false);
              }}
            >
              <Text style={styles.modalResetText}>Reset Simulation Baseline</Text>
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
    backgroundColor: '#0D0E11',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90, // Clearance for tab dock
  },

  /* ========================================================
     SCREEN 1: TELEMETRY SPLIT (Matching Screen 1 in image)
     ======================================================== */
  screen1Container: {
    flex: 1,
  },
  darkTopBlock: {
    backgroundColor: '#0D0E11', // Deep dark ink black
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  brandTitleLight: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  registeredMarkLight: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8F959E',
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  viewSwitchPillDark: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    padding: 2,
  },
  viewSwitchBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  viewSwitchBtnActiveDark: {
    backgroundColor: COLORS.accentYellow,
  },
  viewSwitchTextDark: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8F959E',
  },
  viewSwitchTextActiveDark: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0D0E11',
  },
  menuBtnDark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuLinesWrap: {
    gap: 3,
  },
  menuLineLight: {
    width: 14,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  menuTextLight: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },

  /* Screen 1 Title Row */
  screen1TitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  screen1TitleLeft: {
    flex: 1,
  },
  screen1TitleBig: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  screen1TitleSub: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8F959E',
    marginTop: 4,
  },
  circularArrowBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },

  /* 3-Column Metric Matrix */
  metricMatrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  metricMatrixCol: {
    flex: 1,
  },
  matrixLabelLight: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8F959E',
    marginBottom: 4,
  },
  matrixValueLight: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  matrixUnitLight: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.accentYellow,
  },
  matrixDividerLight: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: 12,
  },

  /* Bottom Electric Canary Yellow Block (Screen 1) */
  yellowBottomBlock: {
    backgroundColor: COLORS.accentYellow,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    position: 'relative',
    minHeight: 340,
    justifyContent: 'space-between',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  watermarkWrap: {
    position: 'absolute',
    right: 10,
    bottom: 20,
    opacity: 0.14,
  },
  watermarkLetter: {
    fontSize: 280,
    fontWeight: '900',
    color: '#0D0E11',
    lineHeight: 280,
  },
  stepStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  stepIndexText: {
    width: 54,
    fontSize: 12,
    fontWeight: '900',
    color: '#0D0E11',
  },
  stepTitleText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#0D0E11',
    paddingHorizontal: 8,
  },
  stepValueText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0D0E11',
  },
  stepDivider: {
    height: 1,
    backgroundColor: 'rgba(13, 14, 17, 0.12)',
  },
  stepBadge: {
    backgroundColor: '#0D0E11',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.accentYellow,
    letterSpacing: 0.5,
  },
  bottomBarYellow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(13, 14, 17, 0.15)',
  },
  detailsBtnTextYellow: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: -0.3,
  },
  playArrowBtnYellow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(13, 14, 17, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ========================================================
     SCREEN 2: OVERVIEW SPLIT (Matching Screen 2 in image)
     ======================================================== */
  screen2Container: {
    flex: 1,
    backgroundColor: '#F3F2EB', // Neutral paper background
  },
  lightTopBlock: {
    backgroundColor: '#F3F2EB',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  brandTitleDark: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: -0.4,
  },
  registeredMarkDark: {
    fontSize: 10,
    fontWeight: '700',
    color: '#66655E',
  },
  viewSwitchPillLight: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13, 14, 17, 0.08)',
    borderRadius: 14,
    padding: 2,
  },
  viewSwitchBtnLight: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  viewSwitchBtnActiveLight: {
    backgroundColor: '#0D0E11',
  },
  viewSwitchTextLight: {
    fontSize: 11,
    fontWeight: '800',
    color: '#66655E',
  },
  viewSwitchTextActiveLight: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  menuBtnLight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuLineDark: {
    width: 14,
    height: 2,
    backgroundColor: '#0D0E11',
    borderRadius: 1,
  },
  menuTextDark: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0D0E11',
    letterSpacing: 0.8,
  },
  screen2HeadlineWrap: {
    marginTop: 24,
    marginBottom: 20,
  },
  screen2HeadlineBig: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: -1.2,
    lineHeight: 36,
  },
  screen2HeadlineSub: {
    fontSize: 13,
    fontWeight: '600',
    color: '#66655E',
    marginTop: 12,
  },
  rightMetaNoteWrap: {
    alignItems: 'flex-end',
    marginTop: 18,
  },
  rightMetaNote: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8F959E',
    lineHeight: 16,
  },

  /* Bottom Split 2-Box Metric Showcase */
  screen2BottomArea: {
    backgroundColor: '#1C1D22',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  splitBoxRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  splitBoxYellow: {
    flex: 1,
    backgroundColor: COLORS.accentYellow,
    padding: 16,
    borderRadius: 18,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  splitBoxLabelDark: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D0E11',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  splitBoxValueDark: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: -1,
  },
  splitBoxUnitDark: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333333',
  },
  splitBoxDark: {
    flex: 1,
    backgroundColor: '#282A30',
    padding: 16,
    borderRadius: 18,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  splitBoxLabelLight: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9E9FA5',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  splitBoxValueLight: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  bottomBarDark: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 4,
  },
  detailsBtnTextLight: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  playArrowBtnLight: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Modal Styling */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0D0E11',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F2EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#66655E',
    marginBottom: 16,
  },
  scenarioOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E1DA',
    marginBottom: 10,
    backgroundColor: '#FAFAF8',
  },
  scenarioOptionActive: {
    borderColor: '#0D0E11',
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  scenarioOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  scenarioNum: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scenarioNumText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0D0E11',
  },
  scenarioOptionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0D0E11',
  },
  scenarioOptionSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#66655E',
    marginTop: 2,
  },
  modalResetBtn: {
    backgroundColor: '#0D0E11',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  modalResetText: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.accentYellow,
    letterSpacing: 0.5,
  },
});
