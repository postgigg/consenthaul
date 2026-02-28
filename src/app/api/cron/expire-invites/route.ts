import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data } = await supabase
    .from('team_invites')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .is('accepted_at', null)
    .select('id');

  return NextResponse.json({ data: { expired: data?.length ?? 0 } });
}
