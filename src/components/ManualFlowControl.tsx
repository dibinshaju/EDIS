import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMqtt } from '../context/MqttContext';
import { useSensor } from '../context/SensorContext';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

interface ManualFlowControlProps {
  compact?: boolean;
}

interface FlowPreset {
  id: string;
  label: string;
  inlet: number;
  outlet: number;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  badge?: string;
}

const PRESETS: FlowPreset[] = [
  {
    id: 'normal',
    label: 'Normal',
    inlet: 8.0,
    outlet: 8.0,
    icon: 'water-outline',
    description: 'Balanced baseline municipal flow (8.0 / 8.0 L/min)',
    badge: 'BALANCED',
  },
  {
    id: 'leak',
    label: 'Simulate Leak',
    inlet: 8.0,
    outlet: 3.0,
    icon: 'alert-circle-outline',
    description: 'Sustained pipe rupture loss (-5.0 L/min deficit)',
    badge: 'LEAK',
  },
  {
    id: 'high',
    label: 'High Consumption',
    inlet: 30.0,
    outlet: 30.0,
    icon: 'speedometer-outline',
    description: 'Surge draw (30.0 L/min) exceeding continuous ceiling',
    badge: 'HIGH FLOW',
  },
  {
    id: 'reversed',
    label: 'Reversed Mismatch',
    inlet: 3.0,
    outlet: 8.0,
    icon: 'swap-horizontal-outline',
    description: 'Outlet exceeds inlet: Reverse siphon or calibration anomaly',
    badge: 'DIAGNOSTIC',
  },
  {
    id: 'reset',
    label: 'Reset to Normal',
    inlet: 8.0,
    outlet: 8.0,
    icon: 'refresh-outline',
    description: 'Quick recovery to safe balanced state (8.0 / 8.0 L/min)',
    badge: 'RESET',
  },
];

