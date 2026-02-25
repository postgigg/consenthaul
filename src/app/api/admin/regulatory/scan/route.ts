import { NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { runRegulatoryScanner } from '@/lib/regulatory/scanner';

export async function POST() {
  const admin = await getAdminUserApi();
  if (!admin) {
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
    console.error('[Manual regulatory scan]', err);
    return NextResponse.json(
      { error: 'Scan failed' },
      { status: 500 },
    );
  }
}
