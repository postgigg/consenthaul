import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const unenrollSchema = z.object({
  factor_id: z.string().min(1, 'Factor ID is required'),
});

// ---------------------------------------------------------------------------
// POST /api/auth/mfa/unenroll -- Disable MFA for the authenticated user
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const parsed = unenrollSchema.safeParse(body);

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

    // Unenroll the factor via Supabase Auth
    const { error } = await supabase.auth.mfa.unenroll({
      factorId: parsed.data.factor_id,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Unenroll Error', message: error.message },
        { status: 400 },
      );
    }

    // Clear MFA fields on the profile using the admin client (bypasses RLS)
    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from('profiles')
      .update({
        mfa_enabled: false,
        mfa_secret: null,
        mfa_backup_codes: null,
        mfa_verified_at: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[POST /api/auth/mfa/unenroll] Profile update error:', updateError);
    }

    return NextResponse.json({ data: { unenrolled: true } });
  } catch (err) {
    console.error('[POST /api/auth/mfa/unenroll]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
