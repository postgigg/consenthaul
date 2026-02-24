import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  TEST_USER_ID,
  TEST_CONSENT_ID,
} from '@/__tests__/helpers/fixtures';

// ---- Mocks ----
const mockSingle = vi.fn();
const mockCreateSignedUrl = vi.fn();
const mockGetUser = vi.fn();

const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({ single: mockSingle })),
    })),
  })),
  storage: {
    from: vi.fn(() => ({
      createSignedUrl: mockCreateSignedUrl,
    })),
  },
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ getAll: vi.fn(() => []), set: vi.fn() })),
}));

const { GET } = await import('../route');

const params = { params: { id: TEST_CONSENT_ID } };

function makeReq() {
  return new NextRequest('https://app.test.com/api/consents/' + TEST_CONSENT_ID + '/pdf', {
    method: 'GET',
  });
}

describe('GET /api/consents/[id]/pdf', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no' } });
    const res = await GET(makeReq(), params);
    expect(res.status).toBe(401);
  });

  it('returns 409 if consent not signed', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle.mockReturnValueOnce({
      data: { id: TEST_CONSENT_ID, status: 'pending', pdf_storage_path: null, driver: {} },
      error: null,
    });
    const res = await GET(makeReq(), params);
    expect(res.status).toBe(409);
  });

  it('returns 404 if no pdf_storage_path', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle.mockReturnValueOnce({
      data: { id: TEST_CONSENT_ID, status: 'signed', pdf_storage_path: null, driver: {} },
      error: null,
    });
    const res = await GET(makeReq(), params);
    expect(res.status).toBe(404);
  });

  it('redirects to signed URL on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle.mockReturnValueOnce({
      data: { id: TEST_CONSENT_ID, status: 'signed', pdf_storage_path: 'org/consent.pdf', driver: {} },
      error: null,
    });
    mockCreateSignedUrl.mockReturnValueOnce({
      data: { signedUrl: 'https://storage.test.com/signed' },
      error: null,
    });
    const res = await GET(makeReq(), params);
    expect(res.status).toBe(307); // redirect
    expect(res.headers.get('location')).toBe('https://storage.test.com/signed');
  });
});
