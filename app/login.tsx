import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SPACING } from '../src/constants/theme';
import { useAuth } from '../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const {
    loginWithEmail,
    registerWithEmail,
    resetPassword,
    loginDemoAdmin,
    loginDemoUser,
    isLoading,
  } = useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState<string>('admin@waterguard.iot');
  const [password, setPassword] = useState<string>('Admin123!');
  const [displayName, setDisplayName] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'USER'>('USER');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const safeBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);

    if (mode === 'LOGIN') {
      const res = await loginWithEmail(cleanEmail, password);
      setSubmitting(false);
      if (res.success) {
        safeBack();
      } else {
        setErrorMessage(res.error || 'Authentication failed.');
      }
    } else {
      const res = await registerWithEmail(
        cleanEmail,
        password,
        displayName.trim() || cleanEmail.split('@')[0],
        selectedRole
      );
      setSubmitting(false);
      if (res.success) {
        safeBack();
      } else {
        setErrorMessage(res.error || 'Registration failed.');
      }
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Enter your email above, then tap "Forgot Password".');
      return;
    }
    setSubmitting(true);
    const res = await resetPassword(cleanEmail);
    setSubmitting(false);
    if (res.success) {
      setSuccessMessage('Password reset link sent to your email.');
      setErrorMessage(null);
    } else {
      setErrorMessage(res.error || 'Could not send reset email.');
    }
  };

  const handleDemoAdmin = async () => {
    setSubmitting(true);
    await loginDemoAdmin();
    setSubmitting(false);
    safeBack();
  };

  const handleDemoUser = async () => {
    setSubmitting(true);
    await loginDemoUser();
    setSubmitting(false);
    safeBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={safeBack}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Portal Sign In</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Brand Banner */}
        <View style={styles.brandContainer}>
          <View style={styles.brandIconWrap}>
            <Ionicons name="shield-checkmark" size={32} color="#0284C7" />
          </View>
          <Text style={styles.brandTitle}>WaterGuard-IoT</Text>
          <Text style={styles.brandSubtitle}>Industrial Leakage & Telemetry Control</Text>
        </View>

        {/* Auth Mode Toggle */}
        <View style={styles.tabToggle}>
          <TouchableOpacity
            style={[styles.tabButton, mode === 'LOGIN' && styles.tabButtonActive]}
            onPress={() => {
              setMode('LOGIN');
              setErrorMessage(null);
            }}
          >
            <Text style={[styles.tabButtonText, mode === 'LOGIN' && styles.tabButtonTextActive]}>
              Sign In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, mode === 'REGISTER' && styles.tabButtonActive]}
            onPress={() => {
              setMode('REGISTER');
              setErrorMessage(null);
            }}
          >
            <Text style={[styles.tabButtonText, mode === 'REGISTER' && styles.tabButtonTextActive]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Feedback Messages */}
        {errorMessage && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {successMessage && (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#16A34A" />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        {/* Form Inputs */}
        <View style={styles.formCard}>
          {mode === 'REGISTER' && (
            <>
              <Text style={styles.inputLabel}>Full Name / Operator ID</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. John Doe"
                  placeholderTextColor="#94A3B8"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                />
              </View>

              <Text style={styles.inputLabel}>Account Role</Text>
              <View style={styles.rolePickerRow}>
                <TouchableOpacity
                  style={[styles.roleChip, selectedRole === 'USER' && styles.roleChipActive]}
                  onPress={() => setSelectedRole('USER')}
                >
                  <Ionicons
                    name="person"
                    size={16}
                    color={selectedRole === 'USER' ? '#FFFFFF' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.roleChipText,
                      selectedRole === 'USER' && styles.roleChipTextActive,
                    ]}
                  >
                    User (Operator)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleChip, selectedRole === 'ADMIN' && styles.roleChipActive]}
                  onPress={() => setSelectedRole('ADMIN')}
                >
                  <Ionicons
                    name="shield"
                    size={16}
                    color={selectedRole === 'ADMIN' ? '#FFFFFF' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.roleChipText,
                      selectedRole === 'ADMIN' && styles.roleChipTextActive,
                    ]}
                  >
                    Administrator
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <Text style={styles.inputLabel}>Email Address</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="operator@plant.com"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIconBtn}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color="#64748B"
              />
            </TouchableOpacity>
          </View>

          {mode === 'LOGIN' && (
            <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword}>
              <Text style={styles.forgotBtnText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>
                {mode === 'LOGIN' ? 'Sign In to Portal' : 'Register Account'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Demo Instant Login Access for Evaluation */}
        <View style={styles.demoSection}>
          <View style={styles.demoDividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ONE-TAP DEMO ACCESS</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.demoButtonsRow}>
            <TouchableOpacity style={styles.demoAdminBtn} onPress={handleDemoAdmin}>
              <Ionicons name="shield-checkmark" size={18} color="#0369A1" />
              <View>
                <Text style={styles.demoBtnTitle}>Instant Admin Demo</Text>
                <Text style={styles.demoBtnSub}>Full management & alarm forward</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.demoUserBtn} onPress={handleDemoUser}>
              <Ionicons name="person" size={18} color="#15803D" />
              <View>
                <Text style={styles.demoBtnTitle}>Instant User Demo</Text>
                <Text style={styles.demoBtnSub}>Standard operator interface</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  brandContainer: {
    alignItems: 'center',
    marginVertical: 18,
  },
  brandIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  successText: {
    fontSize: 13,
    color: '#16A34A',
    flex: 1,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  eyeIconBtn: {
    padding: 6,
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  roleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  roleChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  roleChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotBtnText: {
    fontSize: 13,
    color: '#0284C7',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#0284C7',
    borderRadius: RADIUS.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  demoSection: {
    marginTop: 24,
  },
  demoDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginHorizontal: 10,
    letterSpacing: 0.8,
  },
  demoButtonsRow: {
    gap: 10,
  },
  demoAdminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: RADIUS.md,
    padding: 14,
  },
  demoUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: RADIUS.md,
    padding: 14,
  },
  demoBtnTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  demoBtnSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
