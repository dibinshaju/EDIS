import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS, RADIUS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { formatFlow } from '../utils/format';

interface WaveformChartProps {
  title: string;
  currentValue: number;
  averageValue: number;
  deltaValue: number;
  unit?: string;
  isAlert?: boolean;
}

export const WaveformChart: React.FC<WaveformChartProps> = ({
  title,
  currentValue,
  averageValue,
  deltaValue,
  unit = 'L/min',
  isAlert = false,
}) => {
  const width = 240;
  const height = 75;

  return (
    <View style={styles.card}>
      {/* Card Header with mini options icon */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.iconCircle}>
          <Ionicons name="options-outline" size={13} color={COLORS.textSecondary} />
        </View>
      </View>

      {/* Signature Medical Layered Waveform Area */}
      <View style={styles.waveformContainer}>
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Defs>
            {/* Tech Orange Gradient Fill */}
            <LinearGradient id="orangeWaveGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={COLORS.accentOrange} stopOpacity="0.65" />
              <Stop offset="100%" stopColor={COLORS.accentOrange} stopOpacity="0.05" />
            </LinearGradient>
            {/* Grey Wave Gradient Fill */}
            <LinearGradient id="greyWaveGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#DDD9D0" stopOpacity="0.6" />
              <Stop offset="100%" stopColor="#EFECE6" stopOpacity="0.1" />
            </LinearGradient>
          </Defs>

          {/* Background Grey Layer Wave */}
          <Path
            d="M 0 52 C 40 40, 70 65, 110 48 C 150 32, 180 58, 240 45 L 240 75 L 0 75 Z"
            fill="url(#greyWaveGrad)"
          />

          {/* Foreground Tech Orange Layer Wave */}
          <Path
            d="M 0 44 C 40 28, 80 52, 120 36 C 160 20, 190 44, 240 32 L 240 75 L 0 75 Z"
            fill="url(#orangeWaveGrad)"
          />

          {/* Wave Accent Stroke Line */}
          <Path
            d="M 0 44 C 40 28, 80 52, 120 36 C 160 20, 190 44, 240 32"
            fill="none"
            stroke={isAlert ? COLORS.danger : COLORS.accentOrange}
            strokeWidth="2.5"
          />
        </Svg>

        {/* Floating Dark Charcoal Pill (matching the 180/120 badge in image!) */}
        <View style={styles.floatingPill}>
          <Text style={styles.floatingPillText}>
            {formatFlow(currentValue)} {unit}
          </Text>
        </View>
      </View>

      {/* Footer Summary: Average & Delta */}
      <View style={styles.footer}>
        <Text style={styles.avgText}>
          Average: <Text style={styles.avgValue}>{formatFlow(averageValue)}</Text>
        </Text>

        <View
          style={[
            styles.deltaPill,
            { backgroundColor: deltaValue > 1.5 ? COLORS.dangerBg : 'rgba(0,0,0,0.06)' },
          ]}
        >
          <Text
            style={[
              styles.deltaText,
              { color: deltaValue > 1.5 ? COLORS.dangerText : COLORS.textPrimary },
            ]}
          >
            {deltaValue >= 0 ? '+' : ''}
            {formatFlow(deltaValue)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: 14,
    width: 250,
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
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.cardSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformContainer: {
    height: 75,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  floatingPill: {
    position: 'absolute',
    top: 24,
    backgroundColor: COLORS.darkCharcoal,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.04)',
  },
  avgText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  avgValue: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  deltaPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  deltaText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
