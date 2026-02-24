import { createRateLimiter } from './rate-limit';

/**
 * Pre-configured rate limiters for different endpoint types.
 * Shared across the app — each limiter maintains its own in-memory store.
 */

/** Auth endpoints (login, signup): 10 requests per minute per IP */
export const authLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });

/** Public API (v1): 60 requests per minute per API key/IP */
export const apiLimiter = createRateLimiter({ windowMs: 60_000, max: 60 });

/** Signing endpoint (POST /api/sign/[token]): 5 submissions per minute per IP */
export const signLimiter = createRateLimiter({ windowMs: 60_000, max: 5 });

/** Webhooks: 120 requests per minute per IP (generous for Twilio/Stripe retries) */
export const webhookLimiter = createRateLimiter({ windowMs: 60_000, max: 120 });

/** General API (session-based): 30 requests per minute per IP */
export const generalLimiter = createRateLimiter({ windowMs: 60_000, max: 30 });
