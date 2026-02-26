import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { queryLimiter } from '@/lib/rate-limiters';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// ---------------------------------------------------------------------------
// GET /api/queries/generate-tsv — FMCSA Clearinghouse bulk upload TSV
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
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

    // Check query subscription
    const { data: orgData } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', orgId)
      .single();

    const settings = (orgData?.settings ?? {}) as Record<string, unknown>;
    const subscriptionActive = settings.query_subscription_active === true;
    const expiresAt = settings.query_subscription_expires_at as string | undefined;

    if (!subscriptionActive || (expiresAt && new Date(expiresAt) < new Date())) {
      return NextResponse.json(
        { error: 'Payment Required', message: 'Active query subscription required.' },
        { status: 402 },
      );
    }

    // Get all active drivers with valid signed consents
    const { data: drivers } = await supabase
      .from('drivers')
      .select('id, first_name, last_name, cdl_number, cdl_state, date_of_birth')
      .eq('organization_id', orgId)
      .eq('is_active', true);

    if (!drivers || drivers.length === 0) {
      return new Response('No active drivers found.', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const driverIds = drivers.map((d) => d.id);

    // Get most recent query date for each driver
    const { data: queries } = await supabase
      .from('query_records')
      .select('driver_id, query_date')
      .eq('organization_id', orgId)
      .in('driver_id', driverIds)
      .order('query_date', { ascending: false });

    const lastQueryMap = new Map<string, string>();
    for (const q of queries ?? []) {
      if (!lastQueryMap.has(q.driver_id)) {
        lastQueryMap.set(q.driver_id, q.query_date);
      }
    }

    // Get drivers with valid signed consents
    const todayStr = new Date().toISOString().slice(0, 10);
    const { data: signedConsents } = await supabase
      .from('consents')
      .select('driver_id')
      .eq('organization_id', orgId)
      .eq('status', 'signed')
      .in('driver_id', driverIds)
      .or(`consent_end_date.is.null,consent_end_date.gte.${todayStr}`);

    const driversWithConsent = new Set(
      (signedConsents ?? []).map((c) => c.driver_id),
    );

    // Filter: drivers with consent who haven't been queried in 365 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 365);
    const cutoffStr = cutoffDate.toISOString().slice(0, 10);

    const dueDrivers = drivers.filter((d) => {
      if (!driversWithConsent.has(d.id)) return false;
      const lastQuery = lastQueryMap.get(d.id);
      if (!lastQuery) return true; // Never queried
      return lastQuery <= cutoffStr;
    });

    if (dueDrivers.length === 0) {
      return new Response('No drivers are due for annual queries.', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Generate TSV in FMCSA Clearinghouse bulk upload format
    const tsvHeaders = ['Last Name', 'First Name', 'CDL Number', 'CDL State', 'Date of Birth'].join('\t');
    const tsvRows = dueDrivers.map((d) =>
      [
        d.last_name,
        d.first_name,
        d.cdl_number ?? '',
        d.cdl_state ?? '',
        d.date_of_birth ?? '',
      ].join('\t'),
    );

    // Track the TSV download timestamp on the org
    await supabase
      .from('organizations')
      .update({ last_tsv_download_at: new Date().toISOString() })
      .eq('id', orgId);

    const tsv = [tsvHeaders, ...tsvRows].join('\n');
    const dateStr = todayStr.replace(/-/g, '');

    return new Response(tsv, {
      status: 200,
      headers: {
        'Content-Type': 'text/tab-separated-values',
        'Content-Disposition': `attachment; filename="clearinghouse-bulk-query-${dateStr}.tsv"`,
      },
    });
  } catch (err) {
    console.error('[GET /api/queries/generate-tsv]', err);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
