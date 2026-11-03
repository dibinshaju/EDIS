export type UserRole = 'ADMIN' | 'USER' | 'admin' | 'viewer';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'ADMIN' | 'USER';
  adminId?: string; // For USER role, references their associated ADMIN
  status?: 'ACTIVE' | 'INACTIVE';
  fcmToken?: string;
  expoPushToken?: string;
  isDemoUser: boolean;
  phoneNumber?: string;
  maskedPhone?: string;
  createdAt: number;
  lastLoginAt: number;
}

// Backward-compatibility alias
export type AdminUser = AppUser;

export interface ManagedUser {
  id: string;
  email: string;
  displayName: string;
  role: 'USER';
  adminId: string;
  status: 'ACTIVE' | 'INACTIVE';
  expoPushToken?: string;
  fcmToken?: string;
  createdAt: number;
  lastLoginAt?: number;
}

export interface Invitation {
  id: string;
  email: string;
  adminId: string;
  adminEmail: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED';
  createdAt: number;
  expiresAt: number;
}

export interface AlarmSettings {
  autoPushEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  soundName: 'buzzer_alarm' | 'industrial_siren' | 'urgent_beep';
  mismatchThreshold: number;
  persistenceDurationSec: number;
  highConsumptionThreshold: number;
  updatedAt: number;
}

export interface NotificationForward {
  forwardId: string;
  alertId: string;
  adminId: string;
  adminEmail: string;
  message?: string;
  severity: 'WARNING' | 'CRITICAL';
  recipientCount: number;
  createdAt: number;
}

export interface NotificationRecipient {
  id: string;
  forwardId: string;
  alertId: string;
  userId: string;
  userEmail: string;
  displayName?: string;
  status: 'SENT' | 'DELIVERED' | 'ACKNOWLEDGED';
  sentAt: number;
  deliveredAt?: number;
  acknowledgedAt?: number;
}

export type AuthProviderMode = 'demo' | 'firebase';

export interface AuthState {
  isAuthenticated: boolean;
  user: AppUser | null;
  mode: AuthProviderMode;
  isLoading: boolean;
  error: string | null;
}

