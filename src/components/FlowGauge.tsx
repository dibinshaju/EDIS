import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { COLORS, RADIUS } from '../constants/theme';
import { formatFlow } from '../utils/format';

interface FlowGaugeProps {
  label: string;
  flowValue: number;
  maxFlow?: number;
  color?: string;
  subtitle?: string;
}

export const FlowGauge: React.FC<FlowGaugeProps> = ({
  label,
  flowValue,
  maxFlow = 35.0,
  color = COLORS.tealPrimary,
  subtitle,
}) => {
  const size = 130;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // Gauge spans 240 degrees (from 150 deg to 390 deg)
  const clampedValue = Math.max(0, Math.min(flowValue, maxFlow));
  const fraction = clampedValue / maxFlow;

  const startAngle = 140 * (Math.PI / 180);
  const endAngle = 400 * (Math.PI / 180);
  const totalSweep = endAngle - startAngle;

  const currentSweep = totalSweep * fraction;
  const currentAngle = startAngle + currentSweep;

  // Compute arc coordinates
  const getArcCoordinates = (angle: number) => {
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  const startPt = getArcCoordinates(startAngle);
  const endPt = getArcCoordinates(endAngle);
  const currentPt = getArcCoordinates(currentAngle);

  const backgroundArc = `M ${startPt.x} ${startPt.y} A ${radius} ${radius} 0 1 1 ${endPt.x} ${endPt.y}`;
  const largeArcFlag = currentSweep > Math.PI ? 1 : 0;
  const valueArc = `M ${startPt.x} ${startPt.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${currentPt.x} ${currentPt.y}`;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.svgWrapper}>
        <Svg width={size} height={size}>
          {/* Background Track */}
          <Path
            d={backgroundArc}
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
          />

          {/* Active Value Track */}
          {fraction > 0.01 && (
            <Path
              d={valueArc}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="none"
            />
          )}
        </Svg>

        {/* Center Text */}
        <View style={styles.centerTextContainer}>
          <Text style={[styles.flowValue, { color }]}>{formatFlow(flowValue)}</Text>
          <Text style={styles.flowUnit}>L/min</Text>
        </View>
      </View>

      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  svgWrapper: {
    width: 130,
    height: 130,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  flowUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: -2,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
    textAlign: 'center',
  },
});
