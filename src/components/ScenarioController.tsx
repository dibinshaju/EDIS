import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSensor } from '../context/SensorContext';
import { useMqtt } from '../context/MqttContext';
import { ScenarioType } from '../types/sensor';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface ScenarioOption {
  id: ScenarioType;
  title: string;
  badge: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const SCENARIOS: ScenarioOption[] = [
  {
    id: 'normal',
    title: '1. Balanced Baseline Flow',
    badge: 'NORMAL',
    description: 'Inlet (12.5 L/min) and Outlet (12.3 L/min) match closely. Steady municipal draw.',
    icon: 'water-outline',
    color: COLORS.darkCharcoal,
  },
  {
    id: 'suspected_leak',
    title: '2. Suspected Water Leak',
    badge: 'CRITICAL',
    description: 'Inlet (16.0 L/min) exceeds Outlet (10.8 L/min) by +5.2 L/min loss sustained.',
    icon: 'alert-circle-outline',
    color: COLORS.danger,
  },
  {
    id: 'abnormal_consumption',
    title: '3. Abnormal High Consumption',
    badge: 'HIGH FLOW',
    description: 'Continuous flow draws 31.0 L/min exceeding the 25.0 L/min maximum threshold.',
    icon: 'speedometer-outline',
    color: COLORS.warning,
  },
  {
    id: 'night_time_flow',
    title: '4. Continuous Night Flow',
    badge: 'QUIESCENT',
    description: 'Unbroken flow (4.5 L/min) during quiescent night window (23:00 - 05:00).',
    icon: 'moon-outline',
    color: '#6366F1',
  },
  {
    id: 'sensor_anomaly',
    title: '5. Diagnostic: Reversed Flow',
    badge: 'DIAGNOSTIC',
    description: 'Outlet (15.2 L/min) > Inlet (9.0 L/min). Checks calibration or reverse draw.',
    icon: 'build-outline',
    color: '#0D9488',
  },
  {
    id: 'recovery',
    title: '6. Incident Recovery',
    badge: 'RESOLVED',
    description: 'Deficit eliminated; telemetry normalizes back to certified baseline.',
    icon: 'checkmark-circle-outline',
    color: COLORS.success,
  },
];

export const ScenarioController: React.FC = () => {
  const { activeScenario, setScenario, resetSimulator, dataSource, setDataSource } = useSensor();
  const { status: mqttStatus, connect } = useMqtt();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Expo Evaluation Suite</Text>
          <Text style={styles.subheading}>Deterministic telemetry vectors for academic demo</Text>
        </View>

        <TouchableOpacity style={styles.resetBtn} onPress={resetSimulator}>
          <Ionicons name="refresh" size={13} color="#FFFFFF" />
          <Text style={styles.resetBtnText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Source selector (Pill style matching image) */}
      <View style={styles.sourceSelector}>
        <TouchableOpacity
          style={[styles.sourceTab, dataSource === 'demo' && styles.sourceTabActive]}
          onPress={() => setDataSource('demo')}
        >
          <Ionicons
            name="cube-outline"
            size={13}
            color={dataSource === 'demo' ? '#FFFFFF' : COLORS.textSecondary}
          />
          <Text style={[styles.sourceTabText, dataSource === 'demo' && styles.sourceTabTextActive]}>
            Deterministic Simulator
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sourceTab, dataSource === 'wokwi' && styles.sourceTabActive]}
          onPress={() => {
            setDataSource('wokwi');
            if (mqttStatus !== 'connected') {
              connect();
            }
          }}
        >
          <Ionicons
            name="hardware-chip-outline"
            size={13}
            color={dataSource === 'wokwi' ? '#FFFFFF' : COLORS.textSecondary}
          />
          <Text style={[styles.sourceTabText, dataSource === 'wokwi' && styles.sourceTabTextActive]}>
            Wokwi Virtual Hardware
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scenario List with yellow accent nodes */}
      <View style={styles.scenarioList}>
        {SCENARIOS.map((item) => {
          const isActive = activeScenario === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.scenarioCard,
                isActive && styles.scenarioCardActive,
              ]}
              onPress={() => setScenario(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.scenarioTop}>
                <View style={styles.scenarioTitleRow}>
                  <View style={[styles.nodeCircle, isActive && { backgroundColor: COLORS.accentLime }]}>
                    <Ionicons
                      name={item.icon}
                      size={14}
                      color={isActive ? COLORS.darkCharcoal : COLORS.textSecondary}
                    />
                  </View>
                  <Text style={[styles.scenarioTitle, isActive && { fontWeight: '800' }]}>
                    {item.title}
                  </Text>
                </View>

                <View style={[styles.badge, isActive && { backgroundColor: COLORS.darkCharcoal }]}>
                  <Text style={[styles.badgeText, isActive && { color: '#FFFFFF' }]}>
                    {item.badge}
                  </Text>
                </View>
              </View>

              <Text style={styles.scenarioDesc}>{item.description}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heading: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subheading: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.darkCharcoal,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  sourceSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardSubtle,
    padding: 3,
    borderRadius: RADIUS.md,
    marginBottom: 12,
  },
  sourceTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  sourceTabActive: {
    backgroundColor: COLORS.darkCharcoal,
  },
  sourceTabText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  sourceTabTextActive: {
    color: '#FFFFFF',
  },
  scenarioList: {
    gap: 8,
  },
  scenarioCard: {
    backgroundColor: COLORS.cardSubtle,
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  scenarioCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: COLORS.textPrimary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  scenarioTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  scenarioTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  nodeCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scenarioTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  badge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  scenarioDesc: {
    fontSize: 10,
    color: COLORS.textSecondary,
    lineHeight: 14,
    marginLeft: 32,
  },
});
