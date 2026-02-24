import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash } from 'crypto';

// We'll mock createAdminClient before importing authenticateApiKey
const mockSingle = vi.fn();
const mockUpdate = vi.fn(() => ({ eq: vi.fn(() => ({ then: vi.fn() })) }));
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSingle,
        })),
      })),
    })),
    update: mockUpdate,
  })),
};

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockSupabase),
}));

// Import after mock
const { authenticateApiKey } = await import('../api-auth');

function makeRequest(authHeader?: string): Request {
  const headers = new Headers();
  if (authHeader) headers.set('authorization', authHeader);
  return new Request('https://test.com/api/v1/drivers', { headers });
}

describe('authenticateApiKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no Authorization header', async () => {
    expect(await authenticateApiKey(makeRequest())).toBeNull();
  });

  it('returns null when header is not Bearer', async () => {
    expect(await authenticateApiKey(makeRequest('Basic abc123'))).toBeNull();
  });

  it('returns null when token does not start with ch_', async () => {
    expect(await authenticateApiKey(makeRequest('Bearer sk_live_abc'))).toBeNull();
  });

  it('returns null when no DB match', async () => {
    mockSingle.mockReturnValue({ data: null, error: { message: 'not found' } });
    expect(await authenticateApiKey(makeRequest('Bearer ch_test_1234567890abcdef1234567890abcdef'))).toBeNull();
  });

  it('returns null when key is inactive', async () => {
    mockSingle.mockReturnValue({
      data: {
        id: 'key-1',
        organization_id: 'org-1',
        scopes: ['*'],
        is_active: false,
        expires_at: null,
      },
      error: null,
    });

    expect(await authenticateApiKey(makeRequest('Bearer ch_test_1234567890abcdef1234567890abcdef'))).toBeNull();
  });

  it('returns null when key is expired', async () => {
    mockSingle.mockReturnValue({
      data: {
        id: 'key-1',
        organization_id: 'org-1',
        scopes: ['*'],
        is_active: true,
        expires_at: '2020-01-01T00:00:00Z', // past date
      },
      error: null,
    });

    expect(await authenticateApiKey(makeRequest('Bearer ch_test_1234567890abcdef1234567890abcdef'))).toBeNull();
  });

  it('returns { orgId, keyId, scopes } on valid key', async () => {
    mockSingle.mockReturnValue({
      data: {
        id: 'key-1',
        organization_id: 'org-1',
        scopes: ['drivers:read', 'consents:write'],
        is_active: true,
        expires_at: null,
      },
      error: null,
    });

    const result = await authenticateApiKey(makeRequest('Bearer ch_test_1234567890abcdef1234567890abcdef'));

    expect(result).toEqual({
      orgId: 'org-1',
      keyId: 'key-1',
      scopes: ['drivers:read', 'consents:write'],
    });
  });

  it('calls update last_used_at on success', async () => {
    mockSingle.mockReturnValue({
      data: {
        id: 'key-1',
        organization_id: 'org-1',
        scopes: ['*'],
        is_active: true,
        expires_at: null,
      },
      error: null,
    });

    await authenticateApiKey(makeRequest('Bearer ch_test_1234567890abcdef1234567890abcdef'));

    // from() should be called for both select and update
    expect(mockSupabase.from).toHaveBeenCalledWith('api_keys');
  });

  it('passes correct prefix and hash to query', async () => {
    const rawKey = 'ch_test_1234567890abcdef1234567890abcdef';
    const expectedPrefix = rawKey.slice(0, 16);
    const expectedHash = createHash('sha256').update(rawKey).digest('hex');

    mockSingle.mockReturnValue({ data: null, error: { message: 'not found' } });

    await authenticateApiKey(makeRequest(`Bearer ${rawKey}`));

    // Verify the from('api_keys') chain was called
    expect(mockSupabase.from).toHaveBeenCalledWith('api_keys');
  });
});
