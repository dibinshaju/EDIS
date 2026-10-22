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
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPhoneFrame = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const theme_1 = require("../constants/theme");
const vector_icons_1 = require("@expo/vector-icons");
const MqttContext_1 = require("../context/MqttContext");
const SensorContext_1 = require("../context/SensorContext");
const IPhoneFrame = ({ children }) => {
    const [isFrameEnabled, setIsFrameEnabled] = (0, react_1.useState)(true);
    const { status: mqttStatus } = (0, MqttContext_1.useMqtt)();
    const { dataSource } = (0, SensorContext_1.useSensor)();
    // If not web, or screen width is mobile sized (< 768px), render native full-screen directly
    const screenWidth = react_native_1.Dimensions.get('window').width;
    const isWebDesktop = react_native_1.Platform.OS === 'web' && screenWidth >= 768;
    if (!isWebDesktop || !isFrameEnabled) {
        return (<react_native_1.View style={styles.nativeContainer}>
        {isWebDesktop && !isFrameEnabled && (<react_native_1.TouchableOpacity style={styles.toggleFloatingBtn} onPress={() => setIsFrameEnabled(true)} activeOpacity={0.8}>
            <vector_icons_1.Ionicons name="phone-portrait-outline" size={18} color="#FFFFFF"/>
            <react_native_1.Text style={styles.toggleBtnText}>Show iPhone Frame</react_native_1.Text>
          </react_native_1.TouchableOpacity>)}
        {children}
      </react_native_1.View>);
    }
    return (<react_native_1.View style={styles.deskWrapper}>
      {/* Top Presentation Bar */}
      <react_native_1.View style={styles.presentationBar}>
        <react_native_1.View style={styles.presentationLeft}>
          <vector_icons_1.Ionicons name="water" size={20} color={theme_1.COLORS.tealPrimary}/>
          <react_native_1.Text style={styles.presentationTitle}>
            Smart Water Monitor <react_native_1.Text style={styles.presentationSubtitle}>• Academic Project Expo Presentation Mode</react_native_1.Text>
          </react_native_1.Text>
        </react_native_1.View>

        <react_native_1.View style={styles.presentationRight}>
          {/* Status Indicator */}
          <react_native_1.View style={styles.statusBadge}>
            <react_native_1.View style={[
            styles.statusDot,
            {
                backgroundColor: mqttStatus === 'connected'
                    ? theme_1.COLORS.success
                    : dataSource === 'demo'
                        ? theme_1.COLORS.warning
                        : theme_1.COLORS.danger,
            },
        ]}/>
            <react_native_1.Text style={styles.statusText}>
              {mqttStatus === 'connected' ? 'Wokwi MQTT Live' : dataSource === 'demo' ? 'Deterministic Demo' : 'Disconnected'}
            </react_native_1.Text>
          </react_native_1.View>

          {/* Toggle Fullscreen / Frame */}
          <react_native_1.TouchableOpacity style={styles.frameToggleBtn} onPress={() => setIsFrameEnabled(false)}>
            <vector_icons_1.Ionicons name="expand-outline" size={16} color={theme_1.COLORS.textDark}/>
            <react_native_1.Text style={styles.frameToggleText}>Full View</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>
      </react_native_1.View>

      {/* iPhone 15 Pro Physical Frame Styling */}
      <react_native_1.View style={styles.iphoneBezel}>
        <react_native_1.View style={styles.screenContainer}>
          {/* Dynamic Island / Notch */}
          <react_native_1.View style={styles.dynamicIslandContainer}>
            <react_native_1.View style={styles.dynamicIsland}>
              <react_native_1.View style={styles.cameraLens}/>
              <react_native_1.View style={styles.speakerGrill}/>
            </react_native_1.View>
          </react_native_1.View>

          {/* iOS Status Bar */}
          <react_native_1.View style={styles.iosStatusBar}>
            <react_native_1.Text style={styles.statusTime}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </react_native_1.Text>
            <react_native_1.View style={styles.statusIcons}>
              <vector_icons_1.Ionicons name="cellular" size={12} color="#0F172A" style={{ marginRight: 4 }}/>
              <vector_icons_1.Ionicons name="wifi" size={12} color="#0F172A" style={{ marginRight: 4 }}/>
              <vector_icons_1.Ionicons name="battery-full" size={14} color="#0F172A"/>
            </react_native_1.View>
          </react_native_1.View>

          {/* App Body Content */}
          <react_native_1.View style={styles.appBody}>{children}</react_native_1.View>

          {/* iOS Home Indicator Bar */}
          <react_native_1.View style={styles.homeIndicatorContainer}>
            <react_native_1.View style={styles.homeIndicator}/>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.View>
    </react_native_1.View>);
};
exports.IPhoneFrame = IPhoneFrame;
const styles = react_native_1.StyleSheet.create({
    nativeContainer: {
        flex: 1,
        backgroundColor: theme_1.COLORS.bgLight,
    },
    toggleFloatingBtn: {
        position: 'absolute',
        top: 12,
        right: 16,
        zIndex: 9999,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme_1.COLORS.navyDark,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    toggleBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    deskWrapper: {
        flex: 1,
        minHeight: '100%',
        backgroundColor: '#0A1120', // Dark sleek expo backdrop
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    presentationBar: {
        width: '100%',
        maxWidth: 960,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginBottom: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    presentationLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    presentationTitle: {
        color: '#F8FAFC',
        fontSize: 14,
        fontWeight: '700',
    },
    presentationSubtitle: {
        color: '#94A3B8',
        fontSize: 13,
        fontWeight: '400',
    },
    presentationRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 16,
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        color: '#E2E8F0',
        fontSize: 12,
        fontWeight: '500',
    },
    frameToggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    frameToggleText: {
        color: theme_1.COLORS.textDark,
        fontSize: 12,
        fontWeight: '600',
    },
    iphoneBezel: {
        width: 395,
        height: 820,
        backgroundColor: '#1E293B',
        borderRadius: 54,
        padding: 11,
        shadowColor: '#00B4D8',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.25,
        shadowRadius: 36,
        borderWidth: 3,
        borderColor: '#334155',
    },
    screenContainer: {
        flex: 1,
        backgroundColor: theme_1.COLORS.bgLight,
        borderRadius: 43,
        overflow: 'hidden',
        position: 'relative',
    },
    dynamicIslandContainer: {
        position: 'absolute',
        top: 8,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
        pointerEvents: 'none',
    },
    dynamicIsland: {
        width: 108,
        height: 28,
        backgroundColor: '#000000',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingRight: 10,
    },
    cameraLens: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#1E293B',
        borderWidth: 1.5,
        borderColor: '#38BDF8',
    },
    speakerGrill: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#0F172A',
        marginLeft: 6,
    },
    iosStatusBar: {
        height: 44,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 22,
        paddingTop: 10,
        backgroundColor: 'transparent',
        zIndex: 10,
    },
    statusTime: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0F172A',
    },
    statusIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    appBody: {
        flex: 1,
    },
    homeIndicatorContainer: {
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    homeIndicator: {
        width: 134,
        height: 4,
        backgroundColor: '#0F172A',
        borderRadius: 2,
        opacity: 0.4,
    },
});
