import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSensor } from '../context/SensorContext';
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
    title: '1. Normal Balanced Flow',
    badge: 'NORMAL',
    description: 'Inlet (12.5 L/min) and Outlet (12.3 L/min) are balanced. Steady municipal draw.',
    icon: 'water-outline',
    color: COLORS.success,
  },
  {
    id: 'suspected_leak',
    title: '2. Suspected Water Leak',
    badge: 'CRITICAL',
    description: 'Inlet (16.0 L/min) exceeds Outlet (10.8 L/min) by +5.2 L/min loss sustained.',
    icon: 'alert-circle',
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
    title: '4. Night-Time Flow',
    badge: 'QUIESCENT',
    description: 'Unbroken flow (4.5 L/min) during quiescent night window (11:00 PM - 5:00 AM).',
    icon: 'moon-outline',
    color: '#8B5CF6',
  },
  {
    id: 'sensor_anomaly',
    title: '5. Sensor Anomaly (Outlet > Inlet)',
    badge: 'DIAGNOSTIC',
    description: 'Outlet (15.2 L/min) > Inlet (9.0 L/min). Reverses flow, checks calibration error.',
    icon: 'build-outline',
    color: COLORS.info,
  },
  {
    id: 'recovery',
    title: '6. System Recovery & Normalization',
    badge: 'RECOVERY',
    description: 'Water loss arrested; inlet and outlet equalize back to normal baseline.',
    icon: 'checkmark-done-circle',
    color: COLORS.tealPrimary,
  },
];

export const ScenarioController: React.FC = () => {
  const { activeScenario, setScenario, resetSimulator, dataSource, setDataSource } = useSensor();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Expo Demo Scenario Controller</Text>
          <Text style={styles.subheading}>
            Select a deterministic scenario to demonstrate system response
          </Text>
        </View>

        <TouchableOpacity style={styles.resetBtn} onPress={resetSimulator}>
          <Ionicons name="refresh" size={14} color="#FFFFFF" />
          <Text style={styles.resetBtnText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Source selector (Demo vs Wokwi MQTT) */}
      <View style={styles.sourceSelector}>
        <TouchableOpacity
          style={[styles.sourceTab, dataSource === 'demo' && styles.sourceTabActive]}
          onPress={() => setDataSource('demo')}
        >
          <Ionicons
            name="flask"
            size={14}
            color={dataSource === 'demo' ? COLORS.navyDark : COLORS.textMuted}
          />
          <Text style={[styles.sourceTabText, dataSource === 'demo' && styles.sourceTabTextActive]}>
            Deterministic Demo Simulation
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sourceTab, dataSource === 'wokwi' && styles.sourceTabActive]}
          onPress={() => setDataSource('wokwi')}
        >
          <Ionicons
            name="hardware-chip-outline"
            size={14}
            color={dataSource === 'wokwi' ? COLORS.navyDark : COLORS.textMuted}
          />
          <Text style={[styles.sourceTabText, dataSource === 'wokwi' && styles.sourceTabTextActive]}>
            Live Wokwi ESP32
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scenario List */}
      <View style={styles.scenarioList}>
        {SCENARIOS.map((item) => {
          const isActive = activeScenario === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.scenarioCard,
                isActive && { borderColor: item.color, backgroundColor: `${item.color}08` },
              ]}
              onPress={() => setScenario(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.scenarioTop}>
                <View style={styles.scenarioTitleRow}>
                  <View style={[styles.iconBox, { backgroundColor: `${item.color}18` }]}>
                    <Ionicons name={item.icon} size={16} color={item.color} />
                  </View>
                  <Text style={[styles.scenarioTitle, isActive && { color: item.color }]}>
                    {item.title}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: `${item.color}20` }]}>
                  <Text style={[styles.badgeText, { color: item.color }]}>{item.badge}</Text>
                </View>
              </View>

              <Text style={styles.scenarioDesc}>{item.description}</Text>

              {isActive && (
                <View style={styles.activeBanner}>
                  <Ionicons name="radio-button-on" size={12} color={item.color} />
                  <Text style={[styles.activeBannerText, { color: item.color }]}>
                    Actively Streaming to Telemetry Pipeline
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heading: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  subheading: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.navyDark,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  sourceSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgLight,
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
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sourceTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  sourceTabTextActive: {
    color: COLORS.navyDark,
    fontWeight: '700',
  },
  scenarioList: {
    gap: 8,
  },
  scenarioCard: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: RADIUS.md,
    padding: 10,
    backgroundColor: '#FAFAFA',
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
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scenarioTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  scenarioDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 15,
    marginLeft: 34,
  },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    marginLeft: 34,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  activeBannerText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
