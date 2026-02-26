import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { adminLimiter } from '@/lib/rate-limiters';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const blocked = await checkRateLimit(request, adminLimiter);
  if (blocked) return blocked;

  const admin = await getAdminUserApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { lead_ids } = await request.json();

    if (!Array.isArray(lead_ids) || lead_ids.length === 0) {
      return NextResponse.json({ error: 'lead_ids array is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify campaign exists
    const { data: campaign } = await supabase
      .from('outreach_campaigns')
      .select('id, status')
      .eq('id', params.id)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Filter out leads that are do_not_contact or already enrolled
    const { data: leads } = await supabase
      .from('outreach_leads')
      .select('id')
      .in('id', lead_ids)
      .eq('do_not_contact', false);

    const validLeadIds = (leads ?? []).map((l) => l.id);

    const { data: existingEnrollments } = await supabase
      .from('outreach_enrollments')
      .select('lead_id')
      .eq('campaign_id', params.id)
      .in('lead_id', validLeadIds);

    const alreadyEnrolled = new Set((existingEnrollments ?? []).map((e) => e.lead_id));
    const newLeadIds = validLeadIds.filter((id) => !alreadyEnrolled.has(id));

    if (newLeadIds.length === 0) {
      return NextResponse.json({
        data: { enrolled: 0, skipped: lead_ids.length },
      });
    }

    const enrollments = newLeadIds.map((lead_id) => ({
      campaign_id: params.id,
      lead_id,
      status: 'active' as const,
      current_step: 0,
      next_send_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('outreach_enrollments').insert(enrollments);

    if (error) {
      console.error('[Enroll]', error);
      return NextResponse.json({ error: 'Enrollment failed' }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        enrolled: newLeadIds.length,
        skipped: lead_ids.length - newLeadIds.length,
      },
    });
  } catch (err) {
    console.error('[POST /api/admin/outreach/campaigns/[id]/enroll]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
