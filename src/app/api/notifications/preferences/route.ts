import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// GET /api/notifications/preferences — Get notification preferences
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in.' },
        { status: 401 },
      );
    }

    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Return defaults if no preferences exist
    if (!data) {
      return NextResponse.json({
        data: {
          email_consent_signed: true,
          email_consent_expired: true,
          email_low_credits: true,
          email_team_changes: true,
          email_compliance_alerts: true,
          email_weekly_digest: true,
          in_app_enabled: true,
        },
      });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[GET /api/notifications/preferences]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PUT /api/notifications/preferences — Update notification preferences
// ---------------------------------------------------------------------------
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in.' },
        { status: 401 },
      );
    }

    const body = await request.json();

    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        email_consent_signed: body.email_consent_signed ?? true,
        email_consent_expired: body.email_consent_expired ?? true,
        email_low_credits: body.email_low_credits ?? true,
        email_team_changes: body.email_team_changes ?? true,
        email_compliance_alerts: body.email_compliance_alerts ?? true,
        email_weekly_digest: body.email_weekly_digest ?? true,
        in_app_enabled: body.in_app_enabled ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('[PUT /api/notifications/preferences]', error);
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to update preferences.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[PUT /api/notifications/preferences]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
