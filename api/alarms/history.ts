import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb, verifyUser } from '../lib/firebaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const caller = await verifyUser(req.headers.authorization);
  if (!caller) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
  }

  const { alertId } = req.query || {};

  try {
    if (!adminDb) {
      return res.status(200).json({ forwards: [], recipients: [] });
    }

    let forwardsQuery: any = adminDb.collection('notificationForwards');
    if (alertId && typeof alertId === 'string') {
      forwardsQuery = forwardsQuery.where('alertId', '==', alertId);
    } else {
      forwardsQuery = forwardsQuery.where('adminId', '==', caller.uid).orderBy('createdAt', 'desc').limit(50);
    }

    const forwardsSnap = await forwardsQuery.get();
    const forwards = forwardsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    const forwardIds = forwards.map((f: any) => f.forwardId || f.id);
    let recipients: any[] = [];

    if (forwardIds.length > 0) {
      // Fetch recipients for these forwards
      // Firestore 'in' queries support up to 30 items
      const chunks: string[][] = [];
      for (let i = 0; i < forwardIds.length; i += 30) {
        chunks.push(forwardIds.slice(i, i + 30));
      }

      for (const chunk of chunks) {
        const recSnap = await adminDb
          .collection('notificationRecipients')
          .where('forwardId', 'in', chunk)
          .get();
        recipients.push(...recSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
      }
    }

    return res.status(200).json({
      success: true,
      forwards,
      recipients,
    });
  } catch (err: any) {
    console.error('[Alarm History Error]', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch history.' });
  }
}
