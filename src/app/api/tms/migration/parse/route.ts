import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { partnerUploadLimiter } from '@/lib/rate-limiters';
import { getClientIp } from '@/lib/rate-limit';

interface UploadedFile {
  path: string;
  name: string;
  size_bytes: number;
  uploaded_at: string;
}

// ---------------------------------------------------------------------------
// POST /api/tms/migration/parse — Parse uploaded CSVs, return carrier/driver counts
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = partnerUploadLimiter.check(ip);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: transfer, error: fetchErr } = await supabase
      .from('migration_transfers')
      .select('id, uploaded_files, expires_at')
      .eq('token', token)
      .single();

    if (fetchErr || !transfer) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    if (new Date(transfer.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Transfer link has expired' }, { status: 410 });
    }

    const files = (Array.isArray(transfer.uploaded_files) ? transfer.uploaded_files : []) as unknown as UploadedFile[];

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded yet' }, { status: 400 });
    }

    const carrierNames = new Set<string>();
    const driverNames: string[] = [];
    let totalDriverRows = 0;

    for (const file of files) {
      // Download from storage
      const { data: fileData, error: dlErr } = await supabase.storage
        .from('migration-uploads')
        .download(file.path);

      if (dlErr || !fileData) {
        console.error('[parse] Download error for', file.path, dlErr);
        continue;
      }

      const text = await fileData.text();
      const lines = text.split('\n').filter((l) => l.trim().length > 0);

      if (lines.length < 2) continue; // header only

      const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());

      // Detect carrier vs driver file
      const isCarrierFile = header.includes('company_name') && !header.includes('carrier_company_name');
      const isDriverFile = header.includes('carrier_company_name');

      if (isCarrierFile) {
        const nameIdx = header.indexOf('company_name');
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          const name = cols[nameIdx]?.trim();
          if (name) carrierNames.add(name);
        }
      } else if (isDriverFile) {
        const firstIdx = header.indexOf('first_name');
        const lastIdx = header.indexOf('last_name');
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          totalDriverRows++;
          if (driverNames.length < 3) {
            const first = cols[firstIdx]?.trim() || '';
            const last = cols[lastIdx]?.trim() || '';
            if (first || last) driverNames.push(`${first} ${last}`.trim());
          }
        }
      }
    }

    const carrierCount = carrierNames.size;
    const driverCount = totalDriverRows;
    const carrierSample = Array.from(carrierNames).slice(0, 3);
    const driverSample = driverNames.slice(0, 3);

    // Update transfer with counts
    await supabase
      .from('migration_transfers')
      .update({
        carrier_count: carrierCount,
        driver_count: driverCount,
        parsed_at: new Date().toISOString(),
      })
      .eq('id', transfer.id);

    return NextResponse.json({
      carrier_count: carrierCount,
      driver_count: driverCount,
      carrier_sample: carrierSample,
      driver_sample: driverSample,
    });
  } catch (err) {
    console.error('[POST /api/tms/migration/parse]', err);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

/**
 * Minimal CSV line parser that handles quoted fields with commas.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}
