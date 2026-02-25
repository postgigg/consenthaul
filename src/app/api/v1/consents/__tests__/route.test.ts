import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  TEST_ORG_ID,
  TEST_KEY_ID,
  TEST_DRIVER_ID,
  TEST_DRIVER,
  TEST_CONSENT,
} from '@/__tests__/helpers/fixtures';

// ---- Mocks ----
const mockSingle = vi.fn();
const mockRange = vi.fn(() => ({ data: [], error: null, count: 0 }));
const mockEqChain: ReturnType<typeof vi.fn> = vi.fn(() => ({
  single: mockSingle,
  eq: mockEqChain,
  order: vi.fn(() => ({ range: mockRange })),
}));
const mockSelect = vi.fn(() => ({ eq: mockEqChain }));
const mockInsert = vi.fn(() => ({ select: vi.fn(() => ({ single: mockSingle })) }));
const mockUpdate = vi.fn(() => ({ eq: vi.fn() }));
const mockRpc = vi.fn();

const mockDelete = vi.fn(() => ({ eq: vi.fn() }));

const mockSupabase = {
  from: vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEqChain,
  })),
  rpc: mockRpc,
};

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockSupabase),
}));

const mockAuth = vi.fn();
vi.mock('@/lib/api-auth', () => ({
  authenticateApiKey: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/lib/tokens', () => ({
  generateSigningToken: vi.fn(() => 'ch_sign_mocktoken1234'),
}));

vi.mock('@/lib/constants', () => ({
  SIGNING_TOKEN_DEFAULT_TTL_HOURS: 168,
}));

const mockSendSMS = vi.fn().mockResolvedValue({ sid: 'SM_test' });
const mockSendWhatsApp = vi.fn().mockResolvedValue({ sid: 'WA_test' });
const mockSendEmail = vi.fn().mockResolvedValue({ messageId: 'msg_test' });

vi.mock('@/lib/messaging/sms', () => ({ sendConsentSMS: (...args: unknown[]) => mockSendSMS(...args) }));
vi.mock('@/lib/messaging/whatsapp', () => ({ sendConsentWhatsApp: (...args: unknown[]) => mockSendWhatsApp(...args) }));
vi.mock('@/lib/messaging/email', () => ({ sendConsentEmail: (...args: unknown[]) => mockSendEmail(...args) }));

const { POST, GET } = await import('../route');

function makeReq(opts: { method?: string; body?: unknown; searchParams?: Record<string, string> } = {}) {
  const url = new URL('https://app.test.com/api/v1/consents');
  if (opts.searchParams) {
    for (const [k, v] of Object.entries(opts.searchParams)) url.searchParams.set(k, v);
  }
  const init: RequestInit = {
    method: opts.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ch_test_key' },
  };
  if (opts.body) init.body = JSON.stringify(opts.body);
  return new NextRequest(url, init);
}

