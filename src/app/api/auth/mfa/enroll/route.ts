import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// POST /api/auth/mfa/enroll -- Start MFA enrollment (TOTP)
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

    // Enroll a new TOTP factor
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Authenticator App',
    });

    if (error) {
      return NextResponse.json(
        { error: 'Enrollment Error', message: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json({
      data: {
        id: data.id,
        totp: {
          qr_code: data.totp.qr_code,
          secret: data.totp.secret,
          uri: data.totp.uri,
        },
      },
    });
  } catch (err) {
    console.error('[POST /api/auth/mfa/enroll]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
