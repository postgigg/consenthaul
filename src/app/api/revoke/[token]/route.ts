import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { signLimiter } from '@/lib/rate-limiters';
import { getClientIp } from '@/lib/rate-limit';
import { dispatchWebhookEvent } from '@/lib/webhooks';

// ---------------------------------------------------------------------------
// GET /api/revoke/[token] — Public: get consent info for revocation page
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  try {
    const ip = getClientIp(request);
    const rl = signLimiter.check(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too Many Requests', message: 'Too many requests. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
      );
    }

    const supabase = createAdminClient();
    const { token } = params;

    const { data: consent, error } = await supabase
      .from('consents')
      .select(
        `
        id,
        status,
        signed_at,
        driver:drivers(first_name, last_name),
        organization:organizations(name)
      `,
      )
      .eq('signing_token', token)
      .single();

    if (error || !consent) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Invalid or unknown link.' },
        { status: 404 },
      );
    }

    if (consent.status === 'revoked') {
      return NextResponse.json(
        { error: 'Conflict', message: 'This consent has already been revoked.' },
        { status: 409 },
      );
    }

    if (consent.status !== 'signed') {
      return NextResponse.json(
        { error: 'Unprocessable', message: 'This consent has not been signed yet.' },
        { status: 422 },
      );
    }

    const driver = consent.driver as unknown as { first_name: string; last_name: string } | null;
    const organization = consent.organization as unknown as { name: string } | null;

    return NextResponse.json({
      data: {
        consent_id: consent.id,
        driver_name: driver ? `${driver.first_name} ${driver.last_name}` : 'Unknown Driver',
        organization_name: organization?.name ?? 'Unknown Organization',
        signed_at: consent.signed_at,
        status: consent.status,
      },
    });
  } catch (err) {
    console.error('[GET /api/revoke/[token]]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/revoke/[token] — Public: revoke consent
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  try {
    const ip = getClientIp(request);
    const rl = signLimiter.check(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too Many Requests', message: 'Too many requests. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
      );
    }

    const supabase = createAdminClient();
    const { token } = params;

    // Look up consent
    const { data: consent, error } = await supabase
      .from('consents')
      .select('id, status, organization_id')
      .eq('signing_token', token)
      .single();

    if (error || !consent) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Invalid or unknown link.' },
        { status: 404 },
      );
    }

    if (consent.status === 'revoked') {
      return NextResponse.json(
        { error: 'Conflict', message: 'This consent has already been revoked.' },
        { status: 409 },
      );
    }

    if (consent.status !== 'signed') {
      return NextResponse.json(
        { error: 'Unprocessable', message: 'This consent has not been signed yet.' },
        { status: 422 },
      );
    }

    // Update status to revoked
    const revokedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('consents')
      .update({ status: 'revoked' })
      .eq('id', consent.id);

    if (updateError) {
      console.error('[POST /api/revoke/[token]] update error:', updateError);
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to revoke consent.' },
        { status: 500 },
      );
    }

    // Audit log
    const signerIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';
    const signerUserAgent = request.headers.get('user-agent') ?? 'unknown';

    await supabase.from('audit_log').insert({
      organization_id: consent.organization_id,
      actor_id: null,
      actor_type: 'driver',
      action: 'consent.revoked',
      resource_type: 'consent',
      resource_id: consent.id,
      details: {
        revoked_at: revokedAt,
        revocation_method: 'self_service',
      },
      ip_address: signerIp,
      user_agent: signerUserAgent,
    });

    // Dispatch outgoing webhook (fire-and-forget)
    dispatchWebhookEvent({
      eventType: 'consent.revoked',
      consentId: consent.id,
      organizationId: consent.organization_id,
    }).catch(() => {});

    return NextResponse.json({
      data: {
        consent_id: consent.id,
        status: 'revoked',
        revoked_at: revokedAt,
      },
    });
  } catch (err) {
    console.error('[POST /api/revoke/[token]]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
