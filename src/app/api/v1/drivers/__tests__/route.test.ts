import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  TEST_ORG_ID,
  TEST_KEY_ID,
  TEST_DRIVER,
} from '@/__tests__/helpers/fixtures';

// ---- Mocks ----
const mockSingle = vi.fn();
const mockRange = vi.fn(() => ({ data: [], error: null, count: 0 }));
const mockLimit = vi.fn(() => ({ single: mockSingle }));
const mockOr = vi.fn(() => ({ order: vi.fn(() => ({ range: mockRange })) }));
const mockEqChain = vi.fn(() => ({
  single: mockSingle,
  limit: mockLimit,
  or: mockOr,
  eq: mockEqChain,
  order: vi.fn(() => ({ range: mockRange })),
}));
const mockSelect = vi.fn(() => ({
  eq: mockEqChain,
  single: mockSingle,
}));
const mockInsert = vi.fn(() => ({ select: vi.fn(() => ({ single: mockSingle })) }));

const mockSupabase = {
  from: vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    eq: mockEqChain,
  })),
};

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockSupabase),
}));

const mockAuth = vi.fn();
vi.mock('@/lib/api-auth', () => ({
  authenticateApiKey: (...args: unknown[]) => mockAuth(...args),
}));

const { POST, GET } = await import('../route');

function makeReq(opts: { method?: string; body?: unknown; searchParams?: Record<string, string>; apiKey?: string } = {}) {
  const url = new URL('https://app.test.com/api/v1/drivers');
  if (opts.searchParams) {
    for (const [k, v] of Object.entries(opts.searchParams)) url.searchParams.set(k, v);
  }
  const init: RequestInit = {
    method: opts.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${opts.apiKey ?? 'ch_test_key'}` },
  };
  if (opts.body) init.body = JSON.stringify(opts.body);
  return new NextRequest(url, init);
}

describe('POST /api/v1/drivers', () => {
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
    const res = await POST(makeReq({ method: 'POST', body: { first_name: 'A', last_name: 'B', phone: '+1' } }));
    expect(res.status).toBe(403);
  });

  it('returns 422 on validation error', async () => {
    mockAuth.mockResolvedValue({ orgId: TEST_ORG_ID, keyId: TEST_KEY_ID, scopes: ['drivers:write'] });
    const res = await POST(makeReq({ method: 'POST', body: { first_name: '' } }));
    expect(res.status).toBe(422);
  });

  it('returns 409 on duplicate CDL', async () => {
    mockAuth.mockResolvedValue({ orgId: TEST_ORG_ID, keyId: TEST_KEY_ID, scopes: ['drivers:write'] });
    mockSingle.mockReturnValueOnce({ data: { id: 'existing' }, error: null }); // CDL check
    const res = await POST(makeReq({
      method: 'POST',
      body: { first_name: 'A', last_name: 'B', phone: '+1', cdl_number: 'DUP123' },
    }));
    expect(res.status).toBe(409);
  });

  it('returns 201 on success', async () => {
    mockAuth.mockResolvedValue({ orgId: TEST_ORG_ID, keyId: TEST_KEY_ID, scopes: ['drivers:write'] });
    // No CDL in body so skip duplicate check
    mockSingle.mockReturnValueOnce({ data: TEST_DRIVER, error: null }); // insert
    const res = await POST(makeReq({
      method: 'POST',
      body: { first_name: 'John', last_name: 'Doe', phone: '+15551234567' },
    }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.first_name).toBe('John');
  });
});

describe('GET /api/v1/drivers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when API key is invalid', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it('returns 403 when scope is missing', async () => {
    mockAuth.mockResolvedValue({ orgId: TEST_ORG_ID, keyId: TEST_KEY_ID, scopes: ['consents:read'] });
    const res = await GET(makeReq());
    expect(res.status).toBe(403);
  });

  it('returns paginated list on success', async () => {
    mockAuth.mockResolvedValue({ orgId: TEST_ORG_ID, keyId: TEST_KEY_ID, scopes: ['drivers:read'] });
    mockRange.mockReturnValueOnce({ data: [TEST_DRIVER], error: null, count: 1 });
    const res = await GET(makeReq({ searchParams: { page: '1', per_page: '25' } }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.pagination).toBeDefined();
    expect(json.pagination.total).toBe(1);
  });
});
