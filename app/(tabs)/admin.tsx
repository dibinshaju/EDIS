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
    alert('Threshold settings updated.');
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
        {/* Editorial Header */}
        <View style={styles.header}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>System Preferences</Text>
            <View style={styles.indexPill}>
              <Text style={styles.indexPillText}>Settings</Text>
            </View>
          </View>

          <View style={styles.tagPill}>
            <Text style={styles.tagPillText}>Admin Panel</Text>
          </View>

          <View style={styles.heroTitleWrap}>
            <Text style={styles.heroTitlePrimary}>Hardware &</Text>
            <Text style={styles.heroTitleAccent}>System Config</Text>
          </View>
        </View>

        {/* 1. Admin Profile Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Credentials & Role</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {isDemoMode ? 'EXPO DEMO' : 'FIREBASE SECURE'}
              </Text>
            </View>
          </View>

          {isAuthenticated && user ? (
            <View style={styles.profileBox}>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Account</Text>
                <Text style={styles.profileValue}>{user.maskedPhone}</Text>
              </View>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Role</Text>
                <Text style={styles.profileValueHighlight}>ADMINISTRATOR</Text>
              </View>
              <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                <Ionicons name="log-out-outline" size={13} color="#FFFFFF" />
                <Text style={styles.logoutBtnText}>Logout</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => router.push('/login')}
            >
              <Ionicons name="shield-checkmark-outline" size={14} color="#FFFFFF" />
              <Text style={styles.loginBtnText}>Administrator Login</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 2. Detection Parameters & Thresholds */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detection Thresholds</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mismatch Deficit (L/min)</Text>
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

        {/* 3. MQTT Broker Connection */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>MQTT Broker</Text>
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
              <Ionicons name="hardware-chip-outline" size={13} color={COLORS.textPrimary} />
              <Text style={styles.outlineBtnText}>Wokwi Guide</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Audio Alert Controls */}
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchTitle}>Acoustic Alarm</Text>
              <Text style={styles.switchSub}>Audible chime on critical leaks</Text>
            </View>
            <Switch
              value={isBuzzerEnabled}
              onValueChange={toggleBuzzer}
              trackColor={{ false: '#E2DFD8', true: COLORS.darkCharcoal }}
            />
          </View>

          <TouchableOpacity style={styles.testChimeBtn} onPress={playTestBuzzer}>
            <Ionicons name="volume-high-outline" size={13} color={COLORS.textPrimary} />
            <Text style={styles.testChimeText}>Test Acoustic Alarm</Text>
          </TouchableOpacity>
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
    paddingBottom: 90,
  },
  header: {
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  indexPill: {
    backgroundColor: '#E2DFD8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  indexPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  tagPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E2DFD8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    marginBottom: 10,
  },
  tagPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  heroTitleWrap: {
    marginTop: 2,
    marginBottom: 4,
  },
  heroTitlePrimary: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111215',
    lineHeight: 36,
    letterSpacing: -1.2,
  },
  heroTitleAccent: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.accentOrange,
    lineHeight: 36,
    letterSpacing: -1.2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 14,
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
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111215',
    letterSpacing: -0.2,
  },
  badge: {
    backgroundColor: '#F3F2EC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  profileBox: {
    gap: 8,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  profileLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  profileValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111215',
  },
  profileValueHighlight: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.accentOrange,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.darkCharcoal,
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
    backgroundColor: COLORS.darkCharcoal,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
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
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F7F6F2',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111215',
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.darkCharcoal,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    marginTop: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
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
    backgroundColor: '#F3F2EC',
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DFD8',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  outlineBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111215',
  },
  switchSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  testChimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F3F2EC',
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  testChimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});
