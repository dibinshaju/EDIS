import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  title: string;
  value: string;
  unit?: string;
  subtitle?: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  accentColor?: string;
  isWarning?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  iconName,
  iconColor = COLORS.tealPrimary,
  accentColor,
  isWarning = false,
}) => {
  return (
    <View style={[styles.card, isWarning && styles.warningCard]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.iconBox, { backgroundColor: `${iconColor}15` }]}>
          <Ionicons name={iconName} size={18} color={iconColor} />
        </View>
      </View>

      <View style={styles.valueRow}>
        <Text style={[styles.value, accentColor ? { color: accentColor } : {}]}>
          {value}
        </Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>

      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  warningCard: {
    borderColor: COLORS.danger,
    backgroundColor: '#FFF5F5',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  unit: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 4,
  },
});