export const ManualFlowControl: React.FC<ManualFlowControlProps> = ({ compact = false }) => {
  const { status: mqttStatus, connect, publishFlowCommand, lastAck, lastReading } = useMqtt();
  const { dataSource, setDataSource } = useSensor();

  const [inletText, setInletText] = useState('8.0');
  const [outletText, setOutletText] = useState('8.0');
  const [pendingReqId, setPendingReqId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'idle' | 'pending' | 'success' | 'error' | 'timeout';
    message: string;
    detail?: string;
  }>({
    type: 'idle',
    message: 'Ready to send flow rates to ESP32.',
  });

  const timeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Monitor incoming ACKs and matching Telemetry for confirmation
  useEffect(() => {
    if (!pendingReqId) return;

    // Check if matching ACK arrived
    if (lastAck && lastAck.requestId === pendingReqId) {
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
      if (lastAck.status === 'applied') {
        setFeedback({
          type: 'success',
          message: 'Confirmed & Applied by ESP32!',
          detail: `Inlet: ${lastAck.inlet?.toFixed(1) ?? inletText} L/m | Outlet: ${lastAck.outlet?.toFixed(1) ?? outletText} L/m`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: `ESP32 rejected command: ${lastAck.status}`,
          detail: 'Check flow limits (0 - 100 L/min).',
        });
      }
      setPendingReqId(null);
      return;
    }

    // Check if matching Telemetry arrived directly with requestId
    if (lastReading && lastReading.requestId === pendingReqId) {
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
      setFeedback({
        type: 'success',
        message: 'Telemetry Confirmed & Active!',
        detail: `Sensors reading In: ${lastReading.inletFlow.toFixed(1)} L/m, Out: ${lastReading.outletFlow.toFixed(1)} L/m`,
      });
      setPendingReqId(null);
    }
  }, [lastAck, lastReading, pendingReqId, inletText, outletText]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    };
  }, []);

  const handleApply = (customInlet?: number, customOutlet?: number) => {
    const rawIn = customInlet !== undefined ? customInlet : parseFloat(inletText);
    const rawOut = customOutlet !== undefined ? customOutlet : parseFloat(outletText);

    if (isNaN(rawIn) || isNaN(rawOut) || !Number.isFinite(rawIn) || !Number.isFinite(rawOut)) {
      setFeedback({
        type: 'error',
        message: 'Validation Error',
        detail: 'Please enter valid numerical values for both flow rates.',
      });
      return;
    }

    if (rawIn < 0 || rawIn > 100 || rawOut < 0 || rawOut > 100) {
      setFeedback({
        type: 'error',
        message: 'Range Limit Exceeded',
        detail: 'Flow values must be between 0.0 and 100.0 L/min.',
      });
      return;
    }

    if (mqttStatus !== 'connected') {
      setFeedback({
        type: 'error',
        message: 'MQTT Disconnected',
        detail: 'Connect to the MQTT broker before sending simulator commands.',
      });
      return;
    }

    // Clear prior timers
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);

    // Auto-switch data source to Wokwi so user immediately perceives telemetry
    if (dataSource !== 'wokwi') {
      setDataSource('wokwi');
    }

    const { success, error, requestId } = publishFlowCommand(rawIn, rawOut);

    if (!success) {
      setFeedback({
        type: 'error',
        message: 'Publish Failed',
        detail: error || 'Could not send MQTT command.',
      });
      return;
    }

    setPendingReqId(requestId);
    setFeedback({
      type: 'pending',
      message: 'Command sent to ESP32...',
      detail: `Tracking req: ${requestId.slice(-8)} — Awaiting ACK & Telemetry`,
    });

    // 5-second confirmation timeout
    timeoutTimerRef.current = setTimeout(() => {
      setPendingReqId((currentId) => {
        if (currentId === requestId) {
          setFeedback({
            type: 'timeout',
            message: 'Awaiting ESP32 Confirmation',
            detail: 'Command was published. Verify Wokwi ESP32 simulation is running & subscribed.',
          });
          return null;
        }
        return currentId;
      });
    }, 5000);
  };

  const handleSelectPreset = (preset: FlowPreset) => {
    setInletText(preset.inlet.toFixed(1));
    setOutletText(preset.outlet.toFixed(1));
    handleApply(preset.inlet, preset.outlet);
  };

  const isConnected = mqttStatus === 'connected';

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>MQTT COMMAND</Text>
          </View>
          <Text style={styles.title}>Manual Flow Control</Text>
        </View>

        <View style={styles.headerRight}>
          <View
            style={[
              styles.statusPill,
              isConnected ? styles.statusPillConnected : styles.statusPillDisconnected,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                isConnected ? styles.statusDotConnected : styles.statusDotDisconnected,
              ]}
            />
            <Text
              style={[
                styles.statusText,
                isConnected ? styles.statusTextConnected : styles.statusTextDisconnected,
              ]}
            >
              {isConnected ? 'ESP32 LINKED' : 'OFFLINE'}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Remotely inject custom inlet and outlet rates into the ESP32 simulation over EMQX MQTT.
      </Text>

      {/* Numerical Input Controls */}
      <View style={styles.inputsContainer}>
        <View style={styles.inputWrapper}>
          <View style={styles.inputLabelRow}>
            <Ionicons name="arrow-down-circle-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.inputLabel}>INLET FLOW</Text>
          </View>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              value={inletText}
              onChangeText={setInletText}
              keyboardType="numeric"
              placeholder="0.0"
              placeholderTextColor={COLORS.textSecondary}
              maxLength={6}
            />
            <Text style={styles.unitText}>L/min</Text>
          </View>
        </View>

        <View style={styles.inputDivider}>
          <Ionicons name="swap-horizontal" size={16} color={COLORS.textSecondary} />
        </View>

        <View style={styles.inputWrapper}>
          <View style={styles.inputLabelRow}>
            <Ionicons name="arrow-up-circle-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.inputLabel}>OUTLET FLOW</Text>
          </View>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              value={outletText}
              onChangeText={setOutletText}
              keyboardType="numeric"
              placeholder="0.0"
              placeholderTextColor={COLORS.textSecondary}
              maxLength={6}
            />
            <Text style={styles.unitText}>L/min</Text>
          </View>
        </View>
      </View>

      {/* Action Button */}
      <View style={styles.actionRow}>
        {!isConnected ? (
          <TouchableOpacity style={styles.connectBtn} onPress={connect} activeOpacity={0.85}>
            <Ionicons name="link" size={16} color="#FFFFFF" />
            <Text style={styles.connectBtnText}>Connect MQTT Bridge to Apply</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.applyBtn, pendingReqId !== null && styles.applyBtnDisabled]}
            onPress={() => handleApply()}
            disabled={pendingReqId !== null}
            activeOpacity={0.85}
          >
            {pendingReqId !== null ? (
              <ActivityIndicator size="small" color="#0D0E11" />
            ) : (
              <Ionicons name="paper-plane" size={16} color="#0D0E11" />
            )}
            <Text style={styles.applyBtnText}>
              {pendingReqId !== null ? 'Transmitting...' : 'Apply Flow Values'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Feedback & Acknowledgment Banner */}
      <View
        style={[
          styles.feedbackBox,
          feedback.type === 'success' && styles.feedbackSuccess,
          feedback.type === 'error' && styles.feedbackError,
          feedback.type === 'pending' && styles.feedbackPending,
          feedback.type === 'timeout' && styles.feedbackTimeout,
        ]}
      >
        <Ionicons
          name={
            feedback.type === 'success'
              ? 'checkmark-circle'
              : feedback.type === 'error'
              ? 'alert-circle'
              : feedback.type === 'pending'
              ? 'sync'
              : feedback.type === 'timeout'
              ? 'time-outline'
              : 'information-circle-outline'
          }
          size={18}
          color={
            feedback.type === 'success'
              ? COLORS.success
              : feedback.type === 'error'
              ? COLORS.danger
              : feedback.type === 'pending'
              ? '#6366F1'
              : feedback.type === 'timeout'
              ? COLORS.warning
              : COLORS.textSecondary
          }
        />
        <View style={styles.feedbackTextContainer}>
          <Text
            style={[
              styles.feedbackTitle,
              feedback.type === 'success' && { color: COLORS.success },
              feedback.type === 'error' && { color: COLORS.danger },
              feedback.type === 'pending' && { color: '#4F46E5' },
              feedback.type === 'timeout' && { color: '#B45309' },
            ]}
          >
            {feedback.message}
          </Text>
          {feedback.detail && <Text style={styles.feedbackDetail}>{feedback.detail}</Text>}
        </View>
      </View>

      {/* Presets Header */}
      <View style={styles.presetsHeader}>
        <Text style={styles.presetsTitle}>QUICK PRESETS</Text>
        <Text style={styles.presetsHint}>Tap to load & send instant test pattern</Text>
      </View>

      {/* Presets Row / Grid */}
      <View style={styles.presetsGrid}>
        {PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset.id}
            style={styles.presetChip}
            onPress={() => handleSelectPreset(preset)}
            activeOpacity={0.7}
          >
            <View style={styles.presetChipHeader}>
              <Ionicons name={preset.icon} size={14} color={COLORS.darkCharcoal} />
              <Text style={styles.presetChipTitle}>{preset.label}</Text>
            </View>
            <Text style={styles.presetChipFlow}>
              {preset.inlet.toFixed(1)} / {preset.outlet.toFixed(1)} L/m
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Academic Demonstration Disclaimer */}
      <View style={styles.disclaimerBox}>
        <Ionicons name="school-outline" size={13} color={COLORS.textSecondary} />
        <Text style={styles.disclaimerText}>
          Academic Demonstration: Values are commanded via MQTT to the virtual ESP32. Sensor state updates authoritatively from published telemetry packets.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E1DA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginVertical: SPACING.sm,
  },
  cardCompact: {
    padding: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: COLORS.badgeYellowBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  badgeText: {
    fontFamily: 'BebasNeue',
    fontSize: 11,
    color: COLORS.badgeYellowText,
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: 'Bungee',
    fontSize: 14,
    color: COLORS.textPrimary,
    letterSpacing: 0.2,
  },
  headerRight: {},
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 5,
  },
  statusPillConnected: {
    backgroundColor: '#D1FAE5',
  },
  statusPillDisconnected: {
    backgroundColor: '#F3F4F6',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotConnected: {
    backgroundColor: '#10B981',
  },
  statusDotDisconnected: {
    backgroundColor: '#9CA3AF',
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'BebasNeue',
    letterSpacing: 0.5,
  },
  statusTextConnected: {
    color: '#065F46',
  },
  statusTextDisconnected: {
    color: '#6B7280',
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 16,
  },
  inputsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: 'BebasNeue',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F6',
    borderWidth: 1,
    borderColor: '#DFDED6',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'GravitasOne',
    color: COLORS.textPrimary,
    padding: 0,
  },
  unitText: {
    fontSize: 11,
    fontFamily: 'BebasNeue',
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  inputDivider: {
    paddingTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRow: {
    marginTop: 4,
    marginBottom: SPACING.sm,
  },
  applyBtn: {
    backgroundColor: COLORS.accentYellow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5EE00',
  },
  applyBtnDisabled: {
    opacity: 0.6,
  },
  applyBtnText: {
    fontFamily: 'BebasNeue',
    fontSize: 15,
    color: '#0D0E11',
    letterSpacing: 0.5,
  },
  connectBtn: {
    backgroundColor: COLORS.darkCharcoal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    gap: 8,
  },
  connectBtnText: {
    fontFamily: 'BebasNeue',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.sm,
    padding: 8,
    marginBottom: SPACING.sm,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  feedbackSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  feedbackError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  feedbackPending: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  feedbackTimeout: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  feedbackTextContainer: {
    flex: 1,
  },
  feedbackTitle: {
    fontSize: 12,
    fontFamily: 'BebasNeue',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  feedbackDetail: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 14,
  },
  presetsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
  presetsTitle: {
    fontSize: 11,
    fontFamily: 'BebasNeue',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  presetsHint: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  presetChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: '31%',
    flexGrow: 1,
  },
  presetChipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  presetChipTitle: {
    fontSize: 11,
    fontFamily: 'BebasNeue',
    color: COLORS.textPrimary,
  },
  presetChipFlow: {
    fontSize: 11,
    fontFamily: 'GravitasOne',
    color: COLORS.textSecondary,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8F8F6',
    borderRadius: RADIUS.xs,
    padding: 6,
    borderWidth: 1,
    borderColor: '#ECEBE4',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 10,
    color: COLORS.textSecondary,
    lineHeight: 13,
  },
});
