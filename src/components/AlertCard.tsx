import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertEvent } from '../types/alert';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { formatFlow, formatTime, formatDate } from '../utils/format';

interface AlertCardProps {
  alert: AlertEvent;
  onAcknowledge?: (id: string) => void;
  onResolve?: (id: string) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onAcknowledge,
  onResolve,
}) => {
  const isCritical = alert.severity === 'CRITICAL';
  const isWarning = alert.severity === 'WARNING';
  const isRecovered = alert.category === 'RECOVERED';

  const getStatusColor = () => {
    if (alert.status === 'RESOLVED' || isRecovered) return COLORS.success;
    if (alert.status === 'ACKNOWLEDGED') return COLORS.info;
    return isCritical ? COLORS.danger : COLORS.warning;
  };

  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    if (isRecovered) return 'checkmark-circle';
    if (isCritical) return 'alert-circle';
    if (isWarning) return 'warning';
    return 'information-circle';
  };

  return (
    <View style={styles.card}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.iconAndTitle}>
          <Ionicons name={getIcon()} size={18} color={getStatusColor()} />
          <Text style={styles.title} numberOfLines={1}>
            {alert.title}
          </Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: `${getStatusColor()}20` }]}>
          <Text style={[styles.statusPillText, { color: getStatusColor() }]}>
            {alert.status}
          </Text>
        </View>
      </View>

      {/* Explanation */}
      <Text style={styles.explanation}>{alert.explanation}</Text>

      {/* Sensor Metrics at incident time */}
      <View style={styles.metricGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Inlet Flow</Text>
          <Text style={styles.metricValue}>{formatFlow(alert.inletFlow)} L/min</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Outlet Flow</Text>
          <Text style={styles.metricValue}>{formatFlow(alert.outletFlow)} L/min</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Flow Deficit</Text>
          <Text style={[styles.metricValue, { color: alert.flowDifference > 1 ? COLORS.danger : COLORS.textDark }]}>
            +{formatFlow(alert.flowDifference)} L/min
          </Text>
        </View>
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <View style={styles.timeInfo}>
          <Ionicons name="time-outline" size={12} color={COLORS.textLight} />
          <Text style={styles.timeText}>
            {formatDate(alert.timestamp)} • {formatTime(alert.timestamp)}
          </Text>
        </View>

        <View style={styles.actions}>
          {alert.status === 'ACTIVE' && onAcknowledge && (
            <TouchableOpacity
              style={styles.ackBtn}
              onPress={() => onAcknowledge(alert.id)}
            >
              <Text style={styles.ackBtnText}>Acknowledge</Text>
            </TouchableOpacity>
          )}

          {alert.status !== 'RESOLVED' && !isRecovered && onResolve && (
            <TouchableOpacity
              style={styles.resolveBtn}
              onPress={() => onResolve(alert.id)}
            >
              <Text style={styles.resolveBtnText}>Resolve</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
    flex: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  explanation: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginBottom: 10,
  },
  metricGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgLight,
    borderRadius: RADIUS.sm,
    padding: 8,
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 10,
    color: COLORS.textLight,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  ackBtn: {
    backgroundColor: COLORS.navyDark,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  ackBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  resolveBtn: {
    backgroundColor: COLORS.successBg,
    borderColor: COLORS.success,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  resolveBtnText: {
    color: COLORS.successText,
    fontSize: 10,
    fontWeight: '600',
  },
});
