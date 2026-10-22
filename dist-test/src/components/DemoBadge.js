"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemoBadge = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const theme_1 = require("../constants/theme");
const vector_icons_1 = require("@expo/vector-icons");
const DemoBadge = ({ label = 'DEMO SIMULATION ACTIVE', isSimulated = true, }) => {
    if (!isSimulated)
        return null;
    return (<react_native_1.View style={styles.container}>
      <vector_icons_1.Ionicons name="flask-outline" size={13} color={theme_1.COLORS.demoBadgeText}/>
      <react_native_1.Text style={styles.text}>{label}</react_native_1.Text>
    </react_native_1.View>);
};
exports.DemoBadge = DemoBadge;
const styles = react_native_1.StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: theme_1.COLORS.demoBadgeBg,
        borderColor: theme_1.COLORS.demoBadgeBorder,
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    text: {
        fontSize: 11,
        fontWeight: '700',
        color: theme_1.COLORS.demoBadgeText,
        letterSpacing: 0.3,
    },
});
