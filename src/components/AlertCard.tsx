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
  const isRecovered = alert.category === 'RECOVERED';

  const getStatusBg = () => {
    if (alert.status === 'RESOLVED' || isRecovered) return COLORS.cardSubtle;
    if (alert.status === 'ACKNOWLEDGED') return '#E0F2FE';
    return isCritical ? COLORS.dangerBg : COLORS.warningBg;
  };

  const getStatusTextCol = () => {
    if (alert.status === 'RESOLVED' || isRecovered) return COLORS.successText;
    if (alert.status === 'ACKNOWLEDGED') return '#0369A1';
    return isCritical ? COLORS.dangerText : COLORS.warningText;
  };

  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    if (isRecovered) return 'checkmark-circle-outline';
    if (isCritical) return 'alert-circle-outline';
    return 'warning-outline';
  };

  return (
    <View style={styles.card}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.iconAndTitle}>
          <View style={styles.iconCircle}>
            <Ionicons name={getIcon()} size={15} color={getStatusTextCol()} />
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {alert.title.replace(/^\[DEMO\]\s*/, '')}
          </Text>
        </View>

        <View style={[styles.statusPill, { backgroundColor: getStatusBg() }]}>
          <Text style={[styles.statusPillText, { color: getStatusTextCol() }]}>
            {alert.status}
          </Text>
        </View>
      </View>

      {/* Explanation */}
      <Text style={styles.explanation}>{alert.explanation}</Text>

      {/* Sensor Metrics at incident time */}
      <View style={styles.metricGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Inlet Meter</Text>
          <Text style={styles.metricValue}>{formatFlow(alert.inletFlow)} L/min</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Outlet Meter</Text>
          <Text style={styles.metricValue}>{formatFlow(alert.outletFlow)} L/min</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Flow Deficit</Text>
          <Text style={[styles.metricValue, { color: alert.flowDifference > 1 ? COLORS.danger : COLORS.textPrimary }]}>
            +{formatFlow(alert.flowDifference)} L/min
          </Text>
        </View>
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <View style={styles.timeInfo}>
          <Ionicons name="time-outline" size={11} color={COLORS.textSecondary} />
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
              <Text style={styles.ackBtnText}>Silence</Text>
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
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
    gap: 8,
    flex: 1,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.cardSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  explanation: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 15,
    marginBottom: 10,
  },
  metricGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardSubtle,
    borderRadius: RADIUS.md,
    padding: 8,
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.04)',
    paddingTop: 8,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  ackBtn: {
    backgroundColor: COLORS.darkCharcoal,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ackBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  resolveBtn: {
    backgroundColor: COLORS.cardSubtle,
    borderWidth: 1,
    borderColor: '#CBC7BD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resolveBtnText: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
});
