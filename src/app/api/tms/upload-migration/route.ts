import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { partnerUploadLimiter } from '@/lib/rate-limiters';
import { getClientIp } from '@/lib/rate-limit';
import { randomBytes } from 'crypto';

// ---------------------------------------------------------------------------
// POST /api/tms/upload-migration — Create a migration_transfers row with token
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = partnerUploadLimiter.check(ip);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const applicationId: string | undefined = body.application_id;

    const token = randomBytes(16).toString('hex'); // 32-char hex
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('migration_transfers')
      .insert({
        token,
        application_id: applicationId ?? null,
        expires_at: expiresAt,
      })
      .select('id, token, expires_at')
      .single();

    if (error) {
      console.error('[upload-migration] DB error:', error);
      return NextResponse.json({ error: 'Failed to create transfer' }, { status: 500 });
    }

    return NextResponse.json({
      token: data.token,
      upload_url: `/tms/upload/${data.token}`,
      expires_at: data.expires_at,
    });
  } catch (err) {
    console.error('[POST /api/tms/upload-migration]', err);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
