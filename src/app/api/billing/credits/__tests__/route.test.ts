import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TEST_USER_ID, TEST_ORG_ID } from '@/__tests__/helpers/fixtures';

// ---- Mocks ----
const mockSingle = vi.fn();
const mockGetUser = vi.fn();

const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({ single: mockSingle })),
    })),
  })),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ getAll: vi.fn(() => []), set: vi.fn() })),
}));

const { GET } = await import('../route');

describe('GET /api/billing/credits', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no' } });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns zero defaults when no credit record exists', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle
      .mockReturnValueOnce({ data: { organization_id: TEST_ORG_ID } }) // profile
      .mockReturnValueOnce({ data: null, error: { message: 'not found' } }); // no balance

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.balance).toBe(0);
    expect(json.data.lifetime_purchased).toBe(0);
    expect(json.data.lifetime_used).toBe(0);
    expect(json.data.updated_at).toBeNull();
  });

  it('returns balance on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle
      .mockReturnValueOnce({ data: { organization_id: TEST_ORG_ID } }) // profile
      .mockReturnValueOnce({
        data: { balance: 42, lifetime_purchased: 50, lifetime_used: 8, updated_at: '2024-01-01T00:00:00Z' },
        error: null,
      });

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.balance).toBe(42);
  });
});
