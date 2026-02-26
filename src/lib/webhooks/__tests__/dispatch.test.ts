import { describe, it, expect, vi } from 'vitest';

// ---- Mocks ----
const mockSingle = vi.fn();
const mockEqChain: ReturnType<typeof vi.fn> = vi.fn(() => ({
  single: mockSingle,
  eq: mockEqChain,
}));
const mockSelect = vi.fn(() => ({ eq: mockEqChain, in: vi.fn(() => ({ eq: vi.fn(() => ({ data: [], error: null })) })) }));
const mockInsert = vi.fn(() => ({ select: vi.fn(() => ({ single: mockSingle })) }));
const mockUpdate = vi.fn(() => ({ eq: vi.fn() }));

const mockSupabase = {
  from: vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    eq: mockEqChain,
  })),
};

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockSupabase),
}));

const { signPayload, generateWebhookSecret } = await import('../dispatch');

describe('signPayload', () => {
  it('returns a hex HMAC-SHA256 signature', () => {
    const body = JSON.stringify({ event: 'consent.signed', data: {} });
    const secret = 'whsec_test_secret_123';

    const signature = signPayload(body, secret);

    expect(signature).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces the same signature for the same input', () => {
    const body = '{"hello":"world"}';
    const secret = 'test_secret';

    const sig1 = signPayload(body, secret);
    const sig2 = signPayload(body, secret);

    expect(sig1).toBe(sig2);
  });

  it('produces different signatures for different secrets', () => {
    const body = '{"hello":"world"}';

    const sig1 = signPayload(body, 'secret_a');
    const sig2 = signPayload(body, 'secret_b');

    expect(sig1).not.toBe(sig2);
  });

  it('produces different signatures for different bodies', () => {
    const secret = 'same_secret';

    const sig1 = signPayload('{"a":1}', secret);
    const sig2 = signPayload('{"b":2}', secret);

    expect(sig1).not.toBe(sig2);
  });
});

describe('generateWebhookSecret', () => {
  it('starts with whsec_ prefix', () => {
    const secret = generateWebhookSecret();
    expect(secret).toMatch(/^whsec_[0-9a-f]{64}$/);
  });

  it('generates unique secrets', () => {
    const s1 = generateWebhookSecret();
    const s2 = generateWebhookSecret();
    expect(s1).not.toBe(s2);
  });

  it('has correct total length (whsec_ + 64 hex chars)', () => {
    const secret = generateWebhookSecret();
    expect(secret.length).toBe(6 + 64); // 'whsec_' = 6 chars
  });
});
