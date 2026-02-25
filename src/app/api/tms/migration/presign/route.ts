import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { partnerUploadLimiter } from '@/lib/rate-limiters';
import { getClientIp } from '@/lib/rate-limit';

// ---------------------------------------------------------------------------
// POST /api/tms/migration/presign — Generate a presigned upload URL
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = partnerUploadLimiter.check(ip);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const { token, filename } = await request.json();

    if (!token || !filename) {
      return NextResponse.json({ error: 'token and filename are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Validate token exists and hasn't expired
    const { data: transfer, error: fetchErr } = await supabase
      .from('migration_transfers')
      .select('id, expires_at')
      .eq('token', token)
      .single();

    if (fetchErr || !transfer) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 });
    }

    if (new Date(transfer.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Transfer link has expired' }, { status: 410 });
    }

    // Sanitize filename
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${transfer.id}/${safeName}`;

    const { data: signedData, error: signErr } = await supabase.storage
      .from('migration-uploads')
      .createSignedUploadUrl(path);

    if (signErr || !signedData) {
      console.error('[presign] Storage error:', signErr);
      return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 });
    }

    return NextResponse.json({
      signed_url: signedData.signedUrl,
      path: signedData.path,
      token: signedData.token,
    });
  } catch (err) {
    console.error('[POST /api/tms/migration/presign]', err);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
