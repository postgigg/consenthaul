import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
  if (!profile) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

  const orgId = profile.organization_id;

  const [drivers, consents, queries] = await Promise.all([
    supabase.from('drivers').select('id, is_active, onboarding_status').eq('organization_id', orgId),
    supabase.from('consents').select('id, status, consent_type, signed_at, consent_end_date').eq('organization_id', orgId),
    supabase.from('query_records').select('id, result, escalation_status, query_date').eq('organization_id', orgId),
  ]);

  const activeDrivers = drivers.data?.filter(d => d.is_active).length ?? 0;
  const totalConsents = consents.data?.length ?? 0;
  const signedConsents = consents.data?.filter(c => c.status === 'signed').length ?? 0;
  const expiredConsents = consents.data?.filter(c => c.status === 'expired').length ?? 0;
  const pendingConsents = consents.data?.filter(c => ['pending', 'sent', 'delivered', 'opened'].includes(c.status)).length ?? 0;

  // Calculate compliance score
  const complianceScore = activeDrivers > 0
    ? Math.round((signedConsents / Math.max(activeDrivers, 1)) * 100)
    : 100;

  const violations = queries.data?.filter(q => q.result === 'violations_found').length ?? 0;
  const pendingEscalations = queries.data?.filter(q => q.escalation_status === 'pending').length ?? 0;

  return NextResponse.json({
    data: {
      compliance_score: Math.min(complianceScore, 100),
      active_drivers: activeDrivers,
      total_consents: totalConsents,
      signed_consents: signedConsents,
      expired_consents: expiredConsents,
      pending_consents: pendingConsents,
      violations_found: violations,
      pending_escalations: pendingEscalations,
      drivers_without_consent: activeDrivers - signedConsents,
    },
  });
}
