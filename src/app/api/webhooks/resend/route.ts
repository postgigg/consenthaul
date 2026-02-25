import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { OutreachEventType } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Map Resend event types to our event types
    const eventTypeMap: Record<string, OutreachEventType> = {
      'email.delivered': 'delivered',
      'email.opened': 'opened',
      'email.bounced': 'bounced',
      'email.complained': 'complaint',
    };

    const eventType = eventTypeMap[type];
    if (!eventType) {
      return NextResponse.json({ ok: true });
    }

    // Find the original sent event by resend_message_id
    const messageId = data.email_id;
    if (!messageId) {
      return NextResponse.json({ ok: true });
    }

    const { data: sentEvent } = await supabase
      .from('outreach_events')
      .select('*')
      .eq('resend_message_id', messageId)
      .eq('event_type', 'sent')
      .single();

    if (!sentEvent) {
      return NextResponse.json({ ok: true });
    }

    // Record event
    await supabase.from('outreach_events').insert({
      lead_id: sentEvent.lead_id,
      campaign_id: sentEvent.campaign_id,
      enrollment_id: sentEvent.enrollment_id,
      step_id: sentEvent.step_id,
      event_type: eventType,
      resend_message_id: messageId,
    });

    // Handle bounces — pause enrollment
    if (eventType === 'bounced') {
      if (sentEvent.enrollment_id) {
        await supabase
          .from('outreach_enrollments')
          .update({ status: 'bounced', next_send_at: null })
          .eq('id', sentEvent.enrollment_id);
      }

      // Update campaign bounce count
      if (sentEvent.campaign_id) {
        const { data: campaign } = await supabase
          .from('outreach_campaigns')
          .select('stats_bounced')
          .eq('id', sentEvent.campaign_id)
          .single();

        if (campaign) {
          await supabase
            .from('outreach_campaigns')
            .update({ stats_bounced: campaign.stats_bounced + 1 })
            .eq('id', sentEvent.campaign_id);
        }
      }
    }

    // Handle complaints — unsubscribe
    if (eventType === 'complaint') {
      await supabase
        .from('outreach_leads')
        .update({ do_not_contact: true })
        .eq('id', sentEvent.lead_id);

      if (sentEvent.enrollment_id) {
        await supabase
          .from('outreach_enrollments')
          .update({ status: 'unsubscribed', next_send_at: null })
          .eq('id', sentEvent.enrollment_id);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Resend webhook]', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
