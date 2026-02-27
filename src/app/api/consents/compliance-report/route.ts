import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { batchLimiter } from '@/lib/rate-limiters';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

interface ComplianceRow {
  driver_id: string;
  first_name: string;
  last_name: string;
  cdl_number: string | null;
  cdl_state: string | null;
  phone: string | null;
  email: string | null;
  latest_consent_status: string | null;
  consent_type: string | null;
  signed_at: string | null;
  consent_end_date: string | null;
  days_until_expiration: number | null;
  last_query_date: string | null;
  days_since_query: number | null;
  last_query_result: string | null;
  consent_gap: boolean;
  query_overdue: boolean;
  overall_compliant: boolean;
  has_any_consent: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const blocked = await checkRateLimit(request, batchLimiter);
    if (blocked) return blocked;

    const supabase = createClient();

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

    const orgId = profile.organization_id;
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // Fetch all active drivers
    const { data: drivers } = await supabase
      .from('drivers')
      .select('id, first_name, last_name, cdl_number, cdl_state, phone, email')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .order('last_name', { ascending: true });

    if (!drivers || drivers.length === 0) {
      const format = request.nextUrl.searchParams.get('format');
      if (format === 'json') {
        return NextResponse.json({ data: [], summary: { total: 0, compliant: 0, consent_gaps: 0, query_overdue: 0, expiring_30d: 0 } });
      }
      return new Response('No active drivers found.', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const driverIds = drivers.map((d) => d.id);

    // Fetch all consents for these drivers (most recent first)
    const { data: allConsents } = await supabase
      .from('consents')
      .select('id, driver_id, status, signed_at, consent_end_date, consent_type')
      .eq('organization_id', orgId)
      .in('driver_id', driverIds)
      .order('created_at', { ascending: false });

    // Fetch query records
    const { data: allQueries } = await supabase
      .from('query_records')
      .select('driver_id, query_date, result')
      .eq('organization_id', orgId)
      .in('driver_id', driverIds)
      .order('query_date', { ascending: false });

    // Build per-driver maps
    const consentMap = new Map<string, { status: string; consent_type: string; signed_at: string | null; consent_end_date: string | null }>();
    const signedConsentMap = new Map<string, { consent_type: string; signed_at: string | null; consent_end_date: string | null }>();

    for (const c of allConsents ?? []) {
      // Latest consent of any status
      if (!consentMap.has(c.driver_id)) {
        consentMap.set(c.driver_id, { status: c.status, consent_type: c.consent_type, signed_at: c.signed_at, consent_end_date: c.consent_end_date });
      }
      // Latest signed consent
      if (c.status === 'signed' && !signedConsentMap.has(c.driver_id)) {
        signedConsentMap.set(c.driver_id, { consent_type: c.consent_type, signed_at: c.signed_at, consent_end_date: c.consent_end_date });
      }
    }

    const queryMap = new Map<string, { query_date: string; result: string }>();
    for (const q of allQueries ?? []) {
      if (!queryMap.has(q.driver_id)) {
        queryMap.set(q.driver_id, { query_date: q.query_date, result: q.result });
      }
    }

    // Build report rows
    const rows: ComplianceRow[] = drivers.map((driver) => {
      const latestConsent = consentMap.get(driver.id);
      const signedConsent = signedConsentMap.get(driver.id);
      const latestQuery = queryMap.get(driver.id);

      // Consent gap: no valid signed consent, or signed consent is expired
      const hasValidConsent =
        signedConsent?.consent_end_date
          ? signedConsent.consent_end_date >= todayStr
          : !!signedConsent; // signed with no end date = valid
      const consentGap = !hasValidConsent;

      // Days until expiration
      let daysUntilExpiration: number | null = null;
      if (signedConsent?.consent_end_date) {
        const endDate = new Date(signedConsent.consent_end_date);
        daysUntilExpiration = Math.ceil(
          (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
      }

      // Query overdue: >365 days since last query or never queried
      let daysSinceQuery: number | null = null;
      let queryOverdue = true; // default to overdue if never queried
      if (latestQuery) {
        const qDate = new Date(latestQuery.query_date);
        daysSinceQuery = Math.ceil(
          (today.getTime() - qDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        queryOverdue = daysSinceQuery > 365;
      }

      return {
        driver_id: driver.id,
        first_name: driver.first_name,
        last_name: driver.last_name,
        cdl_number: driver.cdl_number,
        cdl_state: driver.cdl_state,
        phone: driver.phone,
        email: driver.email,
        latest_consent_status: latestConsent?.status ?? null,
        consent_type: signedConsent?.consent_type ?? latestConsent?.consent_type ?? null,
        signed_at: signedConsent?.signed_at ?? null,
        consent_end_date: signedConsent?.consent_end_date ?? null,
        days_until_expiration: daysUntilExpiration,
        last_query_date: latestQuery?.query_date ?? null,
        days_since_query: daysSinceQuery,
        last_query_result: latestQuery?.result ?? null,
        consent_gap: consentGap,
        query_overdue: queryOverdue,
        overall_compliant: !consentGap && !queryOverdue,
        has_any_consent: consentMap.has(driver.id),
      };
    });

    // Summary stats
    const summary = {
      total: rows.length,
      compliant: rows.filter((r) => r.overall_compliant).length,
      consent_gaps: rows.filter((r) => r.consent_gap).length,
      query_overdue: rows.filter((r) => r.query_overdue).length,
      expiring_30d: rows.filter(
        (r) => r.days_until_expiration !== null && r.days_until_expiration <= 30 && r.days_until_expiration >= 0,
      ).length,
    };

    // Return JSON or CSV
    const format = request.nextUrl.searchParams.get('format');
    if (format === 'json') {
      return NextResponse.json({ data: rows, summary });
    }

    // CSV format
    const csvHeaders = [
      'Last Name',
      'First Name',
      'CDL Number',
      'CDL State',
      'Phone',
      'Email',
      'Latest Consent Status',
      'Signed Date',
      'Consent Expiration',
      'Days Until Expiration',
      'Last Query Date',
      'Days Since Query',
      'Query Result',
      'Consent Gap',
      'Query Overdue',
      'Overall Compliant',
    ];

    const csvRows = rows.map((r) =>
      [
        escapeCsv(r.last_name),
        escapeCsv(r.first_name),
        escapeCsv(r.cdl_number ?? ''),
        escapeCsv(r.cdl_state ?? ''),
        escapeCsv(r.phone ?? ''),
        escapeCsv(r.email ?? ''),
        escapeCsv(r.latest_consent_status ?? 'none'),
        escapeCsv(r.signed_at ? r.signed_at.slice(0, 10) : ''),
        escapeCsv(r.consent_end_date ?? ''),
        r.days_until_expiration?.toString() ?? '',
        escapeCsv(r.last_query_date ?? ''),
        r.days_since_query?.toString() ?? '',
        escapeCsv(r.last_query_result ?? 'never'),
        r.consent_gap ? 'YES' : 'NO',
        r.query_overdue ? 'YES' : 'NO',
        r.overall_compliant ? 'YES' : 'NO',
      ].join(','),
    );

    const dateStr = todayStr.replace(/-/g, '');
    const csv = [csvHeaders.join(','), ...csvRows].join('\n');

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="compliance-report-${dateStr}.csv"`,
      },
    });
  } catch (err) {
    console.error('[GET /api/consents/compliance-report]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
