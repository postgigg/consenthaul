import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import type { Database } from '@/types/database';

type ServiceRequestRow = Database['public']['Tables']['service_requests']['Row'];

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  });
}

// ---------------------------------------------------------------------------
// POST /api/service-requests/[id]/verify-deposit — Verify Stripe deposit
// ---------------------------------------------------------------------------
export async function POST(
  request: NextRequest,
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

    const body = await request.json();
    const { session_id } = body as { session_id?: string };

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 422 },
      );
    }

    // Retrieve Stripe session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 },
      );
    }

    // Verify metadata matches
    if (session.metadata?.service_request_id !== id) {
      return NextResponse.json(
        { error: 'Session does not match this request' },
        { status: 400 },
      );
    }

    // Fetch current request
    const { data: requestData } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', id)
      .single();

    const serviceRequest = requestData as ServiceRequestRow | null;
    if (!serviceRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Idempotency: already processed
    if (serviceRequest.status === 'deposit_paid') {
      return NextResponse.json({ data: serviceRequest });
    }

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? session.id;

    const depositAmountDollars = (session.amount_total ?? 0) / 100;

    // Update service request
    const { data: updated, error: updateError } = await supabase
      .from('service_requests')
      .update({
        status: 'deposit_paid',
        deposit_amount: depositAmountDollars,
        deposit_stripe_payment_intent: paymentIntentId,
        deposit_paid_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[verify-deposit] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
    }

    // Audit log
    await supabase.from('audit_log').insert({
      organization_id: serviceRequest.organization_id,
      actor_id: user.id,
      actor_type: 'user',
      action: 'service_request.deposit_paid',
      resource_type: 'service_request',
      resource_id: id,
      details: {
        deposit_amount: depositAmountDollars,
        stripe_session_id: session_id,
        stripe_payment_intent: paymentIntentId,
      },
    });

    return NextResponse.json({ data: updated as ServiceRequestRow });
  } catch (err) {
    console.error('[POST /api/service-requests/[id]/verify-deposit]', err);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
