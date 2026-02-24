/**
 * HTTP client wrapper for ConsentHaul API.
 * Handles Bearer token auth, JSON parsing, and error handling.
 */
export interface ApiError {
    status: number;
    message: string;
    details?: unknown;
}
export declare class ConsentHaulClient {
    private baseUrl;
    private apiKey;
    constructor(apiKey: string, baseUrl?: string);
    request<T = unknown>(method: string, path: string, body?: unknown, query?: Record<string, string | undefined>): Promise<T>;
    get<T = unknown>(path: string, query?: Record<string, string | undefined>): Promise<T>;
    post<T = unknown>(path: string, body?: unknown): Promise<T>;
    patch<T = unknown>(path: string, body?: unknown): Promise<T>;
    delete<T = unknown>(path: string): Promise<T>;
}
