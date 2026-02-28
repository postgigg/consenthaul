import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authLimiter } from '@/lib/rate-limiters';
import { getClientIp } from '@/lib/rate-limit';

// ---------------------------------------------------------------------------
// GET /api/driver-portal/verify?token=xxx — Public: verify portal token and
//   return driver info, consents, and query records
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    // Rate limit
    const ip = getClientIp(request);
    const rl = authLimiter.check(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too Many Requests', message: 'Too many requests. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
      );
    }

    const token = request.nextUrl.searchParams.get('token');
    if (!token || token.length < 32) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Missing or invalid token.' },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // Find driver with matching portal token
    // We query active drivers and filter by metadata in application code since
    // Supabase JSONB filtering syntax can vary.
    const { data: drivers } = await supabase
      .from('drivers')
      .select('id, first_name, last_name, email, phone, cdl_number, cdl_state, organization_id, metadata')
      .eq('is_active', true);

    const driver = drivers?.find((d) => {
      const meta = d.metadata as Record<string, unknown> | null;
      if (!meta) return false;
      return (
        meta.portal_token === token &&
        typeof meta.portal_token_expires_at === 'string' &&
        new Date(meta.portal_token_expires_at) > new Date()
      );
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired link.' },
        { status: 401 },
      );
    }

    // Fetch organization name
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', driver.organization_id)
      .single();

    // Fetch all consents for this driver
    const { data: consents } = await supabase
      .from('consents')
      .select(
        'id, status, consent_type, language, consent_start_date, consent_end_date, signed_at, pdf_storage_path, signing_token, created_at',
      )
      .eq('driver_id', driver.id)
      .order('created_at', { ascending: false });

    // Fetch query records for this driver
    const { data: queries } = await supabase
      .from('query_records')
      .select('id, query_type, query_date, result, created_at')
      .eq('driver_id', driver.id)
      .order('query_date', { ascending: false });

    // Audit log for portal access
    const signerIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';

    await supabase.from('audit_log').insert({
      organization_id: driver.organization_id,
      actor_id: null,
      actor_type: 'driver',
      action: 'driver_portal.accessed',
      resource_type: 'driver',
      resource_id: driver.id,
      details: { method: 'portal_token' },
      ip_address: signerIp,
      user_agent: request.headers.get('user-agent') ?? 'unknown',
    });

    return NextResponse.json({
      data: {
        driver: {
          id: driver.id,
          first_name: driver.first_name,
          last_name: driver.last_name,
          email: driver.email,
          cdl_number: driver.cdl_number,
          cdl_state: driver.cdl_state,
        },
        organization_name: org?.name ?? 'Unknown',
        consents: consents ?? [],
        queries: queries ?? [],
      },
    });
  } catch (err) {
    console.error('[GET /api/driver-portal/verify]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
