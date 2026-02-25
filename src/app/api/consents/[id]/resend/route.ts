import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendConsentSMS } from '@/lib/messaging/sms';
import { sendConsentWhatsApp } from '@/lib/messaging/whatsapp';
import { sendConsentEmail } from '@/lib/messaging/email';
import type { Database } from '@/types/database';

type ConsentRow = Database['public']['Tables']['consents']['Row'];
type NotificationRow = Database['public']['Tables']['notifications']['Row'];

// ---------------------------------------------------------------------------
// POST /api/consents/[id]/resend — Resend the consent signing link
// ---------------------------------------------------------------------------
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createClient();
    const { id } = params;

    // 1. Authenticate
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

    // 2. Get consent with driver — RLS scopes to org
    const { data: consentData, error } = await supabase
      .from('consents')
      .select('*, driver:drivers(id, first_name, last_name, phone, email)')
      .eq('id', id)
      .single();

    const consent = consentData as (ConsentRow & { driver: unknown }) | null;

    if (error || !consent) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Consent not found.' },
        { status: 404 },
      );
    }

    // 3. Validate state — cannot resend if already signed or expired
    if (consent.status === 'signed') {
      return NextResponse.json(
        { error: 'Conflict', message: 'This consent has already been signed.' },
        { status: 409 },
      );
    }

    if (consent.status === 'revoked') {
      return NextResponse.json(
        { error: 'Conflict', message: 'This consent has been revoked.' },
        { status: 409 },
      );
    }

    // Check token expiry
    if (
      consent.signing_token_expires_at &&
      new Date(consent.signing_token_expires_at) < new Date()
    ) {
      return NextResponse.json(
        {
          error: 'Gone',
          message: 'The signing token has expired. Please create a new consent request.',
        },
        { status: 410 },
      );
    }

    if (!consent.signing_token) {
      return NextResponse.json(
        { error: 'Conflict', message: 'No signing token found for this consent.' },
        { status: 409 },
      );
    }

    // Fetch organization name for messaging
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', consent.organization_id)
      .single();
    const companyName = orgData?.name ?? undefined;

    // 4. Build signing URL
    const signingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sign/${consent.signing_token}`;

    // Resolve driver — the select returns it as a nested object
    const driver = consent.driver as {
      id: string;
      first_name: string;
      last_name: string;
      phone: string | null;
      email: string | null;
    };

    const driverFullName = `${driver.first_name} ${driver.last_name}`;

    // 5. Resend via original delivery method
    let deliverySid: string | null = null;

    try {
      if (consent.delivery_method === 'sms') {
        const result = await sendConsentSMS({
          to: consent.delivery_address,
          driverName: driverFullName,
          signingUrl,
          companyName,
          language: consent.language,
        });
        deliverySid = result.sid;
      } else if (consent.delivery_method === 'whatsapp') {
        const result = await sendConsentWhatsApp({
          to: consent.delivery_address,
          driverName: driverFullName,
          signingUrl,
          companyName,
          language: consent.language,
        });
        deliverySid = result.sid;
      } else if (consent.delivery_method === 'email') {
        const result = await sendConsentEmail({
          to: consent.delivery_address,
          driverName: driverFullName,
          signingUrl,
          companyName,
          language: consent.language,
        });
        deliverySid = result.messageId;
      } else {
        return NextResponse.json(
          {
            error: 'Conflict',
            message: 'Manual consents cannot be resent electronically.',
          },
          { status: 409 },
        );
      }
    } catch (sendError) {
      console.error('[POST /api/consents/[id]/resend] delivery error:', sendError);
      return NextResponse.json(
        { error: 'Delivery Error', message: 'Failed to resend consent link.' },
        { status: 502 },
      );
    }

    // 6. Update consent delivery SID
    if (deliverySid) {
      await supabase
        .from('consents')
        .update({
          delivery_sid: deliverySid,
          status: 'sent',
        })
        .eq('id', id);
    }

    // 7. Update or create notification record
    const { data: existingNotificationData } = await supabase
      .from('notifications')
      .select('id, attempts')
      .eq('consent_id', id)
      .eq('type', 'consent_request')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const existingNotification = existingNotificationData as Pick<NotificationRow, 'id' | 'attempts'> | null;

    if (existingNotification) {
      await supabase
        .from('notifications')
        .update({
          external_id: deliverySid,
          status: 'sent',
          attempts: existingNotification.attempts + 1,
          sent_at: new Date().toISOString(),
        })
        .eq('id', existingNotification.id);
    } else {
      await supabase.from('notifications').insert({
        organization_id: consent.organization_id,
        consent_id: consent.id,
        type: 'consent_request',
        channel: consent.delivery_method,
        recipient: consent.delivery_address,
        external_id: deliverySid,
        status: 'sent',
        attempts: 1,
        max_attempts: 3,
      });
    }

    // 8. Audit log
    await supabase.from('audit_log').insert({
      organization_id: consent.organization_id,
      actor_id: user.id,
      actor_type: 'user',
      action: 'consent.resent',
      resource_type: 'consent',
      resource_id: id,
      details: {
        delivery_method: consent.delivery_method,
        delivery_address: consent.delivery_address,
      },
    });

    return NextResponse.json({
      data: {
        consent_id: id,
        status: 'sent',
        delivery_sid: deliverySid,
        message: 'Consent link resent successfully.',
      },
    });
  } catch (err) {
    console.error('[POST /api/consents/[id]/resend]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
