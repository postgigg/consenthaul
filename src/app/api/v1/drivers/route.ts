import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateApiKey } from '@/lib/api-auth';
import { createDriverSchema, paginationSchema } from '@/lib/validators';
import { apiLimiter } from '@/lib/rate-limiters';
import { getClientIp } from '@/lib/rate-limit';
import type { Database } from '@/types/database';

type DriverRow = Database['public']['Tables']['drivers']['Row'];

// ---------------------------------------------------------------------------
// POST /api/v1/drivers — Public API: Create a new driver
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

    if (!auth.scopes.includes('drivers:write') && !auth.scopes.includes('*')) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'API key does not have drivers:write scope.' },
        { status: 403 },
      );
    }

    const supabase = createAdminClient();
    const orgId = auth.orgId;

    // 2. Parse & validate
    const body = await request.json();
    const parsed = createDriverSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid driver data.',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }

    const input = parsed.data;

    // 3. Duplicate check (CDL within org)
    if (input.cdl_number) {
      const { data: existingData } = await supabase
        .from('drivers')
        .select('id')
        .eq('organization_id', orgId)
        .eq('cdl_number', input.cdl_number)
        .limit(1)
        .single();

      const existing = existingData as Pick<DriverRow, 'id'> | null;

      if (existing) {
        return NextResponse.json(
          {
            error: 'Conflict',
            message: `A driver with CDL number "${input.cdl_number}" already exists.`,
          },
          { status: 409 },
        );
      }
    }

    // 4. Insert driver
    const { data: driverData, error: insertError } = await supabase
      .from('drivers')
      .insert({
        organization_id: orgId,
        first_name: input.first_name,
        last_name: input.last_name,
        phone: input.phone ?? null,
        email: input.email ?? null,
        cdl_number: input.cdl_number ?? null,
        cdl_state: input.cdl_state ?? null,
        date_of_birth: input.date_of_birth ?? null,
        hire_date: input.hire_date ?? null,
        preferred_language: input.preferred_language ?? 'en',
        is_active: true,
        metadata: { created_via: 'api', api_key_id: auth.keyId },
      })
      .select()
      .single();

    const driver = driverData as DriverRow | null;

    if (insertError || !driver) {
      console.error('[POST /api/v1/drivers] insert error:', insertError);
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to create driver.' },
        { status: 500 },
      );
    }

    // 5. Audit log
    await supabase.from('audit_log').insert({
      organization_id: orgId,
      actor_id: auth.keyId,
      actor_type: 'api_key',
      action: 'driver.created',
      resource_type: 'driver',
      resource_id: driver.id,
      details: {
        first_name: driver.first_name,
        last_name: driver.last_name,
        api_key_id: auth.keyId,
      },
    });

    return NextResponse.json({ data: driver }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/v1/drivers]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/v1/drivers — Public API: List drivers for the API key's org
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

    if (!auth.scopes.includes('drivers:read') && !auth.scopes.includes('*')) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'API key does not have drivers:read scope.' },
        { status: 403 },
      );
    }

    const supabase = createAdminClient();
    const orgId = auth.orgId;

    // 2. Parse pagination
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
    const search = searchParams.get('search');
    const isActive = searchParams.get('is_active');

    // 3. Build query
    let query = supabase
      .from('drivers')
      .select('*', { count: 'exact' })
      .eq('organization_id', orgId);

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      query = query.eq('is_active', isActive === 'true');
    }

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,cdl_number.ilike.%${search}%`,
      );
    }

    const sortColumn = (sort ?? 'created_at') as keyof DriverRow;
    query = query.order(sortColumn, { ascending: order === 'asc' });
    query = query.range(from, to);

    const { data: drivers, error: listError, count } = await query;

    if (listError) {
      console.error('[GET /api/v1/drivers] query error:', listError);
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to fetch drivers.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: drivers ?? [],
      pagination: {
        page,
        per_page,
        total: count ?? 0,
        total_pages: count ? Math.ceil(count / per_page) : 0,
      },
    });
  } catch (err) {
    console.error('[GET /api/v1/drivers]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
