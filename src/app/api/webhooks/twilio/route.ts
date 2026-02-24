import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database, NotificationStatus, ConsentStatus } from '@/types/database';

type NotificationRow = Database['public']['Tables']['notifications']['Row'];
type ConsentRow = Database['public']['Tables']['consents']['Row'];

// Twilio status values: https://www.twilio.com/docs/messaging/api/message-resource#message-status-values
const TWILIO_TO_NOTIFICATION_STATUS: Record<string, NotificationStatus> = {
  queued: 'queued',
  sending: 'sending',
  sent: 'sent',
  delivered: 'delivered',
  undelivered: 'undeliverable',
  failed: 'failed',
  canceled: 'failed',
};

const TWILIO_TO_CONSENT_STATUS: Record<string, ConsentStatus | null> = {
  delivered: 'delivered',
  undelivered: 'failed',
  failed: 'failed',
  // Other statuses don't change the consent status
  queued: null,
  sending: null,
  sent: null,
  canceled: null,
};

// ---------------------------------------------------------------------------
// POST /api/webhooks/twilio — Handle Twilio message status callbacks
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Twilio sends form-encoded data
    const formData = await request.formData();

    const messageSid = formData.get('MessageSid') as string | null;
    const messageStatus = formData.get('MessageStatus') as string | null;
    const errorCode = formData.get('ErrorCode') as string | null;
    const errorMessage = formData.get('ErrorMessage') as string | null;

    if (!messageSid || !messageStatus) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Missing MessageSid or MessageStatus.' },
        { status: 400 },
      );
    }

    // 1. Map Twilio status to our notification status
    const notificationStatus = TWILIO_TO_NOTIFICATION_STATUS[messageStatus];
    if (!notificationStatus) {
      // Unknown status — acknowledge but don't process
      console.log(`[Twilio webhook] Unknown status: ${messageStatus} for SID: ${messageSid}`);
      return new NextResponse('<Response></Response>', {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // 2. Find the notification by external_id (Twilio SID)
    const { data: notificationData, error: notifError } = await supabase
      .from('notifications')
      .select('id, consent_id, organization_id, status')
      .eq('external_id', messageSid)
      .single();

    const notification = notificationData as Pick<NotificationRow, 'id' | 'consent_id' | 'organization_id' | 'status'> | null;

    if (notifError || !notification) {
      // Could be a message we didn't originate or already cleaned up
      console.log(`[Twilio webhook] No notification found for SID: ${messageSid}`);
      return new NextResponse('<Response></Response>', {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // 3. Update notification record
    const notifUpdate: Record<string, unknown> = {
      status: notificationStatus,
    };

    if (notificationStatus === 'delivered') {
      notifUpdate.delivered_at = new Date().toISOString();
    }

    if (errorCode || errorMessage) {
      notifUpdate.status_detail = `${errorCode ?? ''}: ${errorMessage ?? ''}`.trim();
    }

    await supabase
      .from('notifications')
      .update(notifUpdate)
      .eq('id', notification.id);

    // 4. Update consent status if applicable
    if (notification.consent_id) {
      const consentStatus = TWILIO_TO_CONSENT_STATUS[messageStatus];

      if (consentStatus) {
        // Only update consent if current status is in a pre-delivery state
        const { data: consentData } = await supabase
          .from('consents')
          .select('status')
          .eq('id', notification.consent_id)
          .single();

        const consent = consentData as Pick<ConsentRow, 'status'> | null;

        if (consent) {
          const updatableStatuses = ['pending', 'sent'];
          if (consentStatus === 'failed') {
            // Failed can update from any pre-sign state
            updatableStatuses.push('delivered', 'opened');
          }

          if (updatableStatuses.includes(consent.status)) {
            const consentUpdate: Record<string, unknown> = {
              status: consentStatus,
            };

            if (consentStatus === 'delivered') {
              consentUpdate.delivered_at = new Date().toISOString();
            }

            await supabase
              .from('consents')
              .update(consentUpdate)
              .eq('id', notification.consent_id);
          }
        }
      }
    }

    // Twilio expects a TwiML response (even empty)
    return new NextResponse('<Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (err) {
    console.error('[POST /api/webhooks/twilio]', err);
    // Still return 200 to Twilio to prevent retries for our errors
    return new NextResponse('<Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
