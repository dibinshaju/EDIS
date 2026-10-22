import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { formatFlow } from '../utils/format';

interface TimelineBranchProps {
  monthOrLabel: string;
  sublabel?: string;
  inletFlow: number;
  outletFlow: number;
}

export const TimelineBranch: React.FC<TimelineBranchProps> = ({
  monthOrLabel,
  sublabel = '1 Week',
  inletFlow,
  outletFlow,
}) => {
  return (
    <View style={styles.container}>
      {/* Node Header on horizontal axis */}
      <View style={styles.nodeHeaderRow}>
        {/* Yellow-Lime Circular Badge Node (matching image) */}
        <View style={styles.yellowCircleNode}>
          <Ionicons name="document-text-outline" size={14} color={COLORS.darkCharcoal} />
        </View>

        <View style={styles.axisLine} />
      </View>

      {/* Label under node */}
      <View style={styles.labelBlock}>
        <Text style={styles.monthText}>{monthOrLabel}</Text>
        <Text style={styles.subText}>{sublabel}</Text>
      </View>

      {/* Branching Pills (matching dark and light pills in image) */}
      <View style={styles.pillsContainer}>
        {/* Dark Charcoal Pill (Inlet) */}
        <View style={styles.darkPill}>
          <View style={styles.pillIconCircle}>
            <Ionicons name="radio-button-on" size={10} color="#FFFFFF" />
          </View>
          <Text style={styles.darkPillText}>Inflow S1</Text>
          <View style={styles.pillCountBadge}>
            <Text style={styles.pillCountText}>{formatFlow(inletFlow)}</Text>
          </View>
        </View>

        {/* Light Putty Pill (Outlet) */}
        <View style={styles.lightPill}>
          <View style={[styles.pillIconCircle, { backgroundColor: '#BDB9AE' }]}>
            <Ionicons name="radio-button-off" size={10} color={COLORS.darkCharcoal} />
          </View>
          <Text style={styles.lightPillText}>Outflow S2</Text>
          <View style={[styles.pillCountBadge, { backgroundColor: '#CBC7BD' }]}>
            <Text style={[styles.pillCountText, { color: COLORS.darkCharcoal }]}>
              {formatFlow(outletFlow)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 16,
    alignItems: 'flex-start',
  },
  nodeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 6,
  },
  yellowCircleNode: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accentLime,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#C2E012',
  },
  axisLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#D1CABE',
    marginLeft: 8,
  },
  labelBlock: {
    marginBottom: 10,
    paddingLeft: 4,
  },
  monthText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  pillsContainer: {
    gap: 8,
  },
  darkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkCharcoal,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  pillIconCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  pillCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  pillCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  lightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D5D1C7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 8,
  },
  lightPillText: {
    color: COLORS.darkCharcoal,
    fontSize: 11,
    fontWeight: '700',
  },
});
