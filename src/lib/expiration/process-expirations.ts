import { createAdminClient } from '@/lib/supabase/admin';
import { dispatchWebhookEvent } from '@/lib/webhooks';
import type { Database, ConsentStatus } from '@/types/database';

type ConsentRow = Database['public']['Tables']['consents']['Row'];

/** Batch size for fetching and processing expired consents */
const EXPIRATION_BATCH_SIZE = 100;

/** Consent statuses eligible for automatic expiration */
const EXPIRABLE_STATUSES: ConsentStatus[] = ['pending', 'sent', 'delivered', 'opened'];

export interface ExpirationResult {
  /** Total consents evaluated */
  processed: number;
  /** Consents successfully transitioned to 'expired' */
  expired: number;
  /** Consents that failed to update */
  failed: number;
}

/**
 * Find consents whose signing token has expired while still in an
 * incomplete status, transition them to 'expired', log to the audit
 * trail, and fire the `consent.expired` webhook for each.
 *
 * Designed to be called from a cron endpoint on a regular cadence
 * (e.g. every 5-15 minutes).
 */
export async function processConsentExpirations(): Promise<ExpirationResult> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const result: ExpirationResult = {
    processed: 0,
    expired: 0,
    failed: 0,
  };

  // Step 1: Fetch consents with an expired signing token that are still
  // in an eligible (non-terminal) status. Process in batches of 100.
  const { data: consents, error: fetchError } = await supabase
    .from('consents')
    .select('id, organization_id, status, signing_token_expires_at')
    .in('status', EXPIRABLE_STATUSES)
    .not('signing_token_expires_at', 'is', null)
    .lt('signing_token_expires_at', now)
    .order('signing_token_expires_at', { ascending: true })
    .limit(EXPIRATION_BATCH_SIZE);

  if (fetchError) {
    console.error('[expire-consents] Failed to query eligible consents:', fetchError.message);
    return result;
  }

  if (!consents || consents.length === 0) {
    return result;
  }

  // Step 2: Process each consent individually so a single failure
  // does not block the rest of the batch.
  for (const consent of consents as Pick<ConsentRow, 'id' | 'organization_id' | 'status' | 'signing_token_expires_at'>[]) {
    result.processed++;

    try {
      // Update status to expired
      const { error: updateError } = await supabase
        .from('consents')
        .update({ status: 'expired' as ConsentStatus })
        .eq('id', consent.id)
        // Optimistic-lock: only update if still in an expirable status
        .in('status', EXPIRABLE_STATUSES);

      if (updateError) {
        console.error(`[expire-consents] Failed to expire consent ${consent.id}:`, updateError.message);
        result.failed++;
        continue;
      }

      // Insert audit log entry
      await supabase.from('audit_log').insert({
        organization_id: consent.organization_id,
        actor_id: null,
        actor_type: 'system',
        action: 'consent.expired',
        resource_type: 'consent',
        resource_id: consent.id,
        details: {
          previous_status: consent.status,
          signing_token_expires_at: consent.signing_token_expires_at,
          expired_at: now,
        },
      });

      // Fire consent.expired webhook (fire-and-forget)
      dispatchWebhookEvent({
        eventType: 'consent.expired',
        consentId: consent.id,
        organizationId: consent.organization_id,
      }).catch(() => {});

      result.expired++;
    } catch (err) {
      console.error(`[expire-consents] Unexpected error processing consent ${consent.id}:`, err);
      result.failed++;
    }
  }

  console.log(
    `[expire-consents] Completed: processed=${result.processed}, expired=${result.expired}, failed=${result.failed}`,
  );

  return result;
}
