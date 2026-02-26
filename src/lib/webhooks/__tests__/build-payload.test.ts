import { describe, it, expect } from 'vitest';
import { buildConsentPayload } from '../build-payload';
import { TEST_CONSENT } from '@/__tests__/helpers/fixtures';

describe('buildConsentPayload', () => {
  it('includes safe consent fields', () => {
    const payload = buildConsentPayload(TEST_CONSENT);

    expect(payload.consent_id).toBe(TEST_CONSENT.id);
    expect(payload.organization_id).toBe(TEST_CONSENT.organization_id);
    expect(payload.driver_id).toBe(TEST_CONSENT.driver_id);
    expect(payload.status).toBe(TEST_CONSENT.status);
    expect(payload.consent_type).toBe(TEST_CONSENT.consent_type);
    expect(payload.delivery_method).toBe(TEST_CONSENT.delivery_method);
    expect(payload.language).toBe(TEST_CONSENT.language);
    expect(payload.created_at).toBe(TEST_CONSENT.created_at);
  });

  it('excludes sensitive fields', () => {
    const payload = buildConsentPayload(TEST_CONSENT);
    const payloadKeys = Object.keys(payload);

    expect(payloadKeys).not.toContain('signing_token');
    expect(payloadKeys).not.toContain('signing_token_expires_at');
    expect(payloadKeys).not.toContain('signature_data');
    expect(payloadKeys).not.toContain('signature_hash');
    expect(payloadKeys).not.toContain('signer_ip');
    expect(payloadKeys).not.toContain('signer_user_agent');
    expect(payloadKeys).not.toContain('driver_snapshot');
    expect(payloadKeys).not.toContain('organization_snapshot');
    expect(payloadKeys).not.toContain('pdf_storage_path');
    expect(payloadKeys).not.toContain('pdf_hash');
  });

  it('includes timestamp fields', () => {
    const signedConsent = {
      ...TEST_CONSENT,
      status: 'signed' as const,
      signed_at: '2024-06-01T12:00:00Z',
      delivered_at: '2024-05-31T10:00:00Z',
    };

    const payload = buildConsentPayload(signedConsent);

    expect(payload.signed_at).toBe('2024-06-01T12:00:00Z');
    expect(payload.delivered_at).toBe('2024-05-31T10:00:00Z');
  });

  it('returns expected number of fields', () => {
    const payload = buildConsentPayload(TEST_CONSENT);
    const keys = Object.keys(payload);

    // Should have exactly 12 safe fields
    expect(keys).toEqual([
      'consent_id',
      'organization_id',
      'driver_id',
      'status',
      'consent_type',
      'delivery_method',
      'language',
      'consent_start_date',
      'consent_end_date',
      'signed_at',
      'delivered_at',
      'created_at',
      'updated_at',
    ]);
  });
});
