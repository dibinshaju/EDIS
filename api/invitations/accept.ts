import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as crypto from 'crypto';
import { adminDb, adminAuth, verifyUser } from '../lib/firebaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { token, displayName } = req.body || {};
  if (!token) {
    return res.status(400).json({ error: 'Invitation token is required.' });
  }

  const user = await verifyUser(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Valid Firebase Authentication token required.' });
  }

  const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

  try {
    if (!adminDb) {
      return res.status(200).json({
        success: true,
        user: {
          uid: user.uid,
          email: user.email || 'operator@waterguard.iot',
          displayName: displayName || 'Field Operator',
          role: 'USER',
          adminId: 'demo-admin-01',
          status: 'ACTIVE',
        },
      });
    }

    const snap = await adminDb
      .collection('invitations')
      .where('tokenHash', '==', tokenHash)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(404).json({ error: 'Invitation not found.' });
    }

    const invDoc = snap.docs[0];
    const invData = invDoc.data();

    if (invData.status !== 'PENDING') {
      return res.status(400).json({ error: `Invitation is already ${invData.status}.` });
    }

    if (invData.expiresAt && invData.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'Invitation has expired.' });
    }

    // Email matching verification
    if (user.email && user.email.toLowerCase() !== invData.email.toLowerCase()) {
      return res.status(403).json({
        error: `Account email (${user.email}) does not match the invited address (${invData.email}).`,
      });
    }

    const now = Date.now();

    // 1. Create or update user profile with strictly enforced USER role and adminId
    const userProfile = {
      uid: user.uid,
      email: invData.email,
      displayName: displayName || invData.email.split('@')[0],
      role: 'USER', // STRICT ENFORCEMENT: Public acceptance can NEVER create ADMIN
      adminId: invData.adminId, // Associated inviting admin
      status: 'ACTIVE',
      createdAt: now,
      lastLoginAt: now,
    };

    await adminDb.collection('users').doc(user.uid).set(userProfile, { merge: true });

    // 2. Mark invitation as ACCEPTED
    await invDoc.ref.update({
      status: 'ACCEPTED',
      acceptedAt: now,
      acceptedByUid: user.uid,
    });

    return res.status(200).json({
      success: true,
      user: userProfile,
    });
  } catch (err: any) {
    console.error('[AcceptInvitation Error]', err);
    return res.status(500).json({ error: err.message || 'Failed to accept invitation.' });
  }
}
