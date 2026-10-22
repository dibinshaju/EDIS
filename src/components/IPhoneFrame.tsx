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

      {/* Device Bezel matching the tablet/device frame in uploaded image */}
      <View style={styles.deviceBezel}>
        <View style={styles.screenContainer}>
          {/* iOS Top Bar */}
          <View style={styles.iosStatusBar}>
            <Text style={styles.statusTime}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <View style={styles.dynamicPill}>
              <View style={styles.dynamicDot} />
              <Text style={styles.dynamicText}>WATER SENSORS</Text>
            </View>
            <View style={styles.statusIcons}>
              <Ionicons name="wifi" size={14} color={COLORS.textPrimary} style={{ marginRight: 6 }} />
              <Ionicons name="battery-full" size={16} color={COLORS.textPrimary} />
            </View>
          </View>

          {/* App Body Content */}
          <View style={styles.appBody}>{children}</View>

          {/* iOS Bottom Home Bar */}
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
    fontSize: 14,
    fontWeight: '800',
  },
  presentationSubtitle: {
    color: '#4B5563',
    fontSize: 13,
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
    fontSize: 11,
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
    fontSize: 11,
    fontWeight: '700',
  },
  // iPhone 18 Pro Crimson Titanium / Deep Red metallic frame
  deviceBezel: {
    width: 420,
    height: 860,
    backgroundColor: COLORS.deviceBezel, // #82101E Deep Crimson
    borderRadius: 50,
    padding: 12,
    shadowColor: '#52060F',
    shadowOffset: { width: 0, height: 26 },
    shadowOpacity: 0.38,
    shadowRadius: 40,
    borderWidth: 3.5,
    borderColor: '#B82234', // Metallic Crimson edge rim
  },
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.canvasBg, // Warm putty grey canvas
    borderRadius: 38,
    overflow: 'hidden',
    position: 'relative',
  },
  iosStatusBar: {
    height: 42,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 8,
    backgroundColor: COLORS.canvasBg,
    zIndex: 10,
  },
  statusTime: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  dynamicPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  dynamicDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentLimeDark,
  },
  dynamicText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appBody: {
    flex: 1,
  },
  homeIndicatorContainer: {
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.canvasBg,
  },
  homeIndicator: {
    width: 120,
    height: 4,
    backgroundColor: COLORS.darkCharcoal,
    borderRadius: 2,
    opacity: 0.35,
  },
});
