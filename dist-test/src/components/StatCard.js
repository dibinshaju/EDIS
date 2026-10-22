"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatCard = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const theme_1 = require("../constants/theme");
const vector_icons_1 = require("@expo/vector-icons");
const StatCard = ({ title, value, unit, subtitle, iconName, iconColor = theme_1.COLORS.tealPrimary, accentColor, isWarning = false, }) => {
    return (<react_native_1.View style={[styles.card, isWarning && styles.warningCard]}>
      <react_native_1.View style={styles.headerRow}>
        <react_native_1.Text style={styles.title}>{title}</react_native_1.Text>
        <react_native_1.View style={[styles.iconBox, { backgroundColor: `${iconColor}15` }]}>
          <vector_icons_1.Ionicons name={iconName} size={18} color={iconColor}/>
        </react_native_1.View>
      </react_native_1.View>

      <react_native_1.View style={styles.valueRow}>
        <react_native_1.Text style={[styles.value, accentColor ? { color: accentColor } : {}]}>
          {value}
        </react_native_1.Text>
        {unit ? <react_native_1.Text style={styles.unit}>{unit}</react_native_1.Text> : null}
      </react_native_1.View>

      {subtitle ? <react_native_1.Text style={styles.subtitle}>{subtitle}</react_native_1.Text> : null}
    </react_native_1.View>);
};
exports.StatCard = StatCard;
const styles = react_native_1.StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: theme_1.COLORS.cardBg,
        borderRadius: theme_1.RADIUS.lg,
        padding: theme_1.SPACING.md,
        borderWidth: 1,
        borderColor: theme_1.COLORS.cardBorder,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    warningCard: {
        borderColor: theme_1.COLORS.danger,
        backgroundColor: '#FFF5F5',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme_1.SPACING.sm,
    },
    title: {
        fontSize: 13,
        fontWeight: '600',
        color: theme_1.COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: theme_1.RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    value: {
        fontSize: 26,
        fontWeight: '800',
        color: theme_1.COLORS.textDark,
    },
    unit: {
        fontSize: 13,
        fontWeight: '600',
        color: theme_1.COLORS.textMuted,
    },
    subtitle: {
        fontSize: 11,
        color: theme_1.COLORS.textLight,
        marginTop: 4,
    },
});
