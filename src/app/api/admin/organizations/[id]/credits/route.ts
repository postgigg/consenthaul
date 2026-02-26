import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { adminLimiter } from '@/lib/rate-limiters';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const blocked = await checkRateLimit(request, adminLimiter);
  if (blocked) return blocked;

  const admin = await getAdminUserApi();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const amount = parseInt(body.amount, 10);
  const description = body.description ?? 'Admin credit adjustment';

  if (!amount || isNaN(amount)) {
    return NextResponse.json({ error: 'Valid amount is required' }, { status: 422 });
  }

  const supabase = createAdminClient();

  // Get current balance
  const { data: current } = await supabase
    .from('credit_balances')
    .select('*')
    .eq('organization_id', params.id)
    .single();

  const currentBalance = current?.balance ?? 0;
  const newBalance = currentBalance + amount;

  if (newBalance < 0) {
    return NextResponse.json({ error: 'Resulting balance would be negative' }, { status: 422 });
  }

  // Upsert balance
  await supabase.from('credit_balances').upsert({
    organization_id: params.id,
    balance: newBalance,
    lifetime_purchased: (current?.lifetime_purchased ?? 0) + (amount > 0 ? amount : 0),
    lifetime_used: current?.lifetime_used ?? 0,
    updated_at: new Date().toISOString(),
  });

  // Record transaction
  await supabase.from('credit_transactions').insert({
    organization_id: params.id,
    type: amount > 0 ? 'admin_grant' : 'admin_deduction',
    amount,
    balance_after: newBalance,
    description,
    reference_id: null,
    reference_type: 'admin_action',
    created_by: admin.id,
  });

  // Audit log
  await supabase.from('audit_log').insert({
    organization_id: params.id,
    actor_id: admin.id,
    actor_type: 'platform_admin',
    action: 'add_credits',
    resource_type: 'credit_balance',
    resource_id: params.id,
    details: { amount, description, new_balance: newBalance } as Record<string, string | number | boolean | null>,
  });

  return NextResponse.json({ balance: newBalance });
}
