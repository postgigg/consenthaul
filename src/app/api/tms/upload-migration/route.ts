import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { partnerUploadLimiter } from '@/lib/rate-limiters';
import { getClientIp } from '@/lib/rate-limit';
import { randomBytes } from 'crypto';

// ---------------------------------------------------------------------------
// POST /api/tms/upload-migration — Create a migration_transfers row with token
// Supports both partner (application_id) and non-partner (organization_id) flows
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = partnerUploadLimiter.check(ip);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const applicationId: string | undefined = body.application_id;
    const organizationId: string | undefined = body.organization_id;

    if (!applicationId && !organizationId) {
      return NextResponse.json(
        { error: 'application_id or organization_id is required' },
        { status: 422 },
      );
    }

    const supabase = createAdminClient();

    if (applicationId) {
      // Partner path: verify the application exists
      const { data: app, error: appError } = await supabase
        .from('partner_applications')
        .select('id')
        .eq('id', applicationId)
        .single();

      if (appError || !app) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }

      const token = randomBytes(16).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('migration_transfers')
        .insert({
          token,
          application_id: applicationId,
          expires_at: expiresAt,
        })
        .select('id, token, expires_at')
        .single();

      if (error) {
        console.error('[upload-migration] DB error:', error);
        return NextResponse.json({ error: 'Failed to create transfer' }, { status: 500 });
      }

      return NextResponse.json({
        token: data.token,
        upload_url: `/tms/upload/${data.token}`,
        expires_at: data.expires_at,
      });
    }

    // Non-partner path: verify the org has an existing paid migration transfer
    const { data: existingTransfer } = await supabase
      .from('migration_transfers')
      .select('id')
      .eq('organization_id', organizationId!)
      .limit(1)
      .single();

    if (!existingTransfer) {
      return NextResponse.json(
        { error: 'No migration transfer found for this organization. Please purchase a migration first.' },
        { status: 404 },
      );
    }

    const token = randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('migration_transfers')
      .insert({
        token,
        organization_id: organizationId!,
        expires_at: expiresAt,
      })
      .select('id, token, expires_at')
      .single();

    if (error) {
      console.error('[upload-migration] DB error:', error);
      return NextResponse.json({ error: 'Failed to create transfer' }, { status: 500 });
    }

    return NextResponse.json({
      token: data.token,
      upload_url: `/tms/upload/${data.token}`,
      expires_at: data.expires_at,
    });
  } catch (err) {
    console.error('[POST /api/tms/upload-migration]', err);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
