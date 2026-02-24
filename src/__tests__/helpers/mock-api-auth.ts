import { vi } from 'vitest';
import { TEST_API_KEY_AUTH } from './fixtures';

/**
 * Mock authenticateApiKey to return a valid auth object or null.
 * Call mockReturnValue / mockResolvedValue on the returned mock to control behavior per test.
 */
export function setupApiAuthMock() {
  const mockAuth = vi.fn().mockResolvedValue(TEST_API_KEY_AUTH);

  vi.mock('@/lib/api-auth', () => ({
    authenticateApiKey: mockAuth,
  }));

  return mockAuth;
}
