import { createHash } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/types/database';

type ApiKeyRow = Database['public']['Tables']['api_keys']['Row'];

export interface ApiKeyAuth {
  orgId: string;
  keyId: string;
  scopes: string[];
}

/**
 * Authenticate a request using a Bearer API key.
 *
 * Flow:
 *   1. Extract `Bearer <key>` from the Authorization header.
 *   2. Derive the key prefix (first 16 chars) and full SHA-256 hash.
 *   3. Look up the key in `api_keys` by prefix + hash.
 *   4. Verify the key is active and not expired.
 *   5. Touch `last_used_at`.
 *   6. Return the org/key/scopes or `null` on failure.
 */
export async function authenticateApiKey(
  request: Request,
): Promise<ApiKeyAuth | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  const rawKey = parts[1];
  if (!rawKey || !rawKey.startsWith('ch_')) return null;

  const prefix = rawKey.slice(0, 16);
  const hash = createHash('sha256').update(rawKey).digest('hex');

  const supabase = createAdminClient();

  const { data: apiKeyData, error } = await supabase
    .from('api_keys')
    .select('id, organization_id, scopes, is_active, expires_at')
    .eq('key_prefix', prefix)
    .eq('key_hash', hash)
    .single();

  const apiKey = apiKeyData as Pick<ApiKeyRow, 'id' | 'organization_id' | 'scopes' | 'is_active' | 'expires_at'> | null;

  if (error || !apiKey) return null;

  // Must be active
  if (!apiKey.is_active) return null;

  // Must not be expired
  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
    return null;
  }

  // Touch last_used_at (fire-and-forget)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKey.id)
    .then(); // intentionally not awaited

  return {
    orgId: apiKey.organization_id,
    keyId: apiKey.id,
    scopes: apiKey.scopes,
  };
}
