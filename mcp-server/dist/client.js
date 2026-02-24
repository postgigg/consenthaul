/**
 * HTTP client wrapper for ConsentHaul API.
 * Handles Bearer token auth, JSON parsing, and error handling.
 */
export class ConsentHaulClient {
    baseUrl;
    apiKey;
    constructor(apiKey, baseUrl = "https://app.consenthaul.com") {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl.replace(/\/+$/, "");
    }
    async request(method, path, body, query) {
        const url = new URL(`${this.baseUrl}/api/v1${path}`);
        if (query) {
            for (const [key, value] of Object.entries(query)) {
                if (value !== undefined) {
                    url.searchParams.set(key, value);
                }
            }
        }
        const headers = {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
        };
        const response = await fetch(url.toString(), {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!response.ok) {
            let errorBody;
            try {
                errorBody = await response.json();
            }
            catch {
                errorBody = await response.text();
            }
            const message = typeof errorBody === "object" &&
                errorBody !== null &&
                "error" in errorBody
                ? String(errorBody.error)
                : `API request failed with status ${response.status}`;
            const error = {
                status: response.status,
                message,
                details: errorBody,
            };
            throw error;
        }
        return response.json();
    }
    async get(path, query) {
        return this.request("GET", path, undefined, query);
    }
    async post(path, body) {
        return this.request("POST", path, body);
    }
    async patch(path, body) {
        return this.request("PATCH", path, body);
    }
    async delete(path) {
        return this.request("DELETE", path);
    }
}
