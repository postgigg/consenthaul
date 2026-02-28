import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { generalLimiter } from '@/lib/rate-limiters';
import { z } from 'zod';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

const deleteSchema = z.object({
  confirmation: z.literal('DELETE MY ACCOUNT'),
  password: z.string().min(1, 'Password is required'),
});

// ---------------------------------------------------------------------------
// POST /api/account/delete — Delete organization and all associated data (GDPR Right to Erasure)
// Only the organization owner can perform this action.
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const blocked = await checkRateLimit(request, generalLimiter);
    if (blocked) return blocked;

    const supabase = createClient();
    const admin = createAdminClient();

    // 1. Authenticate
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

    // 2. Verify owner role
    const { data: profileData } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    const profile = profileData as Pick<ProfileRow, 'organization_id' | 'role'> | null;

    if (!profile) {
      return NextResponse.json(
        { error: 'Not Found', message: 'User profile not found.' },
        { status: 404 },
      );
    }

    if (profile.role !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only the organization owner can delete the account.' },
        { status: 403 },
      );
    }

    // 3. Validate request body
    const body = await request.json();
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid request. Confirmation text and password are required.',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }

    // 4. Verify password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: parsed.data.password,
    });
    if (signInError) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid password.' },
        { status: 401 },
      );
    }

    const orgId = profile.organization_id;

    // 5. Audit log (before deletion so it's captured even if partial failure occurs)
    await admin.from('audit_log').insert({
      organization_id: orgId,
      actor_id: user.id,
      actor_type: 'user',
      action: 'organization.deleted',
      resource_type: 'organization',
      resource_id: orgId,
      details: { reason: 'GDPR erasure request', initiated_by: user.email },
    });

    // 6. Delete in order respecting foreign keys
    // 6a. Delete webhook events & endpoints
    await admin.from('webhook_events').delete().eq('organization_id', orgId);
    await admin.from('webhook_endpoints').delete().eq('organization_id', orgId);

    // 6b. Delete notifications
    await admin.from('notifications').delete().eq('organization_id', orgId);

    // 6c. Delete in-app notifications
    const { data: orgProfiles } = await admin
      .from('profiles')
      .select('id')
      .eq('organization_id', orgId);
    if (orgProfiles && orgProfiles.length > 0) {
      for (const p of orgProfiles) {
        await admin.from('in_app_notifications').delete().eq('user_id', p.id);
        await admin.from('notification_preferences').delete().eq('user_id', p.id);
      }
    }

    // 6d. Delete query records
    await admin.from('query_records').delete().eq('organization_id', orgId);

    // 6e. Delete consents
    await admin.from('consents').delete().eq('organization_id', orgId);

    // 6f. Delete drivers
    await admin.from('drivers').delete().eq('organization_id', orgId);

    // 6g. Delete credit transactions & balances
    await admin.from('credit_transactions').delete().eq('organization_id', orgId);
    await admin.from('credit_balances').delete().eq('organization_id', orgId);

    // 6h. Delete API keys
    await admin.from('api_keys').delete().eq('organization_id', orgId);

    // 6i. Delete templates
    await admin.from('consent_templates').delete().eq('organization_id', orgId);

    // 6j. Delete invoices
    await admin.from('invoices').delete().eq('organization_id', orgId);

    // 6k. Delete team invites
    await admin.from('team_invites').delete().eq('organization_id', orgId);

    // 6l. Delete user sessions
    await admin.from('user_sessions').delete().eq('organization_id', orgId);

    // 6m. Delete service requests
    await admin.from('service_requests').delete().eq('organization_id', orgId);

    // 6n. Delete IP allowlist entries
    await admin.from('ip_allowlist').delete().eq('organization_id', orgId);

    // 6o. Get all profile IDs for auth user deletion
    const { data: profiles } = await admin
      .from('profiles')
      .select('id')
      .eq('organization_id', orgId);

    // 6p. Delete profiles
    await admin.from('profiles').delete().eq('organization_id', orgId);

    // 6q. Delete organization
    await admin.from('organizations').delete().eq('id', orgId);

    // 6r. Delete auth users
    for (const p of profiles ?? []) {
      await admin.auth.admin.deleteUser(p.id);
    }

    // 7. Delete consent PDFs from storage
    const { data: files } = await admin.storage.from('consent-pdfs').list(orgId);
    if (files && files.length > 0) {
      await admin.storage
        .from('consent-pdfs')
        .remove(files.map((f) => `${orgId}/${f.name}`));
    }

    return NextResponse.json({ data: { deleted: true } });
  } catch (err) {
    console.error('[POST /api/account/delete]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred during account deletion.' },
      { status: 500 },
    );
  }
}
