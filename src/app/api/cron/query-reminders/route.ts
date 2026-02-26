import { NextRequest, NextResponse } from 'next/server';
import { sendAnnualQueryReminders } from '@/lib/query-reminders/send-annual-reminder';

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[Cron query-reminders] CRON_SECRET not configured');
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await sendAnnualQueryReminders();

    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Cron query-reminders]', err);
    return NextResponse.json(
      { error: 'Query reminder processing failed' },
      { status: 500 },
    );
  }
}
