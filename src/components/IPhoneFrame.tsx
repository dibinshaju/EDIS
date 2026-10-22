import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useMqtt } from '../context/MqttContext';
import { useSensor } from '../context/SensorContext';

interface IPhoneFrameProps {
  children: React.ReactNode;
}

export const IPhoneFrame: React.FC<IPhoneFrameProps> = ({ children }) => {
  const [isFrameEnabled, setIsFrameEnabled] = useState<boolean>(true);
  const { status: mqttStatus } = useMqtt();
  const { dataSource } = useSensor();

  // If not web, or screen width is mobile sized (< 768px), render native full-screen directly
  const screenWidth = Dimensions.get('window').width;
  const isWebDesktop = Platform.OS === 'web' && screenWidth >= 768;

  if (!isWebDesktop || !isFrameEnabled) {
    return (
      <View style={styles.nativeContainer}>
        {isWebDesktop && !isFrameEnabled && (
          <TouchableOpacity
            style={styles.toggleFloatingBtn}
            onPress={() => setIsFrameEnabled(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="phone-portrait-outline" size={18} color="#FFFFFF" />
            <Text style={styles.toggleBtnText}>Show iPhone Frame</Text>
          </TouchableOpacity>
        )}
        {children}
      </View>
    );
  }

  return (
    <View style={styles.deskWrapper}>
      {/* Top Presentation Bar */}
      <View style={styles.presentationBar}>
        <View style={styles.presentationLeft}>
          <Ionicons name="water" size={20} color={COLORS.tealPrimary} />
          <Text style={styles.presentationTitle}>
            Smart Water Monitor <Text style={styles.presentationSubtitle}>• Academic Project Expo Presentation Mode</Text>
          </Text>
        </View>

        <View style={styles.presentationRight}>
          {/* Status Indicator */}
          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    mqttStatus === 'connected'
                      ? COLORS.success
                      : dataSource === 'demo'
                      ? COLORS.warning
                      : COLORS.danger,
                },
              ]}
            />
            <Text style={styles.statusText}>
              {mqttStatus === 'connected' ? 'Wokwi MQTT Live' : dataSource === 'demo' ? 'Deterministic Demo' : 'Disconnected'}
            </Text>
          </View>

          {/* Toggle Fullscreen / Frame */}
          <TouchableOpacity
            style={styles.frameToggleBtn}
            onPress={() => setIsFrameEnabled(false)}
          >
            <Ionicons name="expand-outline" size={16} color={COLORS.textDark} />
            <Text style={styles.frameToggleText}>Full View</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* iPhone 15 Pro Physical Frame Styling */}
      <View style={styles.iphoneBezel}>
        <View style={styles.screenContainer}>
          {/* Dynamic Island / Notch */}
          <View style={styles.dynamicIslandContainer}>
            <View style={styles.dynamicIsland}>
              <View style={styles.cameraLens} />
              <View style={styles.speakerGrill} />
            </View>
          </View>

          {/* iOS Status Bar */}
          <View style={styles.iosStatusBar}>
            <Text style={styles.statusTime}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <View style={styles.statusIcons}>
              <Ionicons name="cellular" size={12} color="#0F172A" style={{ marginRight: 4 }} />
              <Ionicons name="wifi" size={12} color="#0F172A" style={{ marginRight: 4 }} />
              <Ionicons name="battery-full" size={14} color="#0F172A" />
            </View>
          </View>

          {/* App Body Content */}
          <View style={styles.appBody}>{children}</View>

          {/* iOS Home Indicator Bar */}
          <View style={styles.homeIndicatorContainer}>
            <View style={styles.homeIndicator} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  nativeContainer: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
  },
  toggleFloatingBtn: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.navyDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  toggleBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  deskWrapper: {
    flex: 1,
    minHeight: '100%' as any,
    backgroundColor: '#0A1120', // Dark sleek expo backdrop
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  presentationBar: {
    width: '100%',
    maxWidth: 960,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  presentationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  presentationTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  presentationSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '400',
  },
  presentationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '500',
  },
  frameToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  frameToggleText: {
    color: COLORS.textDark,
    fontSize: 12,
    fontWeight: '600',
  },
  iphoneBezel: {
    width: 395,
    height: 820,
    backgroundColor: '#1E293B',
    borderRadius: 54,
    padding: 11,
    shadowColor: '#00B4D8',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 36,
    borderWidth: 3,
    borderColor: '#334155',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
    borderRadius: 43,
    overflow: 'hidden',
    position: 'relative',
  },
  dynamicIslandContainer: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'none',
  },
  dynamicIsland: {
    width: 108,
    height: 28,
    backgroundColor: '#000000',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 10,
  },
  cameraLens: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  speakerGrill: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#0F172A',
    marginLeft: 6,
  },
  iosStatusBar: {
    height: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 10,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  statusTime: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appBody: {
    flex: 1,
  },
  homeIndicatorContainer: {
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  homeIndicator: {
    width: 134,
    height: 4,
    backgroundColor: '#0F172A',
    borderRadius: 2,
    opacity: 0.4,
  },
});
