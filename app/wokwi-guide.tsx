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
          <Ionicons name="arrow-back" size={20} color={COLORS.navyDark} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Wokwi Virtual ESP32 Guide</Text>
          <Text style={styles.headerSubtitle}>Hardware-in-the-Loop Simulation Setup</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Live MQTT Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <StatusDot status={mqttStatus} size={10} />
              <Text style={styles.statusTitle}>MQTT WebSocket Bridge:</Text>
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
                <Ionicons name="link" size={14} color="#FFFFFF" />
                <Text style={styles.btnPrimaryText}>Connect App to MQTT</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.btnDanger} onPress={disconnect}>
                <Ionicons name="unlink" size={14} color="#FFFFFF" />
                <Text style={styles.btnPrimaryText}>Disconnect MQTT</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => setDataSource(dataSource === 'wokwi' ? 'demo' : 'wokwi')}
            >
              <Text style={styles.btnSecondaryText}>
                Active Source: {dataSource.toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Raw Payload Inspector */}
          {lastRawPayload && (
            <View style={styles.payloadBox}>
              <Text style={styles.payloadTitle}>Latest JSON Telemetry Packet:</Text>
              <Text style={styles.payloadText}>{lastRawPayload}</Text>
            </View>
          )}
        </View>

        {/* Step-by-Step Instructions */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>Quick Setup (8 Steps):</Text>

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
                In Wokwi's "Library Manager" tab, search and add <Text style={styles.codeText}>PubSubClient</Text> and <Text style={styles.codeText}>ArduinoJson</Text>.
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumBox}><Text style={styles.stepNum}>5</Text></View>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>Start Virtual ESP32 Simulation</Text>
              <Text style={styles.stepDesc}>
                Click the Green Play button in Wokwi. Wokwi automatically connects to virtual WiFi ("Wokwi-GUEST").
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumBox}><Text style={styles.stepNum}>6</Text></View>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>Verify Serial Output</Text>
              <Text style={styles.stepDesc}>
                Look at the Wokwi Serial Monitor. You will see:
                <Text style={styles.codeBlock}>
                  {"\n"}[WiFi] Connected to Wokwi-GUEST!
                  {"\n"}[MQTT] Connected to broker.emqx.io:1883
                  {"\n"}[MQTT] Subscribed to water/demo/command
                  {"\n"}[TELEMETRY] Published: inlet=12.5, outlet=12.4
                </Text>
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumBox}><Text style={styles.stepNum}>7</Text></View>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>Confirm Telemetry Reaching App</Text>
              <Text style={styles.stepDesc}>
                Click "Connect App to MQTT" above. Set Active Source to "WOKWI". The dashboard gauges will now update directly from the simulated ESP32!
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumBox}><Text style={styles.stepNum}>8</Text></View>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>Trigger Leak Scenario from App or Potentiometer</Text>
              <Text style={styles.stepDesc}>
                Adjust Potentiometer 1 or 2 in Wokwi, or tap "Leak Demo" in the app. The ESP32 receives the command over MQTT and simulates an immediate flow mismatch!
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
  backBtn: {
    padding: 6,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navyDark,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeGreen: {
    backgroundColor: COLORS.successBg,
  },
  badgeRed: {
    backgroundColor: COLORS.dangerBg,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  textGreen: {
    color: COLORS.successText,
  },
  textRed: {
    color: COLORS.dangerText,
  },
  brokerLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  brokerVal: {
    color: COLORS.textDark,
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
    backgroundColor: COLORS.navyDark,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  btnDanger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.danger,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  btnSecondary: {
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
  },
  btnSecondaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.navyDark,
  },
  payloadBox: {
    backgroundColor: '#0F172A',
    borderRadius: RADIUS.sm,
    padding: 8,
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
    color: '#38BDF8',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  stepsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.xl,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.navyDark,
    marginBottom: 12,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  stepNumBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.navyDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNum: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepContent: {
    flex: 1,
  },
  stepHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  stepDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  linkText: {
    color: COLORS.tealDark,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  codeText: {
    fontFamily: 'monospace',
    color: COLORS.navyDark,
    backgroundColor: COLORS.bgLight,
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  codeBlock: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#15803D',
    backgroundColor: '#F0FDF4',
  },
});
