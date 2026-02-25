import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: { enrollmentId: string } },
) {
  try {
    const supabase = createAdminClient();

    // Get enrollment
    const { data: enrollment } = await supabase
      .from('outreach_enrollments')
      .select('id, lead_id, campaign_id')
      .eq('id', params.enrollmentId)
      .single();

    if (enrollment) {
      // Mark enrollment as unsubscribed
      await supabase
        .from('outreach_enrollments')
        .update({ status: 'unsubscribed', next_send_at: null })
        .eq('id', enrollment.id);

      // Mark lead as do_not_contact
      await supabase
        .from('outreach_leads')
        .update({ do_not_contact: true })
        .eq('id', enrollment.lead_id);

      // Record event
      await supabase.from('outreach_events').insert({
        lead_id: enrollment.lead_id,
        campaign_id: enrollment.campaign_id,
        enrollment_id: enrollment.id,
        event_type: 'unsubscribed',
      });
    }
  } catch (err) {
    console.error('[Unsubscribe]', err);
  }

  // Redirect to unsubscribed confirmation page
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://consenthaul.com';
  return NextResponse.redirect(`${appUrl}/outreach/unsubscribed`, 302);
}
