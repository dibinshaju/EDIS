import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { NotificationForward, NotificationRecipient } from '../types/auth';
import { useAuth } from '../context/AuthContext';
import { db, isLiveFirebaseConfigured } from '../services/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

interface NotificationHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  alertId?: string;
}

const DEMO_HISTORY: {
  forward: NotificationForward;
  recipients: NotificationRecipient[];
}[] = [
  {
    forward: {
      forwardId: 'fwd_demo_101',
      alertId: 'alert_demo_42',
      adminId: 'demo-admin-01',
      adminEmail: 'admin@waterguard.iot',
      message: 'Critical Pipe Burst on Main Intake line. Investigate urgently.',
      severity: 'CRITICAL',
      recipientCount: 3,
      createdAt: Date.now() - 3600000 * 2,
    },
    recipients: [
      {
        id: 'rec_01',
        forwardId: 'fwd_demo_101',
        alertId: 'alert_demo_42',
        userId: 'user_01',
        userEmail: 'marcus.vance@waterguard.iot',
        displayName: 'Marcus Vance',
        status: 'ACKNOWLEDGED',
        sentAt: Date.now() - 3600000 * 2,
        deliveredAt: Date.now() - 3600000 * 2 + 1200,
        acknowledgedAt: Date.now() - 3600000 * 2 + 45000,
      },
      {
        id: 'rec_02',
        forwardId: 'fwd_demo_101',
        alertId: 'alert_demo_42',
        userId: 'user_02',
        userEmail: 'sarah.lin@waterguard.iot',
        displayName: 'Sarah Lin',
        status: 'ACKNOWLEDGED',
        sentAt: Date.now() - 3600000 * 2,
        deliveredAt: Date.now() - 3600000 * 2 + 1500,
        acknowledgedAt: Date.now() - 3600000 * 2 + 90000,
      },
      {
        id: 'rec_03',
        forwardId: 'fwd_demo_101',
        alertId: 'alert_demo_42',
        userId: 'user_03',
        userEmail: 'dave.miller@waterguard.iot',
        displayName: 'David Miller',
        status: 'DELIVERED',
        sentAt: Date.now() - 3600000 * 2,
        deliveredAt: Date.now() - 3600000 * 2 + 1800,
      },
    ],
  },
];

export const NotificationHistoryModal: React.FC<NotificationHistoryModalProps> = ({
  visible,
  onClose,
  alertId,
}) => {
  const { user, isAdmin } = useAuth();
  const [history, setHistory] = useState(DEMO_HISTORY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadHistory();
    }
  }, [visible, alertId]);

  const loadHistory = async () => {
    if (!isLiveFirebaseConfigured) {
      setHistory(DEMO_HISTORY);
      return;
    }

    setLoading(true);
    try {
      const q = alertId
        ? query(collection(db, 'notificationForwards'), where('alertId', '==', alertId))
        : query(collection(db, 'notificationForwards'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);

      const items: any[] = [];
      for (const d of snap.docs) {
        const forward = { forwardId: d.id, ...d.data() } as NotificationForward;
        const recSnap = await getDocs(
          query(
            collection(db, 'notificationRecipients'),
            where('forwardId', '==', forward.forwardId)
          )
        );
        const recipients = recSnap.docs.map((rd) => ({
          id: rd.id,
          ...rd.data(),
        })) as NotificationRecipient[];

        items.push({ forward, recipients });
      }

      setHistory(items.length > 0 ? items : DEMO_HISTORY);
    } catch {
      setHistory(DEMO_HISTORY);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="time" size={18} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.title}>Dispatch & Acknowledged History</Text>
                <Text style={styles.subtitle}>Audit Trail of Buzzer Push Notifications</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* List */}
          <ScrollView style={styles.scrollList}>
            {loading ? (
              <ActivityIndicator size="small" color="#0284C7" style={{ marginVertical: 30 }} />
            ) : history.length === 0 ? (
              <Text style={styles.emptyText}>No notifications dispatched yet.</Text>
            ) : (
              history.map((entry, idx) => {
                const ackCount = entry.recipients.filter(
                  (r) => r.status === 'ACKNOWLEDGED'
                ).length;
                return (
                  <View key={entry.forward.forwardId || idx} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={styles.badgeRow}>
                        <View style={styles.critBadge}>
                          <Text style={styles.critBadgeText}>{entry.forward.severity}</Text>
                        </View>
                        <Text style={styles.cardTime}>
                          {new Date(entry.forward.createdAt).toLocaleDateString()} •{' '}
                          {formatTimestamp(entry.forward.createdAt)}
                        </Text>
                      </View>

                      <View style={styles.ackPill}>
                        <Ionicons name="checkmark-done" size={13} color="#16A34A" />
                        <Text style={styles.ackPillText}>
                          {ackCount}/{entry.recipients.length} Acked
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.forwardMsg}>{entry.forward.message}</Text>
                    <Text style={styles.adminSender}>
                      Dispatched by: <Text style={styles.senderBold}>{entry.forward.adminEmail}</Text>
                    </Text>

                    {/* Recipient status breakdown */}
                    <View style={styles.recipientsBlock}>
                      <Text style={styles.recipientsHeader}>Recipient Verification:</Text>
                      {entry.recipients.map((rec) => {
                        const isAck = rec.status === 'ACKNOWLEDGED';
                        return (
                          <View key={rec.id} style={styles.recipientRow}>
                            <View style={styles.recColLeft}>
                              <Ionicons
                                name={isAck ? 'checkmark-circle' : 'time-outline'}
                                size={14}
                                color={isAck ? '#16A34A' : '#EAB308'}
                              />
                              <Text style={styles.recName}>{rec.displayName || rec.userEmail}</Text>
                            </View>

                            <View style={styles.recColRight}>
                              <Text
                                style={[
                                  styles.recStatus,
                                  isAck ? styles.recStatusAck : styles.recStatusPending,
                                ]}
                              >
                                {rec.status}
                              </Text>
                              {isAck && rec.acknowledgedAt && (
                                <Text style={styles.recAckTime}>
                                  {formatTimestamp(rec.acknowledgedAt)}
                                </Text>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Close Audit History</Text>
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
    maxHeight: '88%',
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
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
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
  scrollList: {
    maxHeight: 400,
    marginBottom: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    paddingVertical: 30,
    fontSize: 13,
  },
  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  critBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  critBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
  cardTime: {
    fontSize: 11,
    color: '#64748B',
  },
  ackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  ackPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  forwardMsg: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
    marginBottom: 4,
  },
  adminSender: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },
  senderBold: {
    fontWeight: '600',
    color: '#334155',
  },
  recipientsBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
  },
  recipientsHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  recColLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  recName: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '500',
  },
  recColRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recStatus: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  recStatusAck: {
    backgroundColor: '#DCFCE7',
    color: '#16A34A',
  },
  recStatusPending: {
    backgroundColor: '#FEF9C3',
    color: '#CA8A04',
  },
  recAckTime: {
    fontSize: 10,
    color: '#64748B',
  },
  doneBtn: {
    backgroundColor: '#0F172A',
    borderRadius: RADIUS.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
