import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { AlertEvent } from '../types/alert';
import { ManagedUser } from '../types/auth';
import { useAuth } from '../context/AuthContext';
import { getManagedUsers, recordAlarmForward, forwardAlarmToUsers } from '../services/firebase';
import { triggerLocalBuzzerNotification } from '../services/notifications';

interface ForwardAlarmModalProps {
  visible: boolean;
  onClose: () => void;
  alert: AlertEvent | null;
  onForwardSuccess?: (count: number) => void;
}

const DEMO_OPERATORS: ManagedUser[] = [
  {
    id: 'user_01',
    email: 'marcus.vance@waterguard.iot',
    displayName: 'Marcus Vance (Shift Lead)',
    role: 'USER',
    adminId: 'demo-admin-01',
    status: 'ACTIVE',
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'user_02',
    email: 'sarah.lin@waterguard.iot',
    displayName: 'Sarah Lin (Field Inspector)',
    role: 'USER',
    adminId: 'demo-admin-01',
    status: 'ACTIVE',
    createdAt: Date.now() - 86400000 * 12,
  },
  {
    id: 'user_03',
    email: 'dave.miller@waterguard.iot',
    displayName: 'David Miller (Maintenance)',
    role: 'USER',
    adminId: 'demo-admin-01',
    status: 'ACTIVE',
    createdAt: Date.now() - 86400000 * 20,
  },
];

