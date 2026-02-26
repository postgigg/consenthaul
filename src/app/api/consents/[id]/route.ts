import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { generalLimiter } from '@/lib/rate-limiters';
import type { Database } from '@/types/database';

type ConsentRow = Database['public']['Tables']['consents']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// ---------------------------------------------------------------------------
// GET /api/consents/[id] — Get a single consent by ID (org-scoped)
// ---------------------------------------------------------------------------
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const blocked = await checkRateLimit(_request, generalLimiter);
    if (blocked) return blocked;

    const supabase = createClient();
    const { id } = params;

    // Authenticate
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

    // Fetch profile for org filter
    const { data: profileData } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const profile = profileData as Pick<ProfileRow, 'organization_id'> | null;
    if (!profile) {
      return NextResponse.json(
        { error: 'Not Found', message: 'User profile not found.' },
        { status: 404 },
      );
    }

    // Fetch consent with driver join — RLS + explicit org filter
    const { data: consentData, error } = await supabase
      .from('consents')
      .select('*, driver:drivers(*)')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .single();

    const consent = consentData as (ConsentRow & { driver: unknown }) | null;

    if (error || !consent) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Consent not found.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: consent });
  } catch (err) {
    console.error('[GET /api/consents/[id]]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/consents/[id] — Update consent (limited to status changes, e.g. revoke)
// ---------------------------------------------------------------------------
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const blocked = await checkRateLimit(request, generalLimiter);
    if (blocked) return blocked;

    const supabase = createClient();
    const { id } = params;

    // Authenticate
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

    // Fetch profile for org filter
    const { data: profileData } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const profile = profileData as Pick<ProfileRow, 'organization_id'> | null;
    if (!profile) {
      return NextResponse.json(
        { error: 'Not Found', message: 'User profile not found.' },
        { status: 404 },
      );
    }

    const body = await request.json();

    // Only allow revoking
    if (body.status && body.status !== 'revoked') {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Only status "revoked" is allowed via PATCH. Use the signing endpoint to sign.',
        },
        { status: 422 },
      );
    }

    // Fetch current consent to validate state transition — with org filter
    const { data: existingData, error: fetchError } = await supabase
      .from('consents')
      .select('id, status, organization_id')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .single();

    const existing = existingData as Pick<ConsentRow, 'id' | 'status' | 'organization_id'> | null;

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Consent not found.' },
        { status: 404 },
      );
    }

    // Can only revoke consents that are signed or in an active pre-sign state
    const revokableStatuses = ['pending', 'sent', 'delivered', 'opened', 'signed'];
    if (body.status === 'revoked' && !revokableStatuses.includes(existing.status)) {
      return NextResponse.json(
        {
          error: 'Conflict',
          message: `Cannot revoke a consent with status "${existing.status}".`,
        },
        { status: 409 },
      );
    }

    // Perform the update — with org filter
    const { data: updatedData, error: updateError } = await supabase
      .from('consents')
      .update({ status: 'revoked' })
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .select('*, driver:drivers(id, first_name, last_name)')
      .single();

    const updated = updatedData as (ConsentRow & { driver: unknown }) | null;

    if (updateError || !updated) {
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to update consent.' },
        { status: 500 },
      );
    }

    // Audit log
    await supabase.from('audit_log').insert({
      organization_id: existing.organization_id,
      actor_id: user.id,
      actor_type: 'user',
      action: 'consent.revoked',
      resource_type: 'consent',
      resource_id: id,
      details: { previous_status: existing.status },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error('[PATCH /api/consents/[id]]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
