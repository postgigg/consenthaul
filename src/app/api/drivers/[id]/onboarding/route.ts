import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type DriverRow = Database['public']['Tables']['drivers']['Row'];

const onboardingSchema = z.object({
  onboarding_status: z.enum([
    'pending',
    'onboarding',
    'active',
    'suspended',
    'terminated',
  ]),
});

// ---------------------------------------------------------------------------
// PATCH /api/drivers/[id]/onboarding — Update driver onboarding status
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

    // 2. Get org from profile
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

    // 3. Validate request body
    const body = await request.json();
    const parsed = onboardingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid onboarding status.',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }

    // 4. Update driver — verify driver belongs to org
    const { data: driverData, error: updateError } = await supabase
      .from('drivers')
      .update({ onboarding_status: parsed.data.onboarding_status })
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .select()
      .single();

    const driver = driverData as DriverRow | null;

    if (updateError || !driver) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Driver not found.' },
        { status: 404 },
      );
    }

    // 5. If terminating, also set is_active and termination_date
    if (parsed.data.onboarding_status === 'terminated') {
      const today = new Date().toISOString().slice(0, 10);
      await supabase
        .from('drivers')
        .update({
          is_active: false,
          termination_date: today,
        })
        .eq('id', id)
        .eq('organization_id', profile.organization_id);
    }

    // 6. Audit log
    await supabase.from('audit_log').insert({
      organization_id: profile.organization_id,
      actor_id: user.id,
      actor_type: 'user',
      action: 'driver.onboarding_status_changed',
      resource_type: 'driver',
      resource_id: id,
      details: { new_status: parsed.data.onboarding_status },
    });

    return NextResponse.json({ data: driver });
  } catch (err) {
    console.error('[PATCH /api/drivers/[id]/onboarding]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
