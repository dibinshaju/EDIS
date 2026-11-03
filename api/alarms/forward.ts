import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as crypto from 'crypto';
import { adminDb, verifyUser } from '../lib/firebaseAdmin';

interface ForwardRequestBody {
  alertId: string;
  alertTitle: string;
  alertMessage: string;
  recipientUserIds: string[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const caller = await verifyUser(req.headers.authorization);
  if (!caller) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required.' });
  }

  const { alertId, alertTitle, alertMessage, recipientUserIds } = (req.body || {}) as ForwardRequestBody;

  if (!alertId || !recipientUserIds || !Array.isArray(recipientUserIds) || recipientUserIds.length === 0) {
    return res.status(400).json({ error: 'Invalid parameters: alertId and non-empty recipientUserIds required.' });
  }

  const now = Date.now();
  const forwardId = `fwd_${now}_${crypto.randomBytes(4).toString('hex')}`;

  try {
    const recipientsData: Array<{
      userId: string;
      email: string;
      displayName: string;
      pushToken?: string;
    }> = [];

    if (adminDb) {
      // Fetch target users
      for (const userId of recipientUserIds) {
        const userDoc = await adminDb.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const u = userDoc.data() || {};
          recipientsData.push({
            userId,
            email: u.email || '',
            displayName: u.displayName || u.email || 'User',
            pushToken: u.pushToken,
          });
        }
      }
    } else {
      // Offline / fallback mock mode
      for (const userId of recipientUserIds) {
        recipientsData.push({
          userId,
          email: `${userId}@waterguard.iot`,
          displayName: `User ${userId}`,
        });
      }
    }

    if (recipientsData.length === 0) {
      return res.status(404).json({ error: 'No matching recipient users found.' });
    }

    // 1. Dispatch Expo Push Notifications with Continuous Buzzer Channel
    const pushMessages: any[] = [];
    for (const r of recipientsData) {
      if (r.pushToken && r.pushToken.startsWith('ExponentPushToken[')) {
        pushMessages.push({
          to: r.pushToken,
          sound: 'default',
          title: `EMERGENCY: ${alertTitle || 'Water Leakage Alert'}`,
          body: alertMessage || 'A continuous water leakage alarm has been forwarded to your device by Admin.',
          priority: 'high',
          channelId: 'waterguard-continuous-alarm',
          data: {
            alertId,
            forwardId,
            continuous: true,
            type: 'CRITICAL_LEAK_ALARM',
            timestamp: now,
          },
        });
      }
    }

    if (pushMessages.length > 0) {
      try {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(pushMessages),
        });
      } catch (pushErr) {
        console.warn('[Push Notification Dispatch Warning]', pushErr);
      }
    }

    // 2. Persist forward audit and individual recipient delivery records in Firestore
    if (adminDb) {
      const batch = adminDb.batch();

      // Parent forward doc
      const forwardRef = adminDb.collection('notificationForwards').doc(forwardId);
      batch.set(forwardRef, {
        forwardId,
        alertId,
        alertTitle: alertTitle || 'Water Leakage Alert',
        alertMessage: alertMessage || '',
        adminId: caller.uid,
        adminEmail: caller.email || 'admin@waterguard.iot',
        recipientCount: recipientsData.length,
        createdAt: now,
        status: 'DISPATCHED',
      });

      // Individual recipient audit entries
      for (const r of recipientsData) {
        const recipientDocRef = adminDb.collection('notificationRecipients').doc(`${forwardId}_${r.userId}`);
        batch.set(recipientDocRef, {
          forwardId,
          alertId,
          userId: r.userId,
          email: r.email,
          displayName: r.displayName,
          hasPushToken: Boolean(r.pushToken),
          status: 'DELIVERED',
          deliveredAt: now,
          acknowledgedAt: null,
          stoppedAt: null,
          updatedAt: now,
        });

        // Initialize device alarm state for continuous ringing tracking
        const deviceStateRef = adminDb.collection('deviceAlarmStates').doc(`${alertId}_${r.userId}`);
        batch.set(deviceStateRef, {
          alertId,
          forwardId,
          userId: r.userId,
          userEmail: r.email,
          isRinging: true,
          status: 'RINGING',
          startedAt: now,
          stoppedAt: null,
          acknowledgedAt: null,
        }, { merge: true });
      }

      await batch.commit();
    }

    return res.status(200).json({
      success: true,
      forwardId,
      alertId,
      recipientCount: recipientsData.length,
      pushDispatchedCount: pushMessages.length,
      timestamp: now,
    });
  } catch (err: any) {
    console.error('[Alarm Forwarding Error]', err);
    return res.status(500).json({ error: err.message || 'Failed to forward alarm.' });
  }
}
