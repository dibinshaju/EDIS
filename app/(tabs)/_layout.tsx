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
        tabBarShowLabel: false,
        tabBarActiveTintColor: COLORS.darkCharcoal,
        tabBarInactiveTintColor: '#8F959E',
        tabBarStyle: {
          position: 'absolute',
          bottom: 16,
          left: 18,
          right: 18,
          backgroundColor: '#FFFFFF',
          borderRadius: 36,
          height: 64,
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 18,
          elevation: 10,
          paddingHorizontal: 8,
          paddingBottom: Platform.OS === 'ios' ? 4 : 0,
        },
      }}
    >
      {/* 1. Home (AquaGuard Dashboard) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={22}
                color={focused ? COLORS.darkCharcoal : '#8F959E'}
              />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />

      {/* 2. Timeline / Analytics */}
      <Tabs.Screen
        name="history"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <Ionicons
                name={focused ? 'document-text' : 'document-text-outline'}
                size={22}
                color={focused ? COLORS.darkCharcoal : '#8F959E'}
              />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />

      {/* 3. Center Elevated Action Button [ + ] */}
      <Tabs.Screen
        name="scenarios"
        options={{
          title: 'Simulate',
          tabBarIcon: ({ focused }) => (
            <View style={styles.centerFab}>
              <Ionicons name="add" size={26} color={COLORS.accentLime} />
            </View>
          ),
        }}
      />

      {/* 4. Alerts */}
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarBadge: activeCount > 0 ? activeCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: COLORS.danger,
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: '900',
            top: -2,
          },
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <Ionicons
                name={focused ? 'notifications' : 'notifications-outline'}
                size={22}
                color={focused ? COLORS.darkCharcoal : '#8F959E'}
              />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />

      {/* 5. Admin / Profile */}
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={22}
                color={focused ? COLORS.darkCharcoal : '#8F959E'}
              />
              {focused && <View style={styles.activeDot} />}
            </View>
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.darkCharcoal,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    marginTop: -14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
