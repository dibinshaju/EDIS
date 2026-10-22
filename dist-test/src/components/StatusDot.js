"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusDot = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const theme_1 = require("../constants/theme");
const StatusDot = ({ status, size = 10 }) => {
    const getColor = () => {
        switch (status) {
            case 'connected':
                return theme_1.COLORS.success;
            case 'connecting':
                return theme_1.COLORS.warning;
            case 'error':
            case 'disconnected':
            default:
                return theme_1.COLORS.danger;
        }
    };
    return (<react_native_1.View style={[styles.outer, { width: size + 6, height: size + 6, borderRadius: (size + 6) / 2 }]}>
      <react_native_1.View style={[
            styles.inner,
            {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: getColor(),
            },
        ]}/>
    </react_native_1.View>);
};
exports.StatusDot = StatusDot;
const styles = react_native_1.StyleSheet.create({
    outer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    inner: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
});
