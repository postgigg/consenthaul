import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import getStripe from '@/lib/stripe/client';
import Stripe from 'stripe';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type OrganizationRow = Database['public']['Tables']['organizations']['Row'];

// ---------------------------------------------------------------------------
// Helper: auth + org + stripe customer
// ---------------------------------------------------------------------------
async function getOrgStripeCustomer(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data: profileData } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  const profile = profileData as Pick<ProfileRow, 'organization_id'> | null;
  if (!profile) return null;

  const { data: orgData } = await supabase
    .from('organizations')
    .select('stripe_customer_id')
    .eq('id', profile.organization_id)
    .single();

  const org = orgData as Pick<OrganizationRow, 'stripe_customer_id'> | null;

  return { user, orgId: profile.organization_id, stripeCustomerId: org?.stripe_customer_id ?? null };
}

// ---------------------------------------------------------------------------
// GET /api/billing/payment-methods — List Stripe payment methods
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const supabase = createClient();
    const ctx = await getOrgStripeCustomer(supabase);

    if (!ctx) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in.' },
        { status: 401 },
      );
    }

    if (!ctx.stripeCustomerId) {
      return NextResponse.json({ data: [] });
    }

    const stripe = getStripe();

    const paymentMethods = await stripe.paymentMethods.list({
      customer: ctx.stripeCustomerId,
      type: 'card',
    });

    // Determine the default payment method
    const customer = await stripe.customers.retrieve(ctx.stripeCustomerId) as Stripe.Customer;
    const defaultPmId =
      typeof customer.invoice_settings?.default_payment_method === 'string'
        ? customer.invoice_settings.default_payment_method
        : customer.invoice_settings?.default_payment_method?.id ?? null;

    return NextResponse.json({
      data: paymentMethods.data.map((pm) => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        exp_month: pm.card?.exp_month,
        exp_year: pm.card?.exp_year,
        is_default: pm.id === defaultPmId,
      })),
    });
  } catch (err) {
    console.error('[GET /api/billing/payment-methods]', err);

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

// ---------------------------------------------------------------------------
// POST /api/billing/payment-methods — Create a SetupIntent for adding a card
// ---------------------------------------------------------------------------
export async function POST() {
  try {
    const supabase = createClient();
    const ctx = await getOrgStripeCustomer(supabase);

    if (!ctx) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in.' },
        { status: 401 },
      );
    }

    if (!ctx.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'No Stripe customer associated with this organization.' },
        { status: 400 },
      );
    }

    const stripe = getStripe();

    const setupIntent = await stripe.setupIntents.create({
      customer: ctx.stripeCustomerId,
      payment_method_types: ['card'],
    });

    return NextResponse.json({
      data: { client_secret: setupIntent.client_secret },
    });
  } catch (err) {
    console.error('[POST /api/billing/payment-methods]', err);

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

// ---------------------------------------------------------------------------
// DELETE /api/billing/payment-methods — Detach a payment method
// ---------------------------------------------------------------------------
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const ctx = await getOrgStripeCustomer(supabase);

    if (!ctx) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in.' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { payment_method_id } = body;

    if (!payment_method_id) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'payment_method_id is required.' },
        { status: 400 },
      );
    }

    const stripe = getStripe();

    // Verify the payment method belongs to this customer before detaching
    if (ctx.stripeCustomerId) {
      const pm = await stripe.paymentMethods.retrieve(payment_method_id);
      if (pm.customer !== ctx.stripeCustomerId) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Payment method does not belong to your organization.' },
          { status: 403 },
        );
      }
    }

    await stripe.paymentMethods.detach(payment_method_id);

    return NextResponse.json({ data: { detached: true } });
  } catch (err) {
    console.error('[DELETE /api/billing/payment-methods]', err);

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
