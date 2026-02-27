import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { csvQueryResultRowSchema } from '@/lib/validators';
import { parse } from 'csv-parse/sync';
import { generalLimiter } from '@/lib/rate-limiters';
import { getClientIp } from '@/lib/rate-limit';
import type { Database, EscalationStatus } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

const MAX_RESULT_ROWS = 5000;

// ---------------------------------------------------------------------------
// POST /api/queries/import-results — Bulk import query results from CSV
// Charges 1 credit per 4 drivers (Math.ceil(validRows / 4))
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = generalLimiter.check(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too Many Requests', message: 'Rate limit exceeded. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
      );
    }

    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const profile = profileData as Pick<ProfileRow, 'organization_id'> | null;
    if (!profile) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const orgId = profile.organization_id;

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'A CSV file is required. Upload as the "file" field.' },
        { status: 422 },
      );
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'File must be a .csv file.' },
        { status: 422 },
      );
    }

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

    if (records.length > MAX_RESULT_ROWS) {
      return NextResponse.json(
        { error: 'Import Limit', message: `Maximum ${MAX_RESULT_ROWS} rows per import.` },
        { status: 422 },
      );
    }

    // Validate rows
    interface ValidRow {
      cdl_number: string;
      query_date: string;
      result: 'no_violations' | 'violations_found';
      rowNumber: number;
    }

    const errors: { row: number; message: string }[] = [];
    const validRows: ValidRow[] = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2;

      const parsed = csvQueryResultRowSchema.safeParse(row);
      if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        const messages = Object.entries(fieldErrors)
          .map(([field, errs]) => `${field}: ${(errs ?? []).join(', ')}`)
          .join('; ');
        errors.push({ row: rowNumber, message: messages });
        continue;
      }

      validRows.push({ ...parsed.data, rowNumber });
    }

    if (validRows.length === 0) {
      return NextResponse.json({
        data: { imported: 0, skipped: 0, errors, credits_used: 0 },
      });
    }

    // Look up drivers by CDL number + org
    const uniqueCdls = Array.from(new Set(validRows.map((r) => r.cdl_number)));
    const { data: driversData } = await supabase
      .from('drivers')
      .select('id, cdl_number')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .in('cdl_number', uniqueCdls);

    const cdlToDriver = new Map<string, string>();
    for (const d of driversData ?? []) {
      if (d.cdl_number) {
        cdlToDriver.set(d.cdl_number.toLowerCase(), d.id);
      }
    }

    // Match rows to drivers
    interface MatchedRow {
      driver_id: string;
      query_date: string;
      result: 'no_violations' | 'violations_found';
    }

    const matchedRows: MatchedRow[] = [];
    let skipped = 0;

    for (const row of validRows) {
      const driverId = cdlToDriver.get(row.cdl_number.toLowerCase());
      if (!driverId) {
        skipped++;
        errors.push({ row: row.rowNumber, message: `No active driver found with CDL "${row.cdl_number}".` });
        continue;
      }
      matchedRows.push({ driver_id: driverId, query_date: row.query_date, result: row.result });
    }

    if (matchedRows.length === 0) {
      return NextResponse.json({
        data: { imported: 0, skipped, errors, credits_used: 0 },
      });
    }

    // Credit cost: 1 credit per 4 drivers
    const creditsNeeded = Math.ceil(matchedRows.length / 4);

    // Check balance
    const { data: balanceData } = await supabase
      .from('credit_balances')
      .select('balance')
      .eq('organization_id', orgId)
      .single();

    const available = (balanceData as { balance: number } | null)?.balance ?? 0;
    if (available < creditsNeeded) {
      return NextResponse.json(
        {
          error: 'Insufficient Credits',
          message: `This import requires ${creditsNeeded} credits but you have ${available}.`,
          needed: creditsNeeded,
          available,
        },
        { status: 402 },
      );
    }

    // Deduct credits (one at a time using existing RPC)
    for (let i = 0; i < creditsNeeded; i++) {
      const { data: deducted } = await supabase.rpc('deduct_credit', {
        p_org_id: orgId,
        p_consent_id: orgId, // use orgId as reference since there's no consent
        p_user_id: user.id,
      });
      if (!deducted) {
        return NextResponse.json(
          { error: 'Credit Deduction Failed', message: 'Failed to deduct credits. Please try again.' },
          { status: 402 },
        );
      }
    }

    // Bulk insert query records in chunks of 500
    let imported = 0;
    const violationRecordIds: string[] = [];
    const BATCH_SIZE = 500;

    for (let i = 0; i < matchedRows.length; i += BATCH_SIZE) {
      const batch = matchedRows.slice(i, i + BATCH_SIZE);
      const insertData = batch.map((r) => ({
        organization_id: orgId,
        driver_id: r.driver_id,
        query_date: r.query_date,
        result: r.result,
        result_notes: 'Imported via CSV',
      }));

      const { data: insertedRows, error: insertError } = await supabase
        .from('query_records')
        .insert(insertData)
        .select('id, result');

      if (insertError) {
        console.error('[POST /api/queries/import-results] batch insert error:', insertError);
        errors.push({ row: 0, message: `Batch insert failed: ${insertError.message}` });
      } else {
        imported += insertedRows?.length ?? batch.length;
        for (const row of insertedRows ?? []) {
          if (row.result === 'violations_found') {
            violationRecordIds.push(row.id);
          }
        }
      }
    }

    // Auto-escalate any violations
    for (const recordId of violationRecordIds) {
      const { data: record } = await supabase
        .from('query_records')
        .select('query_date')
        .eq('id', recordId)
        .single();

      if (record) {
        const queryDate = new Date(record.query_date + 'T00:00:00Z');
        const deadline = new Date(queryDate.getTime() + 24 * 60 * 60 * 1000);

        await supabase
          .from('query_records')
          .update({
            escalation_deadline: deadline.toISOString(),
            escalation_status: 'pending' as EscalationStatus,
          })
          .eq('id', recordId);
      }
    }

    // Audit log
    await supabase.from('audit_log').insert({
      organization_id: orgId,
      actor_id: user.id,
      actor_type: 'user',
      action: 'query.csv_import',
      resource_type: 'query_record',
      resource_id: orgId,
      details: {
        file_name: file.name,
        total: records.length,
        imported,
        skipped,
        credits_used: creditsNeeded,
        violations_escalated: violationRecordIds.length,
      },
    });

    return NextResponse.json({
      data: {
        imported,
        skipped,
        errors,
        credits_used: creditsNeeded,
        violations_escalated: violationRecordIds.length,
      },
    }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/queries/import-results]', err);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
