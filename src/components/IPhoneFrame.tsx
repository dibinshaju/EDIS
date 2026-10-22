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
            <Ionicons name="phone-portrait-outline" size={16} color="#FFFFFF" />
            <Text style={styles.toggleBtnText}>Show Device Frame</Text>
          </TouchableOpacity>
        )}
        {children}
      </View>
    );
  }

  return (
    <View style={styles.deskWrapper}>
      {/* Top Floating Control Bar */}
      <View style={styles.presentationBar}>
        <View style={styles.presentationLeft}>
          <View style={styles.brandCircle}>
            <Ionicons name="water" size={16} color={COLORS.darkCharcoal} />
          </View>
          <Text style={styles.presentationTitle}>
            Smart Water Monitor <Text style={styles.presentationSubtitle}>• System Telemetry UI</Text>
          </Text>
        </View>

        <View style={styles.presentationRight}>
          <View style={styles.statusPill}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    mqttStatus === 'connected'
                      ? COLORS.success
                      : dataSource === 'demo'
                      ? COLORS.accentLimeDark
                      : COLORS.danger,
                },
              ]}
            />
            <Text style={styles.statusText}>
              {mqttStatus === 'connected' ? 'Wokwi Live' : 'Demo Simulation'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.frameToggleBtn}
            onPress={() => setIsFrameEnabled(false)}
          >
            <Ionicons name="expand-outline" size={14} color={COLORS.darkCharcoal} />
            <Text style={styles.frameToggleText}>Full View</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Device Bezel matching dark titanium frame in uploaded image */}
      <View style={styles.deviceBezel}>
        <View style={styles.screenContainer}>
          {/* App Body Content Edge-to-Edge */}
          <View style={styles.appBody}>{children}</View>

          {/* iOS Bottom Floating Home Bar */}
          <View style={styles.homeIndicatorContainer} pointerEvents="none">
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
    backgroundColor: COLORS.canvasBg,
  },
  toggleFloatingBtn: {
    position: 'absolute',
    top: 14,
    right: 18,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkCharcoal,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  toggleBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  deskWrapper: {
    flex: 1,
    minHeight: '100%' as any,
    // EXACT neon acid yellow background from the uploaded photo!
    backgroundColor: COLORS.presentationBackdrop,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  presentationBar: {
    width: '100%',
    maxWidth: 900,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  presentationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presentationTitle: {
    color: COLORS.darkCharcoal,
    fontSize: 16,
    fontWeight: '800',
  },
  presentationSubtitle: {
    color: '#4B5563',
    fontSize: 15,
    fontWeight: '500',
  },
  presentationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: COLORS.darkCharcoal,
    fontSize: 13,
    fontWeight: '700',
  },
  frameToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkCharcoal,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  frameToggleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  // iPhone Titanium Graphite metallic frame matching the uploaded photo
  deviceBezel: {
    width: 412,
    height: 852,
    backgroundColor: COLORS.deviceBezel, // #1C1B22 Dark Titanium Graphite
    borderRadius: 54,
    padding: 10,
    shadowColor: '#17161C',
    shadowOffset: { width: 0, height: 28 },
    shadowOpacity: 0.35,
    shadowRadius: 36,
    borderWidth: 3.5,
    borderColor: COLORS.deviceBezelBorder, // #3A3844 Metallic rim
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#0F1A12',
    borderRadius: 44,
    overflow: 'hidden',
    position: 'relative',
  },
  appBody: {
    flex: 1,
  },
  homeIndicatorContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  homeIndicator: {
    width: 134,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 2,
  },
});
