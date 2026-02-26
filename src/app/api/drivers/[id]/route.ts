import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateDriverSchema } from '@/lib/validators';
import { checkRateLimit } from '@/lib/rate-limit';
import { generalLimiter } from '@/lib/rate-limiters';
import type { Database } from '@/types/database';

type DriverRow = Database['public']['Tables']['drivers']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// ---------------------------------------------------------------------------
// Helper: auth + profile with org_id
// ---------------------------------------------------------------------------
async function authenticateWithOrg(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data: profileData } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  const profile = profileData as Pick<ProfileRow, 'organization_id'> | null;
  if (!profile) return null;

  return { user, orgId: profile.organization_id };
}

// ---------------------------------------------------------------------------
// GET /api/drivers/[id] — Get a single driver with recent consents
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

    const auth = await authenticateWithOrg(supabase);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in.' },
        { status: 401 },
      );
    }

    // Fetch driver — RLS + explicit org filter
    const { data: driverData, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', id)
      .eq('organization_id', auth.orgId)
      .single();

    const driver = driverData as DriverRow | null;

    if (error || !driver) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Driver not found.' },
        { status: 404 },
      );
    }

    // Fetch recent consents for this driver (last 20) — org filter via driver ownership
    const { data: consents } = await supabase
      .from('consents')
      .select('id, status, consent_type, delivery_method, signed_at, created_at')
      .eq('driver_id', id)
      .eq('organization_id', auth.orgId)
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      data: {
        ...driver,
        consents: consents ?? [],
      },
    });
  } catch (err) {
    console.error('[GET /api/drivers/[id]]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/drivers/[id] — Update driver fields
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

    const auth = await authenticateWithOrg(supabase);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in.' },
        { status: 401 },
      );
    }

    // Parse & validate
    const body = await request.json();
    const parsed = updateDriverSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid driver data.',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }

    const input = parsed.data;

    // Check the driver exists — with org filter
    const { data: existingData, error: fetchError } = await supabase
      .from('drivers')
      .select('id, organization_id')
      .eq('id', id)
      .eq('organization_id', auth.orgId)
      .single();

    const existing = existingData as Pick<DriverRow, 'id' | 'organization_id'> | null;

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Driver not found.' },
        { status: 404 },
      );
    }

    // Update — with org filter
    const { data: updatedData, error: updateError } = await supabase
      .from('drivers')
      .update(input)
      .eq('id', id)
      .eq('organization_id', auth.orgId)
      .select()
      .single();

    const updated = updatedData as DriverRow | null;

    if (updateError || !updated) {
      console.error('[PATCH /api/drivers/[id]] update error:', updateError);
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to update driver.' },
        { status: 500 },
      );
    }

    // Audit log
    await supabase.from('audit_log').insert({
      organization_id: existing.organization_id,
      actor_id: auth.user.id,
      actor_type: 'user',
      action: 'driver.updated',
      resource_type: 'driver',
      resource_id: id,
      details: { updated_fields: Object.keys(input) },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error('[PATCH /api/drivers/[id]]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/drivers/[id] — Soft-delete a driver
// ---------------------------------------------------------------------------
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const blocked = await checkRateLimit(_request, generalLimiter);
    if (blocked) return blocked;

    const supabase = createClient();
    const { id } = params;

    const auth = await authenticateWithOrg(supabase);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in.' },
        { status: 401 },
      );
    }

    // Check the driver exists — with org filter
    const { data: existingData, error: fetchError } = await supabase
      .from('drivers')
      .select('id, organization_id, is_active')
      .eq('id', id)
      .eq('organization_id', auth.orgId)
      .single();

    const existing = existingData as Pick<DriverRow, 'id' | 'organization_id' | 'is_active'> | null;

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Driver not found.' },
        { status: 404 },
      );
    }

    if (!existing.is_active) {
      return NextResponse.json(
        { error: 'Conflict', message: 'Driver is already deactivated.' },
        { status: 409 },
      );
    }

    // Soft delete: set is_active = false, termination_date = today — with org filter
    const today = new Date().toISOString().slice(0, 10);
    const { data: updatedData, error: updateError } = await supabase
      .from('drivers')
      .update({
        is_active: false,
        termination_date: today,
      })
      .eq('id', id)
      .eq('organization_id', auth.orgId)
      .select()
      .single();

    const updated = updatedData as DriverRow | null;

    if (updateError || !updated) {
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to deactivate driver.' },
        { status: 500 },
      );
    }

    // Audit log
    await supabase.from('audit_log').insert({
      organization_id: existing.organization_id,
      actor_id: auth.user.id,
      actor_type: 'user',
      action: 'driver.deactivated',
      resource_type: 'driver',
      resource_id: id,
      details: { termination_date: today },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error('[DELETE /api/drivers/[id]]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
