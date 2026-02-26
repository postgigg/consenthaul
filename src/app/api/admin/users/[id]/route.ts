import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminUserApi();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const supabase = createAdminClient();

  // Prevent admin from removing their own admin status
  if (params.id === admin.id && 'is_platform_admin' in body && body.is_platform_admin === false) {
    return NextResponse.json({ error: 'Cannot remove your own admin status' }, { status: 403 });
  }

  // Only allow specific fields to be updated
  const allowedFields = ['is_active', 'role', 'is_platform_admin'];
  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 422 });
  }

  // Fetch current profile to get org_id for audit
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', params.id)
    .single();

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    console.error('[PATCH /api/admin/users/[id]]', error.message);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  // Audit log
  if (currentProfile) {
    await supabase.from('audit_log').insert({
      organization_id: currentProfile.organization_id,
      actor_id: admin.id,
      actor_type: 'platform_admin',
      action: 'update_user',
      resource_type: 'profile',
      resource_id: params.id,
      details: updates as Record<string, string | number | boolean | null>,
    });
  }

  return NextResponse.json(data);
}
