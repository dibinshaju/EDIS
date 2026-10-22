import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface DemoBadgeProps {
  label?: string;
  isSimulated?: boolean;
}

export const DemoBadge: React.FC<DemoBadgeProps> = ({
  label = 'DEMO SIMULATION ACTIVE',
  isSimulated = true,
}) => {
  if (!isSimulated) return null;

  return (
    <View style={styles.container}>
      <Ionicons name="flask-outline" size={13} color={COLORS.demoBadgeText} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.demoBadgeBg,
    borderColor: COLORS.demoBadgeBorder,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.demoBadgeText,
    letterSpacing: 0.3,
  },
});
