import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { queryLimiter } from '@/lib/rate-limiters';
import JSZip from 'jszip';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// ---------------------------------------------------------------------------
// GET /api/consents/audit-package — Download ZIP with signed PDFs + CSV
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const blocked = await checkRateLimit(request, queryLimiter);
    if (blocked) return blocked;

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

    // Get org info
    const { data: org } = await supabase
      .from('organizations')
      .select('name, dot_number')
      .eq('id', orgId)
      .single();

    // Get all active drivers with their latest consent and query info
    const { data: drivers } = await supabase
      .from('drivers')
      .select('id, first_name, last_name, cdl_number, cdl_state')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .order('last_name', { ascending: true });

    if (!drivers || drivers.length === 0) {
      return NextResponse.json(
        { error: 'No Data', message: 'No active drivers found.' },
        { status: 404 },
      );
    }

    // Get all signed consents with PDFs
    const { data: consents } = await supabase
      .from('consents')
      .select('id, driver_id, consent_type, status, consent_start_date, consent_end_date, signed_at, pdf_storage_path, driver:drivers(first_name, last_name)')
      .eq('organization_id', orgId)
      .eq('status', 'signed')
      .not('pdf_storage_path', 'is', null)
      .order('signed_at', { ascending: false });

    // Get all query records
    const { data: queryRecords } = await supabase
      .from('query_records')
      .select('driver_id, query_date, result, escalation_status')
      .eq('organization_id', orgId)
      .order('query_date', { ascending: false });

    // Build lookup maps
    const driverConsents = new Map<string, typeof consents>();
    for (const c of consents ?? []) {
      const existing = driverConsents.get(c.driver_id) ?? [];
      existing.push(c);
      driverConsents.set(c.driver_id, existing);
    }

    const lastQueryMap = new Map<string, { query_date: string; result: string; escalation_status: string | null }>();
    for (const q of queryRecords ?? []) {
      if (!lastQueryMap.has(q.driver_id)) {
        lastQueryMap.set(q.driver_id, {
          query_date: q.query_date,
          result: q.result,
          escalation_status: q.escalation_status,
        });
      }
    }

    const zip = new JSZip();
    const today = new Date().toISOString().slice(0, 10);

    // Cover sheet
    const coverLines = [
      `FMCSA Clearinghouse Compliance Audit Package`,
      `Generated: ${new Date().toISOString()}`,
      ``,
      `Organization: ${org?.name ?? 'N/A'}`,
      `DOT Number: ${org?.dot_number ?? 'N/A'}`,
      `Date Range: All records`,
      `Total Active Drivers: ${drivers.length}`,
      `Total Signed Consents: ${(consents ?? []).length}`,
      `Total Query Records: ${(queryRecords ?? []).length}`,
      ``,
      `This package contains:`,
      `- Per-driver folders with signed consent PDFs`,
      `- compliance-summary.csv with consent and query status per driver`,
      ``,
      `Prepared for DOT/FMCSA audit in accordance with 49 CFR Part 382.`,
    ];
    zip.file('cover-sheet.txt', coverLines.join('\n'));

    // CSV summary
    const csvHeaders = [
      'Driver Name',
      'CDL Number',
      'CDL State',
      'Latest Consent Status',
      'Consent Type',
      'Consent Start',
      'Consent End',
      'Signed At',
      'Last Query Date',
      'Last Query Result',
      'Escalation Status',
      'Has PDF',
    ];
    const csvRows = [csvHeaders.join(',')];

    // Process each driver
    for (const driver of drivers) {
      const driverName = `${driver.last_name}_${driver.first_name}`.replace(/[^a-zA-Z0-9_-]/g, '');
      const driverFolder = zip.folder(`drivers/${driverName}`)!;
      const dConsents = driverConsents.get(driver.id) ?? [];
      const lastQuery = lastQueryMap.get(driver.id);
      const latestConsent = dConsents[0];

      // Download PDFs for this driver
      let hasPdf = false;
      for (let i = 0; i < dConsents.length; i++) {
        const consent = dConsents[i];
        if (!consent.pdf_storage_path) continue;

        try {
          const { data: pdfData, error: dlError } = await supabase.storage
            .from('consent-pdfs')
            .download(consent.pdf_storage_path);

          if (!dlError && pdfData) {
            const pdfName = i === 0
              ? `consent_${consent.consent_type}_${consent.signed_at?.slice(0, 10) ?? 'unknown'}.pdf`
              : `consent_${consent.consent_type}_${consent.signed_at?.slice(0, 10) ?? 'unknown'}_${i + 1}.pdf`;
            const buffer = await pdfData.arrayBuffer();
            driverFolder.file(pdfName, buffer);
            hasPdf = true;
          }
        } catch {
          // skip this PDF if download fails
        }
      }

      // CSV row
      const csvRow = [
        `"${driver.first_name} ${driver.last_name}"`,
        driver.cdl_number ?? '',
        driver.cdl_state ?? '',
        latestConsent?.status ?? 'none',
        latestConsent?.consent_type ?? '',
        latestConsent?.consent_start_date ?? '',
        latestConsent?.consent_end_date ?? '',
        latestConsent?.signed_at?.slice(0, 10) ?? '',
        lastQuery?.query_date ?? '',
        lastQuery?.result ?? '',
        lastQuery?.escalation_status ?? '',
        hasPdf ? 'Yes' : 'No',
      ];
      csvRows.push(csvRow.join(','));
    }

    zip.file('compliance-summary.csv', csvRows.join('\n'));

    // Generate ZIP
    const zipData = await zip.generateAsync({ type: 'uint8array' });

    const filename = `audit-package_${org?.name?.replace(/[^a-zA-Z0-9]/g, '_') ?? 'org'}_${today}.zip`;

    // Audit log
    await supabase.from('audit_log').insert({
      organization_id: orgId,
      actor_id: user.id,
      actor_type: 'user',
      action: 'compliance.audit_package_downloaded',
      resource_type: 'organization',
      resource_id: orgId,
      details: {
        driver_count: drivers.length,
        consent_count: (consents ?? []).length,
        query_count: (queryRecords ?? []).length,
      },
    });

    return new NextResponse(zipData as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('[GET /api/consents/audit-package]', err);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
