import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  TEST_USER_ID,
  TEST_DRIVER_ID,
  TEST_DRIVER,
  TEST_ORG_ID,
} from '@/__tests__/helpers/fixtures';

// ---- Mocks ----
const mockSingle = vi.fn();
const mockLimit = vi.fn(() => []);
const mockGetUser = vi.fn();

const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: mockSingle,
        eq: vi.fn(() => ({ single: mockSingle })),
        order: vi.fn(() => ({ limit: mockLimit })),
        limit: mockLimit,
      })),
    })),
    insert: vi.fn(() => ({ select: vi.fn(() => ({ single: mockSingle })) })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({ single: mockSingle })),
      })),
    })),
  })),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ getAll: vi.fn(() => []), set: vi.fn() })),
}));

const { GET, PATCH, DELETE } = await import('../route');

const params = { params: { id: TEST_DRIVER_ID } };

function makeReq(opts: { method?: string; body?: unknown } = {}) {
  const init: RequestInit = { method: opts.method ?? 'GET', headers: { 'Content-Type': 'application/json' } };
  if (opts.body) init.body = JSON.stringify(opts.body);
  return new NextRequest('https://app.test.com/api/drivers/' + TEST_DRIVER_ID, init);
}

describe('GET /api/drivers/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no' } });
    const res = await GET(makeReq(), params);
    expect(res.status).toBe(401);
  });

  it('returns 404 when driver not found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle.mockReturnValueOnce({ data: null, error: { message: 'not found' } });
    const res = await GET(makeReq(), params);
    expect(res.status).toBe(404);
  });

  it('returns driver with consents on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle.mockReturnValueOnce({ data: TEST_DRIVER, error: null });
    mockLimit.mockReturnValueOnce({ data: [], error: null });
    const res = await GET(makeReq(), params);
    expect(res.status).toBe(200);
  });
});

describe('PATCH /api/drivers/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no' } });
    const res = await PATCH(makeReq({ method: 'PATCH', body: { first_name: 'X' } }), params);
    expect(res.status).toBe(401);
  });

  it('returns 422 on invalid data', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    const res = await PATCH(makeReq({ method: 'PATCH', body: { email: 'bad-email' } }), params);
    expect(res.status).toBe(422);
  });

  it('returns updated driver on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle
      .mockReturnValueOnce({ data: { id: TEST_DRIVER_ID, organization_id: TEST_ORG_ID }, error: null }) // fetch existing
      .mockReturnValueOnce({ data: { ...TEST_DRIVER, first_name: 'Updated' }, error: null }); // update result
    const res = await PATCH(makeReq({ method: 'PATCH', body: { first_name: 'Updated' } }), params);
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/drivers/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no' } });
    const res = await DELETE(makeReq({ method: 'DELETE' }), params);
    expect(res.status).toBe(401);
  });

  it('returns 409 when driver already deactivated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle.mockReturnValueOnce({
      data: { id: TEST_DRIVER_ID, organization_id: TEST_ORG_ID, is_active: false },
      error: null,
    });
    const res = await DELETE(makeReq({ method: 'DELETE' }), params);
    expect(res.status).toBe(409);
  });

  it('soft-deletes driver on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle
      .mockReturnValueOnce({ data: { id: TEST_DRIVER_ID, organization_id: TEST_ORG_ID, is_active: true }, error: null })
      .mockReturnValueOnce({ data: { ...TEST_DRIVER, is_active: false, termination_date: '2024-01-01' }, error: null });
    const res = await DELETE(makeReq({ method: 'DELETE' }), params);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.is_active).toBe(false);
  });
});
