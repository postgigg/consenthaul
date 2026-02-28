import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const verifySchema = z.object({
  factor_id: z.string().min(1, 'Factor ID is required'),
  code: z.string().length(6, 'Code must be exactly 6 digits'),
});

// ---------------------------------------------------------------------------
// POST /api/auth/mfa/verify -- Verify a TOTP code and complete enrollment
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
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid verification data.',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }

    const { factor_id, code } = parsed.data;

    // Create a challenge for the factor
    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: factor_id });

    if (challengeError) {
      return NextResponse.json(
        { error: 'Challenge Error', message: challengeError.message },
        { status: 400 },
      );
    }

    // Verify the code against the challenge
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: factor_id,
      challengeId: challengeData.id,
      code,
    });

    if (verifyError) {
      return NextResponse.json(
        { error: 'Verification Error', message: 'Invalid verification code.' },
        { status: 400 },
      );
    }

    // Mark profile as MFA enabled using the admin client (bypasses RLS)
    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from('profiles')
      .update({
        mfa_enabled: true,
        mfa_verified_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[POST /api/auth/mfa/verify] Profile update error:', updateError);
      // MFA is verified on Supabase side even if profile update fails,
      // so we still return success but log the discrepancy.
    }

    return NextResponse.json({ data: { verified: true } });
  } catch (err) {
    console.error('[POST /api/auth/mfa/verify]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
