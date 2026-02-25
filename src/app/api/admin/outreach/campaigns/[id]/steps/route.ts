import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createStepSchema, updateStepSchema } from '@/lib/outreach/validators';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await getAdminUserApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = createStepSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation Error', details: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('outreach_sequence_steps')
      .insert({ campaign_id: params.id, ...parsed.data })
      .select()
      .single();

    if (error) {
      console.error('[POST steps]', error);
      return NextResponse.json({ error: 'Failed to create step' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/outreach/campaigns/[id]/steps]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await getAdminUserApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { step_id, ...updates } = body;

    if (!step_id) {
      return NextResponse.json({ error: 'step_id is required' }, { status: 400 });
    }

    const parsed = updateStepSchema.safeParse(updates);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation Error', details: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('outreach_sequence_steps')
      .update(parsed.data)
      .eq('id', step_id)
      .eq('campaign_id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update step' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[PATCH steps]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await getAdminUserApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const stepId = searchParams.get('stepId');

  if (!stepId) {
    return NextResponse.json({ error: 'stepId query param is required' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('outreach_sequence_steps')
    .delete()
    .eq('id', stepId)
    .eq('campaign_id', params.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete step' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
