import { vi } from 'vitest';
import type { ConsentHaulClient } from '../../client.js';
/**
 * Create a mock ConsentHaulClient with spied methods.
 */
export declare function createMockClient(): ConsentHaulClient & {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    request: ReturnType<typeof vi.fn>;
};
