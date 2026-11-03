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

  try {
    if (!adminDb) {
      return res.status(200).json({ invitations: [] });
    }

    const snap = await adminDb
      .collection('invitations')
      .where('adminId', '==', caller.uid)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const invitations = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        email: data.email,
        status: data.status,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
        acceptedAt: data.acceptedAt || null,
        revokedAt: data.revokedAt || null,
      };
    });

    return res.status(200).json({ success: true, invitations });
  } catch (err: any) {
    console.error('[List Invitations Error]', err);
    return res.status(500).json({ error: err.message || 'Failed to list invitations.' });
  }
}
