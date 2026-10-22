import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/theme';
import { useAlerts } from '../../src/context/AlertContext';

export default function TabsLayout() {
  const { activeCount } = useAlerts();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.darkCharcoal,
        tabBarInactiveTintColor: '#8F959E',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 0.2,
          marginBottom: 6,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 16,
          left: 18,
          right: 18,
          backgroundColor: '#FFFFFF',
          borderRadius: 36,
          height: 68,
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 18,
          elevation: 10,
          paddingHorizontal: 8,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 8 : 4,
        },
      }}
    >
      {/* 1. Home (AquaGuard Dashboard) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarStyle: { display: 'none' },
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={focused ? COLORS.darkCharcoal : '#8F959E'}
            />
          ),
        }}
      />

      {/* 2. Timeline / Analytics */}
      <Tabs.Screen
        name="history"
        options={{
          title: 'Analytics',
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'stats-chart' : 'stats-chart-outline'}
              size={22}
              color={focused ? COLORS.darkCharcoal : '#8F959E'}
            />
          ),
        }}
      />

      {/* 3. Tools / Simulation */}
      <Tabs.Screen
        name="scenarios"
        options={{
          title: 'Tools',
          tabBarLabel: 'Tools',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.centerFab, focused && styles.centerFabActive]}>
              <Ionicons
                name={focused ? 'construct' : 'construct-outline'}
                size={22}
                color={focused ? '#0D0E11' : COLORS.accentYellow}
              />
            </View>
          ),
        }}
      />

      {/* 4. Alerts */}
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarLabel: 'Alerts',
          tabBarBadge: activeCount > 0 ? activeCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: COLORS.danger,
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: '900',
            top: -2,
          },
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'notifications' : 'notifications-outline'}
              size={22}
              color={focused ? COLORS.darkCharcoal : '#8F959E'}
            />
          ),
        }}
      />

      {/* 5. Admin / Profile */}
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarLabel: 'Admin',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'}
              size={22}
              color={focused ? COLORS.darkCharcoal : '#8F959E'}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    width: 48,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accentOrange,
    marginTop: 4,
  },
  centerFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.darkCharcoal,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    marginTop: -16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  centerFabActive: {
    backgroundColor: COLORS.accentYellow,
    borderColor: '#0D0E11',
  },
});
