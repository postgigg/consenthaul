import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { partnerUploadLimiter } from '@/lib/rate-limiters';
import { getClientIp } from '@/lib/rate-limit';
import { MIGRATION_PRICE_PER_GB_CENTS } from '@/lib/stripe/credits';
import { z } from 'zod';
import {
  migrationIngestCarrierSchema,
  migrationIngestDriverSchema,
} from '@/lib/validators';
import type { Json } from '@/types/database';

const ingestRequestSchema = z.object({
  token: z.string().min(1),
  type: z.enum(['carriers', 'drivers']),
  data: z.array(z.record(z.string(), z.unknown())).min(1).max(10_000),
});

// CSV column orders
const CARRIER_COLS = ['company_name', 'dot_number', 'mc_number', 'phone', 'email', 'contact_name'];
const DRIVER_COLS = ['carrier_company_name', 'first_name', 'last_name', 'phone', 'email', 'cdl_number', 'cdl_state'];

function escapeCSV(val: string | undefined | null): string {
  const s = val ?? '';
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function recordsToCSV(records: Record<string, unknown>[], cols: string[]): string {
  const header = cols.join(',');
  const rows = records.map((r) =>
    cols.map((c) => escapeCSV(String(r[c] ?? ''))).join(',')
  );
  return [header, ...rows].join('\n');
}

// ---------------------------------------------------------------------------
// POST /api/tms/migration/ingest — Programmatic migration data upload
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = partnerUploadLimiter.check(ip);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const body = await request.json();
    const parsed = ingestRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { token, type, data } = parsed.data;

    // Validate individual records
    const schema = type === 'carriers' ? migrationIngestCarrierSchema : migrationIngestDriverSchema;
    const validRecords: Record<string, unknown>[] = [];
    const errors: { index: number; error: string }[] = [];

    for (let i = 0; i < data.length; i++) {
      const result = schema.safeParse(data[i]);
      if (result.success) {
        validRecords.push(result.data);
      } else {
        errors.push({ index: i, error: result.error.issues[0]?.message || 'Invalid record' });
      }
    }

    if (validRecords.length === 0) {
      return NextResponse.json(
        { error: 'No valid records', validation_errors: errors },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // Validate token
    const { data: transfer, error: fetchErr } = await supabase
      .from('migration_transfers')
      .select('id, uploaded_files, total_bytes, expires_at')
      .eq('token', token)
      .single();

    if (fetchErr || !transfer) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 });
    }

    if (new Date(transfer.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Transfer link has expired' }, { status: 410 });
    }

    // Convert to CSV and upload to storage
    const cols = type === 'carriers' ? CARRIER_COLS : DRIVER_COLS;
    const csvContent = recordsToCSV(validRecords, cols);
    const csvBuffer = Buffer.from(csvContent, 'utf-8');
    const filename = `${type}_api_${Date.now()}.csv`;
    const storagePath = `${transfer.id}/${filename}`;

    const { error: uploadErr } = await supabase.storage
      .from('migration-uploads')
      .upload(storagePath, csvBuffer, {
        contentType: 'text/csv',
        upsert: false,
      });

    if (uploadErr) {
      console.error('[ingest] Upload error:', uploadErr);
      return NextResponse.json({ error: 'Failed to store data' }, { status: 500 });
    }

    // Update transfer metadata
    const existingFiles = (Array.isArray(transfer.uploaded_files) ? transfer.uploaded_files : []) as Json[];
    const newFile = {
      path: storagePath,
      name: filename,
      size_bytes: csvBuffer.byteLength,
      uploaded_at: new Date().toISOString(),
    };
    const updatedFiles = [...existingFiles, newFile] as Json;
    const newTotalBytes = (transfer.total_bytes || 0) + csvBuffer.byteLength;

    await supabase
      .from('migration_transfers')
      .update({
        uploaded_files: updatedFiles,
        total_bytes: newTotalBytes,
      })
      .eq('id', transfer.id);

    // Calculate fee
    const totalGB = Math.max(1, Math.ceil(newTotalBytes / (1024 * 1024 * 1024)));
    const migrationFeeCents = totalGB * MIGRATION_PRICE_PER_GB_CENTS;

    return NextResponse.json({
      records_received: validRecords.length,
      total_bytes: newTotalBytes,
      migration_fee_cents: migrationFeeCents,
      ...(errors.length > 0 ? { validation_errors: errors } : {}),
    });
  } catch (err) {
    console.error('[POST /api/tms/migration/ingest]', err);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
