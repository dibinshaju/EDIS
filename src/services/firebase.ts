import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import {
  AppUser,
  ManagedUser,
  Invitation,
  AlarmSettings,
  NotificationForward,
  NotificationRecipient,
} from '../types/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDemoFakeKeyWaterGuard2026',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'smart-water-monitor.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'smart-water-monitor',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'smart-water-monitor.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1029384756',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:1029384756:web:9876543210abcdef',
};

export const isLiveFirebaseConfigured = Boolean(
  process.env.EXPO_PUBLIC_FIREBASE_API_KEY &&
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID &&
    !process.env.EXPO_PUBLIC_FIREBASE_API_KEY.includes('Fake')
);

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Default Alarm Settings
export const DEFAULT_ALARM_SETTINGS: AlarmSettings = {
  autoPushEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  soundName: 'buzzer_alarm',
  mismatchThreshold: 1.5,
  persistenceDurationSec: 5,
  highConsumptionThreshold: 8.0,
  updatedAt: Date.now(),
};

/**
 * Fetch user profile from Firestore (checks 'admins' first, then 'users')
 */
export async function getUserProfile(uid: string): Promise<AppUser | null> {
  if (!isLiveFirebaseConfigured) return null;
  try {
    const adminDoc = await getDoc(doc(db, 'admins', uid));
    if (adminDoc.exists()) {
      const data = adminDoc.data();
      return {
        uid,
        email: data.email || '',
        displayName: data.displayName || 'Administrator',
        role: 'ADMIN',
        status: 'ACTIVE',
        fcmToken: data.fcmToken,
        expoPushToken: data.expoPushToken,
        isDemoUser: false,
        createdAt: data.createdAt || Date.now(),
        lastLoginAt: data.lastLoginAt || Date.now(),
      };
    }

    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        uid,
        email: data.email || '',
        displayName: data.displayName || 'Operator',
        role: 'USER',
        adminId: data.adminId,
        status: data.status || 'ACTIVE',
        fcmToken: data.fcmToken,
        expoPushToken: data.expoPushToken,
        isDemoUser: false,
        createdAt: data.createdAt || Date.now(),
        lastLoginAt: data.lastLoginAt || Date.now(),
      };
    }
  } catch (err) {
    console.warn('[Firebase] Error fetching user profile:', err);
  }
  return null;
}

/**
 * Update user push token in Firestore
 */
export async function updateUserPushToken(
  user: AppUser,
  token: string
): Promise<void> {
  if (!isLiveFirebaseConfigured || user.isDemoUser) return;
  try {
    const colName = user.role === 'ADMIN' ? 'admins' : 'users';
    await updateDoc(doc(db, colName, user.uid), {
      expoPushToken: token,
      updatedAt: Date.now(),
    });
  } catch (err) {
    console.warn('[Firebase] Failed to update push token:', err);
  }
}

/**
 * Fetch Alarm Settings for an Admin
 */
export async function getAlarmSettings(adminId: string): Promise<AlarmSettings> {
  if (!isLiveFirebaseConfigured) return DEFAULT_ALARM_SETTINGS;
  try {
    const docSnap = await getDoc(doc(db, 'alarmSettings', adminId));
    if (docSnap.exists()) {
      return docSnap.data() as AlarmSettings;
    }
  } catch (err) {
    console.warn('[Firebase] Failed to fetch alarm settings:', err);
  }
  return DEFAULT_ALARM_SETTINGS;
}

/**
 * Save Alarm Settings for an Admin
 */
export async function saveAlarmSettings(
  adminId: string,
  settings: AlarmSettings
): Promise<void> {
  if (!isLiveFirebaseConfigured) return;
  try {
    await setDoc(doc(db, 'alarmSettings', adminId), {
      ...settings,
      updatedAt: Date.now(),
    });
  } catch (err) {
    console.error('[Firebase] Failed to save alarm settings:', err);
    throw err;
  }
}

/**
 * Get all users managed by an Admin
 */
export async function getManagedUsers(adminId: string): Promise<ManagedUser[]> {
  if (!isLiveFirebaseConfigured) return [];
  try {
    const q = query(
      collection(db, 'users'),
      where('adminId', '==', adminId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as ManagedUser[];
  } catch (err) {
    console.warn('[Firebase] Failed to load managed users:', err);
    return [];
  }
}

/**
 * Invite a user by email
 */
export async function createInvitation(
  adminId: string,
  adminEmail: string,
  inviteEmail: string
): Promise<Invitation> {
  const inviteId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const invitation: Invitation = {
    id: inviteId,
    email: inviteEmail.trim().toLowerCase(),
    adminId,
    adminEmail,
    status: 'PENDING',
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  if (isLiveFirebaseConfigured) {
    await setDoc(doc(db, 'invitations', inviteId), invitation);
  }

  return invitation;
}

/**
 * Toggle user active/inactive status
 */
export async function toggleUserStatus(
  userId: string,
  currentStatus: 'ACTIVE' | 'INACTIVE'
): Promise<'ACTIVE' | 'INACTIVE'> {
  const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  if (isLiveFirebaseConfigured) {
    await updateDoc(doc(db, 'users', userId), {
      status: newStatus,
      updatedAt: Date.now(),
    });
  }
  return newStatus;
}

/**
 * Delete / Remove a user from Admin management
 */
export async function deleteManagedUser(userId: string): Promise<void> {
  if (isLiveFirebaseConfigured) {
    await deleteDoc(doc(db, 'users', userId));
  }
}

/**
 * Record an alarm forward and create recipient records
 */
export async function recordAlarmForward(
  alertId: string,
  adminUser: AppUser,
  recipients: ManagedUser[],
  message?: string
): Promise<string> {
  const forwardId = `fwd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const forwardData: NotificationForward = {
    forwardId,
    alertId,
    adminId: adminUser.uid,
    adminEmail: adminUser.email,
    message: message || 'Urgent: Water leakage detected. Please verify site immediately.',
    severity: 'CRITICAL',
    recipientCount: recipients.length,
    createdAt: Date.now(),
  };

  if (isLiveFirebaseConfigured) {
    await setDoc(doc(db, 'notificationForwards', forwardId), forwardData);
    for (const rec of recipients) {
      const recId = `${forwardId}_${rec.id}`;
      const recData: NotificationRecipient = {
        id: recId,
        forwardId,
        alertId,
        userId: rec.id,
        userEmail: rec.email,
        displayName: rec.displayName,
        status: 'SENT',
        sentAt: Date.now(),
      };
      await setDoc(doc(db, 'notificationRecipients', recId), recData);
    }
  }

  return forwardId;
}

/**
 * Acknowledge an alarm notification by a user
 */
export async function acknowledgeAlarmNotification(
  forwardId: string,
  userId: string
): Promise<void> {
  if (isLiveFirebaseConfigured) {
    const recId = `${forwardId}_${userId}`;
    await updateDoc(doc(db, 'notificationRecipients', recId), {
      status: 'ACKNOWLEDGED',
      acknowledgedAt: Date.now(),
    });
  }
}
