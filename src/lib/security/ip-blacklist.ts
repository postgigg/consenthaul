/**
 * IP Blacklist — automated abuse prevention with escalating bans.
 *
 * Uses an in-memory LRU cache (60s TTL, 10K max) with Supabase REST fallback.
 * Fails open on any DB error to avoid self-DoS.
 *
 * Uses direct REST calls instead of the typed Supabase client because the
 * `ip_blacklist` table is not yet in the generated Database types.
 */

// ---------------------------------------------------------------------------
// Supabase REST helpers
// ---------------------------------------------------------------------------

function getConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  };
}

function headers() {
  const { key } = getConfig();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

function restUrl(path: string) {
  return `${getConfig().url}/rest/v1/${path}`;
}

// ---------------------------------------------------------------------------
// LRU cache
// ---------------------------------------------------------------------------

interface CacheEntry {
  banned: boolean;
  expiresAt: number; // Date.now() + TTL
}

const CACHE_TTL_MS = 60_000; // 60 seconds
const CACHE_MAX_ENTRIES = 10_000;

const cache = new Map<string, CacheEntry>();

function cacheGet(ip: string): boolean | null {
  const entry = cache.get(ip);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(ip);
    return null;
  }
  return entry.banned;
}

function cacheSet(ip: string, banned: boolean) {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(ip, { banned, expiresAt: Date.now() + CACHE_TTL_MS });
}

function cacheInvalidate(ip: string) {
  cache.delete(ip);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check if an IP is currently banned.
 * Returns `true` if banned, `false` otherwise.
 * Fails open (returns `false`) on any DB error.
 */
export async function isIpBanned(ip: string): Promise<boolean> {
  if (!ip || ip === 'unknown') return false;

  const cached = cacheGet(ip);
  if (cached !== null) return cached;

  try {
    const now = new Date().toISOString();
    const url = restUrl(
      `ip_blacklist?ip_address=eq.${encodeURIComponent(ip)}&banned_at=not.is.null&select=ban_expires_at&limit=1`,
    );

    const res = await fetch(url, { headers: headers() });
    if (!res.ok) {
      cacheSet(ip, false);
      return false;
    }

    const rows = (await res.json()) as { ban_expires_at: string | null }[];
    if (!rows || rows.length === 0) {
      cacheSet(ip, false);
      return false;
    }

    const isBanned = !rows[0].ban_expires_at || rows[0].ban_expires_at > now;
    cacheSet(ip, isBanned);
    return isBanned;
  } catch {
    // Fail open
    return false;
  }
}

// Ban escalation thresholds (violation count -> ban duration in ms)
const BAN_ESCALATION: [number, number | null][] = [
  [5, 15 * 60 * 1000],       // 5 violations -> 15 min
  [10, 60 * 60 * 1000],      // 10 violations -> 1 hour
  [20, 24 * 60 * 60 * 1000], // 20 violations -> 24 hours
  [30, null],                  // 30 violations -> permanent
];

/**
 * Record a rate-limit or abuse violation for an IP.
 * Automatically applies escalating bans after thresholds.
 */
export async function recordViolation(ip: string, reason = 'rate_limit'): Promise<void> {
  if (!ip || ip === 'unknown') return;

  try {
    // Fetch current record
    const fetchUrl = restUrl(
      `ip_blacklist?ip_address=eq.${encodeURIComponent(ip)}&select=violation_count&limit=1`,
    );
    const fetchRes = await fetch(fetchUrl, { headers: headers() });

    if (fetchRes.ok) {
      const rows = (await fetchRes.json()) as { violation_count: number }[];

      if (rows.length > 0) {
        // Update existing: increment violation count
        const newCount = rows[0].violation_count + 1;
        const updateUrl = restUrl(
          `ip_blacklist?ip_address=eq.${encodeURIComponent(ip)}`,
        );
        await fetch(updateUrl, {
          method: 'PATCH',
          headers: headers(),
          body: JSON.stringify({
            violation_count: newCount,
            reason,
            updated_at: new Date().toISOString(),
          }),
        });

        await applyBanIfNeeded(ip, newCount);
      } else {
        // Insert new record
        const insertUrl = restUrl('ip_blacklist');
        await fetch(insertUrl, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({
            ip_address: ip,
            violation_count: 1,
            reason,
            updated_at: new Date().toISOString(),
          }),
        });
      }
    }
  } catch {
    // Silently fail — don't block request processing
  }
}

async function applyBanIfNeeded(ip: string, violationCount: number): Promise<void> {
  let banDurationMs: number | null | undefined;

  for (const [threshold, duration] of BAN_ESCALATION) {
    if (violationCount >= threshold) {
      banDurationMs = duration;
    }
  }

  if (banDurationMs === undefined) return;

  const now = new Date();
  const banExpiresAt = banDurationMs === null
    ? null
    : new Date(now.getTime() + banDurationMs).toISOString();

  try {
    const url = restUrl(`ip_blacklist?ip_address=eq.${encodeURIComponent(ip)}`);
    await fetch(url, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({
        banned_at: now.toISOString(),
        ban_expires_at: banExpiresAt,
        updated_at: now.toISOString(),
      }),
    });

    cacheInvalidate(ip);
  } catch {
    // Silent fail
  }
}

/**
 * Manually ban an IP address.
 */
export async function banIp(
  ip: string,
  reason: string,
  durationMs?: number,
): Promise<void> {
  const now = new Date();
  const banExpiresAt = durationMs
    ? new Date(now.getTime() + durationMs).toISOString()
    : null;

  const url = restUrl('ip_blacklist');
  await fetch(url, {
    method: 'POST',
    headers: {
      ...headers(),
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify({
      ip_address: ip,
      banned_at: now.toISOString(),
      ban_expires_at: banExpiresAt,
      reason,
      updated_at: now.toISOString(),
    }),
  });

  cacheInvalidate(ip);
}
