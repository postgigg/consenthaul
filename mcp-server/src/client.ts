/**
 * HTTP client wrapper for ConsentHaul API.
 * Handles Bearer token auth, JSON parsing, and error handling.
 */

export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

export class ConsentHaulClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey: string, baseUrl: string = "https://app.consenthaul.com") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  async request<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string | undefined>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}/api/v1${path}`);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, value);
        }
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }

      const message =
        typeof errorBody === "object" &&
        errorBody !== null &&
        "error" in errorBody
          ? String((errorBody as { error: unknown }).error)
          : `API request failed with status ${response.status}`;

      const error: ApiError = {
        status: response.status,
        message,
        details: errorBody,
      };
      throw error;
    }

    return response.json() as Promise<T>;
  }

  async get<T = unknown>(
    path: string,
    query?: Record<string, string | undefined>
  ): Promise<T> {
    return this.request<T>("GET", path, undefined, query);
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async patch<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  async delete<T = unknown>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }
}
