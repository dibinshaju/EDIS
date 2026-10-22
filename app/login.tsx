import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SPACING } from '../src/constants/theme';
import { useAuth } from '../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { maskPhoneNumber } from '../src/utils/format';

export default function LoginScreen() {
  const router = useRouter();
  const { loginDemo, loginFirebaseOtp } = useAuth();

  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState<string>('9876543210');
  const [countryCode, setCountryCode] = useState<string>('+91');
  const [otp, setOtp] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(30);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRealFirebaseMode, setIsRealFirebaseMode] = useState<boolean>(false);

  // Countdown timer for OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'OTP' && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const fullPhone = `${countryCode}${phone}`;

  const handleRequestOtp = async () => {
    if (phone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);

    // Simulate OTP network dispatch
    setTimeout(() => {
      setIsLoading(false);
      setStep('OTP');
      setCountdown(30);
    }, 600);
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    if (isRealFirebaseMode) {
      const res = await loginFirebaseOtp(fullPhone, otp);
      setIsLoading(false);
      if (res.success) {
        router.back();
      } else {
        setErrorMsg(res.error || 'Verification failed.');
      }
    } else {
      // Demo Mode verification
      await loginDemo(fullPhone);
      setIsLoading(false);
      router.back();
    }
  };

  const handleOneClickDemo = async () => {
    setIsLoading(true);
    await loginDemo('+919876543210');
    setIsLoading(false);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        {/* Close Button */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* Water-drop Logo */}
        <View style={styles.logoBox}>
          <Ionicons name="water" size={36} color={COLORS.tealPrimary} />
        </View>

        <Text style={styles.title}>Smart Water Monitor</Text>
        <Text style={styles.subtitle}>Secure Administrator Login</Text>

        {/* Demo Mode Notice Badge */}
        <View style={styles.demoBanner}>
          <Ionicons name="flask" size={14} color={COLORS.demoBadgeText} />
          <Text style={styles.demoBannerText}>
            {isRealFirebaseMode
              ? 'PRODUCTION MODE: Real Firebase Phone Auth'
              : 'EXPO DEMO MODE: No real SMS sent'}
          </Text>
        </View>

        {errorMsg && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {step === 'PHONE' ? (
          <View style={styles.form}>
            <Text style={styles.label}>Administrator Mobile Number</Text>
            <View style={styles.phoneInputRow}>
              <View style={styles.countryCodeBox}>
                <Text style={styles.countryCodeText}>{countryCode}</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={(t) => {
                  setPhone(t.replace(/[^0-9]/g, ''));
                  setErrorMsg(null);
                }}
                keyboardType="phone-pad"
                placeholder="9876543210"
                maxLength={10}
              />
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleRequestOtp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>Continue to OTP Verification →</Text>
              )}
            </TouchableOpacity>

            {/* Quick 1-Click Demo Login Button */}
            <TouchableOpacity
              style={styles.oneClickBtn}
              onPress={handleOneClickDemo}
              disabled={isLoading}
            >
              <Ionicons name="flash" size={14} color={COLORS.navyDark} />
              <Text style={styles.oneClickBtnText}>Instant Demo Admin Login (1-Click)</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Enter 6-Digit OTP</Text>
            <Text style={styles.otpSentTo}>
              Sent to: <Text style={styles.bold}>{maskPhoneNumber(fullPhone)}</Text>
            </Text>

            {!isRealFirebaseMode && (
              <View style={styles.demoOtpHint}>
                <Text style={styles.demoOtpHintText}>
                  Demo Mode Hint: Enter any 6-digit code (e.g. <Text style={styles.bold}>123456</Text>)
                </Text>
              </View>
            )}

            <TextInput
              style={styles.otpInput}
              value={otp}
              onChangeText={(t) => {
                setOtp(t.replace(/[^0-9]/g, ''));
                setErrorMsg(null);
              }}
              keyboardType="number-pad"
              placeholder="••••••"
              maxLength={6}
              autoFocus
            />

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleVerifyOtp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>Verify & Authorize Admin</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendRow}>
              {countdown > 0 ? (
                <Text style={styles.resendTimer}>Resend OTP in 0:{countdown < 10 ? `0${countdown}` : countdown}</Text>
              ) : (
                <TouchableOpacity onPress={() => setCountdown(30)}>
                  <Text style={styles.resendLink}>Resend OTP Code</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={() => setStep('PHONE')}>
                <Text style={styles.changePhoneLink}>Change Number</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Mode Switcher Toggle */}
        <TouchableOpacity
          style={styles.modeToggle}
          onPress={() => {
            setIsRealFirebaseMode(!isRealFirebaseMode);
            setErrorMsg(null);
          }}
        >
          <Text style={styles.modeToggleText}>
            {isRealFirebaseMode
              ? 'Switch to Offline Expo Demo Mode'
              : 'Switch to Real Firebase Phone Auth Mode'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(11, 31, 58, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: COLORS.tealPrimary,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navyDark,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 10,
  },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.demoBadgeBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.demoBadgeBorder,
    marginBottom: 12,
  },
  demoBannerText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.demoBadgeText,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.dangerBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    width: '100%',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 11,
    color: COLORS.dangerText,
    flex: 1,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  countryCodeBox: {
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryCodeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textDark,
    letterSpacing: 1,
  },
  primaryBtn: {
    backgroundColor: COLORS.navyDark,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  oneClickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: COLORS.tealPrimary,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  oneClickBtnText: {
    color: COLORS.navyDark,
    fontSize: 12,
    fontWeight: '700',
  },
  otpSentTo: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  demoOtpHint: {
    backgroundColor: '#F0FDF4',
    padding: 6,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  demoOtpHintText: {
    fontSize: 10,
    color: '#15803D',
  },
  otpInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: COLORS.tealPrimary,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textDark,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 14,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  resendTimer: {
    fontSize: 10,
    color: COLORS.textLight,
  },
  resendLink: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.tealDark,
  },
  changePhoneLink: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  modeToggle: {
    marginTop: 16,
    paddingVertical: 4,
  },
  modeToggleText: {
    fontSize: 10,
    color: COLORS.textMuted,
    textDecorationLine: 'underline',
  },
  bold: {
    fontWeight: '700',
    color: COLORS.navyDark,
  },
});
