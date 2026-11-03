import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyUser, adminDb } from '../lib/firebaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const caller = await verifyUser(req.headers.authorization);
  if (!caller) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
  }

  const { pushToken, title, body } = req.body || {};

  try {
    let token = pushToken;
    if (!token && adminDb) {
      const userDoc = await adminDb.collection('users').doc(caller.uid).get();
      if (userDoc.exists) {
        token = userDoc.data()?.pushToken;
      }
    }

    if (token && token.startsWith('ExponentPushToken[')) {
      const resp = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          to: token,
          title: title || 'WaterGuard: Test Notification',
          body: body || 'High-priority acoustic channel verified.',
          sound: 'default',
          priority: 'high',
          channelId: 'waterguard-continuous-alarm',
          data: { isTest: true, timestamp: Date.now() },
        }),
      });
      const data = await resp.json();
      return res.status(200).json({ success: true, delivered: true, data });
    }

    return res.status(200).json({
      success: true,
      delivered: false,
      message: 'No active ExponentPushToken found for target user (web or offline mode).',
    });
  } catch (err: any) {
    console.error('[Test Notification Error]', err);
    return res.status(500).json({ error: err.message || 'Failed to dispatch test notification.' });
  }
}
