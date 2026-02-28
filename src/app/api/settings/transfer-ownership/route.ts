import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const initiateSchema = z.object({
  target_user_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();
  if (!profile || profile.role !== 'owner') {
    return NextResponse.json({ error: 'Only the owner can transfer ownership' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = initiateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Validation Error' }, { status: 422 });

  // Verify target is in same org
  const admin = createAdminClient();
  const { data: target } = await admin.from('profiles')
    .select('id, full_name, role')
    .eq('id', parsed.data.target_user_id)
    .eq('organization_id', profile.organization_id)
    .eq('is_active', true)
    .single();
  if (!target) return NextResponse.json({ error: 'Target user not found' }, { status: 404 });

  await admin.from('organizations').update({
    pending_owner_transfer_to: parsed.data.target_user_id,
    owner_transfer_requested_at: new Date().toISOString(),
  }).eq('id', profile.organization_id);

  await admin.from('audit_log').insert({
    organization_id: profile.organization_id,
    actor_id: user.id,
    actor_type: 'user',
    action: 'organization.ownership_transfer_initiated',
    resource_type: 'organization',
    resource_id: profile.organization_id,
    details: { target_user_id: parsed.data.target_user_id, target_name: target.full_name },
  });

  return NextResponse.json({ data: { initiated: true, target: target.full_name } });
}

// PUT to accept the transfer
export async function PUT() {
  const supabase = createClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();
  if (!profile) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

  const { data: org } = await admin.from('organizations')
    .select('pending_owner_transfer_to')
    .eq('id', profile.organization_id)
    .single();

  if (!org || org.pending_owner_transfer_to !== user.id) {
    return NextResponse.json({ error: 'No pending transfer for you' }, { status: 403 });
  }

  // Find current owner
  const { data: currentOwner } = await admin.from('profiles')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .eq('role', 'owner')
    .single();

  // Swap roles
  if (currentOwner) {
    await admin.from('profiles').update({ role: 'admin' }).eq('id', currentOwner.id);
  }
  await admin.from('profiles').update({ role: 'owner' }).eq('id', user.id);

  // Clear transfer
  await admin.from('organizations').update({
    pending_owner_transfer_to: null,
    owner_transfer_requested_at: null,
  }).eq('id', profile.organization_id);

  await admin.from('audit_log').insert({
    organization_id: profile.organization_id,
    actor_id: user.id,
    actor_type: 'user',
    action: 'organization.ownership_transferred',
    resource_type: 'organization',
    resource_id: profile.organization_id,
    details: { from: currentOwner?.id, to: user.id },
  });

  return NextResponse.json({ data: { transferred: true } });
}
