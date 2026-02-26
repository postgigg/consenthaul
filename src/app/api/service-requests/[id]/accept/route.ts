import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type OrganizationRow = Database['public']['Tables']['organizations']['Row'];
type ServiceRequestRow = Database['public']['Tables']['service_requests']['Row'];

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  });
}

// ---------------------------------------------------------------------------
// POST /api/service-requests/[id]/accept — Accept a quote & pay 5% deposit
// ---------------------------------------------------------------------------
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const stripe = getStripe();
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile first for org scoping
    const { data: profileData } = await supabase
      .from('profiles')
      .select('organization_id, email')
      .eq('id', user.id)
      .single();

    const profile = profileData as Pick<ProfileRow, 'organization_id' | 'email'> | null;
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Fetch the service request — scoped to user's org to prevent IDOR
    const { data: requestData, error: fetchError } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .single();

    if (fetchError || !requestData) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const serviceRequest = requestData as ServiceRequestRow;

    if (serviceRequest.status !== 'quoted') {
      return NextResponse.json(
        { error: 'Request is not in quoted status' },
        { status: 400 },
      );
    }

    if (!serviceRequest.quoted_amount) {
      return NextResponse.json(
        { error: 'No quote amount set' },
        { status: 400 },
      );
    }

    // Calculate 5% deposit
    const depositAmount = Math.ceil(Number(serviceRequest.quoted_amount) * 0.05 * 100); // in cents

    const { data: orgData } = await supabase
      .from('organizations')
      .select('id, name, stripe_customer_id')
      .eq('id', profile.organization_id)
      .single();

    const org = orgData as Pick<OrganizationRow, 'id' | 'name' | 'stripe_customer_id'> | null;
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get or create Stripe customer
    let stripeCustomerId = org.stripe_customer_id;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name: org.name,
        metadata: { organization_id: org.id, supabase_user_id: user.id },
      });
      stripeCustomerId = customer.id;
      await supabase
        .from('organizations')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', org.id);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const categoryLabel = serviceRequest.category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    // Create Stripe checkout session with dynamic price
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Security Deposit — ${categoryLabel}`,
              description: `5% refundable deposit for ${categoryLabel} (Quote: $${Number(serviceRequest.quoted_amount).toFixed(2)})`,
            },
            unit_amount: depositAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'service_deposit',
        service_request_id: serviceRequest.id,
        organization_id: profile.organization_id,
        user_id: user.id,
      },
      success_url: `${appUrl}/help?deposit=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/help?deposit=cancelled`,
    });

    return NextResponse.json({
      data: { checkout_url: session.url, session_id: session.id },
    });
  } catch (err) {
    console.error('[POST /api/service-requests/[id]/accept]', err);

    if (err instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: 'Payment Error', message: err.message },
        { status: 502 },
      );
    }

    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
