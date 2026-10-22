import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SPACING } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useMqtt } from '../../src/context/MqttContext';
import { useSensor } from '../../src/context/SensorContext';
import { useAlerts } from '../../src/context/AlertContext';
import { StatusDot } from '../../src/components/StatusDot';
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
          <Ionicons name="shield-checkmark" size={20} color={COLORS.tealPrimary} />
          <Text style={styles.headerTitle}>Admin Center & System Config</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Authorized administrator controls and hardware telemetry settings
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Administrator Profile Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="person-circle-outline" size={20} color={COLORS.navyDark} />
              <Text style={styles.cardTitle}>Registered Administrator</Text>
            </View>
            <View style={[styles.badge, isDemoMode ? styles.badgeDemo : styles.badgeProd]}>
              <Text style={[styles.badgeText, isDemoMode ? styles.badgeTextDemo : styles.badgeTextProd]}>
                {isDemoMode ? 'DEMO SESSION' : 'FIREBASE AUTH'}
              </Text>
            </View>
          </View>

          {isAuthenticated && user ? (
            <View style={styles.profileBox}>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Admin Phone:</Text>
                <Text style={styles.profileValue}>{user.maskedPhone}</Text>
              </View>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Role Level:</Text>
                <Text style={[styles.profileValue, { color: COLORS.tealDark, fontWeight: '700' }]}>
                  {user.role.toUpperCase()} (Privileged)
                </Text>
              </View>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Device Notification Token:</Text>
                <Text style={styles.profileValue}>
                  {isDemoMode ? 'Simulated Local Token (Expo Go)' : 'APNs / FCM Registered'}
                </Text>
              </View>

              <View style={styles.profileBtnRow}>
                <TouchableOpacity
                  style={styles.switchLoginBtn}
                  onPress={() => router.push('/login')}
                >
                  <Text style={styles.switchLoginText}>Switch / Re-login</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
                  <Ionicons name="log-out-outline" size={14} color={COLORS.danger} />
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.unauthBox}>
              <Text style={styles.unauthText}>
                No active administrator session. Log in to manage notification tokens and hardware controls.
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

        {/* Audio Buzzer & Notification Controls */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="volume-high-outline" size={20} color={COLORS.navyDark} />
              <Text style={styles.cardTitle}>Audio Alarm & Notification</Text>
            </View>
          </View>

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>In-App Audio Buzzer</Text>
              <Text style={styles.settingDesc}>
                Plays distinctive 2-tone alarm on new CRITICAL leak events
              </Text>
            </View>
            <Switch
              value={isBuzzerEnabled}
              onValueChange={toggleBuzzer}
              trackColor={{ false: '#CBD5E1', true: COLORS.tealPrimary }}
            />
          </View>

          <View style={styles.buzzerActionRow}>
            <TouchableOpacity style={styles.testBuzzerBtn} onPress={playTestBuzzer}>
              <Ionicons name="play" size={14} color="#FFFFFF" />
              <Text style={styles.testBuzzerText}>Test Buzzer Sound</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testNotificationBtn}
              onPress={() => triggerDemoAlert('SUSPECTED_LEAK')}
            >
              <Ionicons name="notifications-outline" size={14} color={COLORS.navyDark} />
              <Text style={styles.testNotificationText}>Trigger Test Alert</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.noteBox}>
            <Ionicons name="information-circle-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.noteText}>
              iOS Audio Restriction: In-app JavaScript audio only plays when app is foregrounded. Background alerts require Apple APNs / FCM push notification payload.
            </Text>
          </View>
        </View>

        {/* Configurable Leak & Consumption Thresholds */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="options-outline" size={20} color={COLORS.navyDark} />
              <Text style={styles.cardTitle}>Detection Threshold Parameters</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mismatch Threshold (L/min)</Text>
            <Text style={styles.inputHelp}>Positive flow deficit (Inlet - Outlet) to trigger leak inspection</Text>
            <TextInput
              style={styles.textInput}
              value={mismatchInput}
              onChangeText={setMismatchInput}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Persistence Duration Filter (Seconds)</Text>
            <Text style={styles.inputHelp}>Duration mismatch must continuously persist to reject transient spikes</Text>
            <TextInput
              style={styles.textInput}
              value={persistenceInput}
              onChangeText={setPersistenceInput}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>High Consumption Threshold (L/min)</Text>
            <Text style={styles.inputHelp}>Maximum continuous draw rate before triggering abnormal consumption</Text>
            <TextInput
              style={styles.textInput}
              value={highConsumpInput}
              onChangeText={setHighConsumpInput}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveThresholds}>
            <Text style={styles.saveBtnText}>Save Threshold Settings</Text>
          </TouchableOpacity>
        </View>

        {/* MQTT Broker Configuration */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="wifi-outline" size={20} color={COLORS.navyDark} />
              <Text style={styles.cardTitle}>MQTT-over-WebSocket Broker</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <StatusDot status={mqttStatus} size={8} />
              <Text style={styles.statusLabel}>{mqttStatus.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>WebSocket Broker Endpoint URL</Text>
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
              <Text style={styles.mqttConnectText}>Connect / Reconnect</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mqttDisconnectBtn} onPress={disconnect}>
              <Text style={styles.mqttDisconnectText}>Disconnect</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.wokwiGuideLink}
            onPress={() => router.push('/wokwi-guide')}
          >
            <Ionicons name="hardware-chip-outline" size={16} color={COLORS.tealDark} />
            <Text style={styles.wokwiGuideLinkText}>
              Open Wokwi Virtual ESP32 Setup & Telemetry Inspector →
            </Text>
          </TouchableOpacity>

          {/* Diagnostic Log Terminal */}
          <Text style={styles.logsHeading}>Recent Telemetry / MQTT Logs:</Text>
          <View style={styles.logBox}>
            {logs.length === 0 ? (
              <Text style={styles.logEmpty}>No connection events yet.</Text>
            ) : (
              logs.slice(0, 6).map((log, i) => (
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
    backgroundColor: COLORS.bgLight,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.navyDark,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.navyDark,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeDemo: {
    backgroundColor: COLORS.warningBg,
  },
  badgeProd: {
    backgroundColor: COLORS.successBg,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeTextDemo: {
    color: COLORS.warningText,
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
    paddingVertical: 2,
  },
  profileLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  profileValue: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  profileBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  switchLoginBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: COLORS.bgLight,
  },
  switchLoginText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.navyDark,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: COLORS.dangerBg,
  },
  logoutText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.dangerText,
  },
  unauthBox: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  unauthText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 10,
  },
  loginNowBtn: {
    backgroundColor: COLORS.navyDark,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  loginNowText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  settingDesc: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  buzzerActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  testBuzzerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.tealPrimary,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
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
    backgroundColor: '#E0F2FE',
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  testNotificationText: {
    color: COLORS.navyDark,
    fontSize: 11,
    fontWeight: '700',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: COLORS.bgLight,
    padding: 8,
    borderRadius: RADIUS.sm,
  },
  noteText: {
    fontSize: 10,
    color: COLORS.textMuted,
    flex: 1,
    lineHeight: 14,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  inputHelp: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: COLORS.textDark,
    backgroundColor: '#F8FAFC',
  },
  saveBtn: {
    backgroundColor: COLORS.navyDark,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  mqttBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  mqttConnectBtn: {
    flex: 1,
    backgroundColor: COLORS.navyDark,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  mqttConnectText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  mqttDisconnectBtn: {
    paddingHorizontal: 14,
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  mqttDisconnectText: {
    color: COLORS.textDark,
    fontSize: 11,
    fontWeight: '600',
  },
  wokwiGuideLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    borderWidth: 1,
    padding: 10,
    borderRadius: RADIUS.sm,
    marginBottom: 12,
  },
  wokwiGuideLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
    flex: 1,
  },
  logsHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  logBox: {
    backgroundColor: '#0F172A',
    borderRadius: RADIUS.sm,
    padding: 8,
    minHeight: 60,
  },
  logEmpty: {
    color: '#64748B',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  logLine: {
    color: '#38BDF8',
    fontSize: 9,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});
