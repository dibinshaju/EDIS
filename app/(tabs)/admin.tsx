import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SPACING } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useMqtt } from '../../src/context/MqttContext';
import { useSensor } from '../../src/context/SensorContext';
import { useAlerts } from '../../src/context/AlertContext';
import { ManagedUser, AlarmSettings } from '../../src/types/auth';
import {
  getManagedUsers,
  createInvitation,
  toggleUserStatus,
  deleteManagedUser,
  getAlarmSettings,
  saveAlarmSettings,
  DEFAULT_ALARM_SETTINGS,
} from '../../src/services/firebase';
import {
  playAlarmWav,
  triggerLocalBuzzerNotification,
} from '../../src/services/notifications';
import { Ionicons } from '@expo/vector-icons';

const INITIAL_DEMO_USERS: ManagedUser[] = [
  {
    id: 'user_01',
    email: 'marcus.vance@waterguard.iot',
    displayName: 'Marcus Vance',
    role: 'USER',
    adminId: 'demo-admin-01',
    status: 'ACTIVE',
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'user_02',
    email: 'sarah.lin@waterguard.iot',
    displayName: 'Sarah Lin',
    role: 'USER',
    adminId: 'demo-admin-01',
    status: 'ACTIVE',
    createdAt: Date.now() - 86400000 * 12,
  },
  {
    id: 'user_03',
    email: 'dave.miller@waterguard.iot',
    displayName: 'David Miller',
    role: 'USER',
    adminId: 'demo-admin-01',
    status: 'INACTIVE',
    createdAt: Date.now() - 86400000 * 20,
  },
];

