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

    setTimeout(() => {
      setIsLoading(false);
      setStep('OTP');
      setCountdown(30);
    }, 500);
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
      if (otp !== '123456') {
        setIsLoading(false);
        setErrorMsg('Invalid evaluation passcode. Enter 123456 for the demo, or use Instant Demo Login.');
        return;
      }
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
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>

        {/* Clean Logo Circle */}
        <View style={styles.logoBox}>
          <Ionicons name="shield-checkmark" size={28} color={COLORS.darkCharcoal} />
        </View>

        <Text style={styles.title}>Smart Water Monitor</Text>
        <Text style={styles.subtitle}>Administrator Authentication</Text>

        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>
            {isRealFirebaseMode
              ? 'PRODUCTION MODE: Live Firebase Phone Auth'
              : 'EXPO DEMO MODE: Academic Evaluation Session'}
          </Text>
        </View>

        {errorMsg && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={14} color={COLORS.danger} />
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
                <Text style={styles.primaryBtnText}>Continue to OTP Verification</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.oneClickBtn}
              onPress={handleOneClickDemo}
              disabled={isLoading}
            >
              <Ionicons name="flash-outline" size={14} color={COLORS.darkCharcoal} />
              <Text style={styles.oneClickBtnText}>Instant Demo Admin Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Enter 6-Digit OTP</Text>
            <Text style={styles.otpSentTo}>
              Target: <Text style={styles.bold}>{maskPhoneNumber(fullPhone)}</Text>
            </Text>

            {!isRealFirebaseMode && (
              <View style={styles.demoOtpHalf}>
                <Text style={styles.demoOtpHalfText}>
                  Evaluation Code: Enter <Text style={styles.bold}>123456</Text>
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
                <Text style={styles.primaryBtnText}>Authorize Administrator</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendRow}>
              {countdown > 0 ? (
                <Text style={styles.resendTimer}>Resend in 0:{countdown < 10 ? `0${countdown}` : countdown}</Text>
              ) : (
                <TouchableOpacity onPress={() => setCountdown(30)}>
                  <Text style={styles.resendLink}>Resend Code</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={() => setStep('PHONE')}>
                <Text style={styles.changePhoneLink}>Change Number</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
              : 'Switch to Firebase Auth Mode'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(30, 33, 37, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  card: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.cardSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  demoBanner: {
    backgroundColor: COLORS.cardSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginBottom: 12,
  },
  demoBannerText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
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
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  countryCodeBox: {
    backgroundColor: COLORS.cardSubtle,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryCodeText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: COLORS.cardSubtle,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  primaryBtn: {
    backgroundColor: COLORS.darkCharcoal,
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  oneClickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.cardSubtle,
    paddingVertical: 10,
    borderRadius: 18,
  },
  oneClickBtnText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  otpSentTo: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  demoOtpHalf: {
    backgroundColor: COLORS.cardSubtle,
    padding: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  demoOtpHalfText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  otpInput: {
    backgroundColor: COLORS.cardSubtle,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
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
    color: COLORS.textMuted,
  },
  resendLink: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  changePhoneLink: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  modeToggle: {
    marginTop: 14,
    paddingVertical: 4,
  },
  modeToggleText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },
  bold: {
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
});
