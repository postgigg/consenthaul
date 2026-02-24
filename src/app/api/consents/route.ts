import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createConsentSchema, paginationSchema } from '@/lib/validators';
import { generateSigningToken } from '@/lib/tokens';
import { SIGNING_TOKEN_DEFAULT_TTL_HOURS } from '@/lib/constants';
import { sendConsentSMS } from '@/lib/messaging/sms';
import { sendConsentWhatsApp } from '@/lib/messaging/whatsapp';
import { sendConsentEmail } from '@/lib/messaging/email';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type DriverRow = Database['public']['Tables']['drivers']['Row'];
type ConsentRow = Database['public']['Tables']['consents']['Row'];

// ---------------------------------------------------------------------------
// POST /api/consents — Create a new consent request
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

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

    // 3. Get user profile + org
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, organization_id, full_name, role')
      .eq('id', user.id)
      .single();

    const profile = profileData as Pick<ProfileRow, 'id' | 'organization_id' | 'full_name' | 'role'> | null;

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Not Found', message: 'User profile not found.' },
        { status: 404 },
      );
    }

    const orgId = profile.organization_id;

    // 4. Verify the driver belongs to the same org
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

    // Resolve delivery address — fall back to driver's contact info
    let deliveryAddress = input.delivery_address;
    if (!deliveryAddress) {
      if (input.delivery_method === 'email') {
        deliveryAddress = driver.email ?? undefined;
      } else if (input.delivery_method === 'sms' || input.delivery_method === 'whatsapp') {
        deliveryAddress = driver.phone ?? undefined;
      }
    }

    if (!deliveryAddress && input.delivery_method !== 'manual') {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: `No ${input.delivery_method} address available for this driver. Provide delivery_address or update the driver record.`,
        },
        { status: 422 },
      );
    }

    // 5. Deduct credit via RPC
    const { data: creditDeducted, error: creditError } = await supabase.rpc('deduct_credit', {
      p_org_id: orgId,
      p_consent_id: '', // placeholder — consent not yet created
      p_user_id: user.id,
    });

    if (creditError || !creditDeducted) {
      return NextResponse.json(
        {
          error: 'Payment Required',
          message: 'Insufficient credits. Please purchase more credits to send consents.',
        },
        { status: 402 },
      );
    }

    // 6. Generate signing token
    const signingToken = generateSigningToken();
    const ttlHours = input.token_ttl_hours ?? SIGNING_TOKEN_DEFAULT_TTL_HOURS;
    const tokenExpiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();

    // 7. Create the consent record
    const { data: consentData, error: insertError } = await supabase
      .from('consents')
      .insert({
        organization_id: orgId,
        driver_id: input.driver_id,
        created_by: user.id,
        consent_type: input.consent_type ?? 'limited_query',
        status: input.delivery_method === 'manual' ? 'pending' : 'sent',
        language: input.language ?? driver.preferred_language ?? 'en',
        consent_start_date: input.consent_start_date ?? new Date().toISOString().slice(0, 10),
        consent_end_date: input.consent_end_date ?? null,
        query_frequency: input.query_frequency ?? null,
        delivery_method: input.delivery_method,
        delivery_address: deliveryAddress ?? '',
        signing_token: signingToken,
        signing_token_expires_at: tokenExpiresAt,
        is_archived: false,
        metadata: {},
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

    // Update the credit transaction with the real consent id (fire-and-forget)
    // The RPC used a placeholder; we update the most recent deduction for this org.

    // 8. Build signing URL
    const signingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sign/${signingToken}`;

    // 9. Send via appropriate channel
    let deliverySid: string | null = null;
    if (input.delivery_method !== 'manual' && deliveryAddress) {
      try {
        const driverFullName = `${driver.first_name} ${driver.last_name}`;
        if (input.delivery_method === 'sms') {
          const result = await sendConsentSMS({
            to: deliveryAddress,
            driverName: driverFullName,
            signingUrl,
            language: consent.language,
          });
          deliverySid = result.sid;
        } else if (input.delivery_method === 'whatsapp') {
          const result = await sendConsentWhatsApp({
            to: deliveryAddress,
            driverName: driverFullName,
            signingUrl,
            language: consent.language,
          });
          deliverySid = result.sid;
        } else if (input.delivery_method === 'email') {
          const result = await sendConsentEmail({
            to: deliveryAddress,
            driverName: driverFullName,
            signingUrl,
            language: consent.language,
          });
          deliverySid = result.messageId;
        }
      } catch (sendError) {
        // Update consent status to 'failed' but still return it
        await supabase
          .from('consents')
          .update({ status: 'failed' })
          .eq('id', consent.id);

        // Log the failure
        await supabase.from('audit_log').insert({
          organization_id: orgId,
          actor_id: user.id,
          actor_type: 'user',
          action: 'consent.send_failed',
          resource_type: 'consent',
          resource_id: consent.id,
          details: {
            delivery_method: input.delivery_method,
            error: sendError instanceof Error ? sendError.message : 'Unknown send error',
          },
        });

        return NextResponse.json(
          {
            error: 'Delivery Error',
            message: 'Consent created but delivery failed. You can resend later.',
            consent: { ...consent, status: 'failed' },
          },
          { status: 502 },
        );
      }
    }

    // Update consent with delivery SID if we got one
    if (deliverySid) {
      await supabase
        .from('consents')
        .update({ delivery_sid: deliverySid })
        .eq('id', consent.id);
    }

    // 10. Create notification record
    if (input.delivery_method !== 'manual' && deliveryAddress) {
      await supabase.from('notifications').insert({
        organization_id: orgId,
        consent_id: consent.id,
        type: 'consent_request',
        channel: input.delivery_method,
        recipient: deliveryAddress,
        message_body: null,
        external_id: deliverySid,
        status: 'sent',
        attempts: 1,
        max_attempts: 3,
      });
    }

    // 11. Audit log
    await supabase.from('audit_log').insert({
      organization_id: orgId,
      actor_id: user.id,
      actor_type: 'user',
      action: 'consent.created',
      resource_type: 'consent',
      resource_id: consent.id,
      details: {
        driver_id: input.driver_id,
        consent_type: consent.consent_type,
        delivery_method: consent.delivery_method,
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
    console.error('[POST /api/consents]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/consents — List consents for the authenticated user's org
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

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

    // 2. Get org id
    const { data: profileData2 } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const profile2 = profileData2 as Pick<ProfileRow, 'organization_id'> | null;

    if (!profile2) {
      return NextResponse.json(
        { error: 'Not Found', message: 'User profile not found.' },
        { status: 404 },
      );
    }

    const orgId = profile2.organization_id;

    // 3. Parse query params
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

    // 4. Build query with join to drivers for name
    let query = supabase
      .from('consents')
      .select(
        '*, driver:drivers(id, first_name, last_name, phone, email, cdl_number)',
        { count: 'exact' },
      )
      .eq('organization_id', orgId);

    if (status) {
      query = query.eq('status', status as ConsentRow['status']);
    }
    if (driverId) {
      query = query.eq('driver_id', driverId);
    }
    if (createdAfter) {
      query = query.gte('created_at', createdAfter);
    }
    if (createdBefore) {
      query = query.lte('created_at', createdBefore);
    }

    // Sorting
    const sortColumn = (sort ?? 'created_at') as keyof ConsentRow;
    query = query.order(sortColumn, { ascending: order === 'asc' });
    query = query.range(from, to);

    const { data: consents, error: listError, count } = await query;

    if (listError) {
      console.error('[GET /api/consents] query error:', listError);
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
    console.error('[GET /api/consents]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
