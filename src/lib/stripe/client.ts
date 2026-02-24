import Stripe from 'stripe';

// ---------------------------------------------------------------------------
// Shared Stripe client instance
// ---------------------------------------------------------------------------

/**
 * Server-side Stripe client configured with the secret key.
 *
 * Import this instead of instantiating Stripe directly so the entire
 * application shares a single client (and its underlying HTTP agent).
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
  typescript: true,
});

export default stripe;
