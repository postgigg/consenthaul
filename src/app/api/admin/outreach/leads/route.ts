import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createLeadSchema } from '@/lib/outreach/validators';
import { calculateBaseScore } from '@/lib/outreach/lead-scoring';
import { escapeSearchParam } from '@/lib/utils';
import { checkRateLimit } from '@/lib/rate-limit';
import { adminLimiter } from '@/lib/rate-limiters';

const ALLOWED_SORT_COLUMNS: ReadonlySet<string> = new Set([
  'created_at', 'updated_at', 'company_name', 'dot_number', 'email',
  'lead_score', 'fleet_size', 'pipeline_stage', 'state',
]);

const ALLOWED_SORT_DIRS: ReadonlySet<string> = new Set(['asc', 'desc']);

export async function GET(request: NextRequest) {
  const blocked = await checkRateLimit(request, adminLimiter);
  if (blocked) return blocked;

  const admin = await getAdminUserApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '0', 10);
  const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') ?? '20', 10), 1), 100);
  const search = searchParams.get('search') ?? '';
  const sortBy = searchParams.get('sortBy') ?? 'created_at';
  const sortDirRaw = searchParams.get('sortDir') ?? 'desc';
  const stage = searchParams.get('stage');
  const state = searchParams.get('state');
  const fleetMin = searchParams.get('fleetMin');
  const fleetMax = searchParams.get('fleetMax');
  const hasEmail = searchParams.get('hasEmail');
  const tag = searchParams.get('tag');

  if (!ALLOWED_SORT_COLUMNS.has(sortBy)) {
    return NextResponse.json({ error: `Invalid sort column: ${sortBy}` }, { status: 422 });
  }
  if (!ALLOWED_SORT_DIRS.has(sortDirRaw)) {
    return NextResponse.json({ error: `Invalid sort direction: ${sortDirRaw}` }, { status: 422 });
  }
  const sortDir = sortDirRaw as 'asc' | 'desc';

  const supabase = createAdminClient();

  let query = supabase.from('outreach_leads').select('*', { count: 'exact' });

  if (search) {
    const s = escapeSearchParam(search);
    query = query.or(
      `company_name.ilike.%${s}%,dot_number.ilike.%${s}%,email.ilike.%${s}%,contact_name.ilike.%${s}%`,
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
  const blocked = await checkRateLimit(request, adminLimiter);
  if (blocked) return blocked;

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
