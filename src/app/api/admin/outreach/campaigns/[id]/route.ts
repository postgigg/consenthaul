import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { updateCampaignSchema } from '@/lib/outreach/validators';
import { checkRateLimit } from '@/lib/rate-limit';
import { adminLimiter } from '@/lib/rate-limiters';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const blocked = await checkRateLimit(request, adminLimiter);
  if (blocked) return blocked;

  const admin = await getAdminUserApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();

  const { data: campaign, error } = await supabase
    .from('outreach_campaigns')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  // Fetch steps
  const { data: steps } = await supabase
    .from('outreach_sequence_steps')
    .select('*')
    .eq('campaign_id', params.id)
    .order('step_order', { ascending: true });

  // Fetch enrollments with lead info
  const { data: enrollments } = await supabase
    .from('outreach_enrollments')
    .select('*, outreach_leads(company_name, email, pipeline_stage)')
    .eq('campaign_id', params.id)
    .order('created_at', { ascending: false })
    .limit(100);

  // Enrolled count
  const { count: enrolledCount } = await supabase
    .from('outreach_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', params.id);

  return NextResponse.json({
    data: {
      ...campaign,
      steps: steps ?? [],
      enrollments: enrollments ?? [],
      enrolled_count: enrolledCount ?? 0,
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const blocked = await checkRateLimit(request, adminLimiter);
  if (blocked) return blocked;

  const admin = await getAdminUserApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = updateCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation Error', details: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('outreach_campaigns')
      .update(parsed.data)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[PATCH /api/admin/outreach/campaigns/[id]]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const blocked = await checkRateLimit(request, adminLimiter);
  if (blocked) return blocked;

  const admin = await getAdminUserApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  const { error } = await supabase.from('outreach_campaigns').delete().eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
