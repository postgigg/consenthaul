import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { queryLimiter } from '@/lib/rate-limiters';
import { createQuerySchema } from '@/lib/validators';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// ---------------------------------------------------------------------------
// GET /api/queries — List query records for the org
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
    const { searchParams } = request.nextUrl;
    const driverId = searchParams.get('driver_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const perPage = Math.min(parseInt(searchParams.get('per_page') ?? '50', 10), 100);
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from('query_records')
      .select('*, driver:drivers(id, first_name, last_name, cdl_number)', { count: 'exact' })
      .eq('organization_id', orgId)
      .order('query_date', { ascending: false });

    if (driverId) query = query.eq('driver_id', driverId);
    if (dateFrom) query = query.gte('query_date', dateFrom);
    if (dateTo) query = query.lte('query_date', dateTo);
    query = query.range(from, to);

    const { data: records, error: listError, count } = await query;
    if (listError) {
      return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }

    return NextResponse.json({
      data: records ?? [],
      pagination: {
        page,
        per_page: perPage,
        total: count ?? 0,
        total_pages: count ? Math.ceil(count / perPage) : 0,
      },
    });
  } catch (err) {
    console.error('[GET /api/queries]', err);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/queries — Record a new query result
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

    const parsed = createQuerySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid query data.',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }

    const { driver_id, consent_id, query_date, result, result_notes } = parsed.data;

    // If consent_id provided, verify it belongs to same org
    if (consent_id) {
      const { data: consent } = await supabase
        .from('consents')
        .select('id')
        .eq('id', consent_id)
        .eq('organization_id', orgId)
        .single();

      if (!consent) {
        return NextResponse.json(
          { error: 'Not Found', message: 'Consent not found in your organization.' },
          { status: 404 },
        );
      }
    }

    // Verify driver belongs to org
    const { data: driver } = await supabase
      .from('drivers')
      .select('id')
      .eq('id', driver_id)
      .eq('organization_id', orgId)
      .single();

    if (!driver) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Driver not found in your organization.' },
        { status: 404 },
      );
    }

    const { data: record, error: insertError } = await supabase
      .from('query_records')
      .insert({
        organization_id: orgId,
        driver_id,
        consent_id: consent_id ?? null,
        query_type: 'limited',
        query_date,
        result: (result ?? 'pending') as Database['public']['Tables']['query_records']['Row']['result'],
        result_notes: result_notes ?? null,
        recorded_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[POST /api/queries] insert error:', insertError);
      return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }

    // Audit log
    await supabase.from('audit_log').insert({
      organization_id: orgId,
      actor_id: user.id,
      actor_type: 'user',
      action: 'query.recorded',
      resource_type: 'query_record',
      resource_id: (record as { id: string }).id,
      details: { driver_id, query_date, result: result ?? 'pending' },
    });

    return NextResponse.json({ data: record }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/queries]', err);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
