import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { TEST_CONSENT, TEST_DRIVER, TEST_ORGANIZATION } from '@/__tests__/helpers/fixtures';

// ---- Mocks ----
const mockSingle = vi.fn();
const mockUpload = vi.fn(() => ({ data: { path: 'test.pdf' }, error: null }));
const mockUpdateEq = vi.fn(() => ({ error: null }));

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({ single: mockSingle })),
    })),
    update: vi.fn(() => ({ eq: mockUpdateEq })),
    insert: vi.fn(),
  })),
  storage: {
    from: vi.fn(() => ({ upload: mockUpload })),
  },
};

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockSupabase),
}));

vi.mock('@/lib/tokens', () => ({
  hashSignature: vi.fn(() => 'abc123hash'),
}));

vi.mock('@/lib/pdf/generate-consent-pdf', () => ({
  generateConsentPDF: vi.fn(() => Promise.resolve(Buffer.from('fake-pdf'))),
}));

const { GET, POST } = await import('../route');

const validToken = 'ch_sign_testtoken123';
const params = { params: { token: validToken } };

function makeReq(opts: { method?: string; body?: unknown } = {}) {
  const init: RequestInit = {
    method: opts.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '1.2.3.4',
      'user-agent': 'TestAgent/1.0',
    },
  };
  if (opts.body) init.body = JSON.stringify(opts.body);
  return new NextRequest('https://app.test.com/api/sign/' + validToken, init);
}

const consentWithJoins = {
  ...TEST_CONSENT,
  driver: { first_name: 'John', last_name: 'Doe' },
  organization: { name: 'Test Trucking Co' },
};

describe('GET /api/sign/[token]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 for invalid token', async () => {
    mockSingle.mockReturnValueOnce({ data: null, error: { message: 'not found' } });
    const res = await GET(makeReq(), params);
    expect(res.status).toBe(404);
  });

  it('returns 410 when token expired', async () => {
    mockSingle.mockReturnValueOnce({
      data: { ...consentWithJoins, signing_token_expires_at: '2020-01-01T00:00:00Z' },
      error: null,
    });
    const res = await GET(makeReq(), params);
    expect(res.status).toBe(410);
  });

  it('returns 409 when already signed', async () => {
    mockSingle.mockReturnValueOnce({
      data: { ...consentWithJoins, status: 'signed' },
      error: null,
    });
    const res = await GET(makeReq(), params);
    expect(res.status).toBe(409);
  });

  it('returns 410 when revoked', async () => {
    mockSingle.mockReturnValueOnce({
      data: { ...consentWithJoins, status: 'revoked' },
      error: null,
    });
    const res = await GET(makeReq(), params);
    expect(res.status).toBe(410);
  });

  it('returns consent info on success', async () => {
    mockSingle.mockReturnValueOnce({ data: consentWithJoins, error: null });
    const res = await GET(makeReq(), params);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.driver_name).toBe('John Doe');
    expect(json.data.organization_name).toBe('Test Trucking Co');
  });
});

describe('POST /api/sign/[token]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 for invalid token', async () => {
    mockSingle.mockReturnValueOnce({ data: null, error: { message: 'not found' } });
    const res = await POST(makeReq({ method: 'POST', body: {} }), params);
    expect(res.status).toBe(404);
  });

  it('returns 409 when already signed', async () => {
    mockSingle.mockReturnValueOnce({
      data: { ...consentWithJoins, status: 'signed', driver: TEST_DRIVER, organization: TEST_ORGANIZATION },
      error: null,
    });
    const res = await POST(makeReq({
      method: 'POST',
      body: { signature_data: 'a'.repeat(100), confirmed: true },
    }), params);
    expect(res.status).toBe(409);
  });

  it('returns 422 for invalid signature data', async () => {
    mockSingle.mockReturnValueOnce({
      data: { ...consentWithJoins, driver: TEST_DRIVER, organization: TEST_ORGANIZATION },
      error: null,
    });
    const res = await POST(makeReq({
      method: 'POST',
      body: { signature_data: 'short', confirmed: true },
    }), params);
    expect(res.status).toBe(422);
  });

  it('returns success with signature hash and captures IP', async () => {
    mockSingle.mockReturnValueOnce({
      data: { ...consentWithJoins, driver: TEST_DRIVER, organization: TEST_ORGANIZATION },
      error: null,
    });
    mockUpdateEq.mockReturnValueOnce({ error: null }); // consent update

    const res = await POST(makeReq({
      method: 'POST',
      body: { signature_data: 'a'.repeat(100), confirmed: true },
    }), params);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe('signed');
    expect(json.data.signature_hash).toBe('abc123hash');
  });
});
