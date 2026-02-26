import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { csvDriverRowSchema } from '@/lib/validators';
import { MAX_CSV_ROWS } from '@/lib/constants';
import { parse } from 'csv-parse/sync';
import type { CSVImportResult, CSVImportError } from '@/types/driver';
import { generalLimiter } from '@/lib/rate-limiters';
import { getClientIp } from '@/lib/rate-limit';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// ---------------------------------------------------------------------------
// POST /api/drivers/import — Bulk import drivers from CSV
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const ip = getClientIp(request);
    const rl = generalLimiter.check(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too Many Requests', message: 'Rate limit exceeded. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
      );
    }

    const supabase = createClient();

    // 1. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in.' },
        { status: 401 },
      );
    }

    // 2. Get org id
    const { data: profileData } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const profile = profileData as Pick<ProfileRow, 'organization_id'> | null;

    if (!profile) {
      return NextResponse.json(
        { error: 'Not Found', message: 'User profile not found.' },
        { status: 404 },
      );
    }

    const orgId = profile.organization_id;

    // 3. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'A CSV file is required. Upload as the "file" field.' },
        { status: 422 },
      );
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'File must be a .csv file.' },
        { status: 422 },
      );
    }

    // 4. Read and parse CSV
    const csvText = await file.text();

    let records: Record<string, string>[];
    try {
      records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });
    } catch (parseError) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: `Failed to parse CSV: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`,
        },
        { status: 422 },
      );
    }

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'CSV file is empty.' },
        { status: 422 },
      );
    }

    if (records.length > MAX_CSV_ROWS) {
      return NextResponse.json(
        {
          error: 'Import Limit',
          message: `Free CSV import supports up to ${MAX_CSV_ROWS} drivers. For larger imports, use the Migrate Fleet feature on the Drivers page.`,
        },
        { status: 422 },
      );
    }

    // 5. Fetch existing CDL numbers for duplicate detection
    const { data: existingDriversData } = await supabase
      .from('drivers')
      .select('cdl_number')
      .eq('organization_id', orgId)
      .not('cdl_number', 'is', null);

    const existingDrivers = (existingDriversData ?? []) as { cdl_number: string | null }[];

    const existingCdls = new Set(
      existingDrivers.map((d) => d.cdl_number?.toLowerCase()),
    );

    // Track CDL numbers seen in this import for intra-file dedup
    const seenCdls = new Set<string>();

    // 6. Validate each row and collect valid inserts
    const errors: CSVImportError[] = [];
    const validRows: Array<{
      organization_id: string;
      first_name: string;
      last_name: string;
      phone: string | null;
      email: string | null;
      cdl_number: string | null;
      cdl_state: string | null;
      date_of_birth: string | null;
      hire_date: string | null;
      preferred_language: string;
      is_active: boolean;
      metadata: Record<string, never>;
    }> = [];
    let skipped = 0;

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2; // +2 because row 1 is headers, and we want 1-based numbering

      const parsed = csvDriverRowSchema.safeParse(row);
      if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        const messages = Object.entries(fieldErrors)
          .map(([field, errs]) => `${field}: ${(errs ?? []).join(', ')}`)
          .join('; ');
        errors.push({ row: rowNumber, message: messages });
        continue;
      }

      const data = parsed.data;

      // Duplicate detection (DB)
      if (data.cdl_number && existingCdls.has(data.cdl_number.toLowerCase())) {
        skipped++;
        errors.push({
          row: rowNumber,
          message: `Duplicate CDL number "${data.cdl_number}" — driver already exists.`,
        });
        continue;
      }

      // Duplicate detection (intra-file)
      if (data.cdl_number && seenCdls.has(data.cdl_number.toLowerCase())) {
        skipped++;
        errors.push({
          row: rowNumber,
          message: `Duplicate CDL number "${data.cdl_number}" — appears earlier in the same file.`,
        });
        continue;
      }

      if (data.cdl_number) {
        seenCdls.add(data.cdl_number.toLowerCase());
      }

      validRows.push({
        organization_id: orgId,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone ?? null,
        email: data.email ?? null,
        cdl_number: data.cdl_number ?? null,
        cdl_state: data.cdl_state ?? null,
        date_of_birth: data.date_of_birth ?? null,
        hire_date: data.hire_date ?? null,
        preferred_language: data.preferred_language ?? 'en',
        is_active: true,
        metadata: {},
      });
    }

    // 7. Bulk insert valid rows
    let imported = 0;
    if (validRows.length > 0) {
      // Insert in batches of 500 to avoid request-size limits
      const BATCH_SIZE = 500;
      for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
        const batch = validRows.slice(i, i + BATCH_SIZE);
        const { error: insertError, count } = await supabase
          .from('drivers')
          .insert(batch);

        if (insertError) {
          console.error('[POST /api/drivers/import] batch insert error:', insertError);
          // If a batch fails, record it but continue with other batches
          errors.push({
            row: 0,
            message: `Batch insert failed for rows ${i + 2}–${i + batch.length + 1}: ${insertError.message}`,
          });
        } else {
          imported += count ?? batch.length;
        }
      }
    }

    // 8. Build result
    const result: CSVImportResult = {
      total: records.length,
      imported,
      skipped,
      errors,
    };

    // 9. Audit log
    await supabase.from('audit_log').insert({
      organization_id: orgId,
      actor_id: user.id,
      actor_type: 'user',
      action: 'driver.csv_import',
      resource_type: 'driver',
      resource_id: orgId,
      details: {
        file_name: file.name,
        total: result.total,
        imported: result.imported,
        skipped: result.skipped,
        error_count: result.errors.length,
      },
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/drivers/import]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
