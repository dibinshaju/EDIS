/**
 * Resend Email Integration for WaterGuard-IoT Invitations
 * Uses native fetch to Resend API - no extra packages required.
 */

interface SendInviteEmailParams {
  toEmail: string;
  adminName: string;
  adminEmail: string;
  invitationToken: string;
}

export async function sendInvitationEmail({
  toEmail,
  adminName,
  adminEmail,
  invitationToken,
}: SendInviteEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.INVITATION_FROM_EMAIL || 'WaterGuard-IoT <onboarding@resend.dev>';
  const baseUrl = (process.env.APP_BASE_URL || 'http://localhost:8081').replace(/\/$/, '');

  const inviteUrl = `${baseUrl}/invite?token=${encodeURIComponent(invitationToken)}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>You are invited to join WaterGuard-IoT</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: #0284c7; padding: 28px 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">WaterGuard-IoT</h1>
      <p style="color: #e0f2fe; margin: 6px 0 0 0; font-size: 13px;">Industrial Leakage Monitoring & Telemetry Control</p>
    </div>
    
    <div style="padding: 28px 24px;">
      <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0;">You are invited to join WaterGuard-IoT</h2>
      <p style="font-size: 14px; line-height: 22px; color: #334155;">
        Your system administrator, <strong>${adminName}</strong> (${adminEmail}), has invited you to register as an authorized field operator on the WaterGuard-IoT system.
      </p>
      
      <p style="font-size: 14px; line-height: 22px; color: #334155;">
        Click <strong>Accept Invitation</strong> below to create your secure account and connect to your administrator's WaterGuard system.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${inviteUrl}" style="background-color: #0284c7; color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
          Accept Invitation & Create Account
        </a>
      </div>

      <div style="background-color: #f1f5f9; border-radius: 8px; padding: 12px; margin-top: 20px;">
        <p style="margin: 0; font-size: 12px; color: #64748b;">
          <strong>Security Notice:</strong> This invitation is single-use and will expire in 48 hours. If you did not expect this invitation, you can safely ignore this email.
        </p>
        <p style="margin: 8px 0 0 0; font-size: 11px; color: #94a3b8; word-break: break-all;">
          Direct link: <a href="${inviteUrl}" style="color: #0284c7;">${inviteUrl}</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  if (!apiKey) {
    console.log('------------------------------------------------------------');
    console.log('[Resend Mock/Dev Mode] RESEND_API_KEY is not configured.');
    console.log(`To: ${toEmail}`);
    console.log(`Subject: You are invited to join WaterGuard-IoT`);
    console.log(`Invite URL: ${inviteUrl}`);
    console.log('------------------------------------------------------------');
    return { success: true, id: `mock_email_${Date.now()}` };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: 'You are invited to join WaterGuard-IoT',
        html: htmlContent,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[Resend Error]', data);
      return { success: false, error: data.message || 'Failed to dispatch email' };
    }

    return { success: true, id: data.id };
  } catch (err: any) {
    console.error('[Resend Network Error]', err);
    return { success: false, error: err.message || 'Network error reaching Resend' };
  }
}
