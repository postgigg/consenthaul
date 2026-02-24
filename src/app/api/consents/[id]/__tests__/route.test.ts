import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  TEST_USER_ID,
  TEST_CONSENT_ID,
  TEST_CONSENT,
  TEST_ORG_ID,
} from '@/__tests__/helpers/fixtures';

// ---- Mocks ----
const mockSingle = vi.fn();
const mockGetUser = vi.fn();

const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: mockSingle,
        eq: vi.fn(() => ({ single: mockSingle })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({ single: mockSingle })),
      })),
    })),
    insert: vi.fn(),
  })),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ getAll: vi.fn(() => []), set: vi.fn() })),
}));

const { GET, PATCH } = await import('../route');

const params = { params: { id: TEST_CONSENT_ID } };

function makeReq(opts: { method?: string; body?: unknown } = {}) {
  const init: RequestInit = { method: opts.method ?? 'GET', headers: { 'Content-Type': 'application/json' } };
  if (opts.body) init.body = JSON.stringify(opts.body);
  return new NextRequest('https://app.test.com/api/consents/' + TEST_CONSENT_ID, init);
}

describe('GET /api/consents/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no' } });
    const res = await GET(makeReq(), params);
    expect(res.status).toBe(401);
  });

  it('returns consent on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle.mockReturnValueOnce({ data: { ...TEST_CONSENT, driver: {} }, error: null });
    const res = await GET(makeReq(), params);
    expect(res.status).toBe(200);
  });
});

describe('PATCH /api/consents/[id] (revoke)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no' } });
    const res = await PATCH(makeReq({ method: 'PATCH', body: { status: 'revoked' } }), params);
    expect(res.status).toBe(401);
  });

  it('returns 422 when status is not revoked', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    const res = await PATCH(makeReq({ method: 'PATCH', body: { status: 'signed' } }), params);
    expect(res.status).toBe(422);
  });

  it('can revoke pending consent', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle
      .mockReturnValueOnce({ data: { id: TEST_CONSENT_ID, status: 'pending', organization_id: TEST_ORG_ID }, error: null })
      .mockReturnValueOnce({ data: { ...TEST_CONSENT, status: 'revoked', driver: {} }, error: null });
    const res = await PATCH(makeReq({ method: 'PATCH', body: { status: 'revoked' } }), params);
    expect(res.status).toBe(200);
  });

  it('can revoke signed consent', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle
      .mockReturnValueOnce({ data: { id: TEST_CONSENT_ID, status: 'signed', organization_id: TEST_ORG_ID }, error: null })
      .mockReturnValueOnce({ data: { ...TEST_CONSENT, status: 'revoked', driver: {} }, error: null });
    const res = await PATCH(makeReq({ method: 'PATCH', body: { status: 'revoked' } }), params);
    expect(res.status).toBe(200);
  });

  it('cannot revoke expired consent', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle.mockReturnValueOnce({
      data: { id: TEST_CONSENT_ID, status: 'expired', organization_id: TEST_ORG_ID },
      error: null,
    });
    const res = await PATCH(makeReq({ method: 'PATCH', body: { status: 'revoked' } }), params);
    expect(res.status).toBe(409);
  });

  it('cannot revoke failed consent', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle.mockReturnValueOnce({
      data: { id: TEST_CONSENT_ID, status: 'failed', organization_id: TEST_ORG_ID },
      error: null,
    });
    const res = await PATCH(makeReq({ method: 'PATCH', body: { status: 'revoked' } }), params);
    expect(res.status).toBe(409);
  });

  for (const status of ['pending', 'sent', 'delivered', 'opened', 'signed']) {
    it(`allows revoking from "${status}" status`, async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
      mockSingle
        .mockReturnValueOnce({ data: { id: TEST_CONSENT_ID, status, organization_id: TEST_ORG_ID }, error: null })
        .mockReturnValueOnce({ data: { ...TEST_CONSENT, status: 'revoked', driver: {} }, error: null });
      const res = await PATCH(makeReq({ method: 'PATCH', body: { status: 'revoked' } }), params);
      expect(res.status).toBe(200);
    });
  }
});
