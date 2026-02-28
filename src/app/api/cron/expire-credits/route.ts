import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Cron job: expire credit grants whose `expires_at` has passed.
 *
 * Credit transactions of type "purchase" may carry an optional `expires_at`
 * timestamp. When that timestamp is in the past, this cron records an
 * audit-log entry for visibility. Actual balance deduction is deferred to a
 * future iteration because it requires careful double-entry accounting to
 * determine how many of those originally purchased credits remain unspent.
 *
 * NOTE: The `credit_transactions.expires_at` column should be added via a
 * migration (e.g. ALTER TABLE credit_transactions ADD COLUMN expires_at
 * timestamptz). Credits never expire by default -- this cron only processes
 * rows where `expires_at` is explicitly set.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Find expired credit grants
  const { data: expired } = await supabase
    .from('credit_transactions')
    .select('id, organization_id, amount, balance_after')
    .eq('type', 'purchase')
    .lt('expires_at', new Date().toISOString())
    .not('expires_at', 'is', null);

  // For now, just log -- actual expiration is more complex and needs careful accounting
  let processed = 0;

  for (const tx of expired ?? []) {
    await supabase.from('audit_log').insert({
      organization_id: tx.organization_id,
      actor_id: null,
      actor_type: 'system',
      action: 'credits.expired',
      resource_type: 'credit_transaction',
      resource_id: tx.id,
      details: { amount: tx.amount },
    });
    processed++;
  }

  return NextResponse.json({ data: { processed } });
}
