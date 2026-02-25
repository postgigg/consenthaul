import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { updateLeadSchema } from '@/lib/outreach/validators';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await getAdminUserApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();

  const { data: lead, error } = await supabase
    .from('outreach_leads')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  // Fetch events for this lead
  const { data: events } = await supabase
    .from('outreach_events')
    .select('*')
    .eq('lead_id', params.id)
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch enrollments
  const { data: enrollments } = await supabase
    .from('outreach_enrollments')
    .select('*, outreach_campaigns(name, status)')
    .eq('lead_id', params.id);

  return NextResponse.json({ data: { ...lead, events: events ?? [], enrollments: enrollments ?? [] } });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await getAdminUserApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = updateLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation Error', details: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('outreach_leads')
      .update(parsed.data)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[PATCH /api/admin/outreach/leads/[id]]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await getAdminUserApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  const { error } = await supabase.from('outreach_leads').delete().eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
