import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { dispatchWebhookEvent } from '@/lib/webhooks';
import { z } from 'zod';

const batchRevokeSchema = z.object({
  consent_ids: z.array(z.string().uuid()).min(1).max(500).optional(),
  template_id: z.string().uuid().optional(),
  reason: z.string().min(1).max(1000),
}).refine(data => data.consent_ids || data.template_id, {
  message: 'Either consent_ids or template_id is required',
});

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  if (!profile || !['owner', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden', message: 'Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = batchRevokeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Validation Error', details: parsed.error.flatten() }, { status: 422 });

  const { consent_ids, template_id, reason } = parsed.data;
  const orgId = profile.organization_id;

  // Build query for consents to revoke
  let query = admin
    .from('consents')
    .select('id')
    .eq('organization_id', orgId)
    .eq('status', 'signed');

  if (consent_ids) {
    query = query.in('id', consent_ids);
  }
  if (template_id) {
    query = query.eq('template_id', template_id);
  }

  const { data: consentsToRevoke } = await query;
  if (!consentsToRevoke || consentsToRevoke.length === 0) {
    return NextResponse.json({ data: { revoked: 0 } });
  }

  const ids = consentsToRevoke.map(c => c.id);

  // Batch update
  const { error: updateError } = await admin
    .from('consents')
    .update({ status: 'revoked' })
    .in('id', ids);

  if (updateError) return NextResponse.json({ error: 'Failed to revoke' }, { status: 500 });

  // Audit log for each
  const auditEntries = ids.map(id => ({
    organization_id: orgId,
    actor_id: user.id,
    actor_type: 'user',
    action: 'consent.batch_revoked',
    resource_type: 'consent',
    resource_id: id,
    details: { reason, batch_size: ids.length, template_id: template_id ?? null },
  }));

  await admin.from('audit_log').insert(auditEntries);

  // Dispatch webhooks
  for (const id of ids) {
    dispatchWebhookEvent({
      eventType: 'consent.revoked',
      consentId: id,
      organizationId: orgId,
    }).catch(() => {});
  }

  return NextResponse.json({ data: { revoked: ids.length, consent_ids: ids } });
}
