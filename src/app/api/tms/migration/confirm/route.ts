import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { partnerUploadLimiter } from '@/lib/rate-limiters';
import { getClientIp } from '@/lib/rate-limit';
import { MIGRATION_PRICE_PER_GB_CENTS } from '@/lib/stripe/credits';
import type { Json } from '@/types/database';

// ---------------------------------------------------------------------------
// POST /api/tms/migration/confirm — Confirm a file was uploaded to storage
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = partnerUploadLimiter.check(ip);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const { token, path, filename, size_bytes } = await request.json();

    if (!token || !path || !filename) {
      return NextResponse.json({ error: 'token, path, and filename are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch transfer
    const { data: transfer, error: fetchErr } = await supabase
      .from('migration_transfers')
      .select('id, uploaded_files, total_bytes, expires_at')
      .eq('token', token)
      .single();

    if (fetchErr || !transfer) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    if (new Date(transfer.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Transfer link has expired' }, { status: 410 });
    }

    // Append to uploaded_files
    const existingFiles = (Array.isArray(transfer.uploaded_files) ? transfer.uploaded_files : []) as Json[];
    const newFile = {
      path,
      name: filename,
      size_bytes: size_bytes || 0,
      uploaded_at: new Date().toISOString(),
    };
    const updatedFiles = [...existingFiles, newFile] as Json;
    const newTotalBytes = (transfer.total_bytes || 0) + (size_bytes || 0);

    const { error: updateErr } = await supabase
      .from('migration_transfers')
      .update({
        uploaded_files: updatedFiles,
        total_bytes: newTotalBytes,
      })
      .eq('id', transfer.id);

    if (updateErr) {
      console.error('[confirm] Update error:', updateErr);
      return NextResponse.json({ error: 'Failed to update transfer' }, { status: 500 });
    }

    // Calculate fee
    const totalGB = Math.max(1, Math.ceil(newTotalBytes / (1024 * 1024 * 1024)));
    const migrationFeeCents = totalGB * MIGRATION_PRICE_PER_GB_CENTS;

    return NextResponse.json({
      total_bytes: newTotalBytes,
      file_count: (existingFiles.length + 1),
      migration_fee_cents: migrationFeeCents,
    });
  } catch (err) {
    console.error('[POST /api/tms/migration/confirm]', err);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
