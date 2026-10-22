import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { TelemetryReading } from '../types/sensor';
import { COLORS, RADIUS } from '../constants/theme';

interface FlowChartProps {
  data: TelemetryReading[];
  height?: number;
  title?: string;
  showLegend?: boolean;
}

export const FlowChart: React.FC<FlowChartProps> = ({
  data,
  height = 160,
  title = 'Real-Time Flow Telemetry',
  showLegend = true,
}) => {
  const chartWidth = 320;
  const paddingLeft = 32;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 24;

  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;

  // Render recent 20 readings
  const sampleData = data.slice(-20);
  const maxScale = 35.0; // 0 to 35 L/min

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(val, maxScale));
    return paddingTop + graphHeight - (clamped / maxScale) * graphHeight;
  };

  const getX = (index: number) => {
    if (sampleData.length <= 1) return paddingLeft + graphWidth;
    return paddingLeft + (index / (sampleData.length - 1)) * graphWidth;
  };

  // Generate SVG path strings
  let inletPath = '';
  let outletPath = '';

  sampleData.forEach((d, i) => {
    const x = getX(i);
    const yInlet = getY(d.inletFlow);
    const yOutlet = getY(d.outletFlow);

    if (i === 0) {
      inletPath = `M ${x} ${yInlet}`;
      outletPath = `M ${x} ${yOutlet}`;
    } else {
      inletPath += ` L ${x} ${yInlet}`;
      outletPath += ` L ${x} ${yOutlet}`;
    }
  });

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        {showLegend && (
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.tealPrimary }]} />
              <Text style={styles.legendText}>Inlet</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#84CC16' }]} />
              <Text style={styles.legendText}>Outlet</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.chartWrapper}>
        <Svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`}>
          {/* Horizontal Grid lines */}
          {[0, 10, 20, 30].map((level) => {
            const y = getY(level);
            return (
              <React.Fragment key={level}>
                <Line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <SvgText
                  x={paddingLeft - 6}
                  y={y + 3}
                  fontSize="9"
                  fill="#94A3B8"
                  textAnchor="end"
                  fontWeight="600"
                >
                  {level}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Inlet Flow Line */}
          {inletPath !== '' && (
            <Path
              d={inletPath}
              fill="none"
              stroke={COLORS.tealPrimary}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Outlet Flow Line */}
          {outletPath !== '' && (
            <Path
              d={outletPath}
              fill="none"
              stroke="#84CC16"
              strokeWidth="2"
              strokeDasharray="2 0"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Flow Rate (L/min) vs Time</Text>
        <Text style={styles.footerText}>{sampleData.length} data points</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  legend: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  footerText: {
    fontSize: 10,
    color: COLORS.textLight,
  },
});
