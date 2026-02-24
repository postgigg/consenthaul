import { randomBytes, createHash } from 'crypto';

/**
 * Generate a unique signing token for a consent request.
 *
 * Format: `ch_sign_{32 random hex bytes}` (total 40 hex characters after prefix).
 */
export function generateSigningToken(): string {
  const hex = randomBytes(32).toString('hex');
  return `ch_sign_${hex}`;
}

/**
 * Generate an API key for an organization.
 *
 * @param environment - `'live'` or `'test'` — embedded in the key prefix for
 *   quick identification.
 * @returns An object containing:
 *   - `key`    — the full plaintext key (shown once to the user)
 *   - `prefix` — the first 16 characters (stored for display / lookup)
 *   - `hash`   — SHA-256 hex digest of the full key (stored for verification)
 */
export function generateApiKey(environment: 'live' | 'test'): {
  key: string;
  prefix: string;
  hash: string;
} {
  const secret = randomBytes(32).toString('hex');
  const key = `ch_${environment}_${secret}`;
  const prefix = key.slice(0, 16);
  const hash = createHash('sha256').update(key).digest('hex');

  return { key, prefix, hash };
}

/**
 * Produce a SHA-256 hex hash of a signature data-URL string.
 *
 * This hash is stored alongside the consent record so the integrity of the
 * original signature image can be verified later without keeping the raw
 * data-URL in the database long-term.
 */
export function hashSignature(signatureDataUrl: string): string {
  return createHash('sha256').update(signatureDataUrl).digest('hex');
}
