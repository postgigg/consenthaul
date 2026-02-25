import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateApiKey } from '@/lib/api-auth';
import { createConsentSchema, paginationSchema } from '@/lib/validators';
import { generateSigningToken } from '@/lib/tokens';
import { SIGNING_TOKEN_DEFAULT_TTL_HOURS } from '@/lib/constants';
import { sendConsentSMS } from '@/lib/messaging/sms';
import { sendConsentWhatsApp } from '@/lib/messaging/whatsapp';
import { sendConsentEmail } from '@/lib/messaging/email';
import { apiLimiter } from '@/lib/rate-limiters';
import { getClientIp } from '@/lib/rate-limit';
import type { Database } from '@/types/database';

type DriverRow = Database['public']['Tables']['drivers']['Row'];
type ConsentRow = Database['public']['Tables']['consents']['Row'];

// ---------------------------------------------------------------------------
// POST /api/v1/consents — Public API: Create a new consent request
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const ip = getClientIp(request);
    const rl = apiLimiter.check(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too Many Requests', message: 'Rate limit exceeded. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
      );
    }

    // 1. Authenticate via API key
    const auth = await authenticateApiKey(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or missing API key.' },
        { status: 401 },
      );
    }

    // Check scope
    if (!auth.scopes.includes('consents:write') && !auth.scopes.includes('*')) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'API key does not have consents:write scope.' },
        { status: 403 },
      );
    }

    const supabase = createAdminClient();
    const orgId = auth.orgId;

    // Fetch organization name for messaging
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single();
    const companyName = orgData?.name ?? undefined;

    // 2. Parse & validate body
    const body = await request.json();
    const parsed = createConsentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid consent data.',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }

    const input = parsed.data;

    // 3. Verify the driver belongs to the org
    const { data: driverData, error: driverError } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', input.driver_id)
      .eq('organization_id', orgId)
      .single();

    const driver = driverData as DriverRow | null;

    if (driverError || !driver) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Driver not found in your organization.' },
        { status: 404 },
      );
    }

    // Resolve delivery address
    let deliveryAddress = input.delivery_address;
    if (!deliveryAddress) {
      if (input.delivery_method === 'email') {
        deliveryAddress = driver.email?.trim() ?? undefined;
      } else if (input.delivery_method === 'sms' || input.delivery_method === 'whatsapp') {
        deliveryAddress = driver.phone?.trim() ?? undefined;
      }
    }

    if (!deliveryAddress && input.delivery_method !== 'manual') {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: `No ${input.delivery_method} address available for this driver.`,
        },
        { status: 422 },
      );
    }

    // 4. Generate signing token (no side effects)
    const signingToken = generateSigningToken();
    const ttlHours = input.token_ttl_hours ?? SIGNING_TOKEN_DEFAULT_TTL_HOURS;
    const tokenExpiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();

    // 5. Create consent record first (before deducting credit)
    const { data: consentData, error: insertError } = await supabase
      .from('consents')
      .insert({
        organization_id: orgId,
        driver_id: input.driver_id,
        created_by: auth.keyId,
        consent_type: input.consent_type ?? 'limited_query',
        status: 'pending',
        language: input.language ?? driver.preferred_language ?? 'en',
        consent_start_date: input.consent_start_date ?? new Date().toISOString().slice(0, 10),
        consent_end_date: input.consent_end_date ?? null,
        query_frequency: input.query_frequency ?? null,
        delivery_method: input.delivery_method,
        delivery_address: deliveryAddress ?? '',
        signing_token: signingToken,
        signing_token_expires_at: tokenExpiresAt,
        is_archived: false,
        metadata: { created_via: 'api', api_key_id: auth.keyId },
      })
      .select()
      .single();

    const consent = consentData as ConsentRow | null;

    if (insertError || !consent) {
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to create consent record.' },
        { status: 500 },
      );
    }

    // 6. Deduct credit using the real consent ID
    const { data: creditDeducted, error: creditError } = await supabase.rpc('deduct_credit', {
      p_org_id: orgId,
      p_consent_id: consent.id,
      p_user_id: auth.keyId,
    });

    if (creditError || !creditDeducted) {
      // Rollback: delete the pending consent
      await supabase.from('consents').delete().eq('id', consent.id);
      return NextResponse.json(
        { error: 'Payment Required', message: 'Insufficient credits.' },
        { status: 402 },
      );
    }

    // Update status to 'sent' for non-manual delivery
    if (input.delivery_method !== 'manual') {
      await supabase
        .from('consents')
        .update({ status: 'sent' })
        .eq('id', consent.id);
    }

    // 7. Build signing URL
    const signingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sign/${signingToken}`;

    // 8. Send via channel
    let deliverySid: string | null = null;
    if (input.delivery_method !== 'manual' && deliveryAddress) {
      try {
        const driverFullName = `${driver.first_name} ${driver.last_name}`;
        if (input.delivery_method === 'sms') {
          const result = await sendConsentSMS({
            to: deliveryAddress,
            driverName: driverFullName,
            signingUrl,
            companyName,
            language: consent.language,
          });
          deliverySid = result.sid;
        } else if (input.delivery_method === 'whatsapp') {
          const result = await sendConsentWhatsApp({
            to: deliveryAddress,
            driverName: driverFullName,
            signingUrl,
            companyName,
            language: consent.language,
          });
          deliverySid = result.sid;
        } else if (input.delivery_method === 'email') {
          const result = await sendConsentEmail({
            to: deliveryAddress,
            driverName: driverFullName,
            signingUrl,
            companyName,
            language: consent.language,
          });
          deliverySid = result.messageId;
        }
      } catch {
        await supabase
          .from('consents')
          .update({ status: 'failed' })
          .eq('id', consent.id);

        return NextResponse.json(
          {
            error: 'Delivery Error',
            message: 'Consent created but delivery failed.',
            consent: { ...consent, status: 'failed' },
          },
          { status: 502 },
        );
      }
    }

    if (deliverySid) {
      await supabase
        .from('consents')
        .update({ delivery_sid: deliverySid })
        .eq('id', consent.id);
    }

    // Notification record
    if (input.delivery_method !== 'manual' && deliveryAddress) {
      await supabase.from('notifications').insert({
        organization_id: orgId,
        consent_id: consent.id,
        type: 'consent_link',
        channel: input.delivery_method,
        recipient: deliveryAddress,
        external_id: deliverySid,
        status: 'sent',
        attempts: 1,
        max_attempts: 3,
      });
    }

    // Audit log
    await supabase.from('audit_log').insert({
      organization_id: orgId,
      actor_id: auth.keyId,
      actor_type: 'api_key',
      action: 'consent.created',
      resource_type: 'consent',
      resource_id: consent.id,
      details: {
        driver_id: input.driver_id,
        consent_type: consent.consent_type,
        delivery_method: consent.delivery_method,
        api_key_id: auth.keyId,
      },
    });

    return NextResponse.json(
      {
        data: {
          ...consent,
          delivery_sid: deliverySid ?? consent.delivery_sid,
          signing_url: signingUrl,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('[POST /api/v1/consents]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/v1/consents — Public API: List consents for the API key's org
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    // Rate limit
    const ip = getClientIp(request);
    const rl = apiLimiter.check(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too Many Requests', message: 'Rate limit exceeded. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
      );
    }

    // 1. Authenticate via API key
    const auth = await authenticateApiKey(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or missing API key.' },
        { status: 401 },
      );
    }

    if (!auth.scopes.includes('consents:read') && !auth.scopes.includes('*')) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'API key does not have consents:read scope.' },
        { status: 403 },
      );
    }

    const supabase = createAdminClient();
    const orgId = auth.orgId;

    // 2. Parse query params
    const { searchParams } = request.nextUrl;
    const pagination = paginationSchema.safeParse({
      page: searchParams.get('page'),
      per_page: searchParams.get('per_page'),
      sort: searchParams.get('sort'),
      order: searchParams.get('order'),
    });

    if (!pagination.success) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Invalid pagination parameters.' },
        { status: 422 },
      );
    }

    const { page, per_page, sort, order } = pagination.data;
    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    // Filters
    const status = searchParams.get('status');
    const driverId = searchParams.get('driver_id');
    const createdAfter = searchParams.get('created_after');
    const createdBefore = searchParams.get('created_before');

    // 3. Build query
    let query = supabase
      .from('consents')
      .select(
        '*, driver:drivers(id, first_name, last_name, phone, email, cdl_number)',
        { count: 'exact' },
      )
      .eq('organization_id', orgId);

    if (status) query = query.eq('status', status as ConsentRow['status']);
    if (driverId) query = query.eq('driver_id', driverId);
    if (createdAfter) query = query.gte('created_at', createdAfter);
    if (createdBefore) query = query.lte('created_at', createdBefore);

    const sortColumn = (sort ?? 'created_at') as keyof ConsentRow;
    query = query.order(sortColumn, { ascending: order === 'asc' });
    query = query.range(from, to);

    const { data: consents, error: listError, count } = await query;

    if (listError) {
      console.error('[GET /api/v1/consents] query error:', listError);
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to fetch consents.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: consents ?? [],
      pagination: {
        page,
        per_page,
        total: count ?? 0,
        total_pages: count ? Math.ceil(count / per_page) : 0,
      },
    });
  } catch (err) {
    console.error('[GET /api/v1/consents]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
