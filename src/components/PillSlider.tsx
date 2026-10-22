import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface PillSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  color?: string;
}

export const PillSlider: React.FC<PillSliderProps> = ({
  label,
  value,
  min,
  max,
  step = 0.5,
  unit = '',
  onChange,
  color = COLORS.darkCharcoal,
}) => {
  const fraction = Math.max(0, Math.min(1, (value - min) / (max - min)));

  const handleDecrement = () => {
    const next = Math.max(min, Number((value - step).toFixed(2)));
    onChange(next);
  };

  const handleIncrement = () => {
    const next = Math.min(max, Number((value + step).toFixed(2)));
    onChange(next);
  };

  const handleTrackPress = (e: any) => {
    const { locationX } = e.nativeEvent;
    const width = 200; // estimated width
    const ratio = Math.max(0, Math.min(1, locationX / width));
    let raw = min + ratio * (max - min);
    if (step) {
      raw = Math.round(raw / step) * step;
    }
    onChange(Math.max(min, Math.min(max, Number(raw.toFixed(2)))));
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.valueText}>
          {value.toFixed(step < 1 ? 1 : 0)} {unit}
        </Text>
      </View>

      <View style={styles.sliderControlRow}>
        <TouchableOpacity style={styles.stepBtn} onPress={handleDecrement} activeOpacity={0.7}>
          <Ionicons name="remove" size={14} color={COLORS.darkCharcoal} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.track}
          onPress={handleTrackPress}
          activeOpacity={0.9}
        >
          <View style={[styles.fill, { width: `${fraction * 100}%`, backgroundColor: color }]} />
          <View
            style={[
              styles.thumb,
              {
                left: `${fraction * 100}%`,
                borderColor: color,
              },
            ]}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.stepBtn} onPress={handleIncrement} activeOpacity={0.7}>
          <Ionicons name="add" size={14} color={COLORS.darkCharcoal} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  valueText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  sliderControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.cardSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBC7BD',
  },
  track: {
    flex: 1,
    height: 12,
    backgroundColor: '#DAD7CE',
    borderRadius: 6,
    position: 'relative',
    justifyContent: 'center',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
  },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    marginLeft: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
});