export default function AdminScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout, isDemoMode, isAdmin, switchRole } = useAuth();
  const { status: mqttStatus, brokerUrl, setBrokerUrl, connect, disconnect } = useMqtt();
  const { thresholds, updateThresholds } = useSensor();
  const { isBuzzerEnabled, toggleBuzzer, playTestBuzzer } = useAlerts();

  // Threshold form inputs
  const [inputBroker, setInputBroker] = useState<string>(brokerUrl);
  const [mismatchInput, setMismatchInput] = useState<string>(String(thresholds.mismatchThreshold));
  const [persistenceInput, setPersistenceInput] = useState<string>(
    String(thresholds.persistenceDurationSec)
  );
  const [highConsumpInput, setHighConsumpInput] = useState<string>(
    String(thresholds.highConsumptionThreshold)
  );

  // User Management state (Admin only)
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>(INITIAL_DEMO_USERS);
  const [inviteEmailInput, setInviteEmailInput] = useState<string>('');
  const [isInviting, setIsInviting] = useState<boolean>(false);
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);

  // Alarm Settings state (Admin only)
  const [alarmSettings, setAlarmSettings] = useState<AlarmSettings>(DEFAULT_ALARM_SETTINGS);
  const [soundType, setSoundType] = useState<'buzzer_alarm' | 'industrial_siren' | 'urgent_beep'>(
    'buzzer_alarm'
  );
  const [testingAlarm, setTestingAlarm] = useState<boolean>(false);
  const [alarmFeedback, setAlarmFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (user && isAdmin) {
      loadAdminData();
    }
  }, [user, isAdmin]);

  const loadAdminData = async () => {
    if (!user) return;
    try {
      const usersList = await getManagedUsers(user.uid);
      if (usersList.length > 0) setManagedUsers(usersList);

      const settings = await getAlarmSettings(user.uid);
      setAlarmSettings(settings);
      setSoundType(settings.soundName || 'buzzer_alarm');
    } catch {
      // Keep demo defaults
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmailInput.trim() || !inviteEmailInput.includes('@')) {
      setInviteFeedback('Please enter a valid email address.');
      return;
    }

    setIsInviting(true);
    setInviteFeedback(null);
    try {
      const newInv = await createInvitation(
        user?.uid || 'admin-01',
        user?.email || 'admin@waterguard.iot',
        inviteEmailInput.trim()
      );

      const newUser: ManagedUser = {
        id: `usr_${Date.now()}`,
        email: newInv.email,
        displayName: newInv.email.split('@')[0],
        role: 'USER',
        adminId: user?.uid || 'admin-01',
        status: 'ACTIVE',
        createdAt: Date.now(),
      };

      setManagedUsers((prev) => [newUser, ...prev]);
      setInviteEmailInput('');
      setInviteFeedback(`Invitation successfully sent to ${newInv.email}`);
    } catch (err: any) {
      setInviteFeedback(err.message || 'Failed to send invitation.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleToggleUserStatus = async (targetUser: ManagedUser) => {
    try {
      const newStatus = await toggleUserStatus(targetUser.id, targetUser.status);
      setManagedUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      console.warn('Error toggling user status:', err);
    }
  };

  const handleDeleteUser = async (targetUserId: string) => {
    try {
      await deleteManagedUser(targetUserId);
      setManagedUsers((prev) => prev.filter((u) => u.id !== targetUserId));
    } catch (err) {
      console.warn('Error deleting user:', err);
    }
  };

  const handleSaveAlarmSettings = async () => {
    if (!user) return;
    const updated: AlarmSettings = {
      ...alarmSettings,
      soundName: soundType,
      updatedAt: Date.now(),
    };
    try {
      await saveAlarmSettings(user.uid, updated);
      setAlarmSettings(updated);
      setAlarmFeedback('Alarm settings saved successfully.');
      setTimeout(() => setAlarmFeedback(null), 3000);
    } catch {
      setAlarmFeedback('Failed to save settings.');
    }
  };

  const handleTestBuzzerAlert = async () => {
    setTestingAlarm(true);
    try {
      // 1. Play high priority audio
      await playAlarmWav();
      // 2. Schedule immediate notification with channel
      await triggerLocalBuzzerNotification(
        '🚨 TEST: Emergency Buzzer Notification',
        'WaterGuard test alert: High-priority acoustic notification channel verified.',
        { isTest: true }
      );
      setAlarmFeedback('Test alarm dispatched with audio buzzer!');
      setTimeout(() => setAlarmFeedback(null), 3500);
    } catch (err) {
      console.warn('Test alarm error:', err);
    } finally {
      setTestingAlarm(false);
    }
  };

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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.brandRow}>
              <View style={[styles.iconCircle, !isAdmin && styles.iconCircleUser]}>
                <Ionicons
                  name={isAdmin ? 'shield-checkmark' : 'person'}
                  size={18}
                  color={isAdmin ? '#0F172A' : '#15803D'}
                />
              </View>
              <View>
                <Text style={styles.headerTitle}>
                  {isAdmin ? 'Admin Operations Center' : 'Operator Portal'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {isAdmin ? 'User Management & Alarm Controls' : 'Personal Status & Safety Audio'}
                </Text>
              </View>
            </View>

            <View style={[styles.badge, !isAdmin && styles.badgeUser]}>
              <Text style={[styles.badgeText, !isAdmin && styles.badgeTextUser]}>
                {isAdmin ? 'ADMIN ROLE' : 'USER ROLE'}
              </Text>
            </View>
          </View>
        </View>

        {/* 1. Account & Session Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Current Session</Text>
            <TouchableOpacity
              style={styles.switchRoleBtn}
              onPress={() => switchRole(isAdmin ? 'USER' : 'ADMIN')}
            >
              <Ionicons name="swap-horizontal" size={13} color="#0284C7" />
              <Text style={styles.switchRoleBtnText}>
                Switch to {isAdmin ? 'User' : 'Admin'} View
              </Text>
            </TouchableOpacity>
          </View>

          {isAuthenticated && user ? (
            <View style={styles.profileBox}>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Account Email</Text>
                <Text style={styles.profileValue}>{user.email}</Text>
              </View>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Assigned Role</Text>
                <Text
                  style={[
                    styles.profileValueHighlight,
                    !isAdmin && { color: '#16A34A', backgroundColor: '#DCFCE7' },
                  ]}
                >
                  {user.role}
                </Text>
              </View>
              {!isAdmin && (
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Organization Admin</Text>
                  <Text style={styles.profileValue}>admin@waterguard.iot</Text>
                </View>
              )}
              <View style={styles.sessionActionRow}>
                <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                  <Ionicons name="log-out-outline" size={13} color="#FFFFFF" />
                  <Text style={styles.logoutBtnText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
              <Ionicons name="log-in-outline" size={14} color="#FFFFFF" />
              <Text style={styles.loginBtnText}>Sign In to Account</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ========================================================
            ADMIN-ONLY SECTION: USER MANAGEMENT
           ======================================================== */}
        {isAdmin && (
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconWrap}>
                <Ionicons name="people" size={16} color="#0F172A" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Manage Authorized Users</Text>
                <Text style={styles.cardSubtitle}>
                  Invite operators and manage alarm dispatch access
                </Text>
              </View>
            </View>

            {/* Invite Form */}
            <View style={styles.inviteRow}>
              <TextInput
                style={styles.inviteInput}
                placeholder="operator@waterguard.iot"
                placeholderTextColor="#94A3B8"
                value={inviteEmailInput}
                onChangeText={setInviteEmailInput}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.inviteBtn, isInviting && styles.btnDisabled]}
                onPress={handleInviteUser}
                disabled={isInviting}
              >
                {isInviting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={13} color="#FFFFFF" />
                    <Text style={styles.inviteBtnText}>Invite</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {inviteFeedback && (
              <Text
                style={[
                  styles.feedbackMsg,
                  inviteFeedback.includes('successfully') ? styles.feedbackSuccess : styles.feedbackError,
                ]}
              >
                {inviteFeedback}
              </Text>
            )}

            {/* User List */}
            <Text style={styles.subListHeader}>Authorized Personnel ({managedUsers.length})</Text>
            {managedUsers.map((item) => {
              const isActive = item.status === 'ACTIVE';
              return (
                <View key={item.id} style={styles.managedUserRow}>
                  <View style={styles.userInfoCol}>
                    <Text style={styles.userNameText}>{item.displayName || item.email}</Text>
                    <Text style={styles.userEmailText}>{item.email}</Text>
                  </View>

                  <View style={styles.userActionsCol}>
                    <TouchableOpacity
                      style={[styles.statusToggleBtn, isActive ? styles.statusActive : styles.statusInactive]}
                      onPress={() => handleToggleUserStatus(item)}
                    >
                      <Text
                        style={[
                          styles.statusToggleText,
                          isActive ? styles.statusActiveText : styles.statusInactiveText,
                        ]}
                      >
                        {item.status}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteUserBtn}
                      onPress={() => handleDeleteUser(item.id)}
                    >
                      <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ========================================================
            ADMIN-ONLY SECTION: ALARM NOTIFICATION SETTINGS
           ======================================================== */}
        {isAdmin && (
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconWrap, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="notifications" size={16} color="#DC2626" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Alarm Notification Settings</Text>
                <Text style={styles.cardSubtitle}>
                  Configure automated leakage alerts & push triggers
                </Text>
              </View>
            </View>

            {/* Auto push toggle */}
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchTitle}>Auto Push Alert to Admin Phone</Text>
                <Text style={styles.switchSub}>
                  Dispatches push notification on sustained pipe leak
                </Text>
              </View>
              <Switch
                value={alarmSettings.autoPushEnabled}
                onValueChange={(val) =>
                  setAlarmSettings((s) => ({ ...s, autoPushEnabled: val }))
                }
                trackColor={{ false: '#E2E8F0', true: '#DC2626' }}
              />
            </View>

            {/* Sound toggle */}
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchTitle}>Audible Buzzer Sound</Text>
                <Text style={styles.switchSub}>High-priority acoustic channel</Text>
              </View>
              <Switch
                value={alarmSettings.soundEnabled}
                onValueChange={(val) =>
                  setAlarmSettings((s) => ({ ...s, soundEnabled: val }))
                }
                trackColor={{ false: '#E2E8F0', true: '#0F172A' }}
              />
            </View>

            {/* Vibration toggle */}
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchTitle}>Emergency Vibration Pattern</Text>
                <Text style={styles.switchSub}>Pulsing haptic feedback</Text>
              </View>
              <Switch
                value={alarmSettings.vibrationEnabled}
                onValueChange={(val) =>
                  setAlarmSettings((s) => ({ ...s, vibrationEnabled: val }))
                }
                trackColor={{ false: '#E2E8F0', true: '#0F172A' }}
              />
            </View>

            {/* Sound Selector */}
            <Text style={styles.settingLabel}>Acoustic Alarm Tone</Text>
            <View style={styles.soundPickerRow}>
              {[
                { id: 'buzzer_alarm', label: 'Dual Buzzer (WAV)', icon: 'radio' },
                { id: 'industrial_siren', label: 'Plant Siren', icon: 'warning' },
                { id: 'urgent_beep', label: 'High Beep', icon: 'pulse' },
              ].map((s) => {
                const isSelected = soundType === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.soundChip, isSelected && styles.soundChipSelected]}
                    onPress={() => setSoundType(s.id as any)}
                  >
                    <Ionicons
                      name={s.icon as any}
                      size={14}
                      color={isSelected ? '#FFFFFF' : '#475569'}
                    />
                    <Text
                      style={[styles.soundChipText, isSelected && styles.soundChipTextSelected]}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Test Alarm Button */}
            <View style={styles.alarmTestRow}>
              <TouchableOpacity
                style={styles.testAlarmBtn}
                onPress={handleTestBuzzerAlert}
                disabled={testingAlarm}
              >
                <Ionicons name="volume-high" size={15} color="#DC2626" />
                <Text style={styles.testAlarmBtnText}>
                  {testingAlarm ? 'Triggering...' : 'Test Buzzer on this Phone'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveSettingsBtn}
                onPress={handleSaveAlarmSettings}
              >
                <Text style={styles.saveSettingsBtnText}>Save Settings</Text>
              </TouchableOpacity>
            </View>

            {alarmFeedback && (
              <Text style={styles.alarmFeedbackText}>{alarmFeedback}</Text>
            )}
          </View>
        )}

        {/* ========================================================
            USER VIEW: LOCAL AUDIO PREFERENCES & INSTRUCTIONS
           ======================================================== */}
        {!isAdmin && (
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconWrap, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="volume-high" size={16} color="#15803D" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Safety Sound & Preferences</Text>
                <Text style={styles.cardSubtitle}>Configure local audible emergency alert</Text>
              </View>
            </View>

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchTitle}>Play Foreground Buzzer</Text>
                <Text style={styles.switchSub}>Play acoustic buzzer on received alarms</Text>
              </View>
              <Switch
                value={isBuzzerEnabled}
                onValueChange={toggleBuzzer}
                trackColor={{ false: '#E2E8F0', true: '#15803D' }}
              />
            </View>

            <TouchableOpacity style={styles.userTestChimeBtn} onPress={playAlarmWav}>
              <Ionicons name="play-circle-outline" size={16} color="#15803D" />
              <Text style={styles.userTestChimeText}>Test Plant Buzzer Tone</Text>
            </TouchableOpacity>

            <View style={styles.userGuideBox}>
              <Ionicons name="information-circle-outline" size={16} color="#0369A1" />
              <Text style={styles.userGuideText}>
                When an emergency alarm is forwarded to you by the Lead Administrator, your phone will
                ring with the custom WaterGuard buzzer tone. Open the Alerts tab to acknowledge and
                verify field conditions.
              </Text>
            </View>
          </View>
        )}

        {/* 3. Detection Thresholds (Editable by Admin, visible to all) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Leak Detection Parameters</Text>
          <Text style={styles.cardSubtitle}>
            Volumetric deficit and persistence threshold limits
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mismatch Threshold (L/min)</Text>
            <TextInput
              style={[styles.textInput, !isAdmin && styles.textInputDisabled]}
              value={mismatchInput}
              onChangeText={setMismatchInput}
              keyboardType="numeric"
              editable={isAdmin}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Persistence Duration (Seconds)</Text>
            <TextInput
              style={[styles.textInput, !isAdmin && styles.textInputDisabled]}
              value={persistenceInput}
              onChangeText={setPersistenceInput}
              keyboardType="numeric"
              editable={isAdmin}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>High Consumption Limit (L/min)</Text>
            <TextInput
              style={[styles.textInput, !isAdmin && styles.textInputDisabled]}
              value={highConsumpInput}
              onChangeText={setHighConsumpInput}
              keyboardType="numeric"
              editable={isAdmin}
            />
          </View>

          {isAdmin && (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveThresholds}>
              <Ionicons name="save-outline" size={14} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Update Thresholds</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 4. MQTT Broker & Diagnostics */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Telemetry Broker</Text>
            <View
              style={[
                styles.mqttStatusChip,
                mqttStatus === 'CONNECTED' ? styles.mqttConnected : styles.mqttDisconnected,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: mqttStatus === 'CONNECTED' ? '#16A34A' : '#DC2626' },
                ]}
              />
              <Text style={styles.mqttStatusText}>{mqttStatus}</Text>
            </View>
          </View>

          {isAdmin ? (
            <>
              <TextInput
                style={styles.textInput}
                value={inputBroker}
                onChangeText={setInputBroker}
                placeholder="wss://broker.emqx.io:8084/mqtt"
              />
              <TouchableOpacity style={styles.brokerBtn} onPress={handleUpdateBroker}>
                <Ionicons name="refresh" size={14} color="#0F172A" />
                <Text style={styles.brokerBtnText}>Reconnect Broker</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.readOnlyBrokerText}>{brokerUrl}</Text>
          )}
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
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2DFD8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleUser: {
    backgroundColor: '#DCFCE7',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  badge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  badgeUser: {
    backgroundColor: '#DCFCE7',
  },
  badgeTextUser: {
    color: '#15803D',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  switchRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  switchRoleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  profileBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    padding: 10,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  profileLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  profileValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  profileValueHighlight: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sessionActionRow: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  logoutBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  loginBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2DFD8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  inviteInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    fontSize: 13,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
  },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  inviteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  feedbackMsg: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  feedbackSuccess: {
    color: '#16A34A',
  },
  feedbackError: {
    color: '#DC2626',
  },
  subListHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 6,
  },
  managedUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  userInfoCol: {
    flex: 1,
  },
  userNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  userEmailText: {
    fontSize: 10,
    color: '#64748B',
  },
  userActionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusToggleText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusActiveText: {
    color: '#16A34A',
  },
  statusInactiveText: {
    color: '#DC2626',
  },
  deleteUserBtn: {
    padding: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  switchTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  switchSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  settingLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginTop: 10,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  soundPickerRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  soundChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  soundChipSelected: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  soundChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  soundChipTextSelected: {
    color: '#FFFFFF',
  },
  alarmTestRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  testAlarmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: RADIUS.md,
    paddingVertical: 9,
  },
  testAlarmBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  saveSettingsBtn: {
    backgroundColor: '#0F172A',
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  saveSettingsBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  alarmFeedbackText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
    marginTop: 6,
  },
  userTestChimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    marginVertical: 10,
  },
  userTestChimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  userGuideBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: RADIUS.md,
    padding: 10,
  },
  userGuideText: {
    fontSize: 11,
    color: '#0369A1',
    flex: 1,
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  textInput: {
    height: 38,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    fontSize: 12,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
  },
  textInputDisabled: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    borderRadius: RADIUS.md,
    paddingVertical: 9,
    marginTop: 6,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mqttStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  mqttConnected: {
    backgroundColor: '#DCFCE7',
  },
  mqttDisconnected: {
    backgroundColor: '#FEE2E2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  mqttStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
  },
  brokerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    marginTop: 8,
  },
  brokerBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  readOnlyBrokerText: {
    fontSize: 12,
    color: '#475569',
    paddingVertical: 6,
  },
});
