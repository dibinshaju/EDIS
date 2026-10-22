import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SPACING } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useMqtt } from '../../src/context/MqttContext';
import { useSensor } from '../../src/context/SensorContext';
import { useAlerts } from '../../src/context/AlertContext';
import { Ionicons } from '@expo/vector-icons';

export default function AdminScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout, isDemoMode } = useAuth();
  const { status: mqttStatus, brokerUrl, setBrokerUrl, connect, disconnect, logs } = useMqtt();
  const { thresholds, updateThresholds } = useSensor();
  const { isBuzzerEnabled, toggleBuzzer, playTestBuzzer, triggerDemoAlert } = useAlerts();

  const [inputBroker, setInputBroker] = useState<string>(brokerUrl);
  const [mismatchInput, setMismatchInput] = useState<string>(String(thresholds.mismatchThreshold));
  const [persistenceInput, setPersistenceInput] = useState<string>(String(thresholds.persistenceDurationSec));
  const [highConsumpInput, setHighConsumpInput] = useState<string>(String(thresholds.highConsumptionThreshold));

  const handleSaveThresholds = () => {
    const m = parseFloat(mismatchInput);
    const p = parseInt(persistenceInput, 10);
    const h = parseFloat(highConsumpInput);

    if (isNaN(m) || isNaN(p) || isNaN(h)) {
      alert('Please enter valid numeric values for all threshold fields.');
      return;
    }

    updateThresholds({
      mismatchThreshold: m,
      persistenceDurationSec: p,
      highConsumptionThreshold: h,
    });
    alert('Threshold settings successfully updated.');
  };

  const handleUpdateBroker = () => {
    if (!inputBroker.startsWith('ws://') && !inputBroker.startsWith('wss://')) {
      alert('Broker URL must start with ws:// or wss:// for WebSockets transport.');
      return;
    }
    setBrokerUrl(inputBroker);
    disconnect();
    setTimeout(() => {
      connect();
    }, 500);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="settings-outline" size={16} color={COLORS.textPrimary} />
          </View>
          <Text style={styles.headerTitle}>System Configuration</Text>
        </View>
        <Text style={styles.headerSubtitle}>Hardware telemetry parameters & administrator controls</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Administrator Profile Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Administrator Credentials</Text>
            <View style={[styles.badge, isDemoMode ? styles.badgeDemo : styles.badgeProd]}>
              <Text style={[styles.badgeText, isDemoMode ? styles.badgeTextDemo : styles.badgeTextProd]}>
                {isDemoMode ? 'EXPO DEMO MODE' : 'FIREBASE SECURE'}
              </Text>
            </View>
          </View>

          {isAuthenticated && user ? (
            <View style={styles.profileBox}>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Verified Number</Text>
                <Text style={styles.profileValue}>{user.maskedPhone}</Text>
              </View>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Access Level</Text>
                <Text style={[styles.profileValue, { fontWeight: '800' }]}>
                  {user.role.toUpperCase()} (Privileged)
                </Text>
              </View>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Push Dispatch Token</Text>
                <Text style={styles.profileValue}>
                  {isDemoMode ? 'Local Notification Dispatch' : 'FCM Registered'}
                </Text>
              </View>

              <View style={styles.profileBtnRow}>
                <TouchableOpacity
                  style={styles.switchLoginBtn}
                  onPress={() => router.push('/login')}
                >
                  <Text style={styles.switchLoginText}>Switch Session</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
                  <Ionicons name="log-out-outline" size={13} color={COLORS.danger} />
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.unauthBox}>
              <Text style={styles.unauthText}>
                No authenticated admin session. Sign in to edit telemetry settings.
              </Text>
              <TouchableOpacity
                style={styles.loginNowBtn}
                onPress={() => router.push('/login')}
              >
                <Text style={styles.loginNowText}>Admin Login</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Audio Annunciator Settings */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Alert Annunciator</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Audio Buzzer Alarm</Text>
              <Text style={styles.settingDesc}>
                Audible 2-tone alarm on new critical flow discrepancy
              </Text>
            </View>
            <Switch
              value={isBuzzerEnabled}
              onValueChange={toggleBuzzer}
              trackColor={{ false: '#CBD5E1', true: COLORS.accentLimeDark }}
            />
          </View>

          <View style={styles.buzzerActionRow}>
            <TouchableOpacity style={styles.testBuzzerBtn} onPress={playTestBuzzer}>
              <Ionicons name="volume-high-outline" size={13} color="#FFFFFF" />
              <Text style={styles.testBuzzerText}>Test Audio Buzzer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testNotificationBtn}
              onPress={() => triggerDemoAlert('SUSPECTED_LEAK')}
            >
              <Ionicons name="notifications-outline" size={13} color={COLORS.textPrimary} />
              <Text style={styles.testNotificationText}>Trigger Test Event</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Detection Thresholds */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Detection Parameters</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mismatch Threshold (L/min)</Text>
            <Text style={styles.inputHelp}>Flow deficit required to initiate persistence filter</Text>
            <TextInput
              style={styles.textInput}
              value={mismatchInput}
              onChangeText={setMismatchInput}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Persistence Duration Filter (Seconds)</Text>
            <Text style={styles.inputHelp}>Duration deficit must continuously persist to confirm leak</Text>
            <TextInput
              style={styles.textInput}
              value={persistenceInput}
              onChangeText={setPersistenceInput}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>High Consumption Ceiling (L/min)</Text>
            <Text style={styles.inputHelp}>Maximum continuous draw rate before high-demand warning</Text>
            <TextInput
              style={styles.textInput}
              value={highConsumpInput}
              onChangeText={setHighConsumpInput}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveThresholds}>
            <Text style={styles.saveBtnText}>Save Parameters</Text>
          </TouchableOpacity>
        </View>

        {/* MQTT Broker Settings */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>MQTT WebSocket Bridge</Text>
            <View style={styles.statusPill}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      mqttStatus === 'connected' ? COLORS.success : COLORS.danger,
                  },
                ]}
              />
              <Text style={styles.statusText}>{mqttStatus.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Broker WebSocket URL</Text>
            <TextInput
              style={styles.textInput}
              value={inputBroker}
              onChangeText={setInputBroker}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.mqttBtnRow}>
            <TouchableOpacity style={styles.mqttConnectBtn} onPress={handleUpdateBroker}>
              <Text style={styles.mqttConnectText}>Connect Bridge</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mqttDisconnectBtn} onPress={disconnect}>
              <Text style={styles.mqttDisconnectText}>Disconnect</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.wokwiLink}
            onPress={() => router.push('/wokwi-guide')}
          >
            <Ionicons name="hardware-chip-outline" size={14} color={COLORS.textPrimary} />
            <Text style={styles.wokwiLinkText}>
              Open Wokwi Virtual ESP32 Circuit & Setup Guide →
            </Text>
          </TouchableOpacity>

          {/* Diagnostic Log */}
          <Text style={styles.logsHeading}>Telemetry Communication Log</Text>
          <View style={styles.logBox}>
            {logs.length === 0 ? (
              <Text style={styles.logEmpty}>No connection events logged.</Text>
            ) : (
              logs.slice(0, 5).map((log, i) => (
                <Text key={i} style={styles.logLine} numberOfLines={2}>
                  {log}
                </Text>
              ))
            )}
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: COLORS.canvasBg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 14,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeDemo: {
    backgroundColor: COLORS.cardSubtle,
  },
  badgeProd: {
    backgroundColor: COLORS.successBg,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  badgeTextDemo: {
    color: COLORS.textSecondary,
  },
  badgeTextProd: {
    color: COLORS.successText,
  },
  profileBox: {
    gap: 6,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  profileLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  profileValue: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  profileBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.04)',
    paddingTop: 8,
  },
  switchLoginBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: COLORS.cardSubtle,
  },
  switchLoginText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: COLORS.dangerBg,
  },
  logoutText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.dangerText,
  },
  unauthBox: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  unauthText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  loginNowBtn: {
    backgroundColor: COLORS.darkCharcoal,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  loginNowText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  settingDesc: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  buzzerActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  testBuzzerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.darkCharcoal,
    paddingVertical: 8,
    borderRadius: 14,
  },
  testBuzzerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  testNotificationBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.cardSubtle,
    paddingVertical: 8,
    borderRadius: 14,
  },
  testNotificationText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  inputHelp: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D8D5CC',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.cardSubtle,
  },
  saveBtn: {
    backgroundColor: COLORS.darkCharcoal,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.cardSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  mqttBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  mqttConnectBtn: {
    flex: 1,
    backgroundColor: COLORS.darkCharcoal,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
  },
  mqttConnectText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  mqttDisconnectBtn: {
    paddingHorizontal: 12,
    backgroundColor: COLORS.cardSubtle,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
  },
  mqttDisconnectText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  wokwiLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.cardSubtle,
    padding: 10,
    borderRadius: RADIUS.md,
    marginBottom: 12,
  },
  wokwiLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  logsHeading: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  logBox: {
    backgroundColor: COLORS.darkCharcoal,
    borderRadius: RADIUS.md,
    padding: 10,
  },
  logEmpty: {
    color: '#94A3B8',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  logLine: {
    color: COLORS.accentLime,
    fontSize: 9,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});
