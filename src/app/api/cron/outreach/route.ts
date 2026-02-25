import { NextRequest, NextResponse } from 'next/server';
import { processOutreachQueue } from '@/lib/outreach/send-engine';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
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
