import { NextResponse } from 'next/server';
import { generateConsentPDF } from '@/lib/pdf/generate-consent-pdf';

// Simple in-memory rate limiter: max 10 requests per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

export async function POST(request: Request) {
  // Rate limit by IP
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a minute.' },
      { status: 429 },
    );
  }

  // Parse body
  let body: { signature_data?: string; language?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { signature_data, language } = body;

  if (!signature_data || typeof signature_data !== 'string') {
    return NextResponse.json(
      { error: 'signature_data is required' },
      { status: 400 },
    );
  }

  // Validate signature_data is a reasonable data URL (not absurdly large)
  if (signature_data.length > 500_000) {
    return NextResponse.json(
      { error: 'Signature data too large' },
      { status: 400 },
    );
  }

  const lang = language === 'es' ? 'es' : 'en';
  const now = new Date().toISOString();

  try {
    const buffer = await generateConsentPDF({
      consent: {
        id: 'DEMO-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        consent_type: 'limited_query',
        language: lang,
        consent_start_date: new Date().toISOString().split('T')[0],
        consent_end_date: null,
        query_frequency: 'annual',
        signed_at: now,
        signer_ip: ip,
        signature_data: signature_data,
        signature_hash: null,
        driver_snapshot: null,
        organization_snapshot: null,
      },
      driver: {
        first_name: 'Carlos',
        last_name: 'Mendez',
        cdl_number: 'TX-28491037',
        cdl_state: 'TX',
        date_of_birth: '1985-06-15',
      },
      organization: {
        name: 'Acme Freight LLC',
        dot_number: '1234567',
        address_line1: '4200 Industrial Blvd',
        city: 'Houston',
        state: 'TX',
        zip: '77001',
      },
    });

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="demo-consent.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('Demo PDF generation error:', err);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 },
    );
  }
}
