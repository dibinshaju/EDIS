import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../src/constants/theme';
import { useSensor } from '../../src/context/SensorContext';
import { useAlerts } from '../../src/context/AlertContext';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

const DAYS = [
  { day: '10', name: 'Mon' },
  { day: '11', name: 'Tue' },
  { day: '12', name: 'Wed' },
  { day: '13', name: 'Thu', active: true },
  { day: '14', name: 'Fri' },
  { day: '15', name: 'Sat' },
  { day: '16', name: 'Sun' },
];

export default function HistoryScreen() {
  const { history, currentReading, activeScenario } = useSensor();
  const { alerts, acknowledgeAlert } = useAlerts();
  const [selectedDay, setSelectedDay] = useState('13');

  const latestAlert = alerts.find((a) => a.status === 'ACTIVE') || alerts[0];

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* 1. TOP HEADER (Exact match to Screen 2 in reference image) */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.dateLabel}>November 13, 2026</Text>
            <Text style={styles.todayHeading}>Today</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={20} color="#6B7280" />
          </View>
        </View>

        {/* 2. HORIZONTAL DAYS / INTERVALS SELECTOR */}
        <View style={styles.daysRow}>
          {DAYS.map((d) => {
            const isActive = d.day === selectedDay;
            return (
              <TouchableOpacity
                key={d.day}
                style={[styles.dayItem, isActive && styles.dayItemActive]}
                onPress={() => setSelectedDay(d.day)}
              >
                <Text style={[styles.dayNum, isActive && styles.dayNumActive]}>
                  {d.day}
                </Text>
                <Text style={[styles.dayName, isActive && styles.dayNameActive]}>
                  {d.name}
                </Text>
                {isActive && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 3. VERTICAL TIMELINE WITH CIRCULAR NODES */}
        <View style={styles.timelineContainer}>
          {/* Continuous Vertical Wire Line */}
          <View style={styles.verticalWire} />

          {/* Node 1: Featured Dark Event Card (Meeting / Alert) */}
          <View style={styles.timelineRow}>
            {/* Top Node Indicator */}
            <View style={styles.nodeCircleWrapper}>
              <View style={styles.featuredNodeCircle}>
                <View style={styles.featuredInnerDot} />
              </View>
            </View>

            {/* Featured Dark Card (Exact match to "Meeting" card in image) */}
            <View style={styles.featuredCard}>
              {/* Subtle SVG Wave lines */}
              <Svg
                height="120"
                width="100%"
                viewBox="0 0 260 120"
                style={StyleSheet.absoluteFillObject}
              >
                <Path
                  d="M0,50 C80,20 160,90 260,40"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1.5"
                />
                <Path
                  d="M0,80 C100,50 180,100 260,70"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1.5"
                />
              </Svg>

              <View style={styles.featuredCardTop}>
                <Text style={styles.featuredTitle}>
                  {activeScenario === 'suspected_leak'
                    ? 'Leak Alert'
                    : 'Monitoring Session'}
                </Text>
                <Text style={styles.featuredTime}>9.00 AM</Text>
              </View>

              <Text style={styles.featuredDesc}>
                {activeScenario === 'suspected_leak'
                  ? 'Inlet S1 (+2.0 L/m deficit) sustained beyond persistence window'
                  : 'Sensors S1 and S2 reporting steady baseline flow'}
              </Text>

              {/* Bottom Avatar / Checkmark Row */}
              <View style={styles.featuredBottomRow}>
                <View style={styles.avatarPillsRow}>
                  <View style={[styles.microAvatar, { backgroundColor: '#38BDF8' }]}>
                    <Text style={styles.microAvatarText}>S1</Text>
                  </View>
                  <View
                    style={[
                      styles.microAvatar,
                      { backgroundColor: '#818CF8', marginLeft: -8 },
                    ]}
                  >
                    <Text style={styles.microAvatarText}>S2</Text>
                  </View>
                  <View
                    style={[
                      styles.microAvatar,
                      { backgroundColor: '#F43F5E', marginLeft: -8 },
                    ]}
                  >
                    <Text style={styles.microAvatarText}>IoT</Text>
                  </View>
                </View>

                {latestAlert && (
                  <TouchableOpacity
                    style={styles.checkBtn}
                    onPress={() => acknowledgeAlert(latestAlert.id)}
                  >
                    <Ionicons name="checkmark" size={16} color="#16181B" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Node 2: Icon Set / Flow Telemetry */}
          <View style={styles.timelineRow}>
            <View style={styles.nodeCircleWrapper}>
              <View style={styles.regularNodeCircle} />
            </View>
            <View style={styles.plainEventCard}>
              <View style={styles.plainEventTop}>
                <Text style={styles.plainEventTitle}>Baseline Telemetry</Text>
                <Text style={styles.plainEventTime}>9.15 AM</Text>
              </View>
              <Text style={styles.plainEventDesc}>
                Municipal inflow balanced at 5.0 L/min across distribution section
              </Text>
            </View>
          </View>

          {/* Node 3: Prototype / Calibration Check */}
          <View style={styles.timelineRow}>
            <View style={styles.nodeCircleWrapper}>
              <View style={styles.regularNodeCircle} />
            </View>
            <View style={styles.plainEventCard}>
              <View style={styles.plainEventTop}>
                <Text style={styles.plainEventTitle}>MQTT Telemetry Heartbeat</Text>
                <Text style={styles.plainEventTime}>9.30 AM</Text>
              </View>
              <Text style={styles.plainEventDesc}>
                Wokwi virtual bridge synchronized with broker.emqx.io
              </Text>
            </View>
          </View>

          {/* Node 4: Check Asset / Reset */}
          <View style={styles.timelineRow}>
            <View style={styles.nodeCircleWrapper}>
              <View style={styles.regularNodeCircle} />
            </View>
            <View style={styles.plainEventCard}>
              <View style={styles.plainEventTop}>
                <Text style={styles.plainEventTitle}>System Calibration</Text>
                <Text style={styles.plainEventTime}>9.45 AM</Text>
              </View>
              <Text style={styles.plainEventDesc}>
                Threshold confirmed: Mismatch = 1.5 L/m, Persistence = 6 sec
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 44,
    paddingHorizontal: 20,
    paddingBottom: 90,
  },
  /* Header */
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  todayHeading: {
    fontSize: 26,
    fontWeight: '900',
    color: '#16181B',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Horizontal Days Strip */
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dayItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 16,
    minWidth: 38,
  },
  dayItemActive: {
    backgroundColor: '#16181B',
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  dayNum: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  dayNumActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayName: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  dayNameActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },

  /* Vertical Timeline */
  timelineContainer: {
    position: 'relative',
    paddingLeft: 4,
  },
  verticalWire: {
    position: 'absolute',
    left: 10,
    top: 14,
    bottom: 20,
    width: 2,
    backgroundColor: '#E5E7EB',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  nodeCircleWrapper: {
    width: 22,
    alignItems: 'center',
    marginRight: 14,
    paddingTop: 6,
  },
  featuredNodeCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#16181B',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16181B',
  },
  regularNodeCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    backgroundColor: '#FFFFFF',
  },

  /* Featured Dark Card */
  featuredCard: {
    flex: 1,
    backgroundColor: '#16181B',
    borderRadius: 22,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  featuredCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  featuredTime: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  featuredDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
    marginBottom: 16,
  },
  featuredBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  microAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#16181B',
  },
  microAvatarText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  checkBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Plain Event Card */
  plainEventCard: {
    flex: 1,
    paddingVertical: 4,
  },
  plainEventTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  plainEventTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16181B',
  },
  plainEventTime: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  plainEventDesc: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 15,
  },
});
