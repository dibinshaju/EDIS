import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

interface StatusDotProps {
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  size?: number;
}

export const StatusDot: React.FC<StatusDotProps> = ({ status, size = 10 }) => {
  const getColor = () => {
    switch (status) {
      case 'connected':
        return COLORS.success;
      case 'connecting':
        return COLORS.warning;
      case 'error':
      case 'disconnected':
      default:
        return COLORS.danger;
    }
  };

  return (
    <View style={[styles.outer, { width: size + 6, height: size + 6, borderRadius: (size + 6) / 2 }]}>
      <View
        style={[
          styles.inner,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: getColor(),
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  inner: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
