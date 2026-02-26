import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { queryLimiter } from '@/lib/rate-limiters';
import { Resend } from 'resend';
import { escapeHtml } from '@/lib/security/html-escape';
import type { Database, EscalationStatus } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// ---------------------------------------------------------------------------
// POST /api/queries/escalate — Trigger escalation for a query with violations
// Body: { query_record_id: string }
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const blocked = await checkRateLimit(request, queryLimiter);
    if (blocked) return blocked;

    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const profile = profileData as Pick<ProfileRow, 'organization_id'> | null;
    if (!profile) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const orgId = profile.organization_id;
    const body = await request.json();
    const queryRecordId = body.query_record_id;

    if (!queryRecordId || typeof queryRecordId !== 'string') {
      return NextResponse.json(
        { error: 'Validation Error', message: 'query_record_id is required.' },
        { status: 422 },
      );
    }

    // Get the query record
    const { data: record } = await supabase
      .from('query_records')
      .select('*, driver:drivers(id, first_name, last_name, cdl_number)')
      .eq('id', queryRecordId)
      .eq('organization_id', orgId)
      .single();

    if (!record) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Query record not found.' },
        { status: 404 },
      );
    }

    if (record.result !== 'violations_found') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Escalation is only for records with violations found.' },
        { status: 400 },
      );
    }

    // Set escalation deadline = query_date + 24 hours
    const queryDate = new Date(record.query_date + 'T00:00:00Z');
    const deadline = new Date(queryDate.getTime() + 24 * 60 * 60 * 1000);

    const { error: updateError } = await supabase
      .from('query_records')
      .update({
        escalation_deadline: deadline.toISOString(),
        escalation_status: 'pending' as EscalationStatus,
      })
      .eq('id', queryRecordId);

    if (updateError) {
      console.error('[POST /api/queries/escalate] update error:', updateError);
      return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }

    // Get org info
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single();

    // Get all org admins/owners for email notification
    const { data: admins } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('organization_id', orgId)
      .in('role', ['owner', 'admin'])
      .eq('is_active', true);

    const driver = record.driver as unknown as { first_name: string; last_name: string; cdl_number: string | null } | null;
    const driverName = driver
      ? `${driver.first_name} ${driver.last_name}`
      : 'Unknown Driver';

    // Send escalation emails
    if (admins && admins.length > 0 && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.consenthaul.com';

      for (const admin of admins) {
        if (!admin.email) continue;
        try {
          await resend.emails.send({
            from: 'ConsentHaul <notifications@consenthaul.com>',
            to: admin.email,
            subject: `URGENT: Clearinghouse violation found — ${driverName}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #dc2626; padding: 24px; text-align: center;">
                  <h1 style="color: #fff; font-size: 18px; margin: 0;">CLEARINGHOUSE VIOLATION ALERT</h1>
                </div>
                <div style="padding: 32px 24px;">
                  <p style="color: #0c0f14; font-size: 16px; font-weight: bold; margin: 0 0 16px;">
                    Immediate Action Required
                  </p>
                  <p style="color: #3a3f49; font-size: 14px; line-height: 1.6;">
                    Hi ${escapeHtml(admin.full_name ?? '')},
                  </p>
                  <p style="color: #3a3f49; font-size: 14px; line-height: 1.6;">
                    A limited query for <strong>${escapeHtml(driverName)}</strong>${driver?.cdl_number ? ` (CDL: ${escapeHtml(driver.cdl_number)})` : ''} at <strong>${escapeHtml(org?.name ?? '')}</strong> returned <strong style="color: #dc2626;">violations found</strong>.
                  </p>
                  <div style="background: #fef2f2; border: 2px solid #dc2626; padding: 20px; margin: 24px 0;">
                    <h3 style="color: #dc2626; font-size: 14px; margin: 0 0 8px;">You have 24 hours to:</h3>
                    <ol style="color: #3a3f49; font-size: 13px; line-height: 1.8; padding-left: 20px; margin: 0;">
                      <li>Run a <strong>full individual query</strong> in the FMCSA Clearinghouse, <strong>OR</strong></li>
                      <li>Remove the driver from safety-sensitive duties immediately</li>
                    </ol>
                    <p style="color: #dc2626; font-size: 12px; margin: 12px 0 0; font-weight: bold;">
                      Deadline: ${deadline.toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'full', timeStyle: 'short' })} ET
                    </p>
                  </div>
                  <p style="color: #3a3f49; font-size: 13px; line-height: 1.6;">
                    Per 49 CFR 382.701(b), when an employer receives notification that a limited query indicates the existence of a record,
                    the employer must conduct a full individual query within 24 hours or remove the driver from performing safety-sensitive functions.
                  </p>
                  <a href="${appUrl}/compliance" style="display: inline-block; background: #dc2626; color: #fff; padding: 12px 24px; text-decoration: none; font-size: 13px; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase; margin-top: 16px;">
                    View Compliance Dashboard
                  </a>
                </div>
              </div>
            `,
          });
        } catch (err) {
          console.error(`[escalate] failed to send email to ${admin.email}:`, err);
        }
      }
    }

    // Audit log
    await supabase.from('audit_log').insert({
      organization_id: orgId,
      actor_id: user.id,
      actor_type: 'user',
      action: 'query.escalation_triggered',
      resource_type: 'query_record',
      resource_id: queryRecordId,
      details: {
        driver_name: driverName,
        escalation_deadline: deadline.toISOString(),
      },
    });

    return NextResponse.json({
      data: {
        query_record_id: queryRecordId,
        escalation_deadline: deadline.toISOString(),
        escalation_status: 'pending',
      },
    });
  } catch (err) {
    console.error('[POST /api/queries/escalate]', err);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/queries/escalate — Resolve an escalation
// Body: { query_record_id: string, resolution: 'full_query_completed' | 'driver_removed' }
// ---------------------------------------------------------------------------
export async function PATCH(request: NextRequest) {
  try {
    const blocked = await checkRateLimit(request, queryLimiter);
    if (blocked) return blocked;

    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const profile = profileData as Pick<ProfileRow, 'organization_id'> | null;
    if (!profile) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const orgId = profile.organization_id;
    const body = await request.json();
    const { query_record_id, resolution } = body;

    if (!query_record_id || !resolution) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'query_record_id and resolution are required.' },
        { status: 422 },
      );
    }

    if (!['full_query_completed', 'driver_removed'].includes(resolution)) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'resolution must be full_query_completed or driver_removed.' },
        { status: 422 },
      );
    }

    const { data: record } = await supabase
      .from('query_records')
      .select('id, escalation_status')
      .eq('id', query_record_id)
      .eq('organization_id', orgId)
      .single();

    if (!record) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Query record not found.' },
        { status: 404 },
      );
    }

    if (record.escalation_status !== 'pending') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Escalation is not in pending status.' },
        { status: 400 },
      );
    }

    const { error: updateError } = await supabase
      .from('query_records')
      .update({
        escalation_status: resolution as EscalationStatus,
        escalation_resolved_at: new Date().toISOString(),
        escalation_resolved_by: user.id,
      })
      .eq('id', query_record_id);

    if (updateError) {
      console.error('[PATCH /api/queries/escalate] update error:', updateError);
      return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }

    // Audit log
    await supabase.from('audit_log').insert({
      organization_id: orgId,
      actor_id: user.id,
      actor_type: 'user',
      action: 'query.escalation_resolved',
      resource_type: 'query_record',
      resource_id: query_record_id,
      details: { resolution },
    });

    return NextResponse.json({
      data: {
        query_record_id,
        escalation_status: resolution,
        escalation_resolved_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[PATCH /api/queries/escalate]', err);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
