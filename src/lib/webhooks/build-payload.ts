import type { Database } from '@/types/database';

type ConsentRow = Database['public']['Tables']['consents']['Row'];

/**
 * Build a safe webhook payload from a consent row.
 * Strips sensitive fields (signing_token, signature_data, signer info, snapshots).
 */
export function buildConsentPayload(consent: ConsentRow) {
  return {
    consent_id: consent.id,
    organization_id: consent.organization_id,
    driver_id: consent.driver_id,
    status: consent.status,
    consent_type: consent.consent_type,
    delivery_method: consent.delivery_method,
    language: consent.language,
    consent_start_date: consent.consent_start_date,
    consent_end_date: consent.consent_end_date,
    signed_at: consent.signed_at,
    delivered_at: consent.delivered_at,
    created_at: consent.created_at,
    updated_at: consent.updated_at,
  };
}
