import * as admin from 'firebase-admin';

// Initialize Firebase Admin once
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    // Replace literal escaped newlines with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    // Fallback default initialization (works with GOOGLE_APPLICATION_CREDENTIALS or emulator)
    try {
      admin.initializeApp();
    } catch (e) {
      console.warn('[FirebaseAdmin] Initialized without credentials (demo/offline mode)');
    }
  }
}

export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminAuth = admin.apps.length ? admin.auth() : null;

/**
 * Extracts and verifies the Firebase ID Token from Authorization header
 */
export async function verifyUser(authHeader?: string): Promise<{ uid: string; email?: string } | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split('Bearer ')[1].trim();
  if (!token) return null;

  if (!adminAuth) {
    // In local evaluation without service account keys, check for demo tokens
    if (token.startsWith('demo-admin')) {
      return { uid: 'demo-admin-01', email: 'admin@waterguard.iot' };
    }
    return null;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
  } catch (err) {
    console.warn('[verifyUser] Token verification failed:', err);
    return null;
  }
}
