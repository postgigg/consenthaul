import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';
import { escapeHtml } from '@/lib/security/html-escape';
import type { Json } from '@/types/database';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[Cron escalation-check] CRON_SECRET not configured');
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    // Find pending escalations that have expired
    const { data: expired } = await supabase
      .from('query_records')
      .select('id, organization_id, driver_id, escalation_deadline, driver:drivers(first_name, last_name, cdl_number)')
      .eq('escalation_status', 'pending')
      .lt('escalation_deadline', now)
      .limit(100);

    let markedExpired = 0;
    let emailsSent = 0;
    let notificationsCreated = 0;

    if (expired && expired.length > 0) {
      const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.consenthaul.com';

      for (const record of expired) {
        // Mark as expired
        await supabase
          .from('query_records')
          .update({ escalation_status: 'expired' })
          .eq('id', record.id);

        markedExpired++;

        const driver = record.driver as unknown as { first_name: string; last_name: string; cdl_number: string | null } | null;
        const driverName = driver ? `${driver.first_name} ${driver.last_name}` : 'Unknown Driver';

        // Get org info
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', record.organization_id)
          .single();

        // Get org admins for email + in-app notifications
        const { data: admins } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .eq('organization_id', record.organization_id)
          .in('role', ['owner', 'admin'])
          .eq('is_active', true);

        // Create in-app notifications for all org admins
        if (admins && admins.length > 0) {
          for (const admin of admins) {
            await supabase.from('in_app_notifications').insert({
              user_id: admin.id,
              organization_id: record.organization_id,
              title: 'Escalation Deadline Missed',
              body: `A query escalation deadline has passed for driver ${driverName}. Immediate action required per FMCSA regulations.`,
              type: 'error',
              action_url: '/queries?escalation=overdue',
            });
            notificationsCreated++;
          }
        }

        if (admins && admins.length > 0 && resend) {
          for (const admin of admins) {
            if (!admin.email) continue;
            try {
              await resend.emails.send({
                from: 'ConsentHaul <notifications@consenthaul.com>',
                to: admin.email,
                subject: `OVERDUE: 24-hour escalation window expired — ${driverName}`,
                html: `
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #991b1b; padding: 24px; text-align: center;">
                      <h1 style="color: #fff; font-size: 18px; margin: 0;">ESCALATION DEADLINE EXPIRED</h1>
                    </div>
                    <div style="padding: 32px 24px;">
                      <p style="color: #dc2626; font-size: 16px; font-weight: bold; margin: 0 0 16px;">
                        24-Hour Window Has Passed
                      </p>
                      <p style="color: #3a3f49; font-size: 14px; line-height: 1.6;">
                        Hi ${escapeHtml(admin.full_name ?? '')},
                      </p>
                      <p style="color: #3a3f49; font-size: 14px; line-height: 1.6;">
                        The 24-hour escalation deadline for <strong>${escapeHtml(driverName)}</strong>${driver?.cdl_number ? ` (CDL: ${escapeHtml(driver.cdl_number)})` : ''} at <strong>${escapeHtml(org?.name ?? '')}</strong> has <strong style="color: #dc2626;">expired</strong>.
                      </p>
                      <div style="background: #fef2f2; border: 2px solid #991b1b; padding: 20px; margin: 24px 0;">
                        <p style="color: #991b1b; font-size: 14px; font-weight: bold; margin: 0 0 8px;">
                          Immediate action is required:
                        </p>
                        <p style="color: #3a3f49; font-size: 13px; line-height: 1.6; margin: 0;">
                          This driver must be removed from safety-sensitive duties until a full individual query is completed and cleared.
                          Continuing to allow the driver to operate may result in significant FMCSA penalties.
                        </p>
                      </div>
                      <a href="${appUrl}/compliance" style="display: inline-block; background: #991b1b; color: #fff; padding: 12px 24px; text-decoration: none; font-size: 13px; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase;">
                        View Compliance Dashboard
                      </a>
                    </div>
                  </div>
                `,
              });
              emailsSent++;
            } catch (err) {
              console.error(`[escalation-check] failed to send to ${admin.email}:`, err);
            }
          }
        }

        // Audit log
        await supabase.from('audit_log').insert({
          organization_id: record.organization_id,
          actor_id: null,
          actor_type: 'system',
          action: 'query.escalation_expired',
          resource_type: 'query_record',
          resource_id: record.id,
          details: {
            driver_name: driverName,
            deadline: record.escalation_deadline,
          } as unknown as Json,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      expired_count: markedExpired,
      emails_sent: emailsSent,
      notifications_created: notificationsCreated,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Cron escalation-check]', err);
    return NextResponse.json(
      { error: 'Escalation check failed' },
      { status: 500 },
    );
  }
}
