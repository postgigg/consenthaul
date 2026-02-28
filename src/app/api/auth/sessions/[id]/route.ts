import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// ---------------------------------------------------------------------------
// DELETE /api/auth/sessions/[id] -- End a specific session
// ---------------------------------------------------------------------------
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    // Deactivate the session -- scoped to the current user for safety
    const { error } = await admin
      .from('user_sessions')
      .update({ is_active: false })
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[DELETE /api/auth/sessions/[id]]', error);
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to end session.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: { ended: true } });
  } catch (err) {
    console.error('[DELETE /api/auth/sessions/[id]]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
