import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { adminLimiter } from '@/lib/rate-limiters';

export async function GET(request: NextRequest) {
  const blocked = await checkRateLimit(request, adminLimiter);
  if (blocked) return blocked;

  const admin = await getAdminUserApi();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Get all purchase transactions
  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('type', 'purchase')
    .order('created_at', { ascending: false });

  const allTxns = transactions ?? [];

  // Total revenue
  const totalRevenue = allTxns.reduce((sum, t) => sum + t.amount, 0);

  // Revenue by month (last 12 months)
  const monthlyRevenue: { month: string; amount: number }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = d.toISOString().slice(0, 7); // YYYY-MM
    const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const amount = allTxns
      .filter((t) => t.created_at.slice(0, 7) === monthKey)
      .reduce((sum, t) => sum + t.amount, 0);
    monthlyRevenue.push({ month: label, amount });
  }

  // Top organizations by revenue
  const orgRevenue: Record<string, number> = {};
  allTxns.forEach((t) => {
    orgRevenue[t.organization_id] = (orgRevenue[t.organization_id] ?? 0) + t.amount;
  });

  const topOrgIds = Object.entries(orgRevenue)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([id]) => id);

  const { data: topOrgs } = topOrgIds.length > 0
    ? await supabase.from('organizations').select('id, name').in('id', topOrgIds)
    : { data: [] };

  const orgNameMap: Record<string, string> = {};
  topOrgs?.forEach((o) => {
    orgNameMap[o.id] = o.name;
  });

  const topOrganizations = topOrgIds.map((id) => ({
    id,
    name: orgNameMap[id] ?? 'Unknown',
    revenue: orgRevenue[id],
  }));

  // Recent transactions (last 50)
  const recentTxns = allTxns.slice(0, 50).map((t) => ({
    ...t,
    organization_name: orgNameMap[t.organization_id] ?? t.organization_id,
  }));

  return NextResponse.json({
    totalRevenue,
    totalTransactions: allTxns.length,
    monthlyRevenue,
    topOrganizations,
    recentTransactions: recentTxns,
  });
}
