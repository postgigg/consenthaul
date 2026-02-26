/**
 * Simple in-memory sliding window rate limiter.
 * No external dependencies. Suitable for single-instance deployments.
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });
 *   const result = limiter.check(ip);
 *   if (!result.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 */

import { NextResponse } from 'next/server';
import { isIpBanned, recordViolation } from '@/lib/security/ip-blacklist';

interface RateLimiterOptions {
  /** Time window in milliseconds */
  windowMs: number;
  /** Max requests per window */
  max: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

interface RateLimiterEntry {
  count: number;
  resetAt: number;
}

export function createRateLimiter({ windowMs, max }: RateLimiterOptions) {
  const store = new Map<string, RateLimiterEntry>();

  // Periodically clean up expired entries to prevent memory leaks
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of Array.from(store.entries())) {
      if (now >= entry.resetAt) {
        store.delete(key);
      }
    }
  }, windowMs * 2);

  // Allow GC to collect the interval if the module is unloaded
  if (cleanup.unref) cleanup.unref();

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      const entry = store.get(key);

      // Window expired or first request — start fresh
      if (!entry || now >= entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
      }

      entry.count++;

      if (entry.count > max) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
      }

      return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt };
    },
  };
}

/**
 * Extract client IP from a Next.js request.
 * Checks x-forwarded-for first (reverse proxy), falls back to x-real-ip.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * Combined IP-ban + rate-limit check. Returns a Response if blocked, or null if allowed.
 *
 * Usage in a route handler:
 *   const blocked = await checkRateLimit(request, generalLimiter);
 *   if (blocked) return blocked;
 */
export async function checkRateLimit(
  request: Request,
  limiter: ReturnType<typeof createRateLimiter>,
): Promise<NextResponse | null> {
  const ip = getClientIp(request);

  // 1. IP blacklist check
  const banned = await isIpBanned(ip);
  if (banned) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Access denied.' },
      { status: 403 },
    );
  }

  // 2. Rate limit check
  const rl = limiter.check(ip);
  if (!rl.allowed) {
    // Fire-and-forget violation recording
    recordViolation(ip, 'rate_limit').catch(() => {});

    const retryAfter = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: 'Too Many Requests', message: 'Rate limit exceeded. Try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)),
        },
      },
    );
  }

  return null;
}
