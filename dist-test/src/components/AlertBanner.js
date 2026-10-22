"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertBanner = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const theme_1 = require("../constants/theme");
const vector_icons_1 = require("@expo/vector-icons");
const AlertContext_1 = require("../context/AlertContext");
const AlertBanner = () => {
    const { activeAlert, acknowledgeAlert } = (0, AlertContext_1.useAlerts)();
    if (!activeAlert || activeAlert.status !== 'ACTIVE') {
        return null;
    }
    const isCritical = activeAlert.severity === 'CRITICAL';
    const bg = isCritical ? theme_1.COLORS.dangerBg : theme_1.COLORS.warningBg;
    const border = isCritical ? theme_1.COLORS.danger : theme_1.COLORS.warning;
    const textCol = isCritical ? theme_1.COLORS.dangerText : theme_1.COLORS.warningText;
    return (<react_native_1.View style={[styles.container, { backgroundColor: bg, borderColor: border }]}>
      <react_native_1.View style={styles.contentRow}>
        <react_native_1.View style={styles.iconBox}>
          <vector_icons_1.Ionicons name={isCritical ? 'alert-circle' : 'warning'} size={24} color={isCritical ? theme_1.COLORS.danger : theme_1.COLORS.warning}/>
        </react_native_1.View>

        <react_native_1.View style={styles.textContainer}>
          <react_native_1.View style={styles.titleRow}>
            <react_native_1.Text style={[styles.title, { color: textCol }]}>{activeAlert.title}</react_native_1.Text>
            <react_native_1.View style={[styles.badge, { backgroundColor: border }]}>
              <react_native_1.Text style={styles.badgeText}>{activeAlert.severity}</react_native_1.Text>
            </react_native_1.View>
          </react_native_1.View>
          <react_native_1.Text style={styles.explanation} numberOfLines={2}>
            {activeAlert.explanation}
          </react_native_1.Text>
        </react_native_1.View>
      </react_native_1.View>

      <react_native_1.View style={styles.actionRow}>
        <react_native_1.TouchableOpacity style={[styles.ackButton, { backgroundColor: border }]} onPress={() => acknowledgeAlert(activeAlert.id)} activeOpacity={0.8}>
          <vector_icons_1.Ionicons name="volume-mute-outline" size={14} color="#FFFFFF"/>
          <react_native_1.Text style={styles.ackButtonText}>Acknowledge & Silence</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>
    </react_native_1.View>);
};
exports.AlertBanner = AlertBanner;
const styles = react_native_1.StyleSheet.create({
    container: {
        borderRadius: theme_1.RADIUS.md,
        borderWidth: 1.5,
        padding: 12,
        marginHorizontal: theme_1.SPACING.md,
        marginBottom: theme_1.SPACING.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    iconBox: {
        marginTop: 2,
    },
    textContainer: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    title: {
        fontSize: 13,
        fontWeight: '800',
        flex: 1,
        marginRight: 6,
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 6,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    explanation: {
        fontSize: 11,
        color: '#334155',
        lineHeight: 15,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.06)',
        paddingTop: 8,
    },
    ackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: theme_1.RADIUS.sm,
        gap: 4,
    },
    ackButtonText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
});
