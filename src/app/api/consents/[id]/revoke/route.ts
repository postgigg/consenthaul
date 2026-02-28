import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { generalLimiter } from '@/lib/rate-limiters';
import { dispatchWebhookEvent } from '@/lib/webhooks';
import { sendRevocationNotificationEmail } from '@/lib/messaging/email';
import type { Database } from '@/types/database';

type ConsentRow = Database['public']['Tables']['consents']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// ---------------------------------------------------------------------------
// POST /api/consents/[id]/revoke — Admin/dashboard revocation
// ---------------------------------------------------------------------------
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Rate limit + IP blacklist check
    const blocked = await checkRateLimit(request, generalLimiter);
    if (blocked) return blocked;

    const supabase = createClient();
    const { id } = params;

    // 1. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in.' },
        { status: 401 },
      );
    }

    // 2. Fetch profile for org filter
    const { data: profileData } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const profile = profileData as Pick<ProfileRow, 'organization_id'> | null;
    if (!profile) {
      return NextResponse.json(
        { error: 'Not Found', message: 'User profile not found.' },
        { status: 404 },
      );
    }

    // 3. Fetch consent with driver — RLS + explicit org filter
    const { data: consentData, error } = await supabase
      .from('consents')
      .select('*, driver:drivers(id, first_name, last_name, email), organization:organizations(name, logo_url, settings)')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .single();

    const consent = consentData as (ConsentRow & {
      driver: { id: string; first_name: string; last_name: string; email: string | null } | null;
      organization: { name: string; logo_url: string | null; settings: Record<string, unknown> | null } | null;
    }) | null;

    if (error || !consent) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Consent not found.' },
        { status: 404 },
      );
    }

    // 4. Validate status — can only revoke signed consents via this endpoint
    if (consent.status !== 'signed') {
      return NextResponse.json(
        {
          error: 'Conflict',
          message: `Cannot revoke a consent with status "${consent.status}". Only signed consents can be revoked.`,
        },
        { status: 409 },
      );
    }

    // 5. Update status to revoked
    const revokedAt = new Date().toISOString();
    const { data: updatedData, error: updateError } = await supabase
      .from('consents')
      .update({ status: 'revoked' })
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .select('*, driver:drivers(id, first_name, last_name, email)')
      .single();

    const updated = updatedData as (ConsentRow & { driver: unknown }) | null;

    if (updateError || !updated) {
      console.error('[POST /api/consents/[id]/revoke] update error:', updateError);
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to revoke consent.' },
        { status: 500 },
      );
    }

    // 6. Audit log
    await supabase.from('audit_log').insert({
      organization_id: consent.organization_id,
      actor_id: user.id,
      actor_type: 'user',
      action: 'consent.revoked',
      resource_type: 'consent',
      resource_id: id,
      details: {
        revoked_at: revokedAt,
        revocation_method: 'admin_dashboard',
        previous_status: consent.status,
      },
    });

    // 7. Dispatch outgoing webhook (fire-and-forget)
    dispatchWebhookEvent({
      eventType: 'consent.revoked',
      consentId: id,
      organizationId: consent.organization_id,
    }).catch(() => {});

    // 8. Send email notifications (fire-and-forget)
    const driver = consent.driver;
    const organization = consent.organization;
    const driverName = driver
      ? `${driver.first_name} ${driver.last_name}`
      : 'Unknown Driver';
    const companyName = organization?.name ?? 'Unknown Company';

    // Build email branding for white-label partners
    const orgSettings = (organization?.settings as Record<string, unknown>) ?? {};
    const emailBranding = orgSettings.white_label_enabled === true
      ? {
          company_name: (orgSettings.brand_display_name as string) ?? companyName,
          logo_url: organization?.logo_url ?? null,
          primary_color: (orgSettings.brand_primary_color as string) ?? null,
        }
      : undefined;

    // Fetch org member emails for notification (use admin client to bypass RLS)
    const adminSupabase = createAdminClient();

    Promise.resolve(
      adminSupabase
        .from('profiles')
        .select('email')
        .eq('organization_id', consent.organization_id)
    )
      .then(({ data: profiles }) => {
        const orgMemberEmails = (profiles ?? [])
          .map((p: { email: string | null }) => p.email)
          .filter((e): e is string => !!e);

        sendRevocationNotificationEmail({
          driverEmail: driver?.email,
          driverName,
          companyName,
          consentId: id,
          revokedAt,
          revocationMethod: 'admin_dashboard',
          orgMemberEmails: orgMemberEmails.length > 0 ? orgMemberEmails : undefined,
          branding: emailBranding,
        }).catch((err) => {
          console.error('[POST /api/consents/[id]/revoke] revocation email failed:', err);
        });
      })
      .catch((err) => {
        console.error('[POST /api/consents/[id]/revoke] failed to fetch org profiles for email:', err);
      });

    return NextResponse.json({
      data: updated,
    });
  } catch (err) {
    console.error('[POST /api/consents/[id]/revoke]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
