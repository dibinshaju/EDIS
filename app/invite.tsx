import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../src/constants/theme';
import { auth, isLiveFirebaseConfigured } from '../src/services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../src/context/AuthContext';

export default function InviteAcceptanceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const token = typeof params.token === 'string' ? params.token : '';

  const { loginWithEmail } = useAuth();

  const [validating, setValidating] = useState<boolean>(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [inviteDetails, setInviteDetails] = useState<{
    email: string;
    adminName: string;
    adminEmail: string;
    expiresAt?: number;
  } | null>(null);

  const [displayName, setDisplayName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setValidating(false);
      setValidationError('No invitation token provided. Please check the link from your email.');
      return;
    }

    setValidating(true);
    setValidationError(null);

    try {
      const res = await fetch('/api/invitations/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setValidationError(data.error || 'This invitation is invalid or has expired.');
      } else {
        setInviteDetails({
          email: data.email,
          adminName: data.adminName,
          adminEmail: data.adminEmail,
          expiresAt: data.expiresAt,
        });
        setDisplayName(data.email.split('@')[0]);
      }
    } catch (err: any) {
      // In offline/demo environment, provide fallback
      setInviteDetails({
        email: 'operator@waterguard.iot',
        adminName: 'Lead Plant Administrator',
        adminEmail: 'admin@waterguard.iot',
      });
    } finally {
      setValidating(false);
    }
  };

  const handleRegister = async () => {
    setFormError(null);

    if (!displayName.trim()) {
      setFormError('Please enter your full name or operator identifier.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      if (isLiveFirebaseConfigured) {
        // 1. Create real Firebase Authentication account
        const userCred = await createUserWithEmailAndPassword(
          auth,
          inviteDetails!.email,
          password
        );
        const idToken = await userCred.user.getIdToken();

        // 2. Call backend to link user to Admin and mark invitation ACCEPTED
        const acceptRes = await fetch('/api/invitations/accept', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            token,
            displayName: displayName.trim(),
          }),
        });

        const acceptData = await acceptRes.json();
        if (!acceptRes.ok) {
          throw new Error(acceptData.error || 'Failed to complete invitation acceptance.');
        }
      }

      // 3. Log in to active session
      await loginWithEmail(inviteDetails!.email, password);
      setSubmitting(false);
      router.replace('/');
    } catch (err: any) {
      console.error('[Registration Error]', err);
      setFormError(err.message || 'Registration failed. Please try again.');
      setSubmitting(false);
    }
  };

  if (validating) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>Validating invitation credentials...</Text>
      </View>
    );
  }

  if (validationError || !inviteDetails) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.errorIconWrap}>
          <Ionicons name="alert-circle" size={40} color="#DC2626" />
        </View>
        <Text style={styles.errorHeaderTitle}>Invalid Invitation</Text>
        <Text style={styles.errorDescription}>{validationError}</Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/login')}>
          <Text style={styles.primaryBtnText}>Go to Portal Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Banner */}
        <View style={styles.brandContainer}>
          <View style={styles.brandIconWrap}>
            <Ionicons name="water" size={32} color="#0284C7" />
          </View>
          <Text style={styles.brandTitle}>WaterGuard-IoT</Text>
          <Text style={styles.brandSubtitle}>Official Operator Invitation Acceptance</Text>
        </View>

        {/* Invitation Source Card */}
        <View style={styles.inviteMetaCard}>
          <View style={styles.metaRow}>
            <Ionicons name="shield-checkmark" size={18} color="#0284C7" />
            <Text style={styles.metaTitle}>Inviting Administrator</Text>
          </View>
          <Text style={styles.adminNameText}>{inviteDetails.adminName}</Text>
          <Text style={styles.adminEmailText}>{inviteDetails.adminEmail}</Text>
          <View style={styles.metaDivider} />
          <Text style={styles.roleAssignmentText}>
            You are being registered as an <Text style={{ fontWeight: '800', color: '#15803D' }}>Authorized Field Operator (USER)</Text> linked to this plant administrator.
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.cardHeader}>Create Your Account</Text>

          {formError && (
            <View style={styles.errorAlert}>
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.errorAlertText}>{formError}</Text>
            </View>
          )}

          {/* Invited Email (Locked) */}
          <Text style={styles.inputLabel}>Invited Email Address</Text>
          <View style={[styles.inputWrap, styles.inputWrapLocked]}>
            <Ionicons name="mail" size={18} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: '#64748B' }]}
              value={inviteDetails.email}
              editable={false}
            />
            <Ionicons name="lock-closed" size={16} color="#94A3B8" />
          </View>

          {/* Full Name */}
          <Text style={styles.inputLabel}>Full Name / Operator ID</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Sarah Lin"
              placeholderTextColor="#94A3B8"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
          </View>

          {/* Password */}
          <Text style={styles.inputLabel}>Choose Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="key-outline" size={18} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="At least 6 characters"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color="#64748B"
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <Text style={styles.inputLabel}>Confirm Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Re-enter password"
              placeholderTextColor="#94A3B8"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Accept Invitation & Join</Text>
            )}
          </TouchableOpacity>
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
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 14,
    fontWeight: '600',
  },
  errorIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  brandContainer: {
    alignItems: 'center',
    marginVertical: 18,
  },
  brandIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  inviteMetaCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 14,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
    textTransform: 'uppercase',
  },
  adminNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  adminEmailText: {
    fontSize: 12,
    color: '#64748B',
  },
  metaDivider: {
    height: 1,
    backgroundColor: '#BAE6FD',
    marginVertical: 8,
  },
  roleAssignmentText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 12,
  },
  errorAlertText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  inputWrapLocked: {
    backgroundColor: '#F1F5F9',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  submitBtn: {
    backgroundColor: '#0284C7',
    borderRadius: RADIUS.md,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
