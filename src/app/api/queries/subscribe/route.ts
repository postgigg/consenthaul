import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { checkRateLimit } from '@/lib/rate-limit';
import { queryLimiter } from '@/lib/rate-limiters';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type OrganizationRow = Database['public']['Tables']['organizations']['Row'];

/** Price per driver per year in cents */
const QUERY_PRICE_PER_DRIVER_CENTS = 125;

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  });
}

// ---------------------------------------------------------------------------
// POST /api/queries/subscribe — Create query subscription checkout
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const blocked = await checkRateLimit(request, queryLimiter);
    if (blocked) return blocked;

    const stripe = getStripe();
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('organization_id, email, full_name')
      .eq('id', user.id)
      .single();

    const profile = profileData as Pick<ProfileRow, 'organization_id' | 'email' | 'full_name'> | null;
    if (!profile) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const orgId = profile.organization_id;

    // Get org + driver count
    const [orgResult, driverCountResult] = await Promise.all([
      supabase
        .from('organizations')
        .select('id, name, stripe_customer_id')
        .eq('id', orgId)
        .single(),
      supabase
        .from('drivers')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('is_active', true),
    ]);

    const org = orgResult.data as Pick<OrganizationRow, 'id' | 'name' | 'stripe_customer_id'> | null;
    if (!org) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const driverCount = driverCountResult.count ?? 0;
    if (driverCount === 0) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'No active drivers found.' },
        { status: 422 },
      );
    }

    const totalCents = driverCount * QUERY_PRICE_PER_DRIVER_CENTS;

    // Get or create Stripe customer
    let stripeCustomerId = org.stripe_customer_id;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name: org.name,
        metadata: { organization_id: orgId, supabase_user_id: user.id },
      });
      stripeCustomerId = customer.id;
      await supabase
        .from('organizations')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', orgId);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Annual Query Service',
              description: `FMCSA Clearinghouse query reminders & TSV generator for ${driverCount} drivers`,
            },
            unit_amount: QUERY_PRICE_PER_DRIVER_CENTS,
          },
          quantity: driverCount,
        },
      ],
      metadata: {
        organization_id: orgId,
        type: 'query_subscription',
        driver_count: String(driverCount),
        user_id: user.id,
      },
      success_url: `${appUrl}/queries?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/queries?checkout=cancelled`,
      payment_intent_data: {
        receipt_email: profile.email,
      },
    });

    return NextResponse.json({
      data: {
        checkout_url: session.url,
        session_id: session.id,
        driver_count: driverCount,
        total_cents: totalCents,
      },
    });
  } catch (err) {
    console.error('[POST /api/queries/subscribe]', err);

    if (err instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: 'Payment Error', message: err.message },
        { status: 502 },
      );
    }

    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
