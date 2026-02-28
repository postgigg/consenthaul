import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Find orgs where balance <= threshold and not recently notified (within 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, low_credit_threshold, low_credit_notified_at')
    .or(`low_credit_notified_at.is.null,low_credit_notified_at.lt.${sevenDaysAgo}`);

  let notified = 0;

  for (const org of orgs ?? []) {
    const { data: balance } = await supabase
      .from('credit_balances')
      .select('balance')
      .eq('organization_id', org.id)
      .single();

    if (!balance || balance.balance > org.low_credit_threshold) continue;

    // Get org admins
    const { data: admins } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('organization_id', org.id)
      .in('role', ['owner', 'admin'])
      .eq('is_active', true);

    for (const admin of admins ?? []) {
      await supabase.from('in_app_notifications').insert({
        user_id: admin.id,
        organization_id: org.id,
        title: 'Low Credit Balance',
        body: `Your credit balance is ${balance.balance}. Purchase more credits to continue sending consents.`,
        type: 'warning',
        action_url: '/billing',
      });
    }

    await supabase.from('organizations').update({
      low_credit_notified_at: new Date().toISOString(),
    }).eq('id', org.id);

    notified++;
  }

  return NextResponse.json({ data: { notified } });
}
