import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../src/constants/theme';
import { useSensor } from '../../src/context/SensorContext';
import { useMqtt } from '../../src/context/MqttContext';
import { formatFlow } from '../../src/utils/format';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

export default function DashboardScreen() {
  const {
    inFlow,
    outFlow,
    mismatch,
    elapsed,
    suspicious,
    needIntervals,
    statusState,
    setScenario,
    manualFlow,
    resetDemo,
    activeScenario,
  } = useSensor();

  const { status: mqttStatus } = useMqtt();
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusColor = () => {
    switch (statusState) {
      case 'leak':
        return COLORS.danger;
      case 'checking':
      case 'high':
      case 'datacheck':
        return COLORS.warningText;
      case 'normal':
      default:
        return COLORS.success;
    }
  };

  const isLeak = activeScenario === 'suspected_leak' || statusState === 'leak';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      {/* 1. TOP CURVED DARK HEADER (Exact structure from reference image) */}
      <View style={styles.darkHeader}>
        {/* Subtle SVG Wave Background */}
        <Svg
          height="160"
          width="100%"
          viewBox="0 0 350 160"
          style={StyleSheet.absoluteFill}
        >
          <Path
            d="M0,40 C100,10 200,80 350,30 L350,160 L0,160 Z"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1.5"
          />
          <Path
            d="M0,80 C120,40 220,110 350,70 L350,160 L0,160 Z"
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1.5"
          />
        </Svg>

        <View style={styles.darkHeaderContent}>
          <View style={styles.darkHeaderTop}>
            <View>
              <Text style={styles.greetingText}>Hey Inspector !</Text>
              <Text style={styles.heroHeadline}>
                Let's monitor your{'\n'}water pipeline!
              </Text>
            </View>

            {/* Profile / Connection Avatar */}
            <View style={styles.avatarCircle}>
              <Ionicons
                name="water"
                size={22}
                color={mqttStatus === 'connected' ? '#10B981' : '#FFFFFF'}
              />
              <View
                style={[
                  styles.onlineDot,
                  {
                    backgroundColor:
                      mqttStatus === 'connected' ? '#10B981' : '#F59E0B',
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* 2. OVERLAPPING WHITE SEARCH & FILTER BAR */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#94979E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search flow, sensors, leaks..."
            placeholderTextColor="#94979E"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.filterBtn} onPress={resetDemo}>
            <Ionicons name="options-outline" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. FEATURED SENSORS CARDS (Matching "Project" section in image) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Flow Sensors</Text>
        <TouchableOpacity onPress={resetDemo}>
          <Text style={styles.sectionLink}>Reset All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsRow}
      >
        {/* Main Dark Card (Matching the black "Game Design" card) */}
        <View style={styles.mainDarkCard}>
          {/* Top Circular Icon Badge */}
          <View style={styles.cardIconBadge}>
            <Ionicons name="speedometer-outline" size={20} color="#1A1C20" />
          </View>

          <Text style={styles.mainCardCategory}>Dual Monitoring Node</Text>
          <Text style={styles.mainCardTitle}>Inlet Flow S1</Text>

          <Text style={styles.mainCardMetric}>
            {formatFlow(inFlow)}{' '}
            <Text style={styles.mainCardUnit}>L/min</Text>
          </Text>

          <Text style={styles.mainCardSub}>
            Outlet: {formatFlow(outFlow)} L/min • Mismatch: {mismatch.toFixed(2)} L
          </Text>

          {/* Micro Step Control & Trigger Arrow Button */}
          <View style={styles.mainCardBottomRow}>
            <View style={styles.stepperWrap}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => manualFlow(Math.max(0, inFlow - 1), outFlow)}
              >
                <Text style={styles.stepBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepValue}>{inFlow.toFixed(1)}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => manualFlow(inFlow + 1, outFlow)}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.arrowCircleBtn}
              onPress={() =>
                setScenario(isLeak ? 'normal' : 'suspected_leak')
              }
            >
              <Ionicons
                name={isLeak ? 'checkmark' : 'arrow-forward'}
                size={18}
                color="#1A1C20"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Secondary Light Card (Matching the "Decision" side card) */}
        <View style={styles.sideLightCard}>
          <View style={styles.sideCardIconBadge}>
            <Ionicons
              name={isLeak ? 'alert-circle' : 'shield-checkmark'}
              size={18}
              color={getStatusColor()}
            />
          </View>

          <Text style={styles.sideCardCategory}>Pipeline State</Text>
          <Text
            style={[
              styles.sideCardTitle,
              { color: isLeak ? COLORS.danger : '#1A1C20' },
            ]}
          >
            {isLeak ? 'LEAK' : 'NORMAL'}
          </Text>

          <Text style={styles.sideCardSub}>
            {suspicious} / {needIntervals} checks
          </Text>

          <View style={styles.sideCardBottom}>
            <Text style={styles.runtimeTag}>T+{elapsed}s active</Text>
          </View>
        </View>
      </ScrollView>

      {/* 4. SCENARIOS TASK LIST (Matching "Tasks" list in image) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Evaluation Tasks</Text>
        <Text style={styles.sectionSubtitle}>Select scenario to test</Text>
      </View>

      <View style={styles.taskList}>
        {/* Task 1: Normal Balanced Flow */}
        <TouchableOpacity
          style={styles.taskCard}
          onPress={() => setScenario('normal')}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.checkboxCircle,
              activeScenario === 'normal' && styles.checkboxActive,
            ]}
          >
            {activeScenario === 'normal' && (
              <Ionicons name="checkmark" size={13} color="#FFFFFF" />
            )}
          </View>

          <View style={styles.taskTextCol}>
            <Text style={styles.taskTitle}>Normal Balanced Baseline</Text>
            <Text style={styles.taskDesc}>
              Inlet (5.0 L/m) matches Outlet (5.0 L/m)
            </Text>
          </View>

          <View
            style={[
              styles.taskDot,
              {
                backgroundColor:
                  activeScenario === 'normal' ? '#10B981' : '#D1D5DB',
              },
            ]}
          />
        </TouchableOpacity>

        {/* Task 2: Simulate Leak */}
        <TouchableOpacity
          style={styles.taskCard}
          onPress={() => setScenario('suspected_leak')}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.checkboxCircle,
              activeScenario === 'suspected_leak' && styles.checkboxActiveDanger,
            ]}
          >
            {activeScenario === 'suspected_leak' && (
              <Ionicons name="alert" size={13} color="#FFFFFF" />
            )}
          </View>

          <View style={styles.taskTextCol}>
            <Text style={styles.taskTitle}>Simulate Pipe Breach</Text>
            <Text style={styles.taskDesc}>
              Inlet exceeds Outlet by +2.0 L/m deficit
            </Text>
          </View>

          <View
            style={[
              styles.taskDot,
              {
                backgroundColor:
                  activeScenario === 'suspected_leak' ? COLORS.danger : '#D1D5DB',
              },
            ]}
          />
        </TouchableOpacity>

        {/* Task 3: High Consumption */}
        <TouchableOpacity
          style={styles.taskCard}
          onPress={() => setScenario('abnormal_consumption')}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.checkboxCircle,
              activeScenario === 'abnormal_consumption' && styles.checkboxActiveWarning,
            ]}
          >
            {activeScenario === 'abnormal_consumption' && (
              <Ionicons name="checkmark" size={13} color="#FFFFFF" />
            )}
          </View>

          <View style={styles.taskTextCol}>
            <Text style={styles.taskTitle}>High Consumption Draw</Text>
            <Text style={styles.taskDesc}>
              Balanced heavy draw exceeding 25.0 L/m
            </Text>
          </View>

          <View
            style={[
              styles.taskDot,
              {
                backgroundColor:
                  activeScenario === 'abnormal_consumption'
                    ? COLORS.warning
                    : '#D1D5DB',
              },
            ]}
          />
        </TouchableOpacity>

        {/* Task 4: Reversed Anomaly */}
        <TouchableOpacity
          style={styles.taskCard}
          onPress={() => setScenario('sensor_anomaly')}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.checkboxCircle,
              activeScenario === 'sensor_anomaly' && styles.checkboxActive,
            ]}
          >
            {activeScenario === 'sensor_anomaly' && (
              <Ionicons name="checkmark" size={13} color="#FFFFFF" />
            )}
          </View>

          <View style={styles.taskTextCol}>
            <Text style={styles.taskTitle}>Diagnostic: Reversed Flow</Text>
            <Text style={styles.taskDesc}>
              Outlet &gt; Inlet check (sensor calibration)
            </Text>
          </View>

          <View
            style={[
              styles.taskDot,
              {
                backgroundColor:
                  activeScenario === 'sensor_anomaly' ? '#0D9488' : '#D1D5DB',
              },
            ]}
          />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 90,
  },
  /* 1. TOP CURVED DARK HEADER */
  darkHeader: {
    backgroundColor: '#16181B',
    paddingTop: 44,
    paddingHorizontal: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  darkHeaderContent: {
    zIndex: 2,
  },
  darkHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  heroHeadline: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#26292E',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#16181B',
  },

  /* 2. OVERLAPPING SEARCH BAR */
  searchBarWrapper: {
    marginTop: -22,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1A1C20',
    fontWeight: '500',
  },
  filterBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#16181B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* 3. SECTION HEADERS */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1C20',
    letterSpacing: -0.3,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },

  /* 4. FEATURED CARDS (Exact match to image) */
  cardsRow: {
    paddingHorizontal: 18,
    gap: 12,
  },
  mainDarkCard: {
    width: 220,
    backgroundColor: '#16181B',
    borderRadius: 26,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  cardIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  mainCardCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mainCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  mainCardMetric: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 8,
    letterSpacing: -0.5,
  },
  mainCardUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  mainCardSub: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    lineHeight: 14,
  },
  mainCardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#26292E',
    borderRadius: 14,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 6,
  },
  stepBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  stepValue: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  arrowCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sideLightCard: {
    width: 130,
    backgroundColor: '#EDF1F5',
    borderRadius: 26,
    padding: 16,
    justifyContent: 'space-between',
  },
  sideCardIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  sideCardCategory: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  sideCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  sideCardSub: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  sideCardBottom: {
    marginTop: 12,
  },
  runtimeTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9CA3AF',
  },

  /* 5. TASKS LIST */
  taskList: {
    paddingHorizontal: 18,
    gap: 10,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#16181B',
    borderColor: '#16181B',
  },
  checkboxActiveDanger: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
  },
  checkboxActiveWarning: {
    backgroundColor: COLORS.warning,
    borderColor: COLORS.warning,
  },
  taskTextCol: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1C20',
  },
  taskDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  taskDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