describe('POST /api/v1/consents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when API key is invalid', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(makeReq({ method: 'POST', body: {} }));
    expect(res.status).toBe(401);
  });

  it('returns 403 when scope is missing', async () => {
    mockAuth.mockResolvedValue({ orgId: TEST_ORG_ID, keyId: TEST_KEY_ID, scopes: ['drivers:read'] });
    const res = await POST(makeReq({ method: 'POST', body: { driver_id: TEST_DRIVER_ID, delivery_method: 'sms' } }));
    expect(res.status).toBe(403);
  });

  it('returns 422 on validation error', async () => {
    mockAuth.mockResolvedValue({ orgId: TEST_ORG_ID, keyId: TEST_KEY_ID, scopes: ['consents:write'] });
    mockSingle.mockReturnValueOnce({ data: { name: 'Test Co' }, error: null }); // org lookup
    const res = await POST(makeReq({ method: 'POST', body: {} }));
    expect(res.status).toBe(422);
  });

  it('returns 404 when driver not found', async () => {
    mockAuth.mockResolvedValue({ orgId: TEST_ORG_ID, keyId: TEST_KEY_ID, scopes: ['consents:write'] });
    mockSingle
      .mockReturnValueOnce({ data: { name: 'Test Co' }, error: null }) // org lookup
      .mockReturnValueOnce({ data: null, error: { message: 'not found' } }); // driver lookup

    const res = await POST(makeReq({
      method: 'POST',
      body: { driver_id: TEST_DRIVER_ID, delivery_method: 'sms' },
    }));
    expect(res.status).toBe(404);
  });

  it('returns 402 when insufficient credits', async () => {
    mockAuth.mockResolvedValue({ orgId: TEST_ORG_ID, keyId: TEST_KEY_ID, scopes: ['consents:write'] });
    mockSingle
      .mockReturnValueOnce({ data: { name: 'Test Co' }, error: null }) // org lookup
      .mockReturnValueOnce({ data: TEST_DRIVER, error: null }) // driver found
      .mockReturnValueOnce({ data: TEST_CONSENT, error: null }); // consent inserted (now before credit)
    mockRpc.mockReturnValueOnce({ data: false, error: null }); // credit deduction fails

    const res = await POST(makeReq({
      method: 'POST',
      body: { driver_id: TEST_DRIVER_ID, delivery_method: 'sms' },
    }));
    expect(res.status).toBe(402);
  });

  it('returns 201 on success with SMS', async () => {
    mockAuth.mockResolvedValue({ orgId: TEST_ORG_ID, keyId: TEST_KEY_ID, scopes: ['consents:write'] });
    mockSingle
      .mockReturnValueOnce({ data: { name: 'Test Co' }, error: null }) // org lookup
      .mockReturnValueOnce({ data: TEST_DRIVER, error: null }) // driver found
      .mockReturnValueOnce({ data: TEST_CONSENT, error: null }); // consent inserted (now before credit)
    mockRpc.mockReturnValueOnce({ data: true, error: null }); // credit deducted

    const res = await POST(makeReq({
      method: 'POST',
      body: { driver_id: TEST_DRIVER_ID, delivery_method: 'sms' },
    }));
    expect(res.status).toBe(201);
    expect(mockSendSMS).toHaveBeenCalled();
  });

  it('calls sendConsentEmail for email delivery', async () => {
    mockAuth.mockResolvedValue({ orgId: TEST_ORG_ID, keyId: TEST_KEY_ID, scopes: ['consents:write'] });
    const emailDriver = { ...TEST_DRIVER, email: 'test@example.com' };
    mockSingle
      .mockReturnValueOnce({ data: { name: 'Test Co' }, error: null }) // org lookup
      .mockReturnValueOnce({ data: emailDriver, error: null }) // driver found
      .mockReturnValueOnce({ data: { ...TEST_CONSENT, delivery_method: 'email' }, error: null }); // consent inserted
    mockRpc.mockReturnValueOnce({ data: true, error: null }); // credit deducted

    const res = await POST(makeReq({
      method: 'POST',
      body: { driver_id: TEST_DRIVER_ID, delivery_method: 'email' },
    }));
    expect(res.status).toBe(201);
    expect(mockSendEmail).toHaveBeenCalled();
  });

  it('returns 502 on delivery failure', async () => {
    mockAuth.mockResolvedValue({ orgId: TEST_ORG_ID, keyId: TEST_KEY_ID, scopes: ['consents:write'] });
    mockSingle
      .mockReturnValueOnce({ data: { name: 'Test Co' }, error: null }) // org lookup
      .mockReturnValueOnce({ data: TEST_DRIVER, error: null }) // driver found
      .mockReturnValueOnce({ data: TEST_CONSENT, error: null }); // consent inserted
    mockRpc.mockReturnValueOnce({ data: true, error: null }); // credit deducted
    mockSendSMS.mockRejectedValueOnce(new Error('Twilio error'));

    const res = await POST(makeReq({
      method: 'POST',
      body: { driver_id: TEST_DRIVER_ID, delivery_method: 'sms' },
    }));
    expect(res.status).toBe(502);
  });
});

describe('GET /api/v1/consents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when API key is invalid', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it('returns 403 when scope is missing', async () => {
    mockAuth.mockResolvedValue({ orgId: TEST_ORG_ID, keyId: TEST_KEY_ID, scopes: ['drivers:read'] });
    const res = await GET(makeReq());
    expect(res.status).toBe(403);
  });

  it('returns paginated list on success', async () => {
    mockAuth.mockResolvedValue({ orgId: TEST_ORG_ID, keyId: TEST_KEY_ID, scopes: ['consents:read'] });
    mockRange.mockReturnValueOnce({ data: [TEST_CONSENT], error: null, count: 1 });

    const res = await GET(makeReq({ searchParams: { page: '1', per_page: '25' } }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.pagination.total).toBe(1);
  });
});
