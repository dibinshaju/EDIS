"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertCard = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const theme_1 = require("../constants/theme");
const vector_icons_1 = require("@expo/vector-icons");
const format_1 = require("../utils/format");
const AlertCard = ({ alert, onAcknowledge, onResolve, }) => {
    const isCritical = alert.severity === 'CRITICAL';
    const isWarning = alert.severity === 'WARNING';
    const isRecovered = alert.category === 'RECOVERED';
    const getStatusColor = () => {
        if (alert.status === 'RESOLVED' || isRecovered)
            return theme_1.COLORS.success;
        if (alert.status === 'ACKNOWLEDGED')
            return theme_1.COLORS.info;
        return isCritical ? theme_1.COLORS.danger : theme_1.COLORS.warning;
    };
    const getIcon = () => {
        if (isRecovered)
            return 'checkmark-circle';
        if (isCritical)
            return 'alert-circle';
        if (isWarning)
            return 'warning';
        return 'information-circle';
    };
    return (<react_native_1.View style={styles.card}>
      {/* Top Header */}
      <react_native_1.View style={styles.header}>
        <react_native_1.View style={styles.iconAndTitle}>
          <vector_icons_1.Ionicons name={getIcon()} size={18} color={getStatusColor()}/>
          <react_native_1.Text style={styles.title} numberOfLines={1}>
            {alert.title}
          </react_native_1.Text>
        </react_native_1.View>
        <react_native_1.View style={[styles.statusPill, { backgroundColor: `${getStatusColor()}20` }]}>
          <react_native_1.Text style={[styles.statusPillText, { color: getStatusColor() }]}>
            {alert.status}
          </react_native_1.Text>
        </react_native_1.View>
      </react_native_1.View>

      {/* Explanation */}
      <react_native_1.Text style={styles.explanation}>{alert.explanation}</react_native_1.Text>

      {/* Sensor Metrics at incident time */}
      <react_native_1.View style={styles.metricGrid}>
        <react_native_1.View style={styles.metricItem}>
          <react_native_1.Text style={styles.metricLabel}>Inlet Flow</react_native_1.Text>
          <react_native_1.Text style={styles.metricValue}>{(0, format_1.formatFlow)(alert.inletFlow)} L/min</react_native_1.Text>
        </react_native_1.View>
        <react_native_1.View style={styles.metricItem}>
          <react_native_1.Text style={styles.metricLabel}>Outlet Flow</react_native_1.Text>
          <react_native_1.Text style={styles.metricValue}>{(0, format_1.formatFlow)(alert.outletFlow)} L/min</react_native_1.Text>
        </react_native_1.View>
        <react_native_1.View style={styles.metricItem}>
          <react_native_1.Text style={styles.metricLabel}>Flow Deficit</react_native_1.Text>
          <react_native_1.Text style={[styles.metricValue, { color: alert.flowDifference > 1 ? theme_1.COLORS.danger : theme_1.COLORS.textDark }]}>
            +{(0, format_1.formatFlow)(alert.flowDifference)} L/min
          </react_native_1.Text>
        </react_native_1.View>
      </react_native_1.View>

      {/* Footer Info */}
      <react_native_1.View style={styles.footer}>
        <react_native_1.View style={styles.timeInfo}>
          <vector_icons_1.Ionicons name="time-outline" size={12} color={theme_1.COLORS.textLight}/>
          <react_native_1.Text style={styles.timeText}>
            {(0, format_1.formatDate)(alert.timestamp)} • {(0, format_1.formatTime)(alert.timestamp)}
          </react_native_1.Text>
        </react_native_1.View>

        <react_native_1.View style={styles.actions}>
          {alert.status === 'ACTIVE' && onAcknowledge && (<react_native_1.TouchableOpacity style={styles.ackBtn} onPress={() => onAcknowledge(alert.id)}>
              <react_native_1.Text style={styles.ackBtnText}>Acknowledge</react_native_1.Text>
            </react_native_1.TouchableOpacity>)}

          {alert.status !== 'RESOLVED' && !isRecovered && onResolve && (<react_native_1.TouchableOpacity style={styles.resolveBtn} onPress={() => onResolve(alert.id)}>
              <react_native_1.Text style={styles.resolveBtnText}>Resolve</react_native_1.Text>
            </react_native_1.TouchableOpacity>)}
        </react_native_1.View>
      </react_native_1.View>
    </react_native_1.View>);
};
exports.AlertCard = AlertCard;
const styles = react_native_1.StyleSheet.create({
    card: {
        backgroundColor: theme_1.COLORS.cardBg,
        borderRadius: theme_1.RADIUS.md,
        padding: theme_1.SPACING.md,
        marginBottom: theme_1.SPACING.sm,
        borderWidth: 1,
        borderColor: theme_1.COLORS.cardBorder,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    iconAndTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    title: {
        fontSize: 13,
        fontWeight: '700',
        color: theme_1.COLORS.textDark,
        flex: 1,
    },
    statusPill: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    statusPillText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    explanation: {
        fontSize: 12,
        color: theme_1.COLORS.textMuted,
        lineHeight: 16,
        marginBottom: 10,
    },
    metricGrid: {
        flexDirection: 'row',
        backgroundColor: theme_1.COLORS.bgLight,
        borderRadius: theme_1.RADIUS.sm,
        padding: 8,
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    metricItem: {
        alignItems: 'center',
    },
    metricLabel: {
        fontSize: 10,
        color: theme_1.COLORS.textLight,
        fontWeight: '600',
    },
    metricValue: {
        fontSize: 12,
        fontWeight: '700',
        color: theme_1.COLORS.textDark,
        marginTop: 2,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 8,
    },
    timeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timeText: {
        fontSize: 10,
        color: theme_1.COLORS.textLight,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    ackBtn: {
        backgroundColor: theme_1.COLORS.navyDark,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    ackBtnText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '600',
    },
    resolveBtn: {
        backgroundColor: theme_1.COLORS.successBg,
        borderColor: theme_1.COLORS.success,
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    resolveBtnText: {
        color: theme_1.COLORS.successText,
        fontSize: 10,
        fontWeight: '600',
    },
});
