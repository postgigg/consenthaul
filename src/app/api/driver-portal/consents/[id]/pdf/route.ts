import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { signLimiter } from '@/lib/rate-limiters';
import { getClientIp } from '@/lib/rate-limit';

// ---------------------------------------------------------------------------
// GET /api/driver-portal/consents/[id]/pdf?token=xxx — Public: download
//   signed consent PDF via portal token authentication
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Rate limit
    const ip = getClientIp(request);
    const rl = signLimiter.check(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too Many Requests', message: 'Too many download attempts. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
      );
    }

    // Validate portal token
    const token = request.nextUrl.searchParams.get('token');
    if (!token || token.length < 32) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Missing or invalid portal token.' },
        { status: 401 },
      );
    }

    const supabase = createAdminClient();
    const consentId = params.id;

    // 1. Find the driver associated with this portal token
    const { data: drivers } = await supabase
      .from('drivers')
      .select('id, metadata')
      .eq('is_active', true);

    const driver = drivers?.find((d) => {
      const meta = d.metadata as Record<string, unknown> | null;
      if (!meta) return false;
      return (
        meta.portal_token === token &&
        typeof meta.portal_token_expires_at === 'string' &&
        new Date(meta.portal_token_expires_at) > new Date()
      );
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired portal token.' },
        { status: 401 },
      );
    }

    // 2. Fetch the consent record and verify it belongs to this driver
    const { data: consent, error } = await supabase
      .from('consents')
      .select('id, status, signed_at, pdf_storage_path, driver_id')
      .eq('id', consentId)
      .single();

    if (error || !consent) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Consent record not found.' },
        { status: 404 },
      );
    }

    // Security: ensure the consent belongs to the authenticated driver
    if (consent.driver_id !== driver.id) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have access to this consent.' },
        { status: 403 },
      );
    }

    // 3. Must be signed or revoked to have a PDF
    if (consent.status !== 'signed' && consent.status !== 'revoked') {
      return NextResponse.json(
        { error: 'Not Found', message: 'This consent has not been signed yet.' },
        { status: 404 },
      );
    }

    // 4. Check PDF exists
    if (!consent.pdf_storage_path) {
      return NextResponse.json(
        { error: 'Not Found', message: 'PDF is not available for this consent.' },
        { status: 404 },
      );
    }

    // 5. Download from Supabase storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('consent-pdfs')
      .download(consent.pdf_storage_path);

    if (downloadError || !fileData) {
      console.error('[GET /api/driver-portal/consents/[id]/pdf] download error:', downloadError);
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to retrieve PDF.' },
        { status: 500 },
      );
    }

    // 6. Return PDF
    const buffer = Buffer.from(await fileData.arrayBuffer());
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="fmcsa-consent-${consent.id.slice(0, 8)}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    console.error('[GET /api/driver-portal/consents/[id]/pdf]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
