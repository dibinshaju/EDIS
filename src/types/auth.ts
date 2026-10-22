export type UserRole = 'admin' | 'viewer';

export interface AdminUser {
  uid: string;
  phoneNumber: string; // E.164 format, e.g. +919876543210
  maskedPhone: string; // e.g. +91 98765 •••••
  displayName?: string;
  role: UserRole;
  isDemoUser: boolean;
  createdAt: number;
  lastLoginAt: number;
}

export type AuthProviderMode = 'demo' | 'firebase';

export interface AuthState {
  isAuthenticated: boolean;
  user: AdminUser | null;
  mode: AuthProviderMode;
  isLoading: boolean;
  error: string | null;
}
