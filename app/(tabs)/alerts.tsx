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
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
            <Text style={styles.headerTitle}>Alert & Incident Center</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {activeCount > 0 ? `${activeCount} active incident requiring attention` : 'All systems operating within safe limits'}
          </Text>
        </View>

        <TouchableOpacity style={styles.demoBtn} onPress={() => triggerDemoAlert('SUSPECTED_LEAK')}>
          <Ionicons name="flash-outline" size={13} color="#FFFFFF" />
          <Text style={styles.demoBtnText}>Test Alert</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
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
            <Ionicons name="checkmark-done-circle-outline" size={48} color={COLORS.success} />
            <Text style={styles.emptyTitle}>No Alerts in this Category</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'ALL'
                ? 'No water leakage, abnormal flow, or sensor issues recorded yet.'
                : `No events matching filter: ${filter}`}
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
            <Ionicons name="trash-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.clearAllText}>Clear Alert Event History</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.navyDark,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.danger,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  demoBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.md,
    paddingBottom: 8,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: COLORS.bgLight,
  },
  filterTabActive: {
    backgroundColor: COLORS.navyDark,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textDark,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  triggerTestBtn: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  triggerTestText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.tealDark,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: SPACING.xl,
  },
  clearAllText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
