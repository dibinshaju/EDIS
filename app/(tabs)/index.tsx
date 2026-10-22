import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SPACING } from '../../src/constants/theme';
import { useSensor } from '../../src/context/SensorContext';
import { useMqtt } from '../../src/context/MqttContext';
import { WaveformChart } from '../../src/components/WaveformChart';
import { formatFlow, formatTime } from '../../src/utils/format';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const router = useRouter();
  const {
    inFlow,
    outFlow,
    mismatch,
    totalVolumeLiters,
    elapsed,
    statusState,
    statusDetail,
    events,
    setScenario,
    resetDemo,
    activeScenario,
    dataSource,
    currentReading,
  } = useSensor();

  const { status: mqttStatus, brokerUrl, lastMessageTime } = useMqtt();

  // Determine system status title, color, and explanation
  const getSystemStatus = () => {
    if (dataSource === 'wokwi' && mqttStatus === 'disconnected') {
      return {
        title: 'Connection Lost',
        color: COLORS.danger,
        bgColor: '#FEF2F2',
        borderColor: '#FCA5A5',
        icon: 'cloud-offline-outline' as const,
        explanation: 'MQTT broker unreachable. Check Wokwi simulator network bridge.',
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
          explanation: 'Outlet exceeds inlet flow. Diagnostic calibration check advised.',
        };
      case 'high':
        return {
          title: 'High Consumption',
          color: COLORS.warning,
          bgColor: '#FFFBEB',
          borderColor: '#FDE68A',
          icon: 'speedometer-outline' as const,
          explanation: 'Heavy demand detected (>25.0 L/min). Flow balanced across nodes.',
        };
      case 'checking':
        return {
          title: 'Checking Flow Deficit',
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
          explanation: 'Municipal inflow and discharge match within certified tolerances.',
        };
    }
  };

  const sysStatus = getSystemStatus();
  const flowDifference = inFlow - outFlow;
  const isDemo = dataSource === 'demo';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      {/* 1. HEADER & BRANDING (AquaGuard — Smart Water Monitor) */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.brandGroup}>
            <View style={styles.logoBadge}>
              <Ionicons name="water" size={18} color="#0284C7" />
            </View>
            <View>
              <Text style={styles.brandTitle}>AquaGuard</Text>
              <Text style={styles.brandSubtitle}>Smart Water Monitor</Text>
            </View>
          </View>

          {/* Demo Mode / Live Badge */}
          <View style={[styles.modePill, isDemo ? styles.modePillDemo : styles.modePillLive]}>
            <View style={[styles.modeDot, isDemo ? styles.modeDotDemo : styles.modeDotLive]} />
            <Text style={[styles.modePillText, isDemo ? styles.modeTextDemo : styles.modeTextLive]}>
              {isDemo ? 'DEMO MODE' : 'WOKWI LIVE'}
            </Text>
          </View>
        </View>

        {/* High-Impact Punchy Title (Matching reference typography) */}
        <View style={styles.heroTitleWrap}>
          <Text style={styles.heroTitlePrimary}>Real-Time Flow &</Text>
          <Text style={styles.heroTitlePrimary}>
            Leak <Text style={styles.heroTitleAccent}>Detection</Text>
          </Text>
        </View>
      </View>

      {/* 2. SYSTEM STATUS CARD */}
      <View style={[styles.statusCard, { backgroundColor: sysStatus.bgColor, borderColor: sysStatus.borderColor }]}>
        <View style={styles.statusCardHeader}>
          <View style={styles.statusTitleRow}>
            <Ionicons name={sysStatus.icon} size={20} color={sysStatus.color} />
            <Text style={[styles.statusTitleText, { color: sysStatus.color }]}>
              {sysStatus.title}
            </Text>
          </View>
          <Text style={styles.timestampText}>
            Updated {formatTime(currentReading.timestamp || Date.now())}
          </Text>
        </View>
        <Text style={styles.statusExplanationText}>{sysStatus.explanation}</Text>
      </View>

      {/* 3. FOUR KEY SENSOR & CONSUMPTION METRICS */}
      <View style={styles.metricsGrid}>
        {/* Metric 1: Inlet Flow */}
        <View style={styles.metricCard}>
          <View style={styles.metricCardTop}>
            <Ionicons name="arrow-down-circle-outline" size={16} color="#0284C7" />
            <Text style={styles.metricLabel}>Inlet Flow</Text>
          </View>
          <Text style={styles.metricValue}>
            {formatFlow(inFlow)} <Text style={styles.metricUnit}>L/min</Text>
          </Text>
          <Text style={styles.metricFooter}>Municipal section entry</Text>
        </View>

        {/* Metric 2: Outlet Flow */}
        <View style={styles.metricCard}>
          <View style={styles.metricCardTop}>
            <Ionicons name="arrow-up-circle-outline" size={16} color="#0D9488" />
            <Text style={styles.metricLabel}>Outlet Flow</Text>
          </View>
          <Text style={styles.metricValue}>
            {formatFlow(outFlow)} <Text style={styles.metricUnit}>L/min</Text>
          </Text>
          <Text style={styles.metricFooter}>Distribution point</Text>
        </View>

        {/* Metric 3: Flow Difference (Inlet - Outlet) */}
        <View
          style={[
            styles.metricCard,
            flowDifference > 1.5 && styles.metricCardAlert,
          ]}
        >
          <View style={styles.metricCardTop}>
            <Ionicons
              name="git-compare-outline"
              size={16}
              color={flowDifference > 1.5 ? COLORS.danger : '#64748B'}
            />
            <Text style={styles.metricLabel}>Flow Difference</Text>
          </View>
          <Text
            style={[
              styles.metricValue,
              flowDifference > 1.5 && { color: COLORS.danger },
            ]}
          >
            {flowDifference >= 0 ? '+' : ''}
            {formatFlow(flowDifference)}{' '}
            <Text style={styles.metricUnit}>L/min</Text>
          </Text>
          <Text style={styles.metricFooter}>
            {flowDifference > 1.5 ? 'Deficit detected' : 'Inlet minus outlet'}
          </Text>
        </View>

        {/* Metric 4: Today's Consumption */}
        <View style={styles.metricCard}>
          <View style={styles.metricCardTop}>
            <Ionicons name="water-outline" size={16} color="#6366F1" />
            <Text style={styles.metricLabel}>Consumption</Text>
          </View>
          <Text style={styles.metricValue}>
            {totalVolumeLiters.toFixed(1)}{' '}
            <Text style={styles.metricUnit}>L</Text>
          </Text>
          <Text style={styles.metricFooter}>Estimated cumulative</Text>
        </View>
      </View>

      {/* 4. SENSOR AND CONNECTIVITY STATUS */}
      <View style={styles.deviceStatusCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="hardware-chip-outline" size={16} color={COLORS.textPrimary} />
            <Text style={styles.cardHeaderTitle}>Device & Telemetry Link</Text>
          </View>
          <View style={styles.sourceTag}>
            <Text style={styles.sourceTagText}>{isDemo ? 'Local Engine' : 'MQTT Stream'}</Text>
          </View>
        </View>

        <View style={styles.deviceInfoGrid}>
          <View style={styles.deviceInfoItem}>
            <Text style={styles.deviceInfoLabel}>Virtual ESP32</Text>
            <View style={styles.statusIndicatorRow}>
              <View
                style={[
                  styles.miniDot,
                  { backgroundColor: isDemo || mqttStatus === 'connected' ? '#10B981' : '#F59E0B' },
                ]}
              />
              <Text style={styles.deviceInfoVal}>
                {isDemo ? 'Simulated' : mqttStatus === 'connected' ? 'Online' : 'Standby'}
              </Text>
            </View>
          </View>

          <View style={styles.deviceInfoItem}>
            <Text style={styles.deviceInfoLabel}>MQTT Broker</Text>
            <View style={styles.statusIndicatorRow}>
              <View
                style={[
                  styles.miniDot,
                  {
                    backgroundColor:
                      mqttStatus === 'connected'
                        ? '#10B981'
                        : isDemo
                        ? '#6B7280'
                        : '#EF4444',
                  },
                ]}
              />
              <Text style={styles.deviceInfoVal}>
                {mqttStatus === 'connected' ? 'Connected' : isDemo ? 'Demo Mode' : 'Disconnected'}
              </Text>
            </View>
          </View>

          <View style={styles.deviceInfoItem}>
            <Text style={styles.deviceInfoLabel}>Telemetry Packet</Text>
            <Text style={styles.deviceInfoVal} numberOfLines={1}>
              {lastMessageTime ? formatTime(lastMessageTime) : `T+${elapsed}s active`}
            </Text>
          </View>
        </View>
      </View>

      {/* 5. QUICK SIMULATION CONTROLS */}
      <View style={styles.simulationPanel}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="flask-outline" size={16} color={COLORS.textPrimary} />
            <Text style={styles.cardHeaderTitle}>Quick Simulation</Text>
          </View>
          <TouchableOpacity style={styles.resetButton} onPress={resetDemo}>
            <Ionicons name="refresh" size={13} color="#6B7280" />
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.panelSubtitle}>
          Run deterministic evaluations across the dual-sensor detection pipeline
        </Text>

        <View style={styles.scenariosGrid}>
          {/* A. Normal Flow */}
          <TouchableOpacity
            style={[
              styles.scenarioCard,
              activeScenario === 'normal' && styles.scenarioCardActive,
            ]}
            onPress={() => setScenario('normal')}
          >
            <View style={styles.scenarioCardTop}>
              <Ionicons
                name="checkmark-circle-outline"
                size={16}
                color={activeScenario === 'normal' ? '#10B981' : '#64748B'}
              />
              <Text
                style={[
                  styles.scenarioCardTitle,
                  activeScenario === 'normal' && styles.scenarioTextActive,
                ]}
              >
                Normal Flow
              </Text>
            </View>
            <Text style={styles.scenarioCardSub}>5.0 L/m balanced</Text>
          </TouchableOpacity>

          {/* B. Suspected Leak */}
          <TouchableOpacity
            style={[
              styles.scenarioCard,
              activeScenario === 'suspected_leak' && styles.scenarioCardActiveAlert,
            ]}
            onPress={() => setScenario('suspected_leak')}
          >
            <View style={styles.scenarioCardTop}>
              <Ionicons
                name="alert-circle-outline"
                size={16}
                color={activeScenario === 'suspected_leak' ? '#EF4444' : '#64748B'}
              />
              <Text
                style={[
                  styles.scenarioCardTitle,
                  activeScenario === 'suspected_leak' && styles.scenarioTextActive,
                ]}
              >
                Suspected Leak
              </Text>
            </View>
            <Text style={styles.scenarioCardSub}>+2.0 L/m deficit</Text>
          </TouchableOpacity>

          {/* C. High Consumption */}
          <TouchableOpacity
            style={[
              styles.scenarioCard,
              activeScenario === 'abnormal_consumption' && styles.scenarioCardActive,
            ]}
            onPress={() => setScenario('abnormal_consumption')}
          >
            <View style={styles.scenarioCardTop}>
              <Ionicons
                name="speedometer-outline"
                size={16}
                color={activeScenario === 'abnormal_consumption' ? '#F59E0B' : '#64748B'}
              />
              <Text
                style={[
                  styles.scenarioCardTitle,
                  activeScenario === 'abnormal_consumption' && styles.scenarioTextActive,
                ]}
              >
                High Draw
              </Text>
            </View>
            <Text style={styles.scenarioCardSub}>31.0 L/m draw</Text>
          </TouchableOpacity>

          {/* D. Sensor Anomaly */}
          <TouchableOpacity
            style={[
              styles.scenarioCard,
              activeScenario === 'sensor_anomaly' && styles.scenarioCardActive,
            ]}
            onPress={() => setScenario('sensor_anomaly')}
          >
            <View style={styles.scenarioCardTop}>
              <Ionicons
                name="build-outline"
                size={16}
                color={activeScenario === 'sensor_anomaly' ? '#0D9488' : '#64748B'}
              />
              <Text
                style={[
                  styles.scenarioCardTitle,
                  activeScenario === 'sensor_anomaly' && styles.scenarioTextActive,
                ]}
              >
                Sensor Anomaly
              </Text>
            </View>
            <Text style={styles.scenarioCardSub}>Outlet &gt; Inlet</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 6. COMPACT HISTORICAL FLOW CHART */}
      <View style={styles.chartPanel}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="bar-chart-outline" size={16} color={COLORS.textPrimary} />
            <Text style={styles.cardHeaderTitle}>Historical Flow Curve</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#0284C7' }]} />
              <Text style={styles.legendText}>Inlet S1</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#94A3B8' }]} />
              <Text style={styles.legendText}>Outlet S2</Text>
            </View>
          </View>
        </View>

        <WaveformChart
          title="Intake vs Distribution Curve"
          currentValue={inFlow}
          averageValue={outFlow}
          deltaValue={flowDifference}
          isAlert={statusState === 'leak'}
        />
      </View>

      {/* 7. RECENT ACTIVITY FEED */}
      <View style={styles.activityPanel}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="list-outline" size={16} color={COLORS.textPrimary} />
            <Text style={styles.cardHeaderTitle}>Recent Activity</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/alerts')}>
            <Text style={styles.viewAllText}>View All Alerts</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityList}>
          {events.slice(0, 3).map((item) => (
            <View key={item.id} style={styles.activityRow}>
              <View style={styles.activityDot} />
              <Text style={styles.activityTime}>{item.t}</Text>
              <Text style={styles.activityDesc} numberOfLines={1}>
                {item.message}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  /* Header */
  header: {
    marginBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  modePillDemo: {
    backgroundColor: '#F1F5F9',
  },
  modePillLive: {
    backgroundColor: '#ECFDF5',
  },
  modeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modeDotDemo: {
    backgroundColor: '#64748B',
  },
  modeDotLive: {
    backgroundColor: '#10B981',
  },
  modePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  modeTextDemo: {
    color: '#475569',
  },
  modeTextLive: {
    color: '#065F46',
  },
  heroTitleWrap: {
    marginTop: 4,
  },
  heroTitlePrimary: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 33,
    letterSpacing: -1,
  },
  heroTitleAccent: {
    color: '#0284C7',
  },

  /* System Status Card */
  statusCard: {
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  statusCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusTitleText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  timestampText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  statusExplanationText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
    marginTop: 2,
    fontWeight: '500',
  },

  /* 4 Metric Cards Grid */
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricCardAlert: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  metricCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  metricFooter: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },

  /* Device Status Card */
  deviceStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  sourceTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  sourceTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  deviceInfoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  deviceInfoItem: {
    flex: 1,
  },
  deviceInfoLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  deviceInfoVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },

  /* Quick Simulation Panel */
  simulationPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  panelSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 12,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  resetButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  scenariosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scenarioCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scenarioCardActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  scenarioCardActiveAlert: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  scenarioCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  scenarioCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  scenarioTextActive: {
    color: '#FFFFFF',
  },
  scenarioCardSub: {
    fontSize: 10,
    color: '#64748B',
  },

  /* Historical Chart Panel */
  chartPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },

  /* Activity Panel */
  activityPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  activityList: {
    gap: 6,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0284C7',
  },
  activityTime: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    minWidth: 42,
  },
  activityDesc: {
    flex: 1,
    fontSize: 11,
    color: '#1E293B',
    fontWeight: '500',
  },
});
