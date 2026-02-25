import { NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const admin = await getAdminUserApi();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Run all queries in parallel
  const [
    { count: orgCount },
    { count: userCount },
    { count: consentCount },
    { count: activeConsentCount },
    { data: recentConsents },
    { data: recentOrgs },
    { data: creditTxns },
    { count: signedCount },
  ] = await Promise.all([
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('consents').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('consents')
      .select('id, status, consent_type, delivery_method, created_at, organization_id')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('organizations')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('credit_transactions')
      .select('amount, type, created_at')
      .eq('type', 'purchase')
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('consents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'signed'),
  ]);

  // Build daily consent counts for the last 14 days (for sparkline)
  const now = new Date();
  const dailyCounts: number[] = [];
  for (let i = 13; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const count =
      recentConsents?.filter((c) => {
        const d = new Date(c.created_at);
        return d >= dayStart && d < dayEnd;
      }).length ?? 0;
    dailyCounts.push(count);
  }

  // Revenue from credit transactions
  const totalRevenue = creditTxns?.reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0) ?? 0;

  return NextResponse.json({
    stats: {
      organizations: orgCount ?? 0,
      users: userCount ?? 0,
      consents: consentCount ?? 0,
      activeUsers: activeConsentCount ?? 0,
      signedConsents: signedCount ?? 0,
      totalRevenueCents: totalRevenue,
    },
    sparklines: {
      consents: dailyCounts,
    },
    recentConsents: recentConsents ?? [],
    recentOrgs: recentOrgs ?? [],
  });
}
