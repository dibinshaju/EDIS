import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { continuousAlarmEngine, AlarmStatePayload } from '../services/continuousAlarm';
import { useAlerts } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';

export const ActiveAlarmBanner: React.FC = () => {
  const router = useRouter();
  const { acknowledgeAlert } = useAlerts();
  const { user } = useAuth();

  const [state, setState] = useState<AlarmStatePayload>(continuousAlarmEngine.getState());
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    const unsubscribe = continuousAlarmEngine.subscribe((s) => {
      setState(s);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (state.isRinging) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      if (loop) loop.stop();
    };
  }, [state.isRinging]);

  if (!state.isRinging || !state.alertId) {
    return null;
  }

  const handleStop = async () => {
    await continuousAlarmEngine.stopAlarm();
    // Record local stop state in backend if user exists
    if (user && state.alertId) {
      fetch('/api/alarms/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId: state.alertId,
          userId: user.uid,
          userEmail: user.email,
        }),
      }).catch(console.warn);
    }
  };

  const handleAck = async () => {
    const alertId = state.alertId!;
    await continuousAlarmEngine.acknowledgeAlarm(alertId, async () => {
      acknowledgeAlert(alertId);
      if (user) {
        fetch('/api/alarms/acknowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alertId,
            userId: user.uid,
            userEmail: user.email,
            displayName: user.displayName,
          }),
        }).catch(console.warn);
      }
    });
  };

  return (
    <Animated.View style={[styles.bannerContainer, { transform: [{ scale: pulseAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.bannerTouch}
        onPress={() => router.push('/(tabs)/alerts')}
      >
        <View style={styles.topRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="warning" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.titleCol}>
            <Text style={styles.bannerTitle}>EMERGENCY WATER LEAKAGE!</Text>
            <Text style={styles.bannerSubtitle}>
              Continuous alarm ringing • Loss: +{state.loss.toFixed(1)} L/min
            </Text>
          </View>
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
            <Ionicons name="volume-mute" size={15} color="#FFFFFF" />
            <Text style={styles.stopBtnText}>STOP ALARM</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ackBtn} onPress={handleAck}>
            <Ionicons name="checkmark-done" size={15} color="#15803D" />
            <Text style={styles.ackBtnText}>ACKNOWLEDGE</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    zIndex: 9999,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 20,
  },
  bannerTouch: {
    backgroundColor: '#DC2626',
    borderRadius: 14,
    padding: 12,
    borderWidth: 2,
    borderColor: '#FECACA',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  bannerSubtitle: {
    fontSize: 11,
    color: '#FEE2E2',
    fontWeight: '600',
    marginTop: 2,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stopBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  stopBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ackBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 9,
  },
  ackBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
});
