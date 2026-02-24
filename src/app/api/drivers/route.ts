import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDriverSchema, paginationSchema } from '@/lib/validators';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type DriverRow = Database['public']['Tables']['drivers']['Row'];

// ---------------------------------------------------------------------------
// POST /api/drivers — Create a new driver
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

    // 3. Get org id
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

    // 4. Check for duplicate (same CDL in the same org)
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
            message: `A driver with CDL number "${input.cdl_number}" already exists in your organization.`,
          },
          { status: 409 },
        );
      }
    }

    // 5. Insert driver
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
        metadata: {},
      })
      .select()
      .single();

    const driver = driverData as DriverRow | null;

    if (insertError || !driver) {
      console.error('[POST /api/drivers] insert error:', insertError);
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to create driver.' },
        { status: 500 },
      );
    }

    // 6. Audit log
    await supabase.from('audit_log').insert({
      organization_id: orgId,
      actor_id: user.id,
      actor_type: 'user',
      action: 'driver.created',
      resource_type: 'driver',
      resource_id: driver.id,
      details: {
        first_name: driver.first_name,
        last_name: driver.last_name,
      },
    });

    return NextResponse.json({ data: driver }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/drivers]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/drivers — List drivers for the authenticated user's org
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

    // 3. Parse pagination
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

    // 4. Build query
    let query = supabase
      .from('drivers')
      .select('*', { count: 'exact' })
      .eq('organization_id', orgId);

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      query = query.eq('is_active', isActive === 'true');
    }

    if (search) {
      // Full-text search across name, email, phone, CDL
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,cdl_number.ilike.%${search}%`,
      );
    }

    // Sorting
    const sortColumn = (sort ?? 'created_at') as keyof DriverRow;
    query = query.order(sortColumn, { ascending: order === 'asc' });
    query = query.range(from, to);

    const { data: drivers, error: listError, count } = await query;

    if (listError) {
      console.error('[GET /api/drivers] query error:', listError);
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
    console.error('[GET /api/drivers]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
