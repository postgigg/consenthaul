import { vi } from 'vitest';
/**
 * Create a mock ConsentHaulClient with spied methods.
 */
export function createMockClient() {
    return {
        get: vi.fn().mockResolvedValue({}),
        post: vi.fn().mockResolvedValue({}),
        patch: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
        request: vi.fn().mockResolvedValue({}),
    };
}
