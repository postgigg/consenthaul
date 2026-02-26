import { NextRequest, NextResponse } from 'next/server';
import { processReconsent } from '@/lib/reconsent/process-reconsent';

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[Cron reconsent] CRON_SECRET not configured');
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processReconsent();

    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Cron reconsent]', err);
    return NextResponse.json(
      { error: 'Re-consent processing failed' },
      { status: 500 },
    );
  }
}
