import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { CREDIT_PACKS } from '@/lib/stripe/credits';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type OrganizationRow = Database['public']['Tables']['organizations']['Row'];

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  });
}

// ---------------------------------------------------------------------------
// POST /api/billing/checkout — Create a Stripe checkout session
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
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
    const { pack_id } = body as { pack_id?: string };

    if (!pack_id) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'pack_id is required.' },
        { status: 422 },
      );
    }

    // 3. Validate pack
    const pack = CREDIT_PACKS.find((p) => p.id === pack_id);
    if (!pack) {
      return NextResponse.json(
        { error: 'Validation Error', message: `Unknown credit pack: "${pack_id}".` },
        { status: 422 },
      );
    }

    // 4. Get profile + org
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

    // 5. Get or create Stripe customer
    const { data: orgData } = await supabase
      .from('organizations')
      .select('id, name, stripe_customer_id')
      .eq('id', orgId)
      .single();

    const org = orgData as Pick<OrganizationRow, 'id' | 'name' | 'stripe_customer_id'> | null;

    if (!org) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Organization not found.' },
        { status: 404 },
      );
    }

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

      // Persist customer ID
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
          price: pack.stripe_price_id,
          quantity: 1,
        },
      ],
      metadata: {
        organization_id: orgId,
        pack_id: pack.id,
        user_id: user.id,
      },
      success_url: `${appUrl}/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing?checkout=cancelled`,
      allow_promotion_codes: true,
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
    console.error('[POST /api/billing/checkout]', err);

    // Surface Stripe-specific errors with better messaging
    if (err instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {
          error: 'Payment Error',
          message: err.message,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
