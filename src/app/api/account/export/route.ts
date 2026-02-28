import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { generalLimiter } from '@/lib/rate-limiters';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// ---------------------------------------------------------------------------
// GET /api/account/export — Full data export (GDPR Article 20 — Data Portability)
//
// Returns a JSON file containing all organization data. Only owners and admins
// can export data. API key hashes and webhook secrets are excluded for security.
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const blocked = await checkRateLimit(request, generalLimiter);
    if (blocked) return blocked;

    const supabase = createClient();
    const admin = createAdminClient();

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

    // 2. Verify role (owner or admin)
    const { data: profileData } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    const profile = profileData as Pick<ProfileRow, 'organization_id' | 'role'> | null;

    if (!profile) {
      return NextResponse.json(
        { error: 'Not Found', message: 'User profile not found.' },
        { status: 404 },
      );
    }

    if (!['owner', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only organization owners or admins can export data.' },
        { status: 403 },
      );
    }

    const orgId = profile.organization_id;

    // 3. Fetch all data tables in parallel
    const [
      org,
      profiles,
      drivers,
      consents,
      creditBalance,
      creditTx,
      auditLog,
      apiKeys,
      templates,
      webhookEndpoints,
      notifications,
      queryRecords,
      invoices,
      teamInvites,
      serviceRequests,
    ] = await Promise.all([
      admin.from('organizations').select('*').eq('id', orgId).single(),
      admin.from('profiles').select('id, organization_id, role, full_name, email, phone, is_active, last_login_at, mfa_enabled, email_verified, created_at, updated_at').eq('organization_id', orgId),
      admin.from('drivers').select('*').eq('organization_id', orgId),
      admin.from('consents').select('*').eq('organization_id', orgId),
      admin.from('credit_balances').select('*').eq('organization_id', orgId).single(),
      admin.from('credit_transactions').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }),
      admin.from('audit_log').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(10000),
      // Exclude key_hash for security
      admin.from('api_keys').select('id, name, key_prefix, scopes, is_active, created_at').eq('organization_id', orgId),
      admin.from('consent_templates').select('*').eq('organization_id', orgId),
      // Exclude secret for security
      admin.from('webhook_endpoints').select('id, url, description, events, is_active, created_at').eq('organization_id', orgId),
      admin.from('notifications').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(10000),
      admin.from('query_records').select('*').eq('organization_id', orgId),
      admin.from('invoices').select('*').eq('organization_id', orgId),
      admin.from('team_invites').select('id, email, role, invited_by, expires_at, accepted_at, created_at').eq('organization_id', orgId),
      admin.from('service_requests').select('*').eq('organization_id', orgId),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      format_version: '1.0',
      gdpr_article: '20',
      organization: org.data,
      team_members: profiles.data,
      drivers: drivers.data,
      consents: consents.data,
      credit_balance: creditBalance.data,
      credit_transactions: creditTx.data,
      audit_log: auditLog.data,
      api_keys: apiKeys.data,
      consent_templates: templates.data,
      webhook_endpoints: webhookEndpoints.data,
      notifications: notifications.data,
      query_records: queryRecords.data,
      invoices: invoices.data,
      team_invites: teamInvites.data,
      service_requests: serviceRequests.data,
    };

    // 4. Audit log the export
    await admin.from('audit_log').insert({
      organization_id: orgId,
      actor_id: user.id,
      actor_type: 'user',
      action: 'organization.data_exported',
      resource_type: 'organization',
      resource_id: orgId,
      details: { format: 'json', gdpr_article: '20' },
    });

    // 5. Return as downloadable JSON file
    const dateStr = new Date().toISOString().slice(0, 10);
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="consenthaul-export-${orgId}-${dateStr}.json"`,
      },
    });
  } catch (err) {
    console.error('[GET /api/account/export]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred during data export.' },
      { status: 500 },
    );
  }
}
