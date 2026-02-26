import { createHmac, randomBytes } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildConsentPayload } from './build-payload';
import type { Database, WebhookEventType } from '@/types/database';

type ConsentRow = Database['public']['Tables']['consents']['Row'];
type WebhookEndpointRow = Database['public']['Tables']['webhook_endpoints']['Row'];

/** Retry backoff schedule in seconds: immediate, 1min, 5min, 30min, 2hr */
const RETRY_DELAYS_SECONDS = [0, 60, 300, 1800, 7200];

/**
 * Sign a JSON body string with HMAC-SHA256.
 */
export function signPayload(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

/**
 * Generate a webhook secret in the format `whsec_` + 32 random hex bytes.
 */
export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(32).toString('hex')}`;
}

interface DispatchOptions {
  eventType: WebhookEventType;
  consentId: string;
  organizationId: string;
}

/**
 * Dispatch a webhook event to all matching active endpoints for an organization.
 *
 * Also fans out to the parent partner organization (if any) so TMS partners
 * receive events for their carrier sub-orgs.
 *
 * This function is designed to be called fire-and-forget — it catches its own
 * errors and never rejects.
 */
export async function dispatchWebhookEvent(opts: DispatchOptions): Promise<void> {
  try {
    const { eventType, consentId, organizationId } = opts;
    const supabase = createAdminClient();

    // 1. Collect org IDs to check: the org itself + any parent partner org
    const orgIds = [organizationId];

    const { data: partnerLinks } = await supabase
      .from('partner_organizations')
      .select('partner_org_id')
      .eq('carrier_org_id', organizationId)
      .eq('is_active', true);

    if (partnerLinks) {
      for (const link of partnerLinks) {
        orgIds.push(link.partner_org_id);
      }
    }

    // 2. Fetch active endpoints for these orgs that subscribe to this event type
    const { data: endpoints, error: endpointError } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .in('organization_id', orgIds)
      .eq('is_active', true);

    if (endpointError || !endpoints || endpoints.length === 0) {
      return; // No endpoints — nothing to do
    }

    // Filter to endpoints subscribed to this event type
    const matchingEndpoints = (endpoints as WebhookEndpointRow[]).filter(
      (ep) => ep.events.includes(eventType) || ep.events.includes('*'),
    );

    if (matchingEndpoints.length === 0) return;

    // 3. Fetch the consent record for the payload
    const { data: consentData } = await supabase
      .from('consents')
      .select('*')
      .eq('id', consentId)
      .single();

    const consent = consentData as ConsentRow | null;
    if (!consent) return;

    const consentPayload = buildConsentPayload(consent);

    // 4. Create webhook_events rows and attempt immediate delivery
    for (const endpoint of matchingEndpoints) {
      const payload = {
        event: eventType,
        created_at: new Date().toISOString(),
        data: consentPayload,
      };

      const { data: eventRow, error: insertError } = await supabase
        .from('webhook_events')
        .insert({
          endpoint_id: endpoint.id,
          organization_id: endpoint.organization_id,
          event_type: eventType,
          consent_id: consentId,
          payload,
          status: 'pending',
          next_retry_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (insertError || !eventRow) continue;

      // Fire-and-forget immediate delivery
      deliverWebhook(eventRow.id, endpoint.url, endpoint.secret, payload).catch(() => {
        // Errors handled inside deliverWebhook
      });
    }
  } catch (err) {
    console.error('[dispatchWebhookEvent] unexpected error:', err);
  }
}

/**
 * Attempt to deliver a single webhook event.
 * Updates the webhook_events row with the result.
 */
export async function deliverWebhook(
  eventId: string,
  url: string,
  secret: string,
  payload: Record<string, unknown>,
): Promise<boolean> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const timestamp = Math.floor(Date.now() / 1000);
  const body = JSON.stringify(payload);
  const signature = signPayload(body, secret);

  // Mark as delivering
  await supabase
    .from('webhook_events')
    .update({ status: 'delivering', last_attempt_at: now })
    .eq('id', eventId);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ConsentHaul-Signature': signature,
        'X-ConsentHaul-Timestamp': String(timestamp),
        'X-ConsentHaul-Event': String(payload.event ?? ''),
        'X-ConsentHaul-Delivery': eventId,
        'User-Agent': 'ConsentHaul-Webhooks/1.0',
      },
      body,
      signal: AbortSignal.timeout(10_000), // 10s timeout
    });

    // Cap response body at 1KB
    let responseBody: string | null = null;
    try {
      const text = await response.text();
      responseBody = text.slice(0, 1024);
    } catch {
      // Ignore body read errors
    }

    // Read current attempt count
    const { data: eventData } = await supabase
      .from('webhook_events')
      .select('attempts, max_attempts')
      .eq('id', eventId)
      .single();

    const attempts = (eventData?.attempts ?? 0) + 1;
    const maxAttempts = eventData?.max_attempts ?? 5;

    if (response.ok) {
      // Success
      await supabase
        .from('webhook_events')
        .update({
          status: 'delivered',
          attempts,
          response_status: response.status,
          response_body: responseBody,
          error_message: null,
          next_retry_at: null,
        })
        .eq('id', eventId);
      return true;
    }

    // Non-2xx response — schedule retry or exhaust
    const nextRetry = computeNextRetry(attempts, maxAttempts);

    await supabase
      .from('webhook_events')
      .update({
        status: nextRetry ? 'failed' : 'exhausted',
        attempts,
        response_status: response.status,
        response_body: responseBody,
        error_message: `HTTP ${response.status}`,
        next_retry_at: nextRetry,
      })
      .eq('id', eventId);

    return false;
  } catch (err) {
    // Network error / timeout
    const { data: eventData } = await supabase
      .from('webhook_events')
      .select('attempts, max_attempts')
      .eq('id', eventId)
      .single();

    const attempts = (eventData?.attempts ?? 0) + 1;
    const maxAttempts = eventData?.max_attempts ?? 5;
    const nextRetry = computeNextRetry(attempts, maxAttempts);

    await supabase
      .from('webhook_events')
      .update({
        status: nextRetry ? 'failed' : 'exhausted',
        attempts,
        response_status: null,
        response_body: null,
        error_message: err instanceof Error ? err.message : 'Delivery failed',
        next_retry_at: nextRetry,
      })
      .eq('id', eventId);

    return false;
  }
}

function computeNextRetry(attempts: number, maxAttempts: number): string | null {
  if (attempts >= maxAttempts) return null;

  const delaySeconds = RETRY_DELAYS_SECONDS[attempts] ?? RETRY_DELAYS_SECONDS[RETRY_DELAYS_SECONDS.length - 1];
  return new Date(Date.now() + delaySeconds * 1000).toISOString();
}
