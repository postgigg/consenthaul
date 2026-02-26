import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { csvLeadRowSchema } from '@/lib/outreach/validators';
import { calculateBaseScore } from '@/lib/outreach/lead-scoring';
import { checkRateLimit } from '@/lib/rate-limit';
import { adminLimiter } from '@/lib/rate-limiters';
import type { Database } from '@/types/database';

type LeadInsert = Database['public']['Tables']['outreach_leads']['Insert'];

interface ImportError {
  row: number;
  message: string;
}

export async function POST(request: NextRequest) {
  const blocked = await checkRateLimit(request, adminLimiter);
  if (blocked) return blocked;

  const admin = await getAdminUserApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || !file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json({ error: 'A CSV file is required' }, { status: 400 });
    }

    const csvText = await file.text();
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });

    if (!records.length) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    if (records.length > 5000) {
      return NextResponse.json({ error: 'Maximum 5,000 rows per import' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch existing DOT numbers for duplicate detection
    const { data: existingLeads } = await supabase
      .from('outreach_leads')
      .select('dot_number')
      .not('dot_number', 'is', null);

    const existingDots = new Set(
      (existingLeads ?? []).map((l) => l.dot_number).filter(Boolean),
    );

    const errors: ImportError[] = [];
    const toInsert: LeadInsert[] = [];
    const seenDots = new Set<string>();
    let skipped = 0;

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const parsed = csvLeadRowSchema.safeParse(row);

      if (!parsed.success) {
        const msgs = Object.values(parsed.error.flatten().fieldErrors).flat();
        errors.push({ row: i + 2, message: msgs.join(', ') });
        continue;
      }

      const data = parsed.data;

      // Duplicate check
      if (data.dot_number) {
        if (existingDots.has(data.dot_number) || seenDots.has(data.dot_number)) {
          skipped++;
          continue;
        }
        seenDots.add(data.dot_number);
      }

      const score = calculateBaseScore(data as Record<string, unknown>);

      toInsert.push({
        company_name: data.company_name,
        dot_number: data.dot_number,
        mc_number: data.mc_number,
        phone: data.phone,
        email: data.email,
        contact_name: data.contact_name,
        contact_title: data.contact_title,
        city: data.city,
        state: data.state,
        fleet_size: data.fleet_size,
        driver_count: data.driver_count,
        lead_score: score,
        lead_source: 'csv_import',
      });
    }

    // Batch insert (500 per batch)
    let imported = 0;
    for (let i = 0; i < toInsert.length; i += 500) {
      const batch = toInsert.slice(i, i + 500);
      const { error } = await supabase.from('outreach_leads').insert(batch);
      if (error) {
        console.error('[Lead import batch error]', error);
        errors.push({ row: 0, message: `Batch insert failed: ${error.message}` });
      } else {
        imported += batch.length;
      }
    }

    return NextResponse.json({
      data: {
        total: records.length,
        imported,
        skipped,
        errors,
      },
    });
  } catch (err) {
    console.error('[POST /api/admin/outreach/leads/import]', err);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
