import { createAdminClient } from '@/lib/supabase/admin';
import { sendConsentSMS } from '@/lib/messaging/sms';
import { sendConsentWhatsApp } from '@/lib/messaging/whatsapp';
import { sendConsentEmail } from '@/lib/messaging/email';
import { dispatchWebhookEvent } from '@/lib/webhooks';
import {
  REMINDER_INTERVAL_DAYS,
  REMINDER_BATCH_SIZE,
  REMINDER_ELIGIBLE_STATUSES,
} from '@/lib/constants';
import type { Database, DeliveryMethod, Json } from '@/types/database';

type ConsentRow = Database['public']['Tables']['consents']['Row'];

export interface ReminderResult {
  processed: number;
  sent: number;
  skippedNoCredits: number;
  skippedAutoRemindOff: number;
  skippedExpired: number;
  failed: number;
}

export async function processConsentReminders(): Promise<ReminderResult> {
  const supabase = createAdminClient();
  const result: ReminderResult = {
    processed: 0,
    sent: 0,
    skippedNoCredits: 0,
    skippedAutoRemindOff: 0,
    skippedExpired: 0,
    failed: 0,
  };

  // Step 1: Find eligible consents
  const { data: consents, error: consentError } = await supabase
    .from('consents')
    .select('*, driver:drivers(id, first_name, last_name, phone, email)')
    .in('status', REMINDER_ELIGIBLE_STATUSES)
    .neq('delivery_method', 'manual')
    .not('signing_token', 'is', null)
    .gt('signing_token_expires_at', new Date().toISOString());

  if (consentError || !consents || consents.length === 0) {
    return result;
  }

  const consentIds = consents.map((c) => c.id);

  // Step 2: Get notification history for these consents
  const { data: notifications } = await supabase
    .from('notifications')
    .select('consent_id, created_at, type')
    .in('consent_id', consentIds)
    .in('type', ['consent_link', 'reminder'])
    .order('created_at', { ascending: false });

  // Build per-consent map: { lastSentAt, reminderCount }
  const historyMap = new Map<string, { lastSentAt: Date; reminderCount: number }>();
  for (const n of notifications ?? []) {
    if (!n.consent_id) continue;
    const existing = historyMap.get(n.consent_id);
    const createdAt = new Date(n.created_at);
    if (!existing) {
      historyMap.set(n.consent_id, {
        lastSentAt: createdAt,
        reminderCount: n.type === 'reminder' ? 1 : 0,
      });
    } else {
      if (createdAt > existing.lastSentAt) {
        existing.lastSentAt = createdAt;
      }
      if (n.type === 'reminder') {
        existing.reminderCount++;
      }
    }
  }

  // Step 3: Filter — keep only consents where lastSentAt is older than REMINDER_INTERVAL_DAYS
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - REMINDER_INTERVAL_DAYS);

  const eligible = consents.filter((c) => {
    const history = historyMap.get(c.id);
    if (!history) {
      // No notification history — check if consent was created long enough ago
      return new Date(c.created_at) < cutoff;
    }
    return history.lastSentAt < cutoff;
  });

  if (eligible.length === 0) return result;

  // Step 4: Fetch org settings in bulk
  const orgIds = Array.from(new Set(eligible.map((c) => c.organization_id)));
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, settings')
    .in('id', orgIds);

  const orgMap = new Map<string, { name: string; settings: Json }>();
  for (const org of orgs ?? []) {
    orgMap.set(org.id, { name: org.name, settings: org.settings });
  }

  // Step 5: Process batch
  const batch = eligible.slice(0, REMINDER_BATCH_SIZE);

  for (const consent of batch) {
    result.processed++;
    const consentRow = consent as unknown as ConsentRow & {
      driver: { id: string; first_name: string; last_name: string; phone: string | null; email: string | null };
    };

    const org = orgMap.get(consentRow.organization_id);

    // Check auto_remind setting
    const settings = org?.settings as Record<string, unknown> | null;
    if (settings?.auto_remind === false) {
      result.skippedAutoRemindOff++;
      continue;
    }

    // Double-check token expiry
    if (
      consentRow.signing_token_expires_at &&
      new Date(consentRow.signing_token_expires_at) < new Date()
    ) {
      result.skippedExpired++;
      continue;
    }

    // Deduct credit
    const { data: creditDeducted } = await supabase.rpc('deduct_credit', {
      p_org_id: consentRow.organization_id,
      p_consent_id: consentRow.id,
      p_user_id: null,
    });

    if (!creditDeducted) {
      result.skippedNoCredits++;

      // Log skip to audit
      await supabase.from('audit_log').insert({
        organization_id: consentRow.organization_id,
        actor_id: null,
        actor_type: 'system',
        action: 'reminder.skipped_no_credits',
        resource_type: 'consent',
        resource_id: consentRow.id,
        details: {},
      });
      continue;
    }

    // Send reminder
    const signingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sign/${consentRow.signing_token}`;
    const driverName = `${consentRow.driver.first_name} ${consentRow.driver.last_name}`;
    const companyName = org?.name ?? undefined;
    const history = historyMap.get(consentRow.id);
    const reminderNumber = (history?.reminderCount ?? 0) + 1;

    let deliverySid: string | null = null;
    const channel: DeliveryMethod = consentRow.delivery_method;

    try {
      if (consentRow.delivery_method === 'sms') {
        const res = await sendConsentSMS({
          to: consentRow.delivery_address,
          driverName,
          signingUrl,
          companyName,
          language: consentRow.language,
        });
        deliverySid = res.sid;
      } else if (consentRow.delivery_method === 'whatsapp') {
        const res = await sendConsentWhatsApp({
          to: consentRow.delivery_address,
          driverName,
          signingUrl,
          companyName,
          language: consentRow.language,
        });
        deliverySid = res.sid;
      } else if (consentRow.delivery_method === 'email') {
        const res = await sendConsentEmail({
          to: consentRow.delivery_address,
          driverName,
          signingUrl,
          companyName,
          language: consentRow.language,
        });
        deliverySid = res.messageId;
      }
    } catch (err) {
      console.error(`[consent-reminders] failed to send reminder for ${consentRow.id}:`, err);
      result.failed++;
      continue;
    }

    // Insert notification
    await supabase.from('notifications').insert({
      organization_id: consentRow.organization_id,
      consent_id: consentRow.id,
      type: 'reminder',
      channel,
      recipient: consentRow.delivery_address,
      external_id: deliverySid,
      status: 'sent',
      attempts: 1,
      max_attempts: 1,
      sent_at: new Date().toISOString(),
    });

    // Audit log
    await supabase.from('audit_log').insert({
      organization_id: consentRow.organization_id,
      actor_id: null,
      actor_type: 'system',
      action: 'consent.auto_reminder_sent',
      resource_type: 'consent',
      resource_id: consentRow.id,
      details: {
        reminder_number: reminderNumber,
        delivery_method: consentRow.delivery_method,
        delivery_address: consentRow.delivery_address,
      },
    });

    // Fire-and-forget webhook
    dispatchWebhookEvent({
      eventType: 'consent.sent',
      consentId: consentRow.id,
      organizationId: consentRow.organization_id,
    }).catch(() => {});

    result.sent++;
  }

  return result;
}
