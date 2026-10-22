import React, { useRef } from 'react';
import { View, Text, StyleSheet, PanResponder, LayoutChangeEvent } from 'react-native';
import { COLORS } from '../constants/theme';

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
  const trackWidthRef = useRef<number>(200);

  const calculateValueFromPosition = (pageX: number, trackLeft: number) => {
    const width = trackWidthRef.current || 200;
    const clampedX = Math.max(0, Math.min(pageX - trackLeft, width));
    const ratio = clampedX / width;
    let rawVal = min + ratio * (max - min);
    if (step) {
      rawVal = Math.round(rawVal / step) * step;
    }
    const finalVal = Math.max(min, Math.min(max, Number(rawVal.toFixed(2))));
    onChange(finalVal);
  };

  const trackRef = useRef<View>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        trackRef.current?.measure((x, y, width, height, pageX) => {
          calculateValueFromPosition(evt.nativeEvent.pageX, pageX);
        });
      },
      onPanResponderMove: (evt) => {
        trackRef.current?.measure((x, y, width, height, pageX) => {
          calculateValueFromPosition(evt.nativeEvent.pageX, pageX);
        });
      },
    })
  ).current;

  const fraction = Math.max(0, Math.min(1, (value - min) / (max - min)));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.valueText}>
          {value.toFixed(step < 1 ? 1 : 0)} {unit}
        </Text>
      </View>

      <View
        ref={trackRef}
        style={styles.track}
        onLayout={(e: LayoutChangeEvent) => {
          trackWidthRef.current = e.nativeEvent.layout.width;
        }}
        {...panResponder.panHandlers}
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
  track: {
    height: 14,
    backgroundColor: '#DAD7CE',
    borderRadius: 7,
    position: 'relative',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  fill: {
    height: '100%',
    borderRadius: 7,
  },
  thumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    marginLeft: -11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
});
