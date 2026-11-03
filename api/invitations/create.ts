import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as crypto from 'crypto';
import { adminDb, verifyUser } from '../lib/firebaseAdmin';
import { sendInvitationEmail } from '../lib/resend';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const user = await verifyUser(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required.' });
  }

  const { email, adminName } = req.body || {};
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid recipient email address.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const now = Date.now();
  const expiresAt = now + 48 * 60 * 60 * 1000; // 48 hours

  const inviteData = {
    tokenHash,
    email: cleanEmail,
    adminId: user.uid,
    adminEmail: user.email || 'admin@waterguard.iot',
    adminName: adminName || 'Plant Administrator',
    status: 'PENDING',
    createdAt: now,
    expiresAt,
  };

  try {
    let inviteId = `inv_${now}_${crypto.randomBytes(4).toString('hex')}`;
    if (adminDb) {
      // Check for active pending invitations for this email under this admin
      const existing = await adminDb
        .collection('invitations')
        .where('email', '==', cleanEmail)
        .where('adminId', '==', user.uid)
        .where('status', '==', 'PENDING')
        .get();

      if (!existing.empty) {
        // Revoke older pending invites for this email
        const batch = adminDb.batch();
        existing.docs.forEach((d) => {
          batch.update(d.ref, { status: 'REVOKED', revokedAt: now });
        });
        await batch.commit();
      }

      const docRef = await adminDb.collection('invitations').add(inviteData);
      inviteId = docRef.id;
    }

    // Send invitation email via Resend
    const emailResult = await sendInvitationEmail({
      toEmail: cleanEmail,
      adminName: inviteData.adminName,
      adminEmail: inviteData.adminEmail,
      invitationToken: rawToken,
    });

    const baseUrl = (process.env.APP_BASE_URL || 'http://localhost:8081').replace(/\/$/, '');
    const inviteUrl = `${baseUrl}/invite?token=${rawToken}`;

    return res.status(200).json({
      success: true,
      inviteId,
      email: cleanEmail,
      expiresAt,
      inviteUrl,
      emailDispatched: emailResult.success,
    });
  } catch (err: any) {
    console.error('[CreateInvitation Error]', err);
    return res.status(500).json({ error: err.message || 'Failed to create invitation.' });
  }
}
