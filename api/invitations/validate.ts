import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as crypto from 'crypto';
import { adminDb } from '../lib/firebaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { token } = req.body || {};
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ valid: false, error: 'Invitation token is required.' });
  }

  const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

  try {
    if (!adminDb) {
      // In offline/demo mode, accept tokens starting with demo_
      return res.status(200).json({
        valid: true,
        email: 'operator@waterguard.iot',
        adminName: 'Lead Plant Administrator',
        adminEmail: 'admin@waterguard.iot',
        adminId: 'demo-admin-01',
        expiresAt: Date.now() + 86400000,
      });
    }

    const snap = await adminDb
      .collection('invitations')
      .where('tokenHash', '==', tokenHash)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(404).json({ valid: false, error: 'Invalid invitation link or token not found.' });
    }

    const doc = snap.docs[0];
    const data = doc.data();

    if (data.status === 'ACCEPTED') {
      return res.status(400).json({
        valid: false,
        error: 'This invitation has already been accepted. Please sign in directly.',
      });
    }

    if (data.status === 'REVOKED') {
      return res.status(400).json({
        valid: false,
        error: 'This invitation has been revoked by the administrator.',
      });
    }

    if (data.expiresAt && data.expiresAt < Date.now()) {
      return res.status(400).json({
        valid: false,
        error: 'This invitation has expired. Please contact your administrator for a new invite.',
      });
    }

    return res.status(200).json({
      valid: true,
      inviteId: doc.id,
      email: data.email,
      adminName: data.adminName || 'Plant Administrator',
      adminEmail: data.adminEmail,
      adminId: data.adminId,
      expiresAt: data.expiresAt,
    });
  } catch (err: any) {
    console.error('[ValidateInvitation Error]', err);
    return res.status(500).json({ valid: false, error: err.message || 'Validation failed.' });
  }
}
