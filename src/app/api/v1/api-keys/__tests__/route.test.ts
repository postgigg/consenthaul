import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TEST_ORG_ID, TEST_USER_ID } from '@/__tests__/helpers/fixtures';

// ---- Mocks ----
const mockSingle = vi.fn();
const mockInsert = vi.fn(() => ({ error: null }));
const mockGetUser = vi.fn();

const mockSupabaseSession = {
  auth: { getUser: mockGetUser },
  from: vi.fn(() => ({
    select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockSingle })) })),
    insert: mockInsert,
  })),
};

const mockSupabaseAdmin = {
  from: vi.fn(() => ({
    insert: mockInsert,
  })),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseSession),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockSupabaseAdmin),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}));

const { POST } = await import('../route');

function makeReq(body: unknown) {
  return new Request('https://app.test.com/api/v1/api-keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/v1/api-keys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not logged in', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await POST(makeReq({ name: 'Test', scopes: ['drivers:read'] }));
    expect(res.status).toBe(401);
  });

  it('returns 403 for member role', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle.mockReturnValue({ data: { organization_id: TEST_ORG_ID, role: 'member' } });
    const res = await POST(makeReq({ name: 'Test', scopes: ['drivers:read'] }));
    expect(res.status).toBe(403);
  });

  it('returns 422 for missing name', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle.mockReturnValue({ data: { organization_id: TEST_ORG_ID, role: 'owner' } });
    const res = await POST(makeReq({ scopes: ['drivers:read'] }));
    expect(res.status).toBe(422);
  });

  it('returns 422 for invalid scopes', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle.mockReturnValue({ data: { organization_id: TEST_ORG_ID, role: 'owner' } });
    const res = await POST(makeReq({ name: 'Test', scopes: ['invalid:scope'] }));
    expect(res.status).toBe(422);
  });

  it('returns 422 for empty scopes array', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle.mockReturnValue({ data: { organization_id: TEST_ORG_ID, role: 'owner' } });
    const res = await POST(makeReq({ name: 'Test', scopes: [] }));
    expect(res.status).toBe(422);
  });

  it('returns 201 with key starting with ch_', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle.mockReturnValue({ data: { organization_id: TEST_ORG_ID, role: 'admin' } });
    mockInsert.mockReturnValue({ error: null });

    const res = await POST(makeReq({ name: 'My Key', scopes: ['drivers:read', 'consents:write'] }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.key).toMatch(/^ch_/);
  });
});
