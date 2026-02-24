import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  TEST_ORG_ID,
  TEST_USER_ID,
  TEST_DRIVER,
} from '@/__tests__/helpers/fixtures';

// ---- Mocks ----
const mockSingle = vi.fn();
const mockRange = vi.fn(() => ({ data: [], error: null, count: 0 }));
const mockEqChain: ReturnType<typeof vi.fn> = vi.fn(() => ({
  single: mockSingle,
  limit: vi.fn(() => ({ single: mockSingle })),
  eq: mockEqChain,
  or: vi.fn(() => ({ order: vi.fn(() => ({ range: mockRange })) })),
  order: vi.fn(() => ({ range: mockRange })),
}));
const mockSelect = vi.fn(() => ({ eq: mockEqChain }));
const mockInsert = vi.fn(() => ({ select: vi.fn(() => ({ single: mockSingle })) }));
const mockGetUser = vi.fn();

const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    eq: mockEqChain,
  })),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ getAll: vi.fn(() => []), set: vi.fn() })),
}));

const { POST, GET } = await import('../route');

function makeReq(opts: { method?: string; body?: unknown; searchParams?: Record<string, string> } = {}) {
  const url = new URL('https://app.test.com/api/drivers');
  if (opts.searchParams) {
    for (const [k, v] of Object.entries(opts.searchParams)) url.searchParams.set(k, v);
  }
  const init: RequestInit = { method: opts.method ?? 'GET', headers: { 'Content-Type': 'application/json' } };
  if (opts.body) init.body = JSON.stringify(opts.body);
  return new NextRequest(url, init);
}

describe('POST /api/drivers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no session' } });
    const res = await POST(makeReq({ method: 'POST', body: {} }));
    expect(res.status).toBe(401);
  });

  it('returns 422 on validation error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle.mockReturnValueOnce({ data: { organization_id: TEST_ORG_ID } }); // profile
    const res = await POST(makeReq({ method: 'POST', body: { first_name: '' } }));
    expect(res.status).toBe(422);
  });

  it('returns 201 on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle
      .mockReturnValueOnce({ data: { organization_id: TEST_ORG_ID } }) // profile
      .mockReturnValueOnce({ data: TEST_DRIVER, error: null }); // insert
    const res = await POST(makeReq({
      method: 'POST',
      body: { first_name: 'John', last_name: 'Doe', phone: '+15551234567' },
    }));
    expect(res.status).toBe(201);
  });

  it('returns 409 on duplicate CDL', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle
      .mockReturnValueOnce({ data: { organization_id: TEST_ORG_ID } }) // profile
      .mockReturnValueOnce({ data: { id: 'existing' }, error: null }); // CDL check
    const res = await POST(makeReq({
      method: 'POST',
      body: { first_name: 'A', last_name: 'B', phone: '+1', cdl_number: 'DUP' },
    }));
    expect(res.status).toBe(409);
  });
});

describe('GET /api/drivers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no session' } });
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it('returns paginated results on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle.mockReturnValueOnce({ data: { organization_id: TEST_ORG_ID } }); // profile
    mockRange.mockReturnValueOnce({ data: [TEST_DRIVER], error: null, count: 1 });

    const res = await GET(makeReq({ searchParams: { page: '1', per_page: '25' } }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.pagination).toBeDefined();
  });
});
