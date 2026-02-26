import { NextRequest, NextResponse } from 'next/server';
import { processOutreachQueue } from '@/lib/outreach/send-engine';

export async function GET(request: NextRequest) {
  // Verify cron secret — fail closed if not configured
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[Cron outreach] CRON_SECRET not configured');
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processOutreachQueue();

    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Cron outreach]', err);
    return NextResponse.json(
      { error: 'Queue processing failed' },
      { status: 500 },
    );
  }
}
