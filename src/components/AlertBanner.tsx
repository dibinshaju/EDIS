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
  const bg = isCritical ? COLORS.dangerBg : COLORS.warningBg;
  const border = isCritical ? COLORS.danger : COLORS.warning;
  const textCol = isCritical ? COLORS.dangerText : COLORS.warningText;

  return (
    <View style={[styles.container, { backgroundColor: bg, borderColor: border }]}>
      <View style={styles.contentRow}>
        <View style={styles.iconBox}>
          <Ionicons
            name={isCritical ? 'alert-circle' : 'warning'}
            size={24}
            color={isCritical ? COLORS.danger : COLORS.warning}
          />
        </View>

        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: textCol }]}>{activeAlert.title}</Text>
            <View style={[styles.badge, { backgroundColor: border }]}>
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
          style={[styles.ackButton, { backgroundColor: border }]}
          onPress={() => acknowledgeAlert(activeAlert.id)}
          activeOpacity={0.8}
        >
          <Ionicons name="volume-mute-outline" size={14} color="#FFFFFF" />
          <Text style={styles.ackButtonText}>Acknowledge & Silence</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    padding: 12,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconBox: {
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
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
    marginRight: 6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  explanation: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 15,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    paddingTop: 8,
  },
  ackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  ackButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
