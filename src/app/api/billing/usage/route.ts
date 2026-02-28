import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
  if (!profile) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

  const orgId = profile.organization_id;

  // Get monthly usage for last 12 months
  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('type, amount, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(1000);

  // Group by month
  const monthlyUsage: Record<string, { used: number; purchased: number }> = {};
  for (const tx of transactions ?? []) {
    const month = tx.created_at.slice(0, 7); // YYYY-MM
    if (!monthlyUsage[month]) monthlyUsage[month] = { used: 0, purchased: 0 };
    if (tx.type === 'usage') monthlyUsage[month].used += Math.abs(tx.amount);
    if (tx.type === 'purchase') monthlyUsage[month].purchased += tx.amount;
  }

  // Get current balance
  const { data: balance } = await supabase
    .from('credit_balances')
    .select('balance, lifetime_purchased, lifetime_used')
    .eq('organization_id', orgId)
    .single();

  return NextResponse.json({
    data: {
      current_balance: balance?.balance ?? 0,
      lifetime_purchased: balance?.lifetime_purchased ?? 0,
      lifetime_used: balance?.lifetime_used ?? 0,
      monthly_usage: monthlyUsage,
    },
  });
}
