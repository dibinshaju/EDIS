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
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Editorial Header */}
        <View style={styles.header}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Alert Dispatch</Text>
            <View style={styles.indexPill}>
              <Text style={styles.indexPillText}>04 of 04</Text>
            </View>
          </View>

          <View style={styles.tagPill}>
            <Text style={styles.tagPillText}>Safety Monitor</Text>
          </View>

          <View style={styles.heroTitleWrap}>
            <Text style={styles.heroTitlePrimary}>Real-Time Alerts &</Text>
            <Text style={styles.heroTitleAccent}>Incident Logs</Text>
          </View>
        </View>

        {/* Action / Trigger Row */}
        <View style={styles.topActionsRow}>
          <View style={styles.countBox}>
            <Text style={styles.countNumber}>{activeCount}</Text>
            <Text style={styles.countLabel}>Active</Text>
          </View>

          <TouchableOpacity
            style={styles.triggerTestBtn}
            onPress={() => triggerDemoAlert('SUSPECTED_LEAK')}
          >
            <Ionicons name="flash-outline" size={13} color="#FFFFFF" />
            <Text style={styles.triggerTestBtnText}>Simulate Alert</Text>
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

        {filteredAlerts.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="checkmark-done" size={24} color={COLORS.darkCharcoal} />
            </View>
            <Text style={styles.emptyTitle}>System Secure</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'ALL'
                ? 'All sensors reporting steady balance. No anomalies detected.'
                : `No events in ${filter} category.`}
            </Text>
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
            <Ionicons name="trash-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.clearAllText}>Clear All Alerts</Text>
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
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  indexPill: {
    backgroundColor: '#E2DFD8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  indexPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  tagPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E2DFD8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    marginBottom: 10,
  },
  tagPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  heroTitleWrap: {
    marginTop: 2,
    marginBottom: 4,
  },
  heroTitlePrimary: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111215',
    lineHeight: 36,
    letterSpacing: -1.2,
  },
  heroTitleAccent: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.accentLimeDark,
    lineHeight: 36,
    letterSpacing: -1.2,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10,
  },
  countBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  countNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.danger,
  },
  countLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  triggerTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.darkCharcoal,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  triggerTestBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderRadius: RADIUS.md,
    marginBottom: 14,
    gap: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  filterTabActive: {
    backgroundColor: COLORS.darkCharcoal,
  },
  filterTabText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F4F3ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111215',
  },
  emptySubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
  },
  clearAllText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
});
