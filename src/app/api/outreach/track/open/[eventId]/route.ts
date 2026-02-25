import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// 1x1 transparent GIF
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

export async function GET(
  _request: NextRequest,
  { params }: { params: { eventId: string } },
) {
  try {
    const supabase = createAdminClient();

    // Look up the original sent event
    const { data: sentEvent } = await supabase
      .from('outreach_events')
      .select('lead_id, campaign_id, enrollment_id, step_id')
      .eq('id', params.eventId)
      .eq('event_type', 'sent')
      .single();

    if (sentEvent) {
      // Record open event (idempotent — only first open matters for stats)
      const { data: existingOpen } = sentEvent.enrollment_id && sentEvent.step_id
        ? await supabase
          .from('outreach_events')
          .select('id')
          .eq('enrollment_id', sentEvent.enrollment_id)
          .eq('step_id', sentEvent.step_id)
          .eq('event_type', 'opened')
          .limit(1)
          .single()
        : { data: null };

      if (!existingOpen) {
        await supabase.from('outreach_events').insert({
          lead_id: sentEvent.lead_id,
          campaign_id: sentEvent.campaign_id,
          enrollment_id: sentEvent.enrollment_id,
          step_id: sentEvent.step_id,
          event_type: 'opened',
        });

        // Update campaign stats
        if (sentEvent.campaign_id) {
          const { data: campaign } = await supabase
            .from('outreach_campaigns')
            .select('stats_opened')
            .eq('id', sentEvent.campaign_id)
            .single();

          if (campaign) {
            await supabase
              .from('outreach_campaigns')
              .update({ stats_opened: campaign.stats_opened + 1 })
              .eq('id', sentEvent.campaign_id);
          }
        }
      }
    }
  } catch (err) {
    console.error('[Open tracking]', err);
  }

  return new NextResponse(PIXEL, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
