import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } },
) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url') ?? 'https://consenthaul.com';

  // Validate redirect URL — only allow http/https to prevent open redirect
  let redirectUrl = 'https://consenthaul.com';
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      redirectUrl = parsed.toString();
    }
  } catch {
    // Invalid URL — fall back to default
  }

  try {
    const supabase = createAdminClient();

    const { data: sentEvent } = await supabase
      .from('outreach_events')
      .select('lead_id, campaign_id, enrollment_id, step_id')
      .eq('id', params.eventId)
      .eq('event_type', 'sent')
      .single();

    if (sentEvent) {
      await supabase.from('outreach_events').insert({
        lead_id: sentEvent.lead_id,
        campaign_id: sentEvent.campaign_id,
        enrollment_id: sentEvent.enrollment_id,
        step_id: sentEvent.step_id,
        event_type: 'clicked',
        details: { url: redirectUrl },
      });

      // Update campaign stats
      if (sentEvent.campaign_id) {
        const { data: campaign } = await supabase
          .from('outreach_campaigns')
          .select('stats_clicked')
          .eq('id', sentEvent.campaign_id)
          .single();

        if (campaign) {
          await supabase
            .from('outreach_campaigns')
            .update({ stats_clicked: campaign.stats_clicked + 1 })
            .eq('id', sentEvent.campaign_id);
        }
      }
    }
  } catch (err) {
    console.error('[Click tracking]', err);
  }

  return NextResponse.redirect(redirectUrl, 302);
}
