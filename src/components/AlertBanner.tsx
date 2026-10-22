import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAlerts } from '../context/AlertContext';

export const AlertBanner: React.FC = () => {
  const { activeAlert, acknowledgeAlert } = useAlerts();

  if (!activeAlert || activeAlert.status !== 'ACTIVE') {
    return null;
  }

  const isCritical = activeAlert.severity === 'CRITICAL';

  return (
    <View style={[styles.container, isCritical ? styles.containerCritical : styles.containerWarning]}>
      <View style={styles.contentRow}>
        <View style={styles.iconCircle}>
          <Ionicons
            name={isCritical ? 'alert-circle' : 'warning-outline'}
            size={18}
            color={isCritical ? COLORS.danger : COLORS.warningText}
          />
        </View>

        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{activeAlert.title}</Text>
            <View style={[styles.badge, isCritical ? styles.badgeCrit : styles.badgeWarn]}>
              <Text style={styles.badgeText}>{activeAlert.severity}</Text>
            </View>
          </View>
          <Text style={styles.explanation} numberOfLines={2}>
            {activeAlert.explanation}
          </Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.ackButton}
          onPress={() => acknowledgeAlert(activeAlert.id)}
          activeOpacity={0.8}
        >
          <Ionicons name="volume-mute-outline" size={13} color="#FFFFFF" />
          <Text style={styles.ackButtonText}>Silence Alarm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.lg,
    padding: 12,
    marginHorizontal: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
  },
  containerCritical: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FECACA',
  },
  containerWarning: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FDE68A',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.cardSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  badgeCrit: {
    backgroundColor: COLORS.dangerBg,
  },
  badgeWarn: {
    backgroundColor: COLORS.warningBg,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  explanation: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingTop: 8,
  },
  ackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkCharcoal,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 5,
  },
  ackButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
