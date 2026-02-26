import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Edge-compatible in-memory IP blacklist cache (per Edge instance)
// ---------------------------------------------------------------------------

interface BanCacheEntry {
  banned: boolean;
  expiresAt: number;
}

const BAN_CACHE_TTL_MS = 60_000; // 60 seconds
const BAN_CACHE_MAX = 5_000;
const banCache = new Map<string, BanCacheEntry>();

function getClientIpEdge(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * Lightweight Edge-compatible banned-IP check via Supabase REST.
 * Fails open on any error.
 */
async function isIpBannedEdge(ip: string): Promise<boolean> {
  if (!ip || ip === 'unknown') return false;

  // Check cache
  const cached = banCache.get(ip);
  if (cached && Date.now() < cached.expiresAt) return cached.banned;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) return false;

  try {
    const now = new Date().toISOString();
    const url = `${supabaseUrl}/rest/v1/ip_blacklist?ip_address=eq.${encodeURIComponent(ip)}&banned_at=not.is.null&select=ban_expires_at&limit=1`;

    const res = await fetch(url, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      // Short timeout to avoid blocking requests
      signal: AbortSignal.timeout(2000),
    });

    if (!res.ok) {
      // Fail open
      return false;
    }

    const rows = await res.json() as { ban_expires_at: string | null }[];

    if (!rows || rows.length === 0) {
      setCacheEntry(ip, false);
      return false;
    }

    const row = rows[0];
    const isBanned = !row.ban_expires_at || row.ban_expires_at > now;

    setCacheEntry(ip, isBanned);
    return isBanned;
  } catch {
    // Fail open on any network/parse error
    return false;
  }
}

function setCacheEntry(ip: string, banned: boolean) {
  if (banCache.size >= BAN_CACHE_MAX) {
    const firstKey = banCache.keys().next().value;
    if (firstKey) banCache.delete(firstKey);
  }
  banCache.set(ip, { banned, expiresAt: Date.now() + BAN_CACHE_TTL_MS });
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  // Only check IP blacklist for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = getClientIpEdge(request);
    const banned = await isIpBannedEdge(ip);
    if (banned) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Access denied.' },
        { status: 403 },
      );
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.svg|sign/).*)',
  ],
};
