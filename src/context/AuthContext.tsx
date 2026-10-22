import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser, AuthProviderMode, AuthState } from '../types/auth';
import { maskPhoneNumber } from '../utils/format';

interface AuthContextType extends AuthState {
  loginDemo: (phone?: string) => Promise<void>;
  loginFirebaseOtp: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isDemoMode: boolean;
}

const DEFAULT_DEMO_ADMIN: AdminUser = {
  uid: 'demo-admin-01',
  phoneNumber: '+919876543210',
  maskedPhone: '+91 98765 •••••',
  displayName: 'Expo Demo Administrator',
  role: 'admin',
  isDemoUser: true,
  createdAt: Date.now() - 86400000,
  lastLoginAt: Date.now(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: true, // Default to demo admin for ease during academic expo presentation
    user: DEFAULT_DEMO_ADMIN,
    mode: 'demo',
    isLoading: false,
    error: null,
  });

  const loginDemo = async (phone: string = '+919876543210') => {
    setAuthState({
      isAuthenticated: true,
      user: {
        uid: 'demo-admin-session',
        phoneNumber: phone,
        maskedPhone: maskPhoneNumber(phone),
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

  const loginFirebaseOtp = async (phone: string, otp: string) => {
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
        maskedPhone: maskPhoneNumber(phone),
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

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        loginDemo,
        loginFirebaseOtp,
        logout,
        isDemoMode: authState.mode === 'demo' || (authState.user?.isDemoUser ?? true),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
