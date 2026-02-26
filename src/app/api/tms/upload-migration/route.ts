import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { partnerUploadLimiter } from '@/lib/rate-limiters';
import { randomBytes } from 'crypto';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// ---------------------------------------------------------------------------
// POST /api/tms/upload-migration — Create a migration_transfers row with token
// Supports both partner (application_id) and non-partner (organization_id) flows
// Requires authenticated user with owner/admin role.
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const blocked = await checkRateLimit(request, partnerUploadLimiter);
    if (blocked) return blocked;

    // --- Session auth ---
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in.' },
        { status: 401 },
      );
    }

    // --- Profile & role check ---
    const { data: profileData } = await supabase
      .from('profiles')
      .select('organization_id, role, is_platform_admin')
      .eq('id', user.id)
      .single();

    const profile = profileData as Pick<ProfileRow, 'organization_id' | 'role' | 'is_platform_admin'> | null;
    if (!profile) {
      return NextResponse.json(
        { error: 'Not Found', message: 'User profile not found.' },
        { status: 404 },
      );
    }

    // Must be owner or admin (or platform admin)
    if (!profile.is_platform_admin && profile.role !== 'owner' && profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only organization owners or admins can create migration tokens.' },
        { status: 403 },
      );
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

    // --- Authorization: verify org/application ownership ---
    const adminSupabase = createAdminClient();

    if (organizationId && !profile.is_platform_admin && organizationId !== profile.organization_id) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You can only create migration tokens for your own organization.' },
        { status: 403 },
      );
    }

    if (applicationId) {
      // Verify application exists and belongs to user's org (or user is platform admin)
      const { data: app, error: appError } = await adminSupabase
        .from('partner_applications')
        .select('id, organization_id')
        .eq('id', applicationId)
        .single();

      if (appError || !app) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }

      if (!profile.is_platform_admin && app.organization_id && app.organization_id !== profile.organization_id) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Application does not belong to your organization.' },
          { status: 403 },
        );
      }

      const token = randomBytes(16).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await adminSupabase
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
    const { data: existingTransfer } = await adminSupabase
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

    const { data, error } = await adminSupabase
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
