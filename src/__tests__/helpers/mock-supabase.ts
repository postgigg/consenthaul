import { vi } from 'vitest';

/**
 * Creates a chainable Supabase mock. Every method returns `this` except
 * terminal methods (.single(), .then(), implicit await on query) which
 * return the configured response.
 */
export function createMockSupabaseClient(overrides: Record<string, unknown> = {}) {
  let response: { data: unknown; error: unknown; count?: number | null } = {
    data: null,
    error: null,
    count: null,
  };

  const builder: Record<string, unknown> = {
    // Terminal — returns response
    single: vi.fn(() => response),
    then: vi.fn((resolve: (val: unknown) => void) => resolve(response)),
    // Chainable
    from: vi.fn(() => builder),
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    upsert: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    neq: vi.fn(() => builder),
    gt: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    lt: vi.fn(() => builder),
    lte: vi.fn(() => builder),
    like: vi.fn(() => builder),
    ilike: vi.fn(() => builder),
    is: vi.fn(() => builder),
    in: vi.fn(() => builder),
    or: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    range: vi.fn(() => builder),
    // RPC
    rpc: vi.fn(() => response),
    // Auth
    auth: {
      getUser: vi.fn(() => ({ data: { user: null }, error: null })),
    },
    // Storage
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => ({ data: { path: 'test.pdf' }, error: null })),
        createSignedUrl: vi.fn(() => ({
          data: { signedUrl: 'https://storage.test.com/signed-url' },
          error: null,
        })),
      })),
    },
  };

  // Helper to set the next response
  (builder as Record<string, unknown>).__setResponse = (data: unknown, error: unknown = null, count: number | null = null) => {
    response = { data, error, count };
  };

  // Apply overrides
  Object.assign(builder, overrides);

  return builder;
}

/**
 * Set up vi.mock for @/lib/supabase/admin with a controllable mock client.
 * Returns the mock client so tests can configure responses.
 */
export function setupAdminClientMock() {
  const mock = createMockSupabaseClient();
  vi.mock('@/lib/supabase/admin', () => ({
    createAdminClient: vi.fn(() => mock),
  }));
  return mock;
}

/**
 * Set up vi.mock for @/lib/supabase/server with a controllable mock client.
 * Returns the mock client so tests can configure responses.
 */
export function setupServerClientMock() {
  const mock = createMockSupabaseClient();
  vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => mock),
  }));
  return mock;
}
