import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processReconsent } from '@/lib/reconsent/process-reconsent';
import { checkRateLimit } from '@/lib/rate-limit';
import { batchLimiter } from '@/lib/rate-limiters';
import { batchReconsentSchema } from '@/lib/validators';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export async function POST(request: NextRequest) {
  try {
    const blocked = await checkRateLimit(request, batchLimiter);
    if (blocked) return blocked;

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

    // Parse and validate optional body
    let driverIds: string[] | undefined;
    try {
      const body = await request.json();
      const parsed = batchReconsentSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            error: 'Validation Error',
            message: 'Invalid request body.',
            details: parsed.error.flatten().fieldErrors,
          },
          { status: 422 },
        );
      }
      driverIds = parsed.data.driver_ids;
    } catch {
      // No body or invalid JSON — that's fine, all fields are optional
    }

    const result = await processReconsent({
      orgId: profile.organization_id,
      driverIds,
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (err) {
    console.error('[POST /api/consents/batch-reconsent]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
