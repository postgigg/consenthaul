import { NextRequest, NextResponse } from 'next/server';
import { runRegulatoryScanner } from '@/lib/regulatory/scanner';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runRegulatoryScanner();

    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Cron regulatory-scan]', err);
    return NextResponse.json(
      { error: 'Regulatory scan failed' },
      { status: 500 },
    );
  }
}
