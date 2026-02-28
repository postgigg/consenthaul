import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authLimiter } from '@/lib/rate-limiters';
import { getClientIp } from '@/lib/rate-limit';
import { z } from 'zod';
import { randomBytes } from 'crypto';

// ---------------------------------------------------------------------------
// POST /api/driver-portal/auth — Public: send magic link to driver's email
// ---------------------------------------------------------------------------

const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  cdl_number: z.string().min(1, 'CDL number is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const ip = getClientIp(request);
    const rl = authLimiter.check(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too Many Requests', message: 'Too many requests. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
      );
    }

    const body = await request.json();
    const parsed = authSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid request data.',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }

    const { email, cdl_number } = parsed.data;
    const supabase = createAdminClient();

    // Find driver by email + CDL
    const { data: driver } = await supabase
      .from('drivers')
      .select('id, first_name, last_name, organization_id, metadata')
      .eq('email', email)
      .eq('cdl_number', cdl_number)
      .eq('is_active', true)
      .single();

    // Always return the same message to prevent enumeration
    const safeMessage = 'If a matching driver exists, a login link has been sent.';

    if (!driver) {
      return NextResponse.json({ message: safeMessage });
    }

    // Generate portal token (valid 24 hours)
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Merge with existing metadata to avoid overwriting other fields
    const existingMetadata = (driver.metadata as Record<string, unknown>) ?? {};
    await supabase
      .from('drivers')
      .update({
        metadata: {
          ...existingMetadata,
          portal_token: token,
          portal_token_expires_at: expiresAt,
        },
      })
      .eq('id', driver.id);

    // Audit log
    const signerIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';

    await supabase.from('audit_log').insert({
      organization_id: driver.organization_id,
      actor_id: null,
      actor_type: 'driver',
      action: 'driver_portal.auth_requested',
      resource_type: 'driver',
      resource_id: driver.id,
      details: {
        method: 'magic_link',
        email_provided: email,
      },
      ip_address: signerIp,
      user_agent: request.headers.get('user-agent') ?? 'unknown',
    });

    // TODO: Send email with portal link using existing email infrastructure
    // const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/driver-portal?token=${token}`;
    // await sendDriverPortalEmail({ to: email, driverName: `${driver.first_name} ${driver.last_name}`, portalUrl });

    return NextResponse.json({ message: safeMessage });
  } catch (err) {
    console.error('[POST /api/driver-portal/auth]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
