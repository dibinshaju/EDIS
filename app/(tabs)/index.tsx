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
  const isAlert =
    statusState === 'leak' || (dataSource === 'wokwi' && mqttStatus === 'disconnected');

  const getStatusText = () => {
    if (dataSource === 'wokwi' && mqttStatus === 'disconnected') return 'DISCONNECTED';
    if (statusState === 'leak') return 'LEAK ALERT';
    if (statusState === 'datacheck') return 'SENSOR FAULT';
    if (statusState === 'high') return 'HIGH DEMAND';
    return 'NORMAL';
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================
            1. TOP HERO CARD (Exact typography & layout from reference)
           ======================================================== */}
        <View style={styles.topCard}>
          {/* Header Row: Brand left, "01 of 04" pill + MENU right */}
          <View style={styles.headerRow}>
            <View style={styles.brandGroup}>
              <View style={styles.brandIconCircle}>
                <Ionicons name="water" size={14} color="#0D0E11" />
              </View>
              <Text style={styles.brandText}>AquaGuard</Text>
            </View>

            <View style={styles.headerRightRow}>
              <View style={styles.pageIndexPill}>
                <Text style={styles.pageIndexBold}>01</Text>
                <Text style={styles.pageIndexLight}> of 04</Text>
              </View>

              <TouchableOpacity
                style={styles.menuBtn}
                onPress={() => setShowScenarioModal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.menuLinesWrap}>
                  <View style={styles.menuLine} />
                  <View style={styles.menuLine} />
                </View>
                <Text style={styles.menuText}>MENU</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Category Pill Tag (matching "Resources" tag in image) */}
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>Telemetry Engine</Text>
          </View>

          {/* Massive Display Headline (matching "Best Google fonts for tech websites") */}
          <View style={styles.headlineBlock}>
            <Text style={styles.giantHeadline}>Smart Water</Text>
            <Text style={styles.giantHeadline}>monitor for</Text>
            <Text style={styles.giantHeadline}>pipelines</Text>
          </View>

          {/* Subtitle */}
          <Text style={styles.headlineSubtitle}>
            Autonomous dual-flow balance & deficit persistence protection
          </Text>

          {/* Floating Cursor Badge (matching "Inayat Naqvi" badge in image) */}
          <View style={styles.cursorBadge}>
            <View style={styles.cursorAvatar}>
              <Ionicons name="hardware-chip" size={13} color="#FFFFFF" />
            </View>
            <Text style={styles.cursorBadgeText}>Virtual ESP32 Bridge</Text>
            <Ionicons
              name="navigate"
              size={12}
              color="#FFFFFF"
              style={styles.cursorArrow}
            />
          </View>

          {/* Card Telemetry Strip showcasing 01 values */}
          <View style={styles.cardTelemetryRow}>
            <View style={styles.cardTelemetryItem}>
              <Text style={styles.cardTelemetryLabel}>Inlet S1</Text>
              <Text style={styles.cardTelemetryValue}>
                {formatFlow(inFlow)} <Text style={styles.cardTelemetryUnit}>L/m</Text>
              </Text>
            </View>
            <View style={styles.cardTelemetryDivider} />
            <View style={styles.cardTelemetryItem}>
              <Text style={styles.cardTelemetryLabel}>Outlet S2</Text>
              <Text style={styles.cardTelemetryValue}>
                {formatFlow(outFlow)} <Text style={styles.cardTelemetryUnit}>L/m</Text>
              </Text>
            </View>
            <View style={styles.cardTelemetryDivider} />
            <View style={styles.cardTelemetryItem}>
              <Text style={styles.cardTelemetryLabel}>Variance</Text>
              <Text
                style={[
                  styles.cardTelemetryValue,
                  flowDifference > 1.5 && { color: COLORS.danger },
                ]}
              >
                {flowDifference >= 0 ? '+' : ''}
                {formatFlow(flowDifference)} <Text style={styles.cardTelemetryUnit}>L/m</Text>
              </Text>
            </View>
          </View>

          {/* Card Footer (matching "@ui.inayat" and "Save for later" in image) */}
          <View style={styles.cardFooterRow}>
            <View>
              <Text style={styles.footerHandle}>@aquaguard.iot</Text>
              <Text style={styles.footerSub}>Municipal Telemetry</Text>
            </View>

            <TouchableOpacity
              style={styles.actionBtnPill}
              onPress={() => setShowScenarioModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>Simulate State &rarr;</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ========================================================
            2. SPLIT 3-COLUMN METRIC MATRIX (Matching Screen 1)
           ======================================================== */}
        <View style={styles.metricMatrixCard}>
          {/* Col 1: Inlet */}
          <View style={styles.matrixCol}>
            <Text style={styles.matrixLabel}>Inlet Flow</Text>
            <Text style={styles.matrixValue}>
              {formatFlow(inFlow)}
              <Text style={styles.matrixUnit}> L/m</Text>
            </Text>
          </View>

          <View style={styles.matrixDivider} />

          {/* Col 2: Outlet */}
          <View style={styles.matrixCol}>
            <Text style={styles.matrixLabel}>Outlet Flow</Text>
            <Text style={styles.matrixValue}>
              {formatFlow(outFlow)}
              <Text style={styles.matrixUnit}> L/m</Text>
            </Text>
          </View>

          <View style={styles.matrixDivider} />

          {/* Col 3: Delta */}
          <View style={styles.matrixCol}>
            <Text style={styles.matrixLabel}>Flow Delta</Text>
            <Text
              style={[
                styles.matrixValue,
                flowDifference > 1.5 && { color: COLORS.danger },
              ]}
            >
              {flowDifference >= 0 ? '+' : ''}
              {formatFlow(flowDifference)}
              <Text style={styles.matrixUnit}> L/m</Text>
            </Text>
          </View>
        </View>

        {/* ========================================================
            3. SPLIT 2-BOX METRIC SHOWCASE (Matching Screen 2)
           ======================================================== */}
        <View style={styles.splitBoxRow}>
          {/* Box 1: Electric Canary Yellow */}
          <View style={styles.splitBoxYellow}>
            <Text style={styles.splitBoxLabelDark}>Daily Volume</Text>
            <Text style={styles.splitBoxValueDark}>
              {totalVolumeLiters.toFixed(1)}
              <Text style={styles.splitBoxUnitDark}> L</Text>
            </Text>
            <Text style={styles.splitBoxFooterDark}>Metered today</Text>
          </View>

          {/* Box 2: Deep Dark Charcoal Card */}
          <View style={styles.splitBoxDark}>
            <Text style={styles.splitBoxLabelLight}>System Status</Text>
            <Text
              style={[
                styles.splitBoxValueLight,
                isAlert && { color: COLORS.danger },
              ]}
            >
              {getStatusText()}
            </Text>
            <Text style={styles.splitBoxFooterLight}>
              {isAlert ? 'Deficit detected' : 'Zero leak deficit'}
            </Text>
          </View>
        </View>

        {/* ========================================================
            4. PIPELINE AUDIT STEPS (Matching Screen 1 Steps)
           ======================================================== */}
        <View style={styles.stepsCard}>
          {/* Step 1 */}
          <View style={styles.stepItemRow}>
            <Text style={styles.stepIndex}>Step 1</Text>
            <Text style={styles.stepTitle}>Intake Baseline</Text>
            <Text style={styles.stepValue}>{formatFlow(inFlow)} L/m</Text>
          </View>

          <View style={styles.stepItemDivider} />

          {/* Step 2 */}
          <View style={styles.stepItemRow}>
            <Text style={styles.stepIndex}>Step 2</Text>
            <Text style={styles.stepTitle}>Distribution Node</Text>
            <Text style={styles.stepValue}>{formatFlow(outFlow)} L/m</Text>
          </View>

          <View style={styles.stepItemDivider} />

          {/* Step 3 */}
          <View style={styles.stepItemRow}>
            <Text style={styles.stepIndex}>Step 3</Text>
            <Text style={styles.stepTitle}>Persistence Filter</Text>
            <View
              style={[
                styles.stepStatusPill,
                isAlert && { backgroundColor: COLORS.danger },
              ]}
            >
              <Text
                style={[
                  styles.stepStatusPillText,
                  isAlert && { color: '#FFFFFF' },
                ]}
              >
                {isAlert ? 'ALERT' : 'CERTIFIED'}
              </Text>
            </View>
          </View>
        </View>

        {/* ========================================================
            5. BOTTOM FOOTER BAR (Matching Screen 2 Bottom Bar)
           ======================================================== */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            onPress={() => router.push('/history')}
            activeOpacity={0.7}
          >
            <Text style={styles.detailsBtnText}>Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playArrowBtn}
            onPress={() => setShowScenarioModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="play" size={16} color={COLORS.accentYellow} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ========================================================
          SIMULATION SCENARIOS MODAL
         ======================================================== */}
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
                <Ionicons name="checkmark-circle" size={20} color="#0D0E11" />
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
                <Ionicons name="checkmark-circle" size={20} color={COLORS.danger} />
              )}
            </TouchableOpacity>

            {/* Scenario 3: High Demand Consumption */}
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
                <Ionicons name="checkmark-circle" size={20} color="#F59E0B" />
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
                <Ionicons name="checkmark-circle" size={20} color="#0D9488" />
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
    backgroundColor: '#0D0E11', // Deep dark ink black canvas
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 95, // Clearance for tab dock
  },

  /* ========================================================
     1. TOP HERO CARD (Exact typography & layout from reference)
     ======================================================== */
  topCard: {
    backgroundColor: '#F3F2EB', // Off-white card surface
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: 0.2,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pageIndexPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAE8DE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  pageIndexBold: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0D0E11',
  },
  pageIndexLight: {
    fontSize: 13,
    fontWeight: '600',
    color: '#66655E',
  },
  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAE8DE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  menuLinesWrap: {
    gap: 3,
  },
  menuLine: {
    width: 14,
    height: 2,
    backgroundColor: '#0D0E11',
    borderRadius: 1,
  },
  menuText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0D0E11',
    letterSpacing: 0.8,
  },

  /* Category Tag Pill (matching "Resources" tag in image) */
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAE8DE',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 14,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D0E11',
    letterSpacing: 0.3,
  },

  /* Massive Display Headline (matching "Best Google fonts for tech websites") */
  headlineBlock: {
    marginBottom: 8,
  },
  giantHeadline: {
    fontSize: 48,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: -2,
    lineHeight: 48,
  },
  headlineSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#66655E',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 18,
  },

  /* Floating Cursor Badge (matching "Inayat Naqvi" badge in image) */
  cursorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#0D0E11',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 6,
    marginBottom: 18,
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

  /* Card Footer (matching "@ui.inayat" and "Save for later" in image) */
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(13, 14, 17, 0.08)',
  },
  footerHandle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: -0.2,
  },
  footerSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#66655E',
    marginTop: 2,
  },
  actionBtnPill: {
    backgroundColor: '#EAE8DE',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D0E11',
  },

  /* ========================================================
     2. SPLIT 3-COLUMN METRIC MATRIX (Matching Screen 1)
     ======================================================== */
  metricMatrixCard: {
    backgroundColor: '#1C1D22',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#282A30',
  },
  matrixCol: {
    flex: 1,
  },
  matrixLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9E9FA5',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  matrixValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  matrixUnit: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.accentYellow,
  },
  matrixDivider: {
    width: 1,
    height: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: 10,
  },

  /* ========================================================
     3. SPLIT 2-BOX METRIC SHOWCASE (Matching Screen 2)
     ======================================================== */
  splitBoxRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 12,
  },
  splitBoxYellow: {
    flex: 1,
    backgroundColor: COLORS.accentYellow,
    padding: 16,
    borderRadius: 18,
    minHeight: 120,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2EA00',
  },
  splitBoxLabelDark: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D0E11',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  splitBoxValueDark: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0D0E11',
    letterSpacing: -1.2,
  },
  splitBoxUnitDark: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333333',
  },
  splitBoxFooterDark: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333333',
  },
  splitBoxDark: {
    flex: 1,
    backgroundColor: '#1C1D22',
    padding: 16,
    borderRadius: 18,
    minHeight: 120,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#282A30',
  },
  splitBoxLabelLight: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9E9FA5',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  splitBoxValueLight: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  splitBoxFooterLight: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8F959E',
  },

  /* ========================================================
     4. PIPELINE AUDIT STEPS (Matching Screen 1 Steps)
     ======================================================== */
  stepsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D8D6CE',
  },
  stepItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  stepIndex: {
    width: 50,
    fontSize: 12,
    fontWeight: '900',
    color: '#0D0E11',
  },
  stepTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#0D0E11',
    paddingHorizontal: 8,
  },
  stepValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0D0E11',
  },
  stepItemDivider: {
    height: 1,
    backgroundColor: '#EAE8DE',
  },
  stepStatusPill: {
    backgroundColor: '#0D0E11',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stepStatusPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.accentYellow,
    letterSpacing: 0.5,
  },

  /* ========================================================
     5. BOTTOM FOOTER BAR (Matching Screen 2 Bottom Bar)
     ======================================================== */
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailsBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  playArrowBtn: {
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
