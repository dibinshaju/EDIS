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
exports.useAuth = exports.AuthProvider = void 0;
const react_1 = __importStar(require("react"));
const format_1 = require("../utils/format");
const DEFAULT_DEMO_ADMIN = {
    uid: 'demo-admin-01',
    phoneNumber: '+919876543210',
    maskedPhone: '+91 98765 •••••',
    displayName: 'Expo Demo Administrator',
    role: 'admin',
    isDemoUser: true,
    createdAt: Date.now() - 86400000,
    lastLoginAt: Date.now(),
};
const AuthContext = (0, react_1.createContext)(undefined);
const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = (0, react_1.useState)({
        isAuthenticated: true, // Default to demo admin for ease during academic expo presentation
        user: DEFAULT_DEMO_ADMIN,
        mode: 'demo',
        isLoading: false,
        error: null,
    });
    const loginDemo = async (phone = '+919876543210') => {
        setAuthState({
            isAuthenticated: true,
            user: {
                uid: 'demo-admin-session',
                phoneNumber: phone,
                maskedPhone: (0, format_1.maskPhoneNumber)(phone),
                displayName: 'Demo Administrator',
                role: 'admin',
                isDemoUser: true,
                createdAt: Date.now(),
                lastLoginAt: Date.now(),
            },
            mode: 'demo',
            isLoading: false,
            error: null,
        });
    };
    const loginFirebaseOtp = async (phone, otp) => {
        // Scaffold for real Firebase Phone Auth
        // In Production: verifies with firebase.auth().confirm(otp)
        if (otp !== '123456') {
            return { success: false, error: 'Invalid verification code. For demo evaluation use 123456.' };
        }
        setAuthState({
            isAuthenticated: true,
            user: {
                uid: `firebase-admin-${Date.now()}`,
                phoneNumber: phone,
                maskedPhone: (0, format_1.maskPhoneNumber)(phone),
                displayName: 'Verified Administrator',
                role: 'admin',
                isDemoUser: false,
                createdAt: Date.now(),
                lastLoginAt: Date.now(),
            },
            mode: 'firebase',
            isLoading: false,
            error: null,
        });
        return { success: true };
    };
    const logout = async () => {
        setAuthState({
            isAuthenticated: false,
            user: null,
            mode: 'demo',
            isLoading: false,
            error: null,
        });
    };
    return (<AuthContext.Provider value={{
            ...authState,
            loginDemo,
            loginFirebaseOtp,
            logout,
            isDemoMode: authState.mode === 'demo' || (authState.user?.isDemoUser ?? true),
        }}>
      {children}
    </AuthContext.Provider>);
};
exports.AuthProvider = AuthProvider;
const useAuth = () => {
    const context = (0, react_1.useContext)(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
exports.useAuth = useAuth;