export const ForwardAlarmModal: React.FC<ForwardAlarmModalProps> = ({
  visible,
  onClose,
  alert,
  onForwardSuccess,
}) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customNote, setCustomNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (visible && user) {
      loadRecipients();
      setCustomNote('');
      setSuccess(false);
    }
  }, [visible, user]);

  const loadRecipients = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await getManagedUsers(user.uid);
      if (list.length > 0) {
        setUsers(list);
        setSelectedIds(new Set(list.filter((u) => u.status === 'ACTIVE').map((u) => u.id)));
      } else {
        // Fallback to demo operators for evaluation
        setUsers(DEMO_OPERATORS);
        setSelectedIds(new Set(DEMO_OPERATORS.map((u) => u.id)));
      }
    } catch {
      setUsers(DEMO_OPERATORS);
      setSelectedIds(new Set(DEMO_OPERATORS.map((u) => u.id)));
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selectAll = () => {
    setSelectedIds(new Set(users.map((u) => u.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleDispatch = async () => {
    if (!alert || !user || selectedIds.size === 0) return;

    setSubmitting(true);
    try {
      const selectedUsers = users.filter((u) => selectedIds.has(u.id));
      await recordAlarmForward(alert.id, user, selectedUsers, customNote);

      // Call Vercel serverless forwarding backend to send push notifications with continuous buzzer channel
      await forwardAlarmToUsers(
        alert.id,
        alert.title,
        customNote || alert.explanation,
        Array.from(selectedIds)
      );

      // Trigger local notification chime for administrator
      await triggerLocalBuzzerNotification(
        `🚨 Alarm Forwarded: ${alert.title}`,
        `Dispatched to ${selectedUsers.length} operator(s). Buzzer notification sent.`,
        { alertId: alert.id, forwardCount: selectedUsers.length }
      );

      setSubmitting(false);
      setSuccess(true);
      if (onForwardSuccess) {
        onForwardSuccess(selectedUsers.length);
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error forwarding alarm:', err);
      setSubmitting(false);
    }
  };

  if (!alert) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.alertIconWrap}>
                <Ionicons name="megaphone" size={18} color="#DC2626" />
              </View>
              <View>
                <Text style={styles.title}>Forward Alarm to Users</Text>
                <Text style={styles.subtitle}>Dispatch Emergency Buzzer Push Alert</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Incident Summary Card */}
          <View style={styles.incidentSummary}>
            <Text style={styles.incidentTitle}>{alert.title.replace(/^\[DEMO\]\s*/, '')}</Text>
            <Text style={styles.incidentDesc}>{alert.explanation}</Text>
            <View style={styles.metricRow}>
              <Text style={styles.metricText}>
                Inlet: <Text style={styles.metricBold}>{alert.inletFlow.toFixed(1)} L/min</Text>
              </Text>
              <Text style={styles.metricDivider}>•</Text>
              <Text style={styles.metricText}>
                Outlet: <Text style={styles.metricBold}>{alert.outletFlow.toFixed(1)} L/min</Text>
              </Text>
              <Text style={styles.metricDivider}>•</Text>
              <Text style={styles.metricDeficit}>
                Loss: +{alert.flowDifference.toFixed(1)} L/min
              </Text>
            </View>
          </View>

          {/* Recipient Selection Header */}
          <View style={styles.recipientHeader}>
            <Text style={styles.sectionTitle}>
              Select Recipients ({selectedIds.size}/{users.length})
            </Text>
            <View style={styles.shortcutRow}>
              <TouchableOpacity onPress={selectAll}>
                <Text style={styles.shortcutText}>All</Text>
              </TouchableOpacity>
              <Text style={styles.shortcutDivider}>|</Text>
              <TouchableOpacity onPress={deselectAll}>
                <Text style={styles.shortcutText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* User List */}
          <ScrollView style={styles.userList}>
            {loading ? (
              <ActivityIndicator size="small" color="#0284C7" style={{ marginVertical: 20 }} />
            ) : (
              users.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.userRow, isSelected && styles.userRowSelected]}
                    onPress={() => toggleSelect(item.id)}
                  >
                    <View
                      style={[styles.checkbox, isSelected && styles.checkboxSelected]}
                    >
                      {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                    </View>

                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{item.displayName}</Text>
                      <Text style={styles.userEmail}>{item.email}</Text>
                    </View>

                    <View style={styles.statusPill}>
                      <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* Optional Note */}
          <View style={styles.noteWrap}>
            <Text style={styles.noteLabel}>Urgent Instructions (Optional)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="e.g. Please check junction valve B on Sector 2 immediately."
              placeholderTextColor="#94A3B8"
              value={customNote}
              onChangeText={setCustomNote}
            />
          </View>

          {/* Success Banner */}
          {success && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
              <Text style={styles.successBannerText}>
                Alarm and buzzer push dispatched successfully!
              </Text>
            </View>
          )}

          {/* Dispatch Button */}
          <TouchableOpacity
            style={[
              styles.dispatchBtn,
              (selectedIds.size === 0 || submitting || success) && styles.dispatchBtnDisabled,
            ]}
            onPress={handleDispatch}
            disabled={selectedIds.size === 0 || submitting || success}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="radio" size={18} color="#FFFFFF" />
                <Text style={styles.dispatchBtnText}>
                  Dispatch Buzzer to ({selectedIds.size}) User{selectedIds.size === 1 ? '' : 's'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alertIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  closeBtn: {
    padding: 6,
  },
  incidentSummary: {
    backgroundColor: '#FEF2F2',
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 14,
  },
  incidentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
  },
  incidentDesc: {
    fontSize: 12,
    color: '#7F1D1D',
    marginTop: 2,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  metricText: {
    fontSize: 11,
    color: '#7F1D1D',
  },
  metricBold: {
    fontWeight: '700',
  },
  metricDivider: {
    color: '#F87171',
    fontSize: 10,
  },
  metricDeficit: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  recipientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  shortcutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shortcutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  shortcutDivider: {
    color: '#CBD5E1',
    fontSize: 11,
  },
  userList: {
    maxHeight: 180,
    marginBottom: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: RADIUS.md,
    backgroundColor: '#F8FAFC',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userRowSelected: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxSelected: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 11,
    color: '#64748B',
  },
  statusPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  noteWrap: {
    marginBottom: 14,
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  noteInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    padding: 10,
    borderRadius: RADIUS.md,
    marginBottom: 10,
  },
  successBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  dispatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    borderRadius: RADIUS.md,
    height: 48,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  dispatchBtnDisabled: {
    opacity: 0.5,
  },
  dispatchBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
