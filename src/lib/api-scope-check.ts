/**
 * API Key Scope Enforcement
 *
 * Validates that an API key's scopes permit the requested action.
 * Used by the public API (v1) middleware to enforce least-privilege access.
 */

export type ApiScope =
  | 'consents:read'
  | 'consents:write'
  | 'drivers:read'
  | 'drivers:write'
  | 'webhooks:read'
  | 'webhooks:write';

/**
 * Map of endpoint base paths to the scopes required for each HTTP method.
 * PUT/PATCH/DELETE are treated as 'write' operations alongside POST.
 */
const ENDPOINT_SCOPES: Record<string, { method: string; scope: ApiScope }[]> = {
  '/api/v1/consents': [
    { method: 'GET', scope: 'consents:read' },
    { method: 'POST', scope: 'consents:write' },
    { method: 'PUT', scope: 'consents:write' },
    { method: 'PATCH', scope: 'consents:write' },
    { method: 'DELETE', scope: 'consents:write' },
  ],
  '/api/v1/drivers': [
    { method: 'GET', scope: 'drivers:read' },
    { method: 'POST', scope: 'drivers:write' },
    { method: 'PUT', scope: 'drivers:write' },
    { method: 'PATCH', scope: 'drivers:write' },
    { method: 'DELETE', scope: 'drivers:write' },
  ],
  '/api/v1/webhooks': [
    { method: 'GET', scope: 'webhooks:read' },
    { method: 'POST', scope: 'webhooks:write' },
    { method: 'PUT', scope: 'webhooks:write' },
    { method: 'PATCH', scope: 'webhooks:write' },
    { method: 'DELETE', scope: 'webhooks:write' },
  ],
};

export interface ScopeCheckResult {
  allowed: boolean;
  requiredScope?: ApiScope;
}

/**
 * Check whether a given API key's scopes permit a request to a specific
 * endpoint path and HTTP method.
 *
 * @param path    - The request path (e.g. `/api/v1/consents/abc-123`)
 * @param method  - The HTTP method (e.g. `GET`, `POST`)
 * @param keyScopes - Array of scope strings assigned to the API key
 * @returns An object indicating whether the request is allowed, and if not,
 *          which scope is required.
 *
 * @example
 * ```ts
 * const result = checkApiScope('/api/v1/consents', 'POST', ['consents:read']);
 * // { allowed: false, requiredScope: 'consents:write' }
 * ```
 */
export function checkApiScope(
  path: string,
  method: string,
  keyScopes: string[],
): ScopeCheckResult {
  // Normalize: strip trailing slash and remove UUID path segments
  // e.g. /api/v1/consents/abc-123-def -> /api/v1/consents
  const normalizedPath = path.replace(/\/$/, '');
  const basePath = normalizedPath.replace(/\/[a-f0-9-]{36}(\/.*)?$/, '');

  const rules = ENDPOINT_SCOPES[basePath];

  if (!rules) {
    // Unknown endpoint — allow for backwards compatibility.
    // New endpoints should be added to ENDPOINT_SCOPES above.
    return { allowed: true };
  }

  const normalizedMethod = method.toUpperCase();
  const rule = rules.find((r) => r.method === normalizedMethod);

  if (!rule) {
    // No rule for this method on a known endpoint — allow (e.g. OPTIONS/HEAD).
    return { allowed: true };
  }

  // Wildcard scope grants access to everything
  if (keyScopes.includes('*')) {
    return { allowed: true };
  }

  if (keyScopes.includes(rule.scope)) {
    return { allowed: true };
  }

  return { allowed: false, requiredScope: rule.scope };
}

/**
 * Utility to list all valid scopes. Useful for API key creation UI
 * and validation.
 */
export function getAllScopes(): ApiScope[] {
  return [
    'consents:read',
    'consents:write',
    'drivers:read',
    'drivers:write',
    'webhooks:read',
    'webhooks:write',
  ];
}

/**
 * Validate that an array of scope strings contains only valid values.
 */
export function validateScopes(scopes: string[]): { valid: boolean; invalid: string[] } {
  const validScopes = new Set<string>([...getAllScopes(), '*']);
  const invalid = scopes.filter((s) => !validScopes.has(s));
  return { valid: invalid.length === 0, invalid };
}
