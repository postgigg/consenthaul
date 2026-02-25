import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { signLimiter } from '@/lib/rate-limiters';
import { getClientIp } from '@/lib/rate-limit';

// ---------------------------------------------------------------------------
// GET /api/sign/[token]/pdf — Public: download signed consent PDF
// ---------------------------------------------------------------------------

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } },
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

    const supabase = createAdminClient();
    const { token } = params;

    // 1. Look up consent by signing token
    const { data: consent, error } = await supabase
      .from('consents')
      .select('id, status, signed_at, pdf_storage_path, organization_id')
      .eq('signing_token', token)
      .single();

    if (error || !consent) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Invalid or unknown signing link.' },
        { status: 404 },
      );
    }

    // 2. Must be signed
    if (consent.status !== 'signed' && consent.status !== 'revoked') {
      return NextResponse.json(
        { error: 'Not Found', message: 'This consent has not been signed yet.' },
        { status: 404 },
      );
    }

    // 3. Check 30-day download window
    if (consent.signed_at) {
      const signedTime = new Date(consent.signed_at).getTime();
      if (Date.now() - signedTime > THIRTY_DAYS_MS) {
        return NextResponse.json(
          { error: 'Gone', message: 'The PDF download window has expired (30 days). Contact your employer for a copy.' },
          { status: 410 },
        );
      }
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
      console.error('[GET /api/sign/[token]/pdf] download error:', downloadError);
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
    console.error('[GET /api/sign/[token]/pdf]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
