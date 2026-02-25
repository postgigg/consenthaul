import { createAdminClient } from '@/lib/supabase/admin';
import { decrypt } from '@/lib/encryption';

// In-memory cache: key -> { value, expiresAt }
const cache = new Map<string, { value: string; expiresAt: number }>();
const CACHE_TTL_MS = 60_000; // 60 seconds

/**
 * Get a configuration value.
 * 1. Checks the DB `platform_config` table (cached for 60s)
 * 2. Falls back to `process.env[key]`
 * Returns undefined if not found anywhere.
 */
export async function getConfigValue(key: string): Promise<string | undefined> {
  // Check cache first
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  // Try DB
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('platform_config')
      .select('encrypted_value')
      .eq('key', key)
      .single();

    if (data?.encrypted_value) {
      const value = decrypt(data.encrypted_value);
      cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
      return value;
    }
  } catch {
    // DB not available or key not found — fall through to env
  }

  // Fallback to process.env
  const envValue = process.env[key];
  if (envValue) {
    cache.set(key, { value: envValue, expiresAt: Date.now() + CACHE_TTL_MS });
  }
  return envValue;
}

/**
 * Clear the config cache (e.g. after updating a value).
 */
export function clearConfigCache(key?: string) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}
