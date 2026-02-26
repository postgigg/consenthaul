import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { TEST_ORG_ID, TEST_KEY_ID } from '@/__tests__/helpers/fixtures';

// ---- Mocks ----
const mockSingle = vi.fn();
const mockEqChain: ReturnType<typeof vi.fn> = vi.fn(() => ({
  single: mockSingle,
  eq: mockEqChain,
  order: vi.fn(() => ({ data: [], error: null })),
}));
const mockSelect = vi.fn(() => ({ eq: mockEqChain }));
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

vi.mock('@/lib/webhooks', () => ({
  generateWebhookSecret: vi.fn(() => 'whsec_test1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab'),
}));

const { POST, GET } = await import('../route');

function makeReq(opts: { method?: string; body?: unknown } = {}) {
  const url = new URL('https://app.test.com/api/v1/webhooks');
  const init: RequestInit = {
    method: opts.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ch_test_key' },
  };
  if (opts.body) init.body = JSON.stringify(opts.body);
  return new NextRequest(url, init);
}

describe('POST /api/v1/webhooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without auth', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await POST(makeReq({ method: 'POST', body: {} }));
    expect(res.status).toBe(401);
  });

  it('returns 403 without webhooks:write scope', async () => {
    mockAuth.mockResolvedValueOnce({
      orgId: TEST_ORG_ID,
      keyId: TEST_KEY_ID,
      scopes: ['consents:read'],
    });
    const res = await POST(makeReq({
      method: 'POST',
      body: {
        url: 'https://example.com/hook',
        events: ['consent.signed'],
      },
    }));
    expect(res.status).toBe(403);
  });

  it('returns 422 for non-HTTPS URL', async () => {
    mockAuth.mockResolvedValueOnce({
      orgId: TEST_ORG_ID,
      keyId: TEST_KEY_ID,
      scopes: ['webhooks:write'],
    });
    const res = await POST(makeReq({
      method: 'POST',
      body: {
        url: 'http://example.com/hook',
        events: ['consent.signed'],
      },
    }));
    expect(res.status).toBe(422);
  });

  it('returns 422 for empty events array', async () => {
    mockAuth.mockResolvedValueOnce({
      orgId: TEST_ORG_ID,
      keyId: TEST_KEY_ID,
      scopes: ['webhooks:write'],
    });
    const res = await POST(makeReq({
      method: 'POST',
      body: {
        url: 'https://example.com/hook',
        events: [],
      },
    }));
    expect(res.status).toBe(422);
  });

  it('returns 201 with secret on successful creation', async () => {
    mockAuth.mockResolvedValueOnce({
      orgId: TEST_ORG_ID,
      keyId: TEST_KEY_ID,
      scopes: ['webhooks:write'],
    });

    const mockEndpoint = {
      id: '00000000-0000-4000-a000-000000000099',
      organization_id: TEST_ORG_ID,
      url: 'https://example.com/hook',
      description: 'Test hook',
      events: ['consent.signed'],
      is_active: true,
      created_by: TEST_KEY_ID,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      secret: 'whsec_test1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
    };

    mockSingle.mockResolvedValueOnce({ data: mockEndpoint, error: null });

    const res = await POST(makeReq({
      method: 'POST',
      body: {
        url: 'https://example.com/hook',
        events: ['consent.signed'],
        description: 'Test hook',
      },
    }));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.secret).toMatch(/^whsec_/);
    expect(body.data.url).toBe('https://example.com/hook');
    expect(body.data.events).toEqual(['consent.signed']);
  });
});

describe('GET /api/v1/webhooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without auth', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it('returns 403 without webhooks:read scope', async () => {
    mockAuth.mockResolvedValueOnce({
      orgId: TEST_ORG_ID,
      keyId: TEST_KEY_ID,
      scopes: ['consents:read'],
    });
    const res = await GET(makeReq());
    expect(res.status).toBe(403);
  });

  it('returns 200 with endpoints on success', async () => {
    mockAuth.mockResolvedValueOnce({
      orgId: TEST_ORG_ID,
      keyId: TEST_KEY_ID,
      scopes: ['webhooks:read'],
    });

    // Mock: from().select().eq().order()
    const mockOrder = vi.fn(() => ({ data: [], error: null }));
    const mockEq = vi.fn(() => ({ order: mockOrder }));
    const mockSel = vi.fn(() => ({ eq: mockEq }));
    mockSupabase.from.mockReturnValueOnce({
      select: mockSel,
    });

    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
  });
});
