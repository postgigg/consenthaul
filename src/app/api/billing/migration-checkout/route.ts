import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import {
  MIGRATION_PRICE_PER_GB_CENTS,
  MIGRATION_STANDARD_PRICE_PER_GB_CENTS,
} from '@/lib/stripe/credits';
import { checkRateLimit } from '@/lib/rate-limit';
import { billingLimiter } from '@/lib/rate-limiters';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type OrganizationRow = Database['public']['Tables']['organizations']['Row'];

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  });
}

// ---------------------------------------------------------------------------
// POST /api/billing/migration-checkout — Create Stripe checkout for migration
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const blocked = await checkRateLimit(request, billingLimiter);
    if (blocked) return blocked;

    const stripe = getStripe();
    const supabase = createClient();

    // 1. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in.' },
        { status: 401 },
      );
    }

    // 2. Parse body
    const body = await request.json();
    const { estimated_gb } = body as { estimated_gb?: number };

    if (!estimated_gb || typeof estimated_gb !== 'number' || estimated_gb < 1) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'estimated_gb is required and must be at least 1.' },
        { status: 422 },
      );
    }

    // 3. Get profile + org
    const { data: profileData } = await supabase
      .from('profiles')
      .select('organization_id, email, full_name')
      .eq('id', user.id)
      .single();

    const profile = profileData as Pick<ProfileRow, 'organization_id' | 'email' | 'full_name'> | null;

    if (!profile) {
      return NextResponse.json(
        { error: 'Not Found', message: 'User profile not found.' },
        { status: 404 },
      );
    }

    const orgId = profile.organization_id;

    const { data: orgData } = await supabase
      .from('organizations')
      .select('id, name, stripe_customer_id, is_partner')
      .eq('id', orgId)
      .single();

    const org = orgData as Pick<OrganizationRow, 'id' | 'name' | 'stripe_customer_id' | 'is_partner'> | null;

    if (!org) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Organization not found.' },
        { status: 404 },
      );
    }

    // 4. Determine pricing
    const pricePerGb = org.is_partner
      ? MIGRATION_PRICE_PER_GB_CENTS
      : MIGRATION_STANDARD_PRICE_PER_GB_CENTS;
    const totalCents = Math.round(estimated_gb * pricePerGb);

    // 5. Get or create Stripe customer
    let stripeCustomerId = org.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name: org.name,
        metadata: {
          organization_id: orgId,
          supabase_user_id: user.id,
        },
      });
      stripeCustomerId = customer.id;

      await supabase
        .from('organizations')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', orgId);
    }

    // 6. Create checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: totalCents,
            product_data: {
              name: `Data Migration — ${estimated_gb} GB`,
              description: `Fleet data migration at $${(pricePerGb / 100).toFixed(0)}/GB`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'migration',
        organization_id: orgId,
        user_id: user.id,
        estimated_gb: String(estimated_gb),
      },
      success_url: `${appUrl}/drivers?migration=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/drivers?migration=cancelled`,
      payment_intent_data: {
        receipt_email: profile.email,
      },
    });

    return NextResponse.json({
      data: {
        checkout_url: session.url,
        session_id: session.id,
      },
    });
  } catch (err) {
    console.error('[POST /api/billing/migration-checkout]', err);

    if (err instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: 'Payment Error', message: err.message },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
