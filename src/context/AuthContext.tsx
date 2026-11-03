import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUser, AuthProviderMode, AuthState } from '../types/auth';
import {
  auth,
  isLiveFirebaseConfigured,
  getUserProfile,
  db,
} from '../services/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { registerForPushNotificationsAsync } from '../services/notifications';

interface AuthContextType extends AuthState {
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerWithEmail: (
    email: string,
    pass: string,
    displayName: string,
    role?: 'ADMIN' | 'USER'
  ) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  loginDemoAdmin: () => Promise<void>;
  loginDemoUser: () => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: 'ADMIN' | 'USER') => void;
  isDemoMode: boolean;
  isAdmin: boolean;
}

export const DEMO_ADMIN: AppUser = {
  uid: 'demo-admin-01',
  email: 'admin@waterguard.iot',
  displayName: 'Lead Plant Administrator',
  role: 'ADMIN',
  status: 'ACTIVE',
  isDemoUser: true,
  createdAt: Date.now() - 86400000 * 7,
  lastLoginAt: Date.now(),
};

export const DEMO_USER: AppUser = {
  uid: 'demo-user-01',
  email: 'operator@waterguard.iot',
  displayName: 'Field Operator (User)',
  role: 'USER',
  adminId: 'demo-admin-01',
  status: 'ACTIVE',
  isDemoUser: true,
  createdAt: Date.now() - 86400000 * 3,
  lastLoginAt: Date.now(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: true,
    user: DEMO_ADMIN, // Default to demo admin for seamless evaluation
    mode: 'demo',
    isLoading: false,
    error: null,
  });

  // Listen to Firebase auth state changes if configured
  useEffect(() => {
    if (!isLiveFirebaseConfigured) return;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        setAuthState((prev) => ({ ...prev, isLoading: true }));
        const profile = await getUserProfile(fbUser.uid);
        const resolvedUser: AppUser = profile || {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Operator',
          role: 'USER', // Default fallback role
          status: 'ACTIVE',
          isDemoUser: false,
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
        };

        setAuthState({
          isAuthenticated: true,
          user: resolvedUser,
          mode: 'firebase',
          isLoading: false,
          error: null,
        });

        // Register push token for real device
        registerForPushNotificationsAsync(resolvedUser).catch(console.warn);
      } else {
        // If not authenticated in live Firebase and wasn't manually in demo mode
        if (authState.mode === 'firebase') {
          setAuthState({
            isAuthenticated: false,
            user: null,
            mode: 'firebase',
            isLoading: false,
            error: null,
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    const cleanEmail = email.trim().toLowerCase();

    // Check demo credentials first for fast access
    if (cleanEmail === 'admin@waterguard.iot' && pass === 'Admin123!') {
      setAuthState({
        isAuthenticated: true,
        user: DEMO_ADMIN,
        mode: 'demo',
        isLoading: false,
        error: null,
      });
      return { success: true };
    }

    if (cleanEmail === 'operator@waterguard.iot' && pass === 'User123!') {
      setAuthState({
        isAuthenticated: true,
        user: DEMO_USER,
        mode: 'demo',
        isLoading: false,
        error: null,
      });
      return { success: true };
    }

    if (!isLiveFirebaseConfigured) {
      // In offline mode without live Firebase credentials, provide friendly fallback
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Live Firebase credentials not active. Use Instant Demo Login below.',
      }));
      return {
        success: false,
        error: 'Live Firebase credentials not configured. Please use Demo Admin or Demo User login.',
      };
    }

    try {
      const userCred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const profile = await getUserProfile(userCred.user.uid);
      const user: AppUser = profile || {
        uid: userCred.user.uid,
        email: userCred.user.email || cleanEmail,
        displayName: userCred.user.displayName || cleanEmail.split('@')[0],
        role: 'USER',
        status: 'ACTIVE',
        isDemoUser: false,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      };

      setAuthState({
        isAuthenticated: true,
        user,
        mode: 'firebase',
        isLoading: false,
        error: null,
      });

      registerForPushNotificationsAsync(user).catch(console.warn);
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Failed to sign in. Please check your credentials.';
      setAuthState((prev) => ({ ...prev, isLoading: false, error: msg }));
      return { success: false, error: msg };
    }
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    displayName: string,
    role: 'ADMIN' | 'USER' = 'USER'
  ): Promise<{ success: boolean; error?: string }> => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    const cleanEmail = email.trim().toLowerCase();

    if (!isLiveFirebaseConfigured) {
      const demoNewUser: AppUser = {
        uid: `demo-user-${Date.now()}`,
        email: cleanEmail,
        displayName: displayName || cleanEmail.split('@')[0],
        role,
        status: 'ACTIVE',
        isDemoUser: true,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      };
      setAuthState({
        isAuthenticated: true,
        user: demoNewUser,
        mode: 'demo',
        isLoading: false,
        error: null,
      });
      return { success: true };
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const uid = userCred.user.uid;
      const col = role === 'ADMIN' ? 'admins' : 'users';

      await setDoc(doc(db, col, uid), {
        uid,
        email: cleanEmail,
        displayName,
        role,
        status: 'ACTIVE',
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      });

      const user: AppUser = {
        uid,
        email: cleanEmail,
        displayName,
        role,
        status: 'ACTIVE',
        isDemoUser: false,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      };

      setAuthState({
        isAuthenticated: true,
        user,
        mode: 'firebase',
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Registration failed.';
      setAuthState((prev) => ({ ...prev, isLoading: false, error: msg }));
      return { success: false, error: msg };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your email address.' };
    }

    if (!isLiveFirebaseConfigured) {
      return {
        success: true,
        error: undefined,
      };
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send password reset email.' };
    }
  };

  const loginDemoAdmin = async () => {
    setAuthState({
      isAuthenticated: true,
      user: { ...DEMO_ADMIN, lastLoginAt: Date.now() },
      mode: 'demo',
      isLoading: false,
      error: null,
    });
  };

  const loginDemoUser = async () => {
    setAuthState({
      isAuthenticated: true,
      user: { ...DEMO_USER, lastLoginAt: Date.now() },
      mode: 'demo',
      isLoading: false,
      error: null,
    });
  };

  const switchRole = (role: 'ADMIN' | 'USER') => {
    if (role === 'ADMIN') {
      loginDemoAdmin();
    } else {
      loginDemoUser();
    }
  };

  const logout = async () => {
    if (isLiveFirebaseConfigured && auth.currentUser) {
      try {
        await fbSignOut(auth);
      } catch (err) {
        console.warn('Error signing out of Firebase:', err);
      }
    }
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
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        loginDemoAdmin,
        loginDemoUser,
        logout,
        switchRole,
        isDemoMode: authState.mode === 'demo' || (authState.user?.isDemoUser ?? true),
        isAdmin: authState.user?.role === 'ADMIN',
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
