import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { adminLimiter } from '@/lib/rate-limiters';
import { z } from 'zod';

const suspendSchema = z.object({
  action: z.enum(['suspend', 'unsuspend']),
  reason: z.string().max(1000).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const blocked = await checkRateLimit(request, adminLimiter);
  if (blocked) return blocked;

  const admin = await getAdminUserApi();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = suspendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation Error', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { action, reason } = parsed.data;
  const orgId = params.id;
  const supabase = createAdminClient();

  // Verify the organization exists
  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .select('id, name, is_suspended')
    .eq('id', orgId)
    .single();

  if (orgErr || !org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  // Prevent redundant operations
  if (action === 'suspend' && org.is_suspended) {
    return NextResponse.json(
      { error: 'Organization is already suspended' },
      { status: 409 },
    );
  }
  if (action === 'unsuspend' && !org.is_suspended) {
    return NextResponse.json(
      { error: 'Organization is not suspended' },
      { status: 409 },
    );
  }

  if (action === 'suspend') {
    const { error: updateErr } = await supabase
      .from('organizations')
      .update({
        is_suspended: true,
        suspended_at: new Date().toISOString(),
        suspended_reason: reason ?? null,
      })
      .eq('id', orgId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
  } else {
    const { error: updateErr } = await supabase
      .from('organizations')
      .update({
        is_suspended: false,
        suspended_at: null,
        suspended_reason: null,
      })
      .eq('id', orgId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
  }

  // Audit log
  await supabase.from('audit_log').insert({
    organization_id: orgId,
    actor_id: admin.id,
    actor_type: 'platform_admin',
    action: action === 'suspend' ? 'organization.suspended' : 'organization.unsuspended',
    resource_type: 'organization',
    resource_id: orgId,
    details: { reason: reason ?? null } as Record<string, string | null>,
  });

  // If suspending, notify org admins via in-app notification
  if (action === 'suspend') {
    const { data: orgAdmins } = await supabase
      .from('profiles')
      .select('id')
      .eq('organization_id', orgId)
      .in('role', ['owner', 'admin'])
      .eq('is_active', true);

    if (orgAdmins && orgAdmins.length > 0) {
      for (const orgAdmin of orgAdmins) {
        await supabase.from('in_app_notifications').insert({
          user_id: orgAdmin.id,
          organization_id: orgId,
          title: 'Organization Suspended',
          body: reason
            ? `Your organization has been suspended. Reason: ${reason}`
            : 'Your organization has been suspended. Please contact support for more information.',
          type: 'error',
          action_url: '/settings',
        });
      }
    }
  }

  return NextResponse.json({
    data: {
      action,
      organization_id: orgId,
      organization_name: org.name,
    },
  });
}
