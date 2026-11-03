import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb, verifyUser } from '../lib/firebaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const user = await verifyUser(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required.' });
  }

  const { inviteId } = req.body || {};
  if (!inviteId) {
    return res.status(400).json({ error: 'inviteId is required.' });
  }

  try {
    if (!adminDb) {
      return res.status(200).json({ success: true, message: 'Revoked (demo mode)' });
    }

    const docRef = adminDb.collection('invitations').doc(inviteId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Invitation not found.' });
    }

    const data = docSnap.data();
    if (data?.adminId !== user.uid) {
      return res.status(403).json({ error: 'Forbidden: You can only revoke your own invitations.' });
    }

    await docRef.update({
      status: 'REVOKED',
      revokedAt: Date.now(),
    });

    return res.status(200).json({ success: true, inviteId });
  } catch (err: any) {
    console.error('[RevokeInvitation Error]', err);
    return res.status(500).json({ error: err.message || 'Failed to revoke invitation.' });
  }
}
