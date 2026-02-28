import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
  if (!profile) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

  const driverId = params.id;
  const orgId = profile.organization_id;

  // Verify driver belongs to org
  const { data: driver } = await supabase
    .from('drivers')
    .select('id, first_name, last_name')
    .eq('id', driverId)
    .eq('organization_id', orgId)
    .single();

  if (!driver) return NextResponse.json({ error: 'Driver not found' }, { status: 404 });

  const today = new Date().toISOString().slice(0, 10);

  // 1. Update driver status
  await admin.from('drivers').update({
    is_active: false,
    termination_date: today,
    onboarding_status: 'terminated',
  }).eq('id', driverId);

  // 2. Cancel pending consents
  const { data: pendingConsents } = await admin
    .from('consents')
    .select('id')
    .eq('driver_id', driverId)
    .eq('organization_id', orgId)
    .in('status', ['pending', 'sent', 'delivered', 'opened']);

  if (pendingConsents && pendingConsents.length > 0) {
    await admin
      .from('consents')
      .update({ status: 'expired', is_archived: true })
      .in('id', pendingConsents.map(c => c.id));
  }

  // 3. Archive signed consents
  await admin
    .from('consents')
    .update({ is_archived: true })
    .eq('driver_id', driverId)
    .eq('organization_id', orgId)
    .eq('status', 'signed');

  // 4. Audit log
  await admin.from('audit_log').insert({
    organization_id: orgId,
    actor_id: user.id,
    actor_type: 'user',
    action: 'driver.terminated',
    resource_type: 'driver',
    resource_id: driverId,
    details: {
      driver_name: `${driver.first_name} ${driver.last_name}`,
      termination_date: today,
      cancelled_consents: pendingConsents?.length ?? 0,
    },
  });

  return NextResponse.json({
    data: {
      terminated: true,
      cancelled_consents: pendingConsents?.length ?? 0,
    },
  });
}
