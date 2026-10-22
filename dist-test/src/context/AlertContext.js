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
exports.useAlerts = exports.AlertProvider = void 0;
const react_1 = __importStar(require("react"));
const leakDetection_1 = require("../utils/leakDetection");
const alertDedup_1 = require("../utils/alertDedup");
const sound_1 = require("../utils/sound");
const SensorContext_1 = require("./SensorContext");
const AuthContext_1 = require("./AuthContext");
const AlertContext = (0, react_1.createContext)(undefined);
const AlertProvider = ({ children }) => {
    const { currentReading, thresholds } = (0, SensorContext_1.useSensor)();
    const { user } = (0, AuthContext_1.useAuth)();
    const [alerts, setAlerts] = (0, react_1.useState)([]);
    const [activeAlert, setActiveAlert] = (0, react_1.useState)(null);
    const [diagnosticNotes, setDiagnosticNotes] = (0, react_1.useState)([]);
    const [isBuzzerEnabled, setIsBuzzerEnabled] = (0, react_1.useState)(true);
    const engineRef = (0, react_1.useRef)(new leakDetection_1.LeakDetectionEngine());
    const dedupRef = (0, react_1.useRef)(new alertDedup_1.AlertDeduplicator(30));
    // Process every new reading through the leak detection engine
    (0, react_1.useEffect)(() => {
        if (!currentReading)
            return;
        const evalResult = engineRef.current.processReading(currentReading, thresholds, currentReading.timestamp);
        setDiagnosticNotes(evalResult.diagnosticNotes);
        if (evalResult.hasAlert && evalResult.alertCandidate) {
            const processed = dedupRef.current.processCandidate(evalResult.alertCandidate, currentReading, Date.now());
            if (processed) {
                const { isNew, event } = processed;
                setAlerts((prev) => {
                    const index = prev.findIndex((a) => a.id === event.id);
                    if (index >= 0) {
                        const updated = [...prev];
                        updated[index] = event;
                        return updated;
                    }
                    return [event, ...prev.slice(0, 49)];
                });
                if (event.status === 'ACTIVE') {
                    setActiveAlert(event);
                    // Play buzzer on brand new active alert
                    if (isNew && event.severity === 'CRITICAL' && isBuzzerEnabled) {
                        sound_1.buzzerService.playAlarm();
                    }
                }
            }
        }
        else {
            // If system cleared condition and no alert candidate exists
            if (activeAlert && activeAlert.status === 'ACTIVE') {
                // Condition self-resolved
                const resolved = dedupRef.current.resolveCategory(activeAlert.category);
                if (resolved) {
                    setAlerts((prev) => prev.map((a) => (a.id === resolved.id ? { ...a, status: 'RESOLVED', resolvedAt: Date.now() } : a)));
                }
                setActiveAlert(null);
            }
        }
    }, [currentReading, thresholds, isBuzzerEnabled, activeAlert]);
    const acknowledgeAlert = (0, react_1.useCallback)((alertId) => {
        // Silence audio immediately
        sound_1.buzzerService.stop();
        const ackName = user?.displayName || 'Administrator';
        const acked = dedupRef.current.acknowledgeAlert(alertId, ackName);
        setAlerts((prev) => prev.map((a) => a.id === alertId
            ? { ...a, status: 'ACKNOWLEDGED', acknowledgedAt: Date.now(), acknowledgedBy: ackName }
            : a));
        setActiveAlert((prev) => (prev?.id === alertId ? { ...prev, status: 'ACKNOWLEDGED' } : prev));
    }, [user]);
    const resolveAlert = (0, react_1.useCallback)((alertId) => {
        sound_1.buzzerService.stop();
        setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status: 'RESOLVED', resolvedAt: Date.now() } : a)));
        setActiveAlert((prev) => (prev?.id === alertId ? null : prev));
    }, []);
    const clearAllAlerts = (0, react_1.useCallback)(() => {
        sound_1.buzzerService.stop();
        dedupRef.current.clear();
        engineRef.current.reset();
        setAlerts([]);
        setActiveAlert(null);
    }, []);
    const toggleBuzzer = (0, react_1.useCallback)(() => {
        setIsBuzzerEnabled((prev) => {
            const next = !prev;
            sound_1.buzzerService.setSoundEnabled(next);
            return next;
        });
    }, []);
    const playTestBuzzer = (0, react_1.useCallback)(() => {
        sound_1.buzzerService.playAlarm();
    }, []);
    const triggerDemoAlert = (0, react_1.useCallback)((category = 'SUSPECTED_LEAK') => {
        const now = Date.now();
        const demoEvent = {
            id: `DEMO-${category}-${now}`,
            category,
            severity: category === 'SUSPECTED_LEAK' ? 'CRITICAL' : 'WARNING',
            status: 'ACTIVE',
            title: category === 'SUSPECTED_LEAK'
                ? '[DEMO] Suspected Water Leakage Detected'
                : '[DEMO] Simulated System Alert',
            explanation: 'Manual demonstration alert triggered via Admin Alert Center for expo testing.',
            timestamp: now,
            inletFlow: 18.5,
            outletFlow: 11.2,
            flowDifference: 7.3,
            durationSec: 12,
            isSimulated: true,
            source: 'demo',
            occurrenceCount: 1,
        };
        setAlerts((prev) => [demoEvent, ...prev]);
        setActiveAlert(demoEvent);
        if (isBuzzerEnabled) {
            sound_1.buzzerService.playAlarm();
        }
    }, [isBuzzerEnabled]);
    const activeCount = alerts.filter((a) => a.status === 'ACTIVE').length;
    return (<AlertContext.Provider value={{
            alerts,
            activeAlert,
            activeCount,
            diagnosticNotes,
            isBuzzerEnabled,
            toggleBuzzer,
            playTestBuzzer,
            acknowledgeAlert,
            resolveAlert,
            clearAllAlerts,
            triggerDemoAlert,
        }}>
      {children}
    </AlertContext.Provider>);
};
exports.AlertProvider = AlertProvider;
const useAlerts = () => {
    const context = (0, react_1.useContext)(AlertContext);
    if (!context) {
        throw new Error('useAlerts must be used within an AlertProvider');
    }
    return context;
};
exports.useAlerts = useAlerts;
