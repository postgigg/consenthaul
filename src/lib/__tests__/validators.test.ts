import { describe, it, expect } from 'vitest';
import {
  createDriverSchema,
  createConsentSchema,
  submitSignatureSchema,
  paginationSchema,
  updateDriverSchema,
} from '../validators';

describe('createDriverSchema', () => {
  const valid = { first_name: 'John', last_name: 'Doe', phone: '+15551234567' };

  it('accepts valid input with phone', () => {
    expect(createDriverSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts valid input with email instead of phone', () => {
    expect(createDriverSchema.safeParse({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
    }).success).toBe(true);
  });

  it('rejects when neither phone nor email provided', () => {
    const result = createDriverSchema.safeParse({ first_name: 'John', last_name: 'Doe' });
    expect(result.success).toBe(false);
  });

  it('requires first_name', () => {
    expect(createDriverSchema.safeParse({ last_name: 'Doe', phone: '+1' }).success).toBe(false);
  });

  it('requires last_name', () => {
    expect(createDriverSchema.safeParse({ first_name: 'John', phone: '+1' }).success).toBe(false);
  });

  it('validates email format', () => {
    expect(createDriverSchema.safeParse({
      first_name: 'A',
      last_name: 'B',
      email: 'not-an-email',
    }).success).toBe(false);
  });

  it('validates cdl_state must be 2 characters', () => {
    expect(createDriverSchema.safeParse({
      ...valid,
      cdl_state: 'TEX',
    }).success).toBe(false);

    expect(createDriverSchema.safeParse({
      ...valid,
      cdl_state: 'TX',
    }).success).toBe(true);
  });

  it('defaults preferred_language to en', () => {
    const result = createDriverSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.preferred_language).toBe('en');
    }
  });

  it('validates preferred_language enum', () => {
    expect(createDriverSchema.safeParse({ ...valid, preferred_language: 'fr' }).success).toBe(false);
    expect(createDriverSchema.safeParse({ ...valid, preferred_language: 'es' }).success).toBe(true);
  });
});

describe('createConsentSchema', () => {
  const valid = {
    driver_id: '00000000-0000-4000-a000-000000000001',
    delivery_method: 'sms' as const,
  };

  it('requires driver_id and delivery_method', () => {
    expect(createConsentSchema.safeParse({}).success).toBe(false);
    expect(createConsentSchema.safeParse({ driver_id: valid.driver_id }).success).toBe(false);
  });

  it('accepts valid minimal input', () => {
    expect(createConsentSchema.safeParse(valid).success).toBe(true);
  });

  it('validates delivery_method enum', () => {
    expect(createConsentSchema.safeParse({ ...valid, delivery_method: 'telegram' }).success).toBe(false);
    for (const m of ['sms', 'whatsapp', 'email', 'manual'] as const) {
      expect(createConsentSchema.safeParse({ ...valid, delivery_method: m }).success).toBe(true);
    }
  });

  it('validates language enum', () => {
    expect(createConsentSchema.safeParse({ ...valid, language: 'fr' }).success).toBe(false);
    expect(createConsentSchema.safeParse({ ...valid, language: 'es' }).success).toBe(true);
  });

  it('validates driver_id as UUID', () => {
    expect(createConsentSchema.safeParse({ ...valid, driver_id: 'not-uuid' }).success).toBe(false);
  });

  it('defaults token_ttl_hours to 168', () => {
    const result = createConsentSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.token_ttl_hours).toBe(168);
    }
  });

  it('rejects negative token_ttl_hours', () => {
    expect(createConsentSchema.safeParse({ ...valid, token_ttl_hours: -1 }).success).toBe(false);
  });
});

describe('submitSignatureSchema', () => {
  it('requires signature_data min 100 chars', () => {
    expect(submitSignatureSchema.safeParse({
      signature_data: 'short',
      confirmed: true,
    }).success).toBe(false);
  });

  it('requires confirmed to be literal true', () => {
    expect(submitSignatureSchema.safeParse({
      signature_data: 'a'.repeat(100),
      confirmed: false,
    }).success).toBe(false);
  });

  it('accepts valid input', () => {
    expect(submitSignatureSchema.safeParse({
      signature_data: 'a'.repeat(100),
      confirmed: true,
    }).success).toBe(true);
  });
});

describe('paginationSchema', () => {
  it('defaults page=1, per_page=25, order=desc', () => {
    const result = paginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.per_page).toBe(25);
      expect(result.data.order).toBe('desc');
    }
  });

  it('coerces string values to numbers', () => {
    const result = paginationSchema.safeParse({ page: '3', per_page: '50' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.per_page).toBe(50);
    }
  });

  it('falls back to defaults for null values (from searchParams.get)', () => {
    const result = paginationSchema.safeParse({ page: null, per_page: null, sort: null, order: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.per_page).toBe(25);
    }
  });

  it('rejects per_page > 100 (falls back to default)', () => {
    const result = paginationSchema.safeParse({ per_page: 101 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.per_page).toBe(25); // catch fallback
    }
  });

  it('rejects page < 1 (falls back to default)', () => {
    const result = paginationSchema.safeParse({ page: 0 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1); // catch fallback
    }
  });

  it('validates order enum', () => {
    expect(paginationSchema.safeParse({ order: 'asc' }).success).toBe(true);
    // Invalid order falls back to 'desc' via catch
    const result = paginationSchema.safeParse({ order: 'random' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.order).toBe('desc');
    }
  });
});

describe('updateDriverSchema', () => {
  it('accepts partial fields', () => {
    expect(updateDriverSchema.safeParse({ first_name: 'New' }).success).toBe(true);
    expect(updateDriverSchema.safeParse({ is_active: false }).success).toBe(true);
  });

  it('validates email if provided', () => {
    expect(updateDriverSchema.safeParse({ email: 'bad' }).success).toBe(false);
    expect(updateDriverSchema.safeParse({ email: 'good@test.com' }).success).toBe(true);
  });
});
