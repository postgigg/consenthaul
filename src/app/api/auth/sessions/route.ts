import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// ---------------------------------------------------------------------------
// GET /api/auth/sessions -- List active sessions for the authenticated user
// ---------------------------------------------------------------------------
export async function GET(_request: NextRequest) {
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

    const admin = createAdminClient();
    const { data: sessions, error: queryError } = await admin
      .from('user_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('last_active_at', { ascending: false });

    if (queryError) {
      console.error('[GET /api/auth/sessions] Query error:', queryError);
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to fetch sessions.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: sessions ?? [] });
  } catch (err) {
    console.error('[GET /api/auth/sessions]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/auth/sessions -- Log out all other sessions
// ---------------------------------------------------------------------------
export async function DELETE(request: NextRequest) {
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

    const admin = createAdminClient();

    // Get current session ID from the request header to keep it active
    const currentSessionId = request.headers.get('x-session-id');

    // Deactivate all other sessions in our user_sessions table
    let query = admin
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (currentSessionId) {
      query = query.neq('id', currentSessionId);
    }

    const { error: updateError } = await query;

    if (updateError) {
      console.error('[DELETE /api/auth/sessions] Update error:', updateError);
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to end sessions.' },
        { status: 500 },
      );
    }

    // Sign out all other sessions via Supabase Auth admin API
    try {
      await admin.auth.admin.signOut(user.id, 'others');
    } catch (signOutErr) {
      // Log but do not fail -- the session records are already deactivated
      console.error('[DELETE /api/auth/sessions] Supabase signOut error:', signOutErr);
    }

    return NextResponse.json({ data: { logged_out: true } });
  } catch (err) {
    console.error('[DELETE /api/auth/sessions]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
