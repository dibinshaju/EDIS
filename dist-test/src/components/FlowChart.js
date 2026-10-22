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
exports.FlowChart = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const react_native_svg_1 = __importStar(require("react-native-svg"));
const theme_1 = require("../constants/theme");
const FlowChart = ({ data, height = 160, title = 'Real-Time Flow Telemetry', showLegend = true, }) => {
    const chartWidth = 320;
    const paddingLeft = 32;
    const paddingRight = 16;
    const paddingTop = 16;
    const paddingBottom = 24;
    const graphWidth = chartWidth - paddingLeft - paddingRight;
    const graphHeight = height - paddingTop - paddingBottom;
    // Render recent 20 readings
    const sampleData = data.slice(-20);
    const maxScale = 35.0; // 0 to 35 L/min
    const getY = (val) => {
        const clamped = Math.max(0, Math.min(val, maxScale));
        return paddingTop + graphHeight - (clamped / maxScale) * graphHeight;
    };
    const getX = (index) => {
        if (sampleData.length <= 1)
            return paddingLeft + graphWidth;
        return paddingLeft + (index / (sampleData.length - 1)) * graphWidth;
    };
    // Generate SVG path strings
    let inletPath = '';
    let outletPath = '';
    sampleData.forEach((d, i) => {
        const x = getX(i);
        const yInlet = getY(d.inletFlow);
        const yOutlet = getY(d.outletFlow);
        if (i === 0) {
            inletPath = `M ${x} ${yInlet}`;
            outletPath = `M ${x} ${yOutlet}`;
        }
        else {
            inletPath += ` L ${x} ${yInlet}`;
            outletPath += ` L ${x} ${yOutlet}`;
        }
    });
    return (<react_native_1.View style={styles.card}>
      <react_native_1.View style={styles.headerRow}>
        <react_native_1.Text style={styles.title}>{title}</react_native_1.Text>
        {showLegend && (<react_native_1.View style={styles.legend}>
            <react_native_1.View style={styles.legendItem}>
              <react_native_1.View style={[styles.legendDot, { backgroundColor: theme_1.COLORS.tealPrimary }]}/>
              <react_native_1.Text style={styles.legendText}>Inlet</react_native_1.Text>
            </react_native_1.View>
            <react_native_1.View style={styles.legendItem}>
              <react_native_1.View style={[styles.legendDot, { backgroundColor: '#84CC16' }]}/>
              <react_native_1.Text style={styles.legendText}>Outlet</react_native_1.Text>
            </react_native_1.View>
          </react_native_1.View>)}
      </react_native_1.View>

      <react_native_1.View style={styles.chartWrapper}>
        <react_native_svg_1.default width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`}>
          {/* Horizontal Grid lines */}
          {[0, 10, 20, 30].map((level) => {
            const y = getY(level);
            return (<react_1.default.Fragment key={level}>
                <react_native_svg_1.Line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4"/>
                <react_native_svg_1.Text x={paddingLeft - 6} y={y + 3} fontSize="9" fill="#94A3B8" textAnchor="end" fontWeight="600">
                  {level}
                </react_native_svg_1.Text>
              </react_1.default.Fragment>);
        })}

          {/* Inlet Flow Line */}
          {inletPath !== '' && (<react_native_svg_1.Path d={inletPath} fill="none" stroke={theme_1.COLORS.tealPrimary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>)}

          {/* Outlet Flow Line */}
          {outletPath !== '' && (<react_native_svg_1.Path d={outletPath} fill="none" stroke="#84CC16" strokeWidth="2" strokeDasharray="2 0" strokeLinecap="round" strokeLinejoin="round"/>)}
        </react_native_svg_1.default>
      </react_native_1.View>

      <react_native_1.View style={styles.footerRow}>
        <react_native_1.Text style={styles.footerText}>Flow Rate (L/min) vs Time</react_native_1.Text>
        <react_native_1.Text style={styles.footerText}>{sampleData.length} data points</react_native_1.Text>
      </react_native_1.View>
    </react_native_1.View>);
};
exports.FlowChart = FlowChart;
const styles = react_native_1.StyleSheet.create({
    card: {
        backgroundColor: theme_1.COLORS.cardBg,
        borderRadius: theme_1.RADIUS.lg,
        padding: 14,
        borderWidth: 1,
        borderColor: theme_1.COLORS.cardBorder,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    title: {
        fontSize: 13,
        fontWeight: '700',
        color: theme_1.COLORS.textDark,
    },
    legend: {
        flexDirection: 'row',
        gap: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 11,
        color: theme_1.COLORS.textMuted,
        fontWeight: '600',
    },
    chartWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 4,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    footerText: {
        fontSize: 10,
        color: theme_1.COLORS.textLight,
    },
});
