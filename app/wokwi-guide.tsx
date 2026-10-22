import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SPACING } from '../src/constants/theme';
import { useMqtt } from '../src/context/MqttContext';
import { useSensor } from '../src/context/SensorContext';
import { StatusDot } from '../src/components/StatusDot';
import { Ionicons } from '@expo/vector-icons';
import { formatTime } from '../src/utils/format';

export default function WokwiGuideScreen() {
  const router = useRouter();
  const { status: mqttStatus, lastRawPayload, lastMessageTime, connect, disconnect, brokerUrl } = useMqtt();
  const { setDataSource, dataSource } = useSensor();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Wokwi ESP32 Guide</Text>
          <Text style={styles.headerSubtitle}>Hardware Simulation & MQTT Bridge</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Live MQTT Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <StatusDot status={mqttStatus} size={8} />
              <Text style={styles.statusTitle}>MQTT Telemetry Bridge</Text>
            </View>
            <View style={[styles.statusBadge, mqttStatus === 'connected' ? styles.badgeGreen : styles.badgeRed]}>
              <Text style={[styles.statusBadgeText, mqttStatus === 'connected' ? styles.textGreen : styles.textRed]}>
                {mqttStatus.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.brokerLabel}>Broker: <Text style={styles.brokerVal}>{brokerUrl}</Text></Text>
          <Text style={styles.brokerLabel}>Topic: <Text style={styles.brokerVal}>water/demo/telemetry</Text></Text>
          <Text style={styles.brokerLabel}>Last Packet: <Text style={styles.brokerVal}>{lastMessageTime ? formatTime(lastMessageTime) : 'None received yet'}</Text></Text>

          <View style={styles.actionRow}>
            {mqttStatus !== 'connected' ? (
              <TouchableOpacity style={styles.btnPrimary} onPress={connect}>
                <Ionicons name="link" size={13} color="#FFFFFF" />
                <Text style={styles.btnPrimaryText}>Connect Bridge</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.btnDanger} onPress={disconnect}>
                <Ionicons name="unlink" size={13} color="#FFFFFF" />
                <Text style={styles.btnPrimaryText}>Disconnect Bridge</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => setDataSource(dataSource === 'wokwi' ? 'demo' : 'wokwi')}
            >
              <Text style={styles.btnSecondaryText}>
                Source: {dataSource.toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Raw Payload Inspector */}
          {lastRawPayload && (
            <View style={styles.payloadBox}>
              <Text style={styles.payloadTitle}>Telemetry Packet Received</Text>
              <Text style={styles.payloadText}>{lastRawPayload}</Text>
            </View>
          )}
        </View>

        {/* Step-by-Step Instructions */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>Simulation Setup (8 Steps)</Text>

          <View style={styles.stepItem}>
            <View style={styles.stepNumBox}><Text style={styles.stepNum}>1</Text></View>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>Open Wokwi Simulator</Text>
              <Text style={styles.stepDesc}>
                In your browser, visit <Text style={styles.linkText} onPress={() => Linking.openURL('https://wokwi.com')}>https://wokwi.com</Text> and choose "ESP32".
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumBox}><Text style={styles.stepNum}>2</Text></View>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>Copy Firmware (sketch.ino)</Text>
              <Text style={styles.stepDesc}>
                Open the file <Text style={styles.codeText}>wokwi/sketch.ino</Text> generated in this project, and paste its code into the Wokwi editor.
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumBox}><Text style={styles.stepNum}>3</Text></View>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>Copy Circuit Diagram (diagram.json)</Text>
              <Text style={styles.stepDesc}>
                Switch to the "diagram.json" tab in Wokwi, and replace its content with <Text style={styles.codeText}>wokwi/diagram.json</Text>.
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumBox}><Text style={styles.stepNum}>4</Text></View>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>Add Arduino Libraries</Text>
              <Text style={styles.stepDesc}>
                In Wokwi Library Manager, add <Text style={styles.codeText}>PubSubClient</Text> and <Text style={styles.codeText}>ArduinoJson</Text>.
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumBox}><Text style={styles.stepNum}>5</Text></View>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>Start Virtual ESP32 Simulation</Text>
              <Text style={styles.stepDesc}>
                Click the Play button in Wokwi. The ESP32 connects automatically to virtual WiFi.
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumBox}><Text style={styles.stepNum}>6</Text></View>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>Verify Serial Output</Text>
              <Text style={styles.stepDesc}>
                Look at the Wokwi Serial Monitor:
                <Text style={styles.codeBlock}>
                  {"\n"}[WiFi] Connected to Wokwi-GUEST!
                  {"\n"}[MQTT] Connected to broker.emqx.io:1883
                  {"\n"}[TELEMETRY] In: 12.5 L/m | Out: 12.4 L/m | Diff: +0.1
                </Text>
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumBox}><Text style={styles.stepNum}>7</Text></View>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>Confirm Telemetry Reaching App</Text>
              <Text style={styles.stepDesc}>
                Tap "Connect Bridge" above and select WOKWI as active source. The dashboard gauges will now update directly from simulated ESP32.
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumBox}><Text style={styles.stepNum}>8</Text></View>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>Trigger Leak Scenario</Text>
              <Text style={styles.stepDesc}>
                Rotate Potentiometer 1 or 2 in Wokwi, or tap "Leak Incident" in the app. The ESP32 simulates an immediate flow mismatch.
              </Text>
            </View>
          </View>
        </View>
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
  backBtn: {
    padding: 6,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 14,
    paddingBottom: 40,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeGreen: {
    backgroundColor: COLORS.cardSubtle,
  },
  badgeRed: {
    backgroundColor: COLORS.dangerBg,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  textGreen: {
    color: COLORS.successText,
  },
  textRed: {
    color: COLORS.dangerText,
  },
  brokerLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  brokerVal: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.darkCharcoal,
    paddingVertical: 8,
    borderRadius: 14,
  },
  btnDanger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.danger,
    paddingVertical: 8,
    borderRadius: 14,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  btnSecondary: {
    backgroundColor: COLORS.cardSubtle,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    justifyContent: 'center',
  },
  btnSecondaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  payloadBox: {
    backgroundColor: COLORS.darkCharcoal,
    borderRadius: RADIUS.md,
    padding: 10,
    marginTop: 10,
  },
  payloadTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  payloadText: {
    color: COLORS.accentLime,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  stepsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  stepsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  stepNumBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.cardSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNum: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: '800',
  },
  stepContent: {
    flex: 1,
  },
  stepHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  stepDesc: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  linkText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  codeText: {
    fontFamily: 'monospace',
    color: COLORS.textPrimary,
    backgroundColor: COLORS.cardSubtle,
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  codeBlock: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.cardSubtle,
  },
});
