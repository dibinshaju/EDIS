import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../src/constants/theme';
import { useAlerts } from '../../src/context/AlertContext';
import { AlertCard } from '../../src/components/AlertCard';
import { AlertStatus } from '../../src/types/alert';
import { Ionicons } from '@expo/vector-icons';

export default function AlertsScreen() {
  const { alerts, activeCount, acknowledgeAlert, resolveAlert, clearAllAlerts, triggerDemoAlert } =
    useAlerts();

  const [filter, setFilter] = useState<'ALL' | AlertStatus>('ALL');

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'ALL') return true;
    return a.status === filter;
  });

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="alert-circle-outline" size={16} color={COLORS.textPrimary} />
            </View>
            <Text style={styles.headerTitle}>Incident Log</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {activeCount > 0 ? `${activeCount} active incident requiring attention` : 'All telemetry operating within verified margins'}
          </Text>
        </View>

        <TouchableOpacity style={styles.demoBtn} onPress={() => triggerDemoAlert('SUSPECTED_LEAK')}>
          <Ionicons name="flash-outline" size={12} color="#FFFFFF" />
          <Text style={styles.demoBtnText}>Test Event</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Pill Tabs */}
      <View style={styles.filterRow}>
        {(['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'] as const).map((tab) => {
          const isActive = filter === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setFilter(tab)}
            >
              <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {filteredAlerts.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="checkmark-done" size={28} color={COLORS.darkCharcoal} />
            </View>
            <Text style={styles.emptyTitle}>No Recorded Incidents</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'ALL'
                ? 'All sensors reporting steady balance. No anomalies detected.'
                : `No events in ${filter} category.`}
            </Text>
            <TouchableOpacity
              style={styles.triggerTestBtn}
              onPress={() => triggerDemoAlert('SUSPECTED_LEAK')}
            >
              <Text style={styles.triggerTestText}>Trigger Test Leak Incident</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={acknowledgeAlert}
              onResolve={resolveAlert}
            />
          ))
        )}

        {alerts.length > 0 && (
          <TouchableOpacity style={styles.clearAllBtn} onPress={clearAllAlerts}>
            <Ionicons name="trash-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.clearAllText}>Clear Event Archive</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.canvasBg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: COLORS.canvasBg,
  },
  headerLeft: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.darkCharcoal,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  demoBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  filterTabActive: {
    backgroundColor: COLORS.darkCharcoal,
  },
  filterTabText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 14,
    paddingBottom: 80,
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.accentLime,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  triggerTestBtn: {
    backgroundColor: COLORS.darkCharcoal,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  triggerTestText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  clearAllText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});
