import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../src/constants/theme';
import { useAlerts } from '../../src/context/AlertContext';

export default function TabsLayout() {
  const { activeCount } = useAlerts();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.darkCharcoal,
        tabBarInactiveTintColor: '#8A8D93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderRadius: RADIUS.full,
          height: 54,
          marginHorizontal: 12,
          marginBottom: 10,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 5,
          paddingHorizontal: 6,
          paddingBottom: 6,
          paddingTop: 6,
          borderWidth: 1,
          borderColor: 'rgba(0, 0, 0, 0.05)',
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Monitor',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconBox, focused && styles.tabIconBoxActive]}>
              <Ionicons
                name={focused ? 'pulse' : 'pulse-outline'}
                size={17}
                color={focused ? '#FFFFFF' : String(color)}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="scenarios"
        options={{
          title: 'Scenarios',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconBox, focused && styles.tabIconBoxActive]}>
              <Ionicons
                name={focused ? 'flask' : 'flask-outline'}
                size={17}
                color={focused ? '#FFFFFF' : String(color)}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconBox, focused && styles.tabIconBoxActive]}>
              <Ionicons
                name={focused ? 'bar-chart' : 'bar-chart-outline'}
                size={17}
                color={focused ? '#FFFFFF' : String(color)}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarBadge: activeCount > 0 ? activeCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: COLORS.accentOrange,
            color: '#FFFFFF',
            fontSize: 9,
            fontWeight: '900',
          },
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconBox, focused && styles.tabIconBoxActive]}>
              <Ionicons
                name={focused ? 'alert-circle' : 'alert-circle-outline'}
                size={17}
                color={focused ? '#FFFFFF' : String(color)}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconBox, focused && styles.tabIconBoxActive]}>
              <Ionicons
                name={focused ? 'settings' : 'settings-outline'}
                size={17}
                color={focused ? '#FFFFFF' : String(color)}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconBoxActive: {
    backgroundColor: COLORS.darkCharcoal,
  },
});
