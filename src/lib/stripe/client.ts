import Stripe from 'stripe';

// ---------------------------------------------------------------------------
// Shared Stripe client instance
// ---------------------------------------------------------------------------

let _stripe: Stripe | null = null;

/**
 * Server-side Stripe client configured with the secret key.
 *
 * Lazily initialized to avoid crashing during build when env vars are absent.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    });
  }
  return _stripe;
}

export default getStripe;
