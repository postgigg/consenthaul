import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createCampaignSchema } from '@/lib/outreach/validators';
import { checkRateLimit } from '@/lib/rate-limit';
import { adminLimiter } from '@/lib/rate-limiters';

export async function GET(request: NextRequest) {
  const blocked = await checkRateLimit(request, adminLimiter);
  if (blocked) return blocked;

  const admin = await getAdminUserApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '0', 10);
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10);
  const status = searchParams.get('status');

  const supabase = createAdminClient();

  let query = supabase.from('outreach_campaigns').select('*', { count: 'exact' });

  if (status) query = query.eq('status', status as 'draft' | 'active' | 'paused' | 'completed');

  query = query
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  // Get enrolled counts per campaign
  const enriched = await Promise.all(
    (data ?? []).map(async (campaign) => {
      const { count: enrolledCount } = await supabase
        .from('outreach_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id);

      const { count: stepsCount } = await supabase
        .from('outreach_sequence_steps')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id);

      return {
        ...campaign,
        enrolled_count: enrolledCount ?? 0,
        steps_count: stepsCount ?? 0,
      };
    }),
  );

  return NextResponse.json({ data: enriched, total: count ?? 0 });
}

export async function POST(request: NextRequest) {
  const blocked = await checkRateLimit(request, adminLimiter);
  if (blocked) return blocked;

  const admin = await getAdminUserApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = createCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation Error', details: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('outreach_campaigns')
      .insert({
        name: parsed.data.name,
        description: parsed.data.description,
        target_filters: parsed.data.target_filters ?? {},
        send_settings: parsed.data.send_settings ?? {
          daily_limit: 50,
          send_window_start: '09:00',
          send_window_end: '17:00',
          timezone: 'America/Chicago',
          from_name: 'ConsentHaul',
          from_email: 'outreach@consenthaul.com',
        },
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/outreach/campaigns]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
