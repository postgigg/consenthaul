import { createAdminClient } from '@/lib/supabase/admin';
import { generateSigningToken } from '@/lib/tokens';
import { sendConsentSMS } from '@/lib/messaging/sms';
import { sendConsentWhatsApp } from '@/lib/messaging/whatsapp';
import { sendConsentEmail } from '@/lib/messaging/email';
import { dispatchWebhookEvent } from '@/lib/webhooks';
import {
  RECONSENT_BATCH_SIZE,
  SIGNING_TOKEN_DEFAULT_TTL_HOURS,
} from '@/lib/constants';
import type { Database, DeliveryMethod, Json } from '@/types/database';

type ConsentRow = Database['public']['Tables']['consents']['Row'];

export interface ReconsentResult {
  processed: number;
  created: number;
  skippedNoCredits: number;
  skippedAlreadyPending: number;
  skippedAutoReconsentOff: number;
  failed: number;
}

interface ReconsentOptions {
  /** Limit processing to a single org */
  orgId?: string;
  /** Limit to specific driver IDs */
  driverIds?: string[];
}

export async function processReconsent(
  options?: ReconsentOptions,
): Promise<ReconsentResult> {
  const supabase = createAdminClient();
  const result: ReconsentResult = {
    processed: 0,
    created: 0,
    skippedNoCredits: 0,
    skippedAlreadyPending: 0,
    skippedAutoReconsentOff: 0,
    failed: 0,
  };

  // Step 1: Get orgs with their settings
  let orgQuery = supabase
    .from('organizations')
    .select('id, name, settings');

  if (options?.orgId) {
    orgQuery = orgQuery.eq('id', options.orgId);
  }

  const { data: orgs, error: orgError } = await orgQuery;
  if (orgError || !orgs || orgs.length === 0) return result;

  // Build org map, filtering by auto_reconsent setting (skip if not manual trigger)
  const orgMap = new Map<string, { name: string; settings: Record<string, unknown> }>();
  for (const org of orgs) {
    const settings = (org.settings ?? {}) as Record<string, unknown>;
    // If called from cron (no orgId), respect auto_reconsent setting
    if (!options?.orgId && settings.auto_reconsent !== true) {
      continue;
    }
    orgMap.set(org.id, { name: org.name, settings });
  }

  if (orgMap.size === 0) return result;

  const orgIds = Array.from(orgMap.keys());

  // Step 2: Find signed consents expiring soon
  // For each org, use their remind_days_before setting
  const allExpiringConsents: (ConsentRow & {
    driver: { id: string; first_name: string; last_name: string; phone: string | null; email: string | null };
  })[] = [];

  for (const orgId of orgIds) {
    const org = orgMap.get(orgId)!;
    const remindDaysBefore = (org.settings.remind_days_before as number) ?? 30;
    const today = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(today.getDate() + remindDaysBefore);

    let query = supabase
      .from('consents')
      .select('*, driver:drivers(id, first_name, last_name, phone, email)')
      .eq('organization_id', orgId)
      .eq('status', 'signed')
      .not('consent_end_date', 'is', null)
      .gte('consent_end_date', today.toISOString().slice(0, 10))
      .lte('consent_end_date', cutoffDate.toISOString().slice(0, 10));

    if (options?.driverIds && options.driverIds.length > 0) {
      query = query.in('driver_id', options.driverIds);
    }

    const { data: consents } = await query;
    if (consents) {
      allExpiringConsents.push(
        ...(consents as unknown as typeof allExpiringConsents),
      );
    }
  }

  if (allExpiringConsents.length === 0) return result;

  // Step 3: Check for existing pending/sent consents to prevent duplicates
  const driverOrgPairs = allExpiringConsents.map((c) => ({
    driverId: c.driver_id,
    orgId: c.organization_id,
  }));
  const uniqueDriverIds = Array.from(new Set(driverOrgPairs.map((p) => p.driverId)));

  const { data: existingPending } = await supabase
    .from('consents')
    .select('driver_id, organization_id')
    .in('driver_id', uniqueDriverIds)
    .in('status', ['pending', 'sent', 'delivered', 'opened']);

  const pendingSet = new Set(
    (existingPending ?? []).map((c) => `${c.organization_id}:${c.driver_id}`),
  );

  // Step 4: Process batch
  const batch = allExpiringConsents.slice(0, RECONSENT_BATCH_SIZE);

  for (const consent of batch) {
    result.processed++;
    const orgInfo = orgMap.get(consent.organization_id);
    if (!orgInfo) continue;

    // Skip if not auto_reconsent enabled (for cron-triggered)
    if (!options?.orgId && orgInfo.settings.auto_reconsent !== true) {
      result.skippedAutoReconsentOff++;
      continue;
    }

    // Skip if already has a pending consent
    const key = `${consent.organization_id}:${consent.driver_id}`;
    if (pendingSet.has(key)) {
      result.skippedAlreadyPending++;
      continue;
    }

    // Deduct credit
    const { data: creditDeducted } = await supabase.rpc('deduct_credit', {
      p_org_id: consent.organization_id,
      p_consent_id: consent.id,
      p_user_id: null,
    });

    if (!creditDeducted) {
      result.skippedNoCredits++;
      await supabase.from('audit_log').insert({
        organization_id: consent.organization_id,
        actor_id: null,
        actor_type: 'system',
        action: 'reconsent.skipped_no_credits',
        resource_type: 'consent',
        resource_id: consent.id,
        details: { driver_id: consent.driver_id },
      });
      continue;
    }

    // Calculate new consent dates
    const consentDurationDays = (orgInfo.settings.consent_duration_days as number) ?? 365;
    const newStartDate = consent.consent_end_date ?? new Date().toISOString().slice(0, 10);
    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newEndDate.getDate() + consentDurationDays);

    // Generate signing token
    const signingToken = generateSigningToken();
    const tokenExpiresAt = new Date(
      Date.now() + SIGNING_TOKEN_DEFAULT_TTL_HOURS * 60 * 60 * 1000,
    ).toISOString();

    // Create new consent record
    const { data: newConsent, error: insertError } = await supabase
      .from('consents')
      .insert({
        organization_id: consent.organization_id,
        driver_id: consent.driver_id,
        created_by: consent.created_by,
        consent_type: consent.consent_type,
        status: 'pending',
        language: consent.language,
        consent_start_date: newStartDate,
        consent_end_date: newEndDate.toISOString().slice(0, 10),
        query_frequency: consent.query_frequency,
        delivery_method: consent.delivery_method,
        delivery_address: consent.delivery_address,
        signing_token: signingToken,
        signing_token_expires_at: tokenExpiresAt,
        is_archived: false,
        metadata: { auto_reconsent: true, previous_consent_id: consent.id } as unknown as Json,
      })
      .select()
      .single();

    if (insertError || !newConsent) {
      result.failed++;
      continue;
    }

    // Mark as added to pending set to avoid duplicates within this batch
    pendingSet.add(key);

    // Send via appropriate channel
    const signingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sign/${signingToken}`;
    const driverName = `${consent.driver.first_name} ${consent.driver.last_name}`;
    const companyName = orgInfo.name;
    let deliverySid: string | null = null;
    const channel: DeliveryMethod = consent.delivery_method;

    if (consent.delivery_method !== 'manual') {
      try {
        if (consent.delivery_method === 'sms') {
          const res = await sendConsentSMS({
            to: consent.delivery_address,
            driverName,
            signingUrl,
            companyName,
            language: consent.language,
          });
          deliverySid = res.sid;
        } else if (consent.delivery_method === 'whatsapp') {
          const res = await sendConsentWhatsApp({
            to: consent.delivery_address,
            driverName,
            signingUrl,
            companyName,
            language: consent.language,
          });
          deliverySid = res.sid;
        } else if (consent.delivery_method === 'email') {
          const res = await sendConsentEmail({
            to: consent.delivery_address,
            driverName,
            signingUrl,
            companyName,
            language: consent.language,
          });
          deliverySid = res.messageId;
        }

        // Update status to sent
        await supabase
          .from('consents')
          .update({ status: 'sent', delivery_sid: deliverySid })
          .eq('id', (newConsent as ConsentRow).id);
      } catch (err) {
        console.error(`[reconsent] failed to send for ${consent.driver_id}:`, err);
        await supabase
          .from('consents')
          .update({ status: 'failed' })
          .eq('id', (newConsent as ConsentRow).id);
        result.failed++;
        continue;
      }
    }

    // Insert notification
    if (consent.delivery_method !== 'manual') {
      await supabase.from('notifications').insert({
        organization_id: consent.organization_id,
        consent_id: (newConsent as ConsentRow).id,
        type: 'consent_link',
        channel,
        recipient: consent.delivery_address,
        external_id: deliverySid,
        status: 'sent',
        attempts: 1,
        max_attempts: 1,
        sent_at: new Date().toISOString(),
      });
    }

    // Audit log
    await supabase.from('audit_log').insert({
      organization_id: consent.organization_id,
      actor_id: null,
      actor_type: 'system',
      action: 'consent.auto_reconsent',
      resource_type: 'consent',
      resource_id: (newConsent as ConsentRow).id,
      details: {
        previous_consent_id: consent.id,
        driver_id: consent.driver_id,
        delivery_method: consent.delivery_method,
      },
    });

    // Fire webhook
    dispatchWebhookEvent({
      eventType: 'consent.created',
      consentId: (newConsent as ConsentRow).id,
      organizationId: consent.organization_id,
    }).catch(() => {});

    result.created++;
  }

  return result;
}
