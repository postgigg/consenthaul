import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createLeadSchema } from '@/lib/outreach/validators';
import { calculateBaseScore } from '@/lib/outreach/lead-scoring';

export async function GET(request: NextRequest) {
  const admin = await getAdminUserApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '0', 10);
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10);
  const search = searchParams.get('search') ?? '';
  const sortBy = searchParams.get('sortBy') ?? 'created_at';
  const sortDir = (searchParams.get('sortDir') ?? 'desc') as 'asc' | 'desc';
  const stage = searchParams.get('stage');
  const state = searchParams.get('state');
  const fleetMin = searchParams.get('fleetMin');
  const fleetMax = searchParams.get('fleetMax');
  const hasEmail = searchParams.get('hasEmail');
  const tag = searchParams.get('tag');

  const supabase = createAdminClient();

  let query = supabase.from('outreach_leads').select('*', { count: 'exact' });

  if (search) {
    query = query.or(
      `company_name.ilike.%${search}%,dot_number.ilike.%${search}%,email.ilike.%${search}%,contact_name.ilike.%${search}%`,
    );
  }

  if (stage) query = query.eq('pipeline_stage', stage as 'lead' | 'contacted' | 'replied' | 'demo' | 'trial' | 'customer' | 'lost');
  if (state) query = query.eq('state', state.toUpperCase());
  if (fleetMin) query = query.gte('fleet_size', parseInt(fleetMin, 10));
  if (fleetMax) query = query.lte('fleet_size', parseInt(fleetMax, 10));
  if (hasEmail === 'true') query = query.not('email', 'is', null);
  if (tag) query = query.contains('tags', [tag]);

  query = query
    .order(sortBy, { ascending: sortDir === 'asc' })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('[GET /api/admin/outreach/leads]', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [], total: count ?? 0 });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminUserApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = createLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation Error', details: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const leadData = parsed.data;
    const score = calculateBaseScore(leadData as Record<string, unknown>);

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('outreach_leads')
      .insert({ ...leadData, lead_score: score, lead_source: leadData.lead_source ?? 'manual' })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/admin/outreach/leads]', error);
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/outreach/leads]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
