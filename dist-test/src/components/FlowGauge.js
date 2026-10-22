"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowGauge = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const react_native_svg_1 = __importStar(require("react-native-svg"));
const theme_1 = require("../constants/theme");
const format_1 = require("../utils/format");
const FlowGauge = ({ label, flowValue, maxFlow = 35.0, color = theme_1.COLORS.tealPrimary, subtitle, }) => {
    const size = 130;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    // Gauge spans 240 degrees (from 150 deg to 390 deg)
    const clampedValue = Math.max(0, Math.min(flowValue, maxFlow));
    const fraction = clampedValue / maxFlow;
    const startAngle = 140 * (Math.PI / 180);
    const endAngle = 400 * (Math.PI / 180);
    const totalSweep = endAngle - startAngle;
    const currentSweep = totalSweep * fraction;
    const currentAngle = startAngle + currentSweep;
    // Compute arc coordinates
    const getArcCoordinates = (angle) => {
        return {
            x: center + radius * Math.cos(angle),
            y: center + radius * Math.sin(angle),
        };
    };
    const startPt = getArcCoordinates(startAngle);
    const endPt = getArcCoordinates(endAngle);
    const currentPt = getArcCoordinates(currentAngle);
    const backgroundArc = `M ${startPt.x} ${startPt.y} A ${radius} ${radius} 0 1 1 ${endPt.x} ${endPt.y}`;
    const largeArcFlag = currentSweep > Math.PI ? 1 : 0;
    const valueArc = `M ${startPt.x} ${startPt.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${currentPt.x} ${currentPt.y}`;
    return (<react_native_1.View style={styles.container}>
      <react_native_1.Text style={styles.label}>{label}</react_native_1.Text>

      <react_native_1.View style={styles.svgWrapper}>
        <react_native_svg_1.default width={size} height={size}>
          {/* Background Track */}
          <react_native_svg_1.Path d={backgroundArc} stroke="#E2E8F0" strokeWidth={strokeWidth} strokeLinecap="round" fill="none"/>

          {/* Active Value Track */}
          {fraction > 0.01 && (<react_native_svg_1.Path d={valueArc} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none"/>)}
        </react_native_svg_1.default>

        {/* Center Text */}
        <react_native_1.View style={styles.centerTextContainer}>
          <react_native_1.Text style={[styles.flowValue, { color }]}>{(0, format_1.formatFlow)(flowValue)}</react_native_1.Text>
          <react_native_1.Text style={styles.flowUnit}>L/min</react_native_1.Text>
        </react_native_1.View>
      </react_native_1.View>

      {subtitle && <react_native_1.Text style={styles.subtitle}>{subtitle}</react_native_1.Text>}
    </react_native_1.View>);
};
exports.FlowGauge = FlowGauge;
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme_1.COLORS.cardBg,
        borderRadius: theme_1.RADIUS.lg,
        padding: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme_1.COLORS.cardBorder,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: theme_1.COLORS.textDark,
        marginBottom: 4,
    },
    svgWrapper: {
        width: 130,
        height: 130,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerTextContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    flowValue: {
        fontSize: 24,
        fontWeight: '800',
    },
    flowUnit: {
        fontSize: 11,
        fontWeight: '600',
        color: theme_1.COLORS.textMuted,
        marginTop: -2,
    },
    subtitle: {
        fontSize: 11,
        color: theme_1.COLORS.textLight,
        marginTop: 2,
        textAlign: 'center',
    },
});
