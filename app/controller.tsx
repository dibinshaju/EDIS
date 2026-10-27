import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../src/constants/theme';
import { useMqtt } from '../src/context/MqttContext';
import { useSensor } from '../src/context/SensorContext';
import { ManualFlowControl } from '../src/components/ManualFlowControl';
import { ScenarioController } from '../src/components/ScenarioController';
import { formatFlow } from '../src/utils/format';

export default function StandaloneControllerScreen() {
  const router = useRouter();
  const { status: mqttStatus, connect, disconnect, brokerUrl, lastReading } = useMqtt();
  const {
    dataSource,
    setDataSource,
    inFlow,
    outFlow,
    mismatch,
    statusState,
    resetSimulator,
  } = useSensor();

  const isConnected = mqttStatus === 'connected';

  const openDashboard = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open('/', '_blank');
    } else {
      router.push('/');
    }
  };

  const openWokwi = () => {
    Linking.openURL('https://wokwi.com');
  };

  return (
    <View style={styles.screen}>
      {/* Top Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <TouchableOpacity style={styles.navBackBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <View style={styles.tagBadge}>
              <Text style={styles.tagBadgeText}>STANDALONE CONSOLE</Text>
            </View>
            <Text style={styles.navTitle}>WaterGuard Controller</Text>
          </View>
        </View>

        <View style={styles.navRight}>
          <TouchableOpacity style={styles.navActionBtn} onPress={openDashboard}>
            <Ionicons name="open-outline" size={14} color="#0D0E11" />
            <Text style={styles.navActionBtnText}>Open Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navSecondaryBtn} onPress={openWokwi}>
            <Ionicons name="hardware-chip-outline" size={14} color="#FFFFFF" />
            <Text style={styles.navSecondaryBtnText}>Wokwi</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.container}>
          {/* Hardware Connection Strip */}
          <View style={styles.connectionCard}>
            <View style={styles.connectionHeader}>
              <View style={styles.connectionTitleGroup}>
                <View
                  style={[
                    styles.statusDot,
                    isConnected ? styles.statusDotGreen : styles.statusDotRed,
                  ]}
                />
                <Text style={styles.connectionHeading}>
                  {isConnected ? 'MQTT BRIDGE CONNECTED' : 'MQTT BRIDGE DISCONNECTED'}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.connectToggleBtn,
                  isConnected ? styles.disconnectBtn : styles.connectBtn,
                ]}
                onPress={isConnected ? disconnect : connect}
              >
                <Ionicons
                  name={isConnected ? 'unlink' : 'link'}
                  size={12}
                  color={isConnected ? '#EF4444' : '#0D0E11'}
                />
                <Text
                  style={[
                    styles.connectToggleText,
                    isConnected ? { color: '#EF4444' } : { color: '#0D0E11' },
                  ]}
                >
                  {isConnected ? 'Disconnect' : 'Connect'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.connectionDetailsRow}>
              <Text style={styles.connectionMeta}>
                Broker: <Text style={styles.connectionCode}>{brokerUrl}</Text>
              </Text>
              <Text style={styles.connectionMeta}>
                Topic: <Text style={styles.connectionCode}>water/demo/command</Text>
              </Text>
            </View>
          </View>

          {/* Real-time Telemetry Snapshot Bar */}
          <View style={styles.telemetryCard}>
            <View style={styles.telemetryHeader}>
              <Text style={styles.telemetryTitle}>SYNCHRONIZED SENSOR STATE</Text>
              <View
                style={[
                  styles.telemetryBadge,
                  statusState === 'leak'
                    ? styles.badgeDanger
                    : statusState === 'high'
                    ? styles.badgeWarning
                    : styles.badgeNormal,
                ]}
              >
                <Text style={styles.telemetryBadgeText}>{statusState.toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.telemetryGrid}>
              <View style={styles.telemetryCol}>
                <Text style={styles.telemetryLabel}>INLET FLOW (S1)</Text>
                <Text style={styles.telemetryValue}>
                  {formatFlow(inFlow)} <Text style={styles.telemetryUnit}>L/min</Text>
                </Text>
              </View>

              <View style={styles.telemetryDivider} />

              <View style={styles.telemetryCol}>
                <Text style={styles.telemetryLabel}>OUTLET FLOW (S2)</Text>
                <Text style={styles.telemetryValue}>
                  {formatFlow(outFlow)} <Text style={styles.telemetryUnit}>L/min</Text>
                </Text>
              </View>

              <View style={styles.telemetryDivider} />

              <View style={styles.telemetryCol}>
                <Text style={styles.telemetryLabel}>MISMATCH (S1 - S2)</Text>
                <Text
                  style={[
                    styles.telemetryValue,
                    mismatch > 1.5 && { color: COLORS.danger },
                    mismatch < -1.5 && { color: '#0D9488' },
                  ]}
                >
                  {mismatch > 0 ? '+' : ''}
                  {formatFlow(mismatch)} <Text style={styles.telemetryUnit}>L/min</Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Primary Manual Flow Control Panel */}
          <ManualFlowControl />

          {/* Academic Evaluation Scenarios */}
          <View style={{ marginTop: SPACING.md }}>
            <ScenarioController />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.canvasBg,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#18191D',
    borderBottomWidth: 1,
    borderBottomColor: '#282A30',
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navBackBtn: {
    padding: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: '#26282E',
  },
  tagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.badgeYellowBg,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
    marginBottom: 2,
  },
  tagBadgeText: {
    fontFamily: 'BebasNeue',
    fontSize: 9,
    color: '#0D0E11',
    letterSpacing: 0.5,
  },
  navTitle: {
    fontFamily: 'Bungee',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accentYellow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  navActionBtnText: {
    fontFamily: 'BebasNeue',
    fontSize: 12,
    color: '#0D0E11',
    letterSpacing: 0.5,
  },
  navSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#26282E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  navSecondaryBtnText: {
    fontFamily: 'BebasNeue',
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 720,
  },
  connectionCard: {
    backgroundColor: '#1C1D22',
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#282A30',
    marginBottom: 12,
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  connectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotGreen: {
    backgroundColor: '#10B981',
  },
  statusDotRed: {
    backgroundColor: '#EF4444',
  },
  connectionHeading: {
    fontFamily: 'BebasNeue',
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  connectToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  connectBtn: {
    backgroundColor: COLORS.accentYellow,
  },
  disconnectBtn: {
    backgroundColor: '#2C1D22',
    borderWidth: 1,
    borderColor: '#7F1D1D',
  },
  connectToggleText: {
    fontFamily: 'BebasNeue',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  connectionDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  connectionMeta: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  connectionCode: {
    fontFamily: 'SF Mono, monospace',
    color: '#E5E7EB',
  },
  telemetryCard: {
    backgroundColor: '#1C1D22',
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#282A30',
    marginBottom: 12,
  },
  telemetryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  telemetryTitle: {
    fontFamily: 'BebasNeue',
    fontSize: 11,
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  telemetryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeNormal: {
    backgroundColor: '#064E3B',
  },
  badgeWarning: {
    backgroundColor: '#78350F',
  },
  badgeDanger: {
    backgroundColor: '#7F1D1D',
  },
  telemetryBadgeText: {
    fontFamily: 'BebasNeue',
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  telemetryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  telemetryCol: {
    flex: 1,
    alignItems: 'center',
  },
  telemetryLabel: {
    fontFamily: 'BebasNeue',
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  telemetryValue: {
    fontFamily: 'GravitasOne',
    fontSize: 20,
    color: '#FFFFFF',
  },
  telemetryUnit: {
    fontFamily: 'BebasNeue',
    fontSize: 11,
    color: '#9CA3AF',
  },
  telemetryDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#282A30',
  },
});
