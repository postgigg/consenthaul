import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateDriverSchema } from '@/lib/validators';
import type { Database } from '@/types/database';

type DriverRow = Database['public']['Tables']['drivers']['Row'];

// ---------------------------------------------------------------------------
// GET /api/drivers/[id] — Get a single driver with recent consents
// ---------------------------------------------------------------------------
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createClient();
    const { id } = params;

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

    // 2. Fetch driver — RLS scopes to org
    const { data: driverData, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', id)
      .single();

    const driver = driverData as DriverRow | null;

    if (error || !driver) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Driver not found.' },
        { status: 404 },
      );
    }

    // 3. Fetch recent consents for this driver (last 20)
    const { data: consents } = await supabase
      .from('consents')
      .select('id, status, consent_type, delivery_method, signed_at, created_at')
      .eq('driver_id', id)
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
    const supabase = createClient();
    const { id } = params;

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

    // 2. Parse & validate
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

    // 3. Check the driver exists (RLS scopes to org)
    const { data: existingData, error: fetchError } = await supabase
      .from('drivers')
      .select('id, organization_id')
      .eq('id', id)
      .single();

    const existing = existingData as Pick<DriverRow, 'id' | 'organization_id'> | null;

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Driver not found.' },
        { status: 404 },
      );
    }

    // 4. Update
    const { data: updatedData, error: updateError } = await supabase
      .from('drivers')
      .update(input)
      .eq('id', id)
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

    // 5. Audit log
    await supabase.from('audit_log').insert({
      organization_id: existing.organization_id,
      actor_id: user.id,
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
    const supabase = createClient();
    const { id } = params;

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

    // 2. Check the driver exists
    const { data: existingData2, error: fetchError } = await supabase
      .from('drivers')
      .select('id, organization_id, is_active')
      .eq('id', id)
      .single();

    const existing2 = existingData2 as Pick<DriverRow, 'id' | 'organization_id' | 'is_active'> | null;

    if (fetchError || !existing2) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Driver not found.' },
        { status: 404 },
      );
    }

    if (!existing2.is_active) {
      return NextResponse.json(
        { error: 'Conflict', message: 'Driver is already deactivated.' },
        { status: 409 },
      );
    }

    // 3. Soft delete: set is_active = false, termination_date = today
    const today = new Date().toISOString().slice(0, 10);
    const { data: updatedData2, error: updateError } = await supabase
      .from('drivers')
      .update({
        is_active: false,
        termination_date: today,
      })
      .eq('id', id)
      .select()
      .single();

    const updated2 = updatedData2 as DriverRow | null;

    if (updateError || !updated2) {
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to deactivate driver.' },
        { status: 500 },
      );
    }

    // 4. Audit log
    await supabase.from('audit_log').insert({
      organization_id: existing2.organization_id,
      actor_id: user.id,
      actor_type: 'user',
      action: 'driver.deactivated',
      resource_type: 'driver',
      resource_id: id,
      details: { termination_date: today },
    });

    return NextResponse.json({ data: updated2 });
  } catch (err) {
    console.error('[DELETE /api/drivers/[id]]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
