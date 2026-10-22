"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScenarioController = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const SensorContext_1 = require("../context/SensorContext");
const theme_1 = require("../constants/theme");
const vector_icons_1 = require("@expo/vector-icons");
const SCENARIOS = [
    {
        id: 'normal',
        title: '1. Normal Balanced Flow',
        badge: 'NORMAL',
        description: 'Inlet (12.5 L/min) and Outlet (12.3 L/min) are balanced. Steady municipal draw.',
        icon: 'water-outline',
        color: theme_1.COLORS.success,
    },
    {
        id: 'suspected_leak',
        title: '2. Suspected Water Leak',
        badge: 'CRITICAL',
        description: 'Inlet (16.0 L/min) exceeds Outlet (10.8 L/min) by +5.2 L/min loss sustained.',
        icon: 'alert-circle',
        color: theme_1.COLORS.danger,
    },
    {
        id: 'abnormal_consumption',
        title: '3. Abnormal High Consumption',
        badge: 'HIGH FLOW',
        description: 'Continuous flow draws 31.0 L/min exceeding the 25.0 L/min maximum threshold.',
        icon: 'speedometer-outline',
        color: theme_1.COLORS.warning,
    },
    {
        id: 'night_time_flow',
        title: '4. Night-Time Flow',
        badge: 'QUIESCENT',
        description: 'Unbroken flow (4.5 L/min) during quiescent night window (11:00 PM - 5:00 AM).',
        icon: 'moon-outline',
        color: '#8B5CF6',
    },
    {
        id: 'sensor_anomaly',
        title: '5. Sensor Anomaly (Outlet > Inlet)',
        badge: 'DIAGNOSTIC',
        description: 'Outlet (15.2 L/min) > Inlet (9.0 L/min). Reverses flow, checks calibration error.',
        icon: 'build-outline',
        color: theme_1.COLORS.info,
    },
    {
        id: 'recovery',
        title: '6. System Recovery & Normalization',
        badge: 'RECOVERY',
        description: 'Water loss arrested; inlet and outlet equalize back to normal baseline.',
        icon: 'checkmark-done-circle',
        color: theme_1.COLORS.tealPrimary,
    },
];
const ScenarioController = () => {
    const { activeScenario, setScenario, resetSimulator, dataSource, setDataSource } = (0, SensorContext_1.useSensor)();
    return (<react_native_1.View style={styles.container}>
      <react_native_1.View style={styles.header}>
        <react_native_1.View>
          <react_native_1.Text style={styles.heading}>Expo Demo Scenario Controller</react_native_1.Text>
          <react_native_1.Text style={styles.subheading}>
            Select a deterministic scenario to demonstrate system response
          </react_native_1.Text>
        </react_native_1.View>

        <react_native_1.TouchableOpacity style={styles.resetBtn} onPress={resetSimulator}>
          <vector_icons_1.Ionicons name="refresh" size={14} color="#FFFFFF"/>
          <react_native_1.Text style={styles.resetBtnText}>Reset</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>

      {/* Source selector (Demo vs Wokwi MQTT) */}
      <react_native_1.View style={styles.sourceSelector}>
        <react_native_1.TouchableOpacity style={[styles.sourceTab, dataSource === 'demo' && styles.sourceTabActive]} onPress={() => setDataSource('demo')}>
          <vector_icons_1.Ionicons name="flask" size={14} color={dataSource === 'demo' ? theme_1.COLORS.navyDark : theme_1.COLORS.textMuted}/>
          <react_native_1.Text style={[styles.sourceTabText, dataSource === 'demo' && styles.sourceTabTextActive]}>
            Deterministic Demo Simulation
          </react_native_1.Text>
        </react_native_1.TouchableOpacity>

        <react_native_1.TouchableOpacity style={[styles.sourceTab, dataSource === 'wokwi' && styles.sourceTabActive]} onPress={() => setDataSource('wokwi')}>
          <vector_icons_1.Ionicons name="hardware-chip-outline" size={14} color={dataSource === 'wokwi' ? theme_1.COLORS.navyDark : theme_1.COLORS.textMuted}/>
          <react_native_1.Text style={[styles.sourceTabText, dataSource === 'wokwi' && styles.sourceTabTextActive]}>
            Live Wokwi ESP32
          </react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>

      {/* Scenario List */}
      <react_native_1.View style={styles.scenarioList}>
        {SCENARIOS.map((item) => {
            const isActive = activeScenario === item.id;
            return (<react_native_1.TouchableOpacity key={item.id} style={[
                    styles.scenarioCard,
                    isActive && { borderColor: item.color, backgroundColor: `${item.color}08` },
                ]} onPress={() => setScenario(item.id)} activeOpacity={0.8}>
              <react_native_1.View style={styles.scenarioTop}>
                <react_native_1.View style={styles.scenarioTitleRow}>
                  <react_native_1.View style={[styles.iconBox, { backgroundColor: `${item.color}18` }]}>
                    <vector_icons_1.Ionicons name={item.icon} size={16} color={item.color}/>
                  </react_native_1.View>
                  <react_native_1.Text style={[styles.scenarioTitle, isActive && { color: item.color }]}>
                    {item.title}
                  </react_native_1.Text>
                </react_native_1.View>
                <react_native_1.View style={[styles.badge, { backgroundColor: `${item.color}20` }]}>
                  <react_native_1.Text style={[styles.badgeText, { color: item.color }]}>{item.badge}</react_native_1.Text>
                </react_native_1.View>
              </react_native_1.View>

              <react_native_1.Text style={styles.scenarioDesc}>{item.description}</react_native_1.Text>

              {isActive && (<react_native_1.View style={styles.activeBanner}>
                  <vector_icons_1.Ionicons name="radio-button-on" size={12} color={item.color}/>
                  <react_native_1.Text style={[styles.activeBannerText, { color: item.color }]}>
                    Actively Streaming to Telemetry Pipeline
                  </react_native_1.Text>
                </react_native_1.View>)}
            </react_native_1.TouchableOpacity>);
        })}
      </react_native_1.View>
    </react_native_1.View>);
};
exports.ScenarioController = ScenarioController;
const styles = react_native_1.StyleSheet.create({
    container: {
        backgroundColor: theme_1.COLORS.cardBg,
        borderRadius: theme_1.RADIUS.lg,
        padding: theme_1.SPACING.md,
        borderWidth: 1,
        borderColor: theme_1.COLORS.cardBorder,
        marginBottom: theme_1.SPACING.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    heading: {
        fontSize: 14,
        fontWeight: '800',
        color: theme_1.COLORS.textDark,
    },
    subheading: {
        fontSize: 11,
        color: theme_1.COLORS.textMuted,
        marginTop: 2,
    },
    resetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: theme_1.COLORS.navyDark,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: theme_1.RADIUS.sm,
    },
    resetBtnText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    sourceSelector: {
        flexDirection: 'row',
        backgroundColor: theme_1.COLORS.bgLight,
        padding: 3,
        borderRadius: theme_1.RADIUS.md,
        marginBottom: 12,
    },
    sourceTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 7,
        borderRadius: theme_1.RADIUS.sm,
    },
    sourceTabActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    sourceTabText: {
        fontSize: 11,
        fontWeight: '600',
        color: theme_1.COLORS.textMuted,
    },
    sourceTabTextActive: {
        color: theme_1.COLORS.navyDark,
        fontWeight: '700',
    },
    scenarioList: {
        gap: 8,
    },
    scenarioCard: {
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: theme_1.RADIUS.md,
        padding: 10,
        backgroundColor: '#FAFAFA',
    },
    scenarioTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    scenarioTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    iconBox: {
        width: 26,
        height: 26,
        borderRadius: theme_1.RADIUS.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scenarioTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: theme_1.COLORS.textDark,
        flex: 1,
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: '800',
    },
    scenarioDesc: {
        fontSize: 11,
        color: theme_1.COLORS.textMuted,
        lineHeight: 15,
        marginLeft: 34,
    },
    activeBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 6,
        marginLeft: 34,
        paddingTop: 4,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.05)',
    },
    activeBannerText: {
        fontSize: 10,
        fontWeight: '700',
    },
});
