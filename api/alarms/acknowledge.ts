import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb } from '../lib/firebaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { alertId, userId, userEmail, displayName } = req.body || {};

  if (!alertId || !userId) {
    return res.status(400).json({ error: 'Missing alertId or userId.' });
  }

  const now = Date.now();

  try {
    if (adminDb) {
      // 1. Update device state for this specific user device
      const deviceStateRef = adminDb.collection('deviceAlarmStates').doc(`${alertId}_${userId}`);
      await deviceStateRef.set({
        alertId,
        userId,
        userEmail: userEmail || '',
        displayName: displayName || userEmail || 'User',
        isRinging: false,
        status: 'ACKNOWLEDGED',
        acknowledgedAt: now,
        updatedAt: now,
      }, { merge: true });

      // 2. Find any notificationRecipients records for this alertId & userId
      const recipientMatches = await adminDb
        .collection('notificationRecipients')
        .where('alertId', '==', alertId)
        .where('userId', '==', userId)
        .get();

      if (!recipientMatches.empty) {
        const batch = adminDb.batch();
        recipientMatches.docs.forEach((doc) => {
          batch.update(doc.ref, {
            status: 'ACKNOWLEDGED',
            acknowledgedAt: now,
            updatedAt: now,
          });
        });
        await batch.commit();
      }
    }

    return res.status(200).json({
      success: true,
      alertId,
      userId,
      acknowledgedAt: now,
    });
  } catch (err: any) {
    console.error('[Alarm Acknowledge Error]', err);
    return res.status(500).json({ error: err.message || 'Failed to record acknowledgement.' });
  }
}
