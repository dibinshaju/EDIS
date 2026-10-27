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
  const { status: mqttStatus, brokerUrl, setBrokerUrl, connect, disconnect } = useMqtt();
  const { thresholds, updateThresholds } = useSensor();
  const { isBuzzerEnabled, toggleBuzzer, playTestBuzzer } = useAlerts();

  const [inputBroker, setInputBroker] = useState<string>(brokerUrl);
  const [mismatchInput, setMismatchInput] = useState<string>(
    String(thresholds.mismatchThreshold)
  );
  const [persistenceInput, setPersistenceInput] = useState<string>(
    String(thresholds.persistenceDurationSec)
  );
  const [highConsumpInput, setHighConsumpInput] = useState<string>(
    String(thresholds.highConsumptionThreshold)
  );

  // Night-time schedule state
  const [isNightScheduleEnabled, setIsNightScheduleEnabled] = useState(true);
  const [nightStart, setNightStart] = useState('23:00');
  const [nightEnd, setNightEnd] = useState('05:00');

  // Notification preferences
  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);

  const handleSaveThresholds = () => {
    const m = parseFloat(mismatchInput);
    const p = parseInt(persistenceInput, 10);
    const h = parseFloat(highConsumpInput);

    if (isNaN(m) || isNaN(p) || isNaN(h)) {
      alert('Please enter valid numeric values for all threshold fields.');
      return;
    }

    const startH = parseInt(nightStart.split(':')[0], 10);
    const endH = parseInt(nightEnd.split(':')[0], 10);
    const validNightHours =
      !isNaN(startH) && !isNaN(endH) && startH >= 0 && startH <= 23 && endH >= 0 && endH <= 23;

    updateThresholds({
      mismatchThreshold: m,
      persistenceDurationSec: p,
      highConsumptionThreshold: h,
      nightTimeStartHour: validNightHours ? startH : thresholds.nightTimeStartHour,
      nightTimeEndHour: validNightHours ? endH : thresholds.nightTimeEndHour,
    });
    alert('Detection thresholds and parameters successfully saved.');
  };

  const handleUpdateBroker = () => {
    if (!inputBroker.startsWith('ws://') && !inputBroker.startsWith('wss://')) {
      alert('Broker URL must start with ws:// or wss://');
      return;
    }
    setBrokerUrl(inputBroker);
    disconnect();
    setTimeout(() => {
      connect();
    }, 400);
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* 1. Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.brandRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="settings-outline" size={18} color="#0F172A" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Admin Center</Text>
                <Text style={styles.headerSubtitle}>System Controls & Diagnostics</Text>
              </View>
            </View>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {isDemoMode ? 'EXPO DEMO' : 'FIREBASE SECURE'}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Admin Credentials Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Administrator Session</Text>
          {isAuthenticated && user ? (
            <View style={styles.profileBox}>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Account</Text>
                <Text style={styles.profileValue}>{user.maskedPhone}</Text>
              </View>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Access Tier</Text>
                <Text style={styles.profileValueHighlight}>PRIVILEGED ADMIN</Text>
              </View>
              <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                <Ionicons name="log-out-outline" size={13} color="#FFFFFF" />
                <Text style={styles.logoutBtnText}>End Session</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => router.push('/login')}
            >
              <Ionicons name="shield-checkmark-outline" size={14} color="#FFFFFF" />
              <Text style={styles.loginBtnText}>Administrator Sign In</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 3. Detection Thresholds */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Leak Detection Parameters</Text>
          <Text style={styles.cardSubtitle}>
            Configure persistence intervals and minimum volumetric deficit
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mismatch Threshold (L/min)</Text>
            <TextInput
              style={styles.textInput}
              value={mismatchInput}
              onChangeText={setMismatchInput}
              keyboardType="numeric"
              placeholder="1.5"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Persistence Duration (Seconds)</Text>
            <TextInput
              style={styles.textInput}
              value={persistenceInput}
              onChangeText={setPersistenceInput}
              keyboardType="numeric"
              placeholder="6"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>High Consumption Limit (L/min)</Text>
            <TextInput
              style={styles.textInput}
              value={highConsumpInput}
              onChangeText={setHighConsumpInput}
              keyboardType="numeric"
              placeholder="25.0"
            />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveThresholds}>
            <Ionicons name="save-outline" size={14} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>Save Parameters</Text>
          </TouchableOpacity>
        </View>

        {/* 4. Night-Time Monitoring Schedule */}
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.cardTitle}>Night-Time Quiescent Flow</Text>
              <Text style={styles.cardSubtitle}>Continuous flow detection during off-peak hours</Text>
            </View>
            <Switch
              value={isNightScheduleEnabled}
              onValueChange={setIsNightScheduleEnabled}
              trackColor={{ false: '#E2E8F0', true: '#0F172A' }}
            />
          </View>

          <View style={styles.timeScheduleRow}>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>Start Window</Text>
              <TextInput
                style={styles.scheduleInput}
                value={nightStart}
                onChangeText={setNightStart}
                placeholder="23:00"
              />
            </View>
            <View style={styles.scheduleDivider} />
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>End Window</Text>
              <TextInput
                style={styles.scheduleInput}
                value={nightEnd}
                onChangeText={setNightEnd}
                placeholder="05:00"
              />
            </View>
          </View>
        </View>

        {/* 5. Notification & Buzzer Preferences */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notification & Alarm Experience</Text>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchTitle}>Acoustic Buzzer Chime</Text>
              <Text style={styles.switchSub}>Plays foreground two-tone alert upon suspected leak</Text>
            </View>
            <Switch
              value={isBuzzerEnabled}
              onValueChange={toggleBuzzer}
              trackColor={{ false: '#E2E8F0', true: '#0F172A' }}
            />
          </View>

          <TouchableOpacity style={styles.testChimeBtn} onPress={playTestBuzzer}>
            <Ionicons name="volume-high-outline" size={13} color="#0F172A" />
            <Text style={styles.testChimeText}>Test Buzzer Sound</Text>
          </TouchableOpacity>

          <View style={[styles.switchRow, { marginTop: 12 }]}>
            <View>
              <Text style={styles.switchTitle}>In-App Push Dispatch</Text>
              <Text style={styles.switchSub}>Immediate notification banners</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: '#E2E8F0', true: '#0F172A' }}
            />
          </View>
        </View>

        {/* 6. MQTT Hardware & Diagnostic Bridge */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Device Diagnostics & MQTT</Text>
            <View
              style={[
                styles.mqttDot,
                {
                  backgroundColor:
                    mqttStatus === 'connected' ? COLORS.success : COLORS.danger,
                },
              ]}
            />
          </View>

          <TextInput
            style={styles.textInput}
            value={inputBroker}
            onChangeText={setInputBroker}
            autoCapitalize="none"
            placeholder="wss://broker.emqx.io:8084/mqtt"
          />

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleUpdateBroker}>
              <Text style={styles.secondaryBtnText}>Update & Reconnect</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => router.push('/wokwi-guide')}
            >
              <Ionicons name="hardware-chip-outline" size={13} color="#0F172A" />
              <Text style={styles.outlineBtnText}>Wokwi Guide</Text>
            </TouchableOpacity>
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
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  badge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: 16,
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
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
  },
  profileBox: {
    gap: 6,
    marginTop: 6,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  profileLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  profileValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  profileValueHighlight: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    marginTop: 8,
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    marginTop: 6,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    marginTop: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  switchSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  timeScheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  scheduleItem: {
    flex: 1,
  },
  scheduleLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  scheduleInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    textAlign: 'center',
  },
  scheduleDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  testChimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    marginTop: 6,
  },
  testChimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  mqttDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  outlineBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
});
