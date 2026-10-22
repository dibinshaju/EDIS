import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
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
        tabBarActiveTintColor: '#16181B',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          position: 'absolute',
          bottom: 12,
          left: 16,
          right: 16,
          backgroundColor: '#FFFFFF',
          borderRadius: 28,
          height: 60,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 6,
          borderWidth: 1,
          borderColor: 'rgba(0, 0, 0, 0.04)',
          paddingHorizontal: 8,
          alignItems: 'center',
          justifyContent: 'space-around',
        },
      }}
    >
      {/* 1. Home / Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabItem}>
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={20}
                color={focused ? '#16181B' : '#9CA3AF'}
              />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />

      {/* 2. Timeline / History */}
      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabItem}>
              <Ionicons
                name={focused ? 'reader' : 'reader-outline'}
                size={20}
                color={focused ? '#16181B' : '#9CA3AF'}
              />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />

      {/* 3. Center Floating Black Plus Button [+] (Scenarios Quick Action) */}
      <Tabs.Screen
        name="scenarios"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.centerPlusButton}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </View>
          ),
        }}
      />

      {/* 4. Alerts / Notifications */}
      <Tabs.Screen
        name="alerts"
        options={{
          tabBarBadge: activeCount > 0 ? activeCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: COLORS.danger,
            color: '#FFFFFF',
            fontSize: 9,
            fontWeight: '900',
            top: 4,
          },
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabItem}>
              <Ionicons
                name={focused ? 'notifications' : 'notifications-outline'}
                size={20}
                color={focused ? '#16181B' : '#9CA3AF'}
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
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabItem}>
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={20}
                color={focused ? '#16181B' : '#9CA3AF'}
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
    height: 40,
    width: 40,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#16181B',
    marginTop: 4,
  },
  centerPlusButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#16181B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});
