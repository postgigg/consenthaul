// ---------------------------------------------------------------------------
// Email notification for critical regulatory alerts
// ---------------------------------------------------------------------------

import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

interface CriticalAlertParams {
  title: string;
  url: string;
  relevance_score: number;
  category: string;
  summary: string;
  impact_assessment: string;
  recommended_actions: string;
}

export async function notifyCriticalAlert(params: CriticalAlertParams): Promise<void> {
  const adminEmail =
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.PLATFORM_ADMIN_EMAILS?.split(',')[0]?.trim();

  if (!adminEmail) {
    console.warn('[regulatory notifier] No admin email configured');
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://consenthaul.com';

  const subject = `[Regulatory Alert] ${params.title}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#f8f8f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f8f6;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background-color:#0c0f14;padding:24px 32px;">
          <h1 style="margin:0;color:#C8A75E;font-size:18px;font-weight:700;letter-spacing:0.04em;">CONSENTHAUL</h1>
          <div style="margin-top:16px;height:2px;background:linear-gradient(90deg,#C8A75E 0%,#C8A75E 30%,#1e2129 100%);"></div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <!-- Priority badge -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;width:100%;">
            <tr><td style="background-color:#fef2f2;border-left:3px solid #dc2626;padding:12px 16px;">
              <p style="margin:0;font-size:14px;font-weight:700;color:#991b1b;">
                Critical Regulatory Alert — Relevance ${params.relevance_score}/10
              </p>
              <p style="margin:4px 0 0;font-size:12px;color:#991b1b;text-transform:uppercase;letter-spacing:0.05em;">${params.category}</p>
            </td></tr>
          </table>

          <h2 style="margin:0 0 16px;font-size:18px;color:#0c0f14;">${params.title}</h2>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#3a3f49;">${params.summary}</p>

          ${params.impact_assessment ? `
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#8b919a;letter-spacing:0.08em;text-transform:uppercase;">Impact Assessment</p>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#3a3f49;">${params.impact_assessment.replace(/\n/g, '<br/>')}</p>
          ` : ''}

          ${params.recommended_actions ? `
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#8b919a;letter-spacing:0.08em;text-transform:uppercase;">Recommended Actions</p>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#3a3f49;">${params.recommended_actions.replace(/\n/g, '<br/>')}</p>
          ` : ''}

          ${params.url ? `
          <p style="margin:0 0 24px;font-size:13px;">
            <a href="${params.url}" style="color:#C8A75E;text-decoration:underline;">View source article</a>
          </p>
          ` : ''}

          <!-- CTA -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
            <tr><td align="center" style="background-color:#0c0f14;">
              <a href="${appUrl}/admin/regulatory" target="_blank" style="display:inline-block;padding:14px 36px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.05em;text-transform:uppercase;">
                REVIEW IN ADMIN
              </a>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background-color:#fafaf8;padding:20px 32px;border-top:1px solid #e8e8e3;">
          <p style="margin:0;font-size:12px;color:#8b919a;text-align:center;">This is an internal ConsentHaul regulatory intelligence alert.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  await getResend().emails.send({
    from: 'ConsentHaul <noreply@consenthaul.com>',
    to: adminEmail,
    subject,
    html,
  });
}
