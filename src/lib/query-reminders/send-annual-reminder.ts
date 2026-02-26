import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';
import { escapeHtml } from '@/lib/security/html-escape';
import type { Json } from '@/types/database';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface QueryReminderResult {
  orgsProcessed: number;
  emailsSent: number;
  totalDriversDue: number;
  failed: number;
}

export async function sendAnnualQueryReminders(): Promise<QueryReminderResult> {
  const supabase = createAdminClient();
  const result: QueryReminderResult = {
    orgsProcessed: 0,
    emailsSent: 0,
    totalDriversDue: 0,
    failed: 0,
  };

  // Find orgs with active query subscriptions
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, settings, last_tsv_download_at');

  if (!orgs) return result;

  const now = new Date();

  for (const org of orgs) {
    const settings = (org.settings ?? {}) as Record<string, unknown>;
    if (settings.query_subscription_active !== true) continue;

    const expiresAt = settings.query_subscription_expires_at as string | undefined;
    if (expiresAt && new Date(expiresAt) < now) continue;

    result.orgsProcessed++;

    // Get active drivers
    const { data: drivers } = await supabase
      .from('drivers')
      .select('id')
      .eq('organization_id', org.id)
      .eq('is_active', true);

    if (!drivers || drivers.length === 0) continue;

    const driverIds = drivers.map((d) => d.id);

    // Get last query for each driver
    const { data: queries } = await supabase
      .from('query_records')
      .select('driver_id, query_date')
      .eq('organization_id', org.id)
      .in('driver_id', driverIds)
      .order('query_date', { ascending: false });

    const lastQueryMap = new Map<string, string>();
    for (const q of queries ?? []) {
      if (!lastQueryMap.has(q.driver_id)) {
        lastQueryMap.set(q.driver_id, q.query_date);
      }
    }

    // Drivers due: last query >11 months ago (giving 30-day buffer)
    const elevenMonthsAgo = new Date();
    elevenMonthsAgo.setMonth(elevenMonthsAgo.getMonth() - 11);
    const cutoffStr = elevenMonthsAgo.toISOString().slice(0, 10);

    const dueCount = driverIds.filter((id) => {
      const lastQuery = lastQueryMap.get(id);
      if (!lastQuery) return true;
      return lastQuery <= cutoffStr;
    }).length;

    if (dueCount === 0) continue;

    result.totalDriversDue += dueCount;

    // Check if TSV was downloaded but results not yet recorded
    const lastTsvDownload = (org as Record<string, unknown>).last_tsv_download_at as string | undefined;
    const tsvNudge = (() => {
      if (!lastTsvDownload) return '';
      const downloadDate = new Date(lastTsvDownload);
      const daysSince = Math.ceil((now.getTime() - downloadDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince < 3) return '';
      const dateStr = downloadDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      return `
        <div style="background: #fffbeb; border: 2px solid #f59e0b; padding: 16px; margin: 16px 0;">
          <p style="color: #92400e; font-size: 13px; font-weight: bold; margin: 0 0 8px;">
            Unrecorded Results Detected
          </p>
          <p style="color: #78350f; font-size: 13px; margin: 0;">
            You downloaded your batch file on <strong>${dateStr}</strong> but haven&rsquo;t recorded results yet.
            Log back in to record your query outcomes and maintain compliance.
          </p>
        </div>
      `;
    })();

    // Get org owner email
    const { data: owner } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('organization_id', org.id)
      .eq('role', 'owner')
      .single();

    if (!owner?.email) continue;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    try {
      await resend.emails.send({
        from: 'ConsentHaul <notifications@consenthaul.com>',
        to: owner.email,
        subject: `${dueCount} drivers due for annual Clearinghouse queries`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #0c0f14; padding: 24px; text-align: center;">
              <h1 style="color: #C8A75E; font-size: 18px; margin: 0;">ConsentHaul</h1>
            </div>
            <div style="padding: 32px 24px;">
              <h2 style="color: #0c0f14; font-size: 20px; margin: 0 0 16px;">Annual Query Reminder</h2>
              <p style="color: #3a3f49; font-size: 14px; line-height: 1.6;">
                Hi ${escapeHtml(owner.full_name ?? '')},
              </p>
              <p style="color: #3a3f49; font-size: 14px; line-height: 1.6;">
                <strong>${dueCount}</strong> of your drivers at <strong>${escapeHtml(org.name ?? '')}</strong> are due for their annual FMCSA Clearinghouse limited query (per 49 CFR 382.701).
              </p>
              <div style="background: #fafaf8; border: 1px solid #e8e8e3; padding: 20px; margin: 24px 0;">
                <h3 style="color: #0c0f14; font-size: 14px; margin: 0 0 12px;">How to run your annual queries:</h3>
                <ol style="color: #3a3f49; font-size: 13px; line-height: 1.8; padding-left: 20px; margin: 0;">
                  <li>Download your bulk upload file from <a href="${appUrl}/queries" style="color: #C8A75E;">ConsentHaul</a></li>
                  <li>Log into the <a href="https://clearinghouse.fmcsa.dot.gov" style="color: #C8A75E;">FMCSA Clearinghouse</a></li>
                  <li>Go to <strong>Queries &rarr; Bulk Upload</strong></li>
                  <li>Upload the TSV file</li>
                  <li>Queries process overnight (8pm&ndash;8am ET)</li>
                  <li>Come back to ConsentHaul and record the results</li>
                </ol>
              </div>
              ${tsvNudge}
              <a href="${appUrl}/queries" style="display: inline-block; background: #0c0f14; color: #fff; padding: 12px 24px; text-decoration: none; font-size: 13px; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase;">
                Download Bulk Upload File
              </a>
              <p style="color: #8b919a; font-size: 12px; margin-top: 24px; line-height: 1.5;">
                Failure to conduct annual queries is a violation of 49 CFR 382.701 with penalties up to $5,833 per driver per violation.
              </p>
            </div>
          </div>
        `,
      });

      result.emailsSent++;
    } catch (err) {
      console.error(`[query-reminders] failed to send email for org ${org.id}:`, err);
      result.failed++;
    }

    // Audit log
    await supabase.from('audit_log').insert({
      organization_id: org.id,
      actor_id: null,
      actor_type: 'system',
      action: 'query.annual_reminder_sent',
      resource_type: 'organization',
      resource_id: org.id,
      details: { drivers_due: dueCount } as unknown as Json,
    });
  }

  return result;
}
