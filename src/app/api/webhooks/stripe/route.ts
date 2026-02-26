import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';
import { CREDIT_PACKS, TMS_PARTNER_PACKS } from '@/lib/stripe/credits';
import { sendPartnerReceiptEmail } from '@/lib/messaging/email';
import { provisionPartner } from '@/lib/partner-provisioning';
import { webhookLimiter } from '@/lib/rate-limiters';
import { getClientIp } from '@/lib/rate-limit';
import type { Database } from '@/types/database';

type CreditTransactionRow = Database['public']['Tables']['credit_transactions']['Row'];

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  });
}

// ---------------------------------------------------------------------------
// POST /api/webhooks/stripe — Handle Stripe webhook events
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  let event: Stripe.Event;

  try {
    // Rate limit
    const ip = getClientIp(request);
    const rl = webhookLimiter.check(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too Many Requests' },
        { status: 429 },
      );
    }

    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    // 1. Verify the Stripe signature
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Missing Stripe signature header.' },
        { status: 400 },
      );
    }

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (verifyError) {
      console.error('[Stripe webhook] Signature verification failed:', verifyError);
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid Stripe signature.' },
        { status: 401 },
      );
    }

    // 2. Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.type === 'service_deposit') {
          await handleServiceDeposit(session);
        } else if (session.metadata?.type === 'tms_partner_application') {
          await handlePartnerApplicationPayment(session);
        } else {
          await handleCheckoutCompleted(session);
        }
        break;
      }
      default: {
        // Unhandled event type — acknowledge receipt but do nothing
        console.log(`[Stripe webhook] Unhandled event type: ${event.type}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[POST /api/webhooks/stripe]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'Webhook processing failed.' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Handlers for specific event types
// ---------------------------------------------------------------------------

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = createAdminClient();

  // Extract metadata set during checkout creation
  const orgId = session.metadata?.organization_id;
  const packId = session.metadata?.pack_id;
  const userId = session.metadata?.user_id;

  if (!orgId || !packId) {
    console.error(
      '[Stripe webhook] checkout.session.completed missing metadata:',
      { orgId, packId },
    );
    return;
  }

  // Find the pack
  const pack = CREDIT_PACKS.find((p) => p.id === packId);
  if (!pack) {
    console.error(`[Stripe webhook] Unknown pack_id: ${packId}`);
    return;
  }

  // Idempotency check — don't add credits if we already processed this session
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? session.id;

  const { data: existingData } = await supabase
    .from('credit_transactions')
    .select('id')
    .eq('reference_id', paymentIntentId)
    .eq('reference_type', 'stripe_payment')
    .limit(1)
    .single();

  const existing = existingData as Pick<CreditTransactionRow, 'id'> | null;

  if (existing) {
    console.log(
      `[Stripe webhook] Duplicate event — credits already added for ${paymentIntentId}`,
    );
    return;
  }

  // Add credits via RPC
  const { data: newBalance, error: rpcError } = await supabase.rpc('add_credits', {
    p_org_id: orgId,
    p_amount: pack.credits,
    p_stripe_payment_id: paymentIntentId,
    p_description: `Purchased ${pack.label} pack (${pack.credits} credits)`,
  });

  if (rpcError) {
    console.error('[Stripe webhook] add_credits RPC error:', rpcError);
    return;
  }

  // Audit log
  await supabase.from('audit_log').insert({
    organization_id: orgId,
    actor_id: userId ?? null,
    actor_type: userId ? 'user' : 'system',
    action: 'credits.purchased',
    resource_type: 'credit_balance',
    resource_id: orgId,
    details: {
      pack_id: packId,
      pack_name: pack.label,
      credits_added: pack.credits,
      new_balance: newBalance,
      stripe_session_id: session.id,
      stripe_payment_intent: paymentIntentId,
      amount_total: session.amount_total,
      currency: session.currency,
    },
  });

  console.log(
    `[Stripe webhook] Added ${pack.credits} credits to org ${orgId}. New balance: ${newBalance}`,
  );
}

// ---------------------------------------------------------------------------
// Handle service deposit checkout completion
// ---------------------------------------------------------------------------

async function handleServiceDeposit(session: Stripe.Checkout.Session) {
  const supabase = createAdminClient();

  const requestId = session.metadata?.service_request_id;
  const orgId = session.metadata?.organization_id;
  const userId = session.metadata?.user_id;

  if (!requestId || !orgId) {
    console.error('[Stripe webhook] service_deposit missing metadata:', { requestId, orgId });
    return;
  }

  // Idempotency: check if already processed
  const { data: existing } = await supabase
    .from('service_requests')
    .select('id, status')
    .eq('id', requestId)
    .single();

  if (!existing) {
    console.error(`[Stripe webhook] Service request not found: ${requestId}`);
    return;
  }

  if ((existing as { status: string }).status === 'deposit_paid') {
    console.log(`[Stripe webhook] Deposit already processed for request ${requestId}`);
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? session.id;

  const depositAmountDollars = (session.amount_total ?? 0) / 100;

  const { error: updateError } = await supabase
    .from('service_requests')
    .update({
      status: 'deposit_paid',
      deposit_amount: depositAmountDollars,
      deposit_stripe_payment_intent: paymentIntentId,
      deposit_paid_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (updateError) {
    console.error('[Stripe webhook] Failed to update service request:', updateError);
    return;
  }

  // Audit log
  await supabase.from('audit_log').insert({
    organization_id: orgId,
    actor_id: userId ?? null,
    actor_type: userId ? 'user' : 'system',
    action: 'service_request.deposit_paid',
    resource_type: 'service_request',
    resource_id: requestId,
    details: {
      deposit_amount: depositAmountDollars,
      stripe_session_id: session.id,
      stripe_payment_intent: paymentIntentId,
    },
  });

  console.log(`[Stripe webhook] Deposit of $${depositAmountDollars} recorded for request ${requestId}`);
}

// ---------------------------------------------------------------------------
// Handle TMS partner application payment
// ---------------------------------------------------------------------------

async function handlePartnerApplicationPayment(session: Stripe.Checkout.Session) {
  const supabase = createAdminClient();

  const applicationId = session.metadata?.partner_application_id;
  if (!applicationId) {
    console.error('[Stripe webhook] tms_partner_application missing application ID');
    return;
  }

  // Load application
  const { data: appData, error: appError } = await supabase
    .from('partner_applications')
    .select('*')
    .eq('id', applicationId)
    .single();

  if (appError || !appData) {
    console.error(`[Stripe webhook] Partner application not found: ${applicationId}`, appError);
    return;
  }

  const application = appData as Database['public']['Tables']['partner_applications']['Row'];

  // Idempotency: skip if already processed
  if (application.status !== 'pending') {
    console.log(`[Stripe webhook] Partner application ${applicationId} already ${application.status}`);
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? session.id;

  // Mark as paid
  await supabase
    .from('partner_applications')
    .update({
      status: 'paid',
      stripe_payment_intent_id: paymentIntentId,
    })
    .eq('id', applicationId);

  console.log(`[Stripe webhook] Partner application ${applicationId} marked as paid`);

  // Send payment receipt email
  const pack = TMS_PARTNER_PACKS.find((p) => p.id === application.selected_pack_id);
  try {
    await sendPartnerReceiptEmail({
      to: application.contact_email,
      contactName: application.contact_name,
      companyName: application.company_name,
      packName: pack?.name ?? 'Partner',
      packCredits: application.selected_pack_credits,
      onboardingFeeCents: application.onboarding_fee_cents,
      packPriceCents: application.selected_pack_price_cents,
      migrationFeeCents: application.migration_fee_cents,
      autoCreateFeeCents: application.auto_create_fee_cents,
      totalAmountCents: application.total_amount_cents,
      stripePaymentIntent: paymentIntentId,
      paidAt: new Date().toISOString(),
    });
    console.log(`[Stripe webhook] Payment receipt sent to ${application.contact_email}`);
  } catch (emailErr) {
    console.error('[Stripe webhook] Failed to send receipt email:', emailErr);
  }

  // Provision partner account (user, org, API keys, credits, migration token, welcome email)
  const stripeCustomerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id ?? null;

  await provisionPartner(applicationId, {
    stripePaymentIntentId: paymentIntentId,
    stripeCustomerId,
    stripeSessionId: session.id,
  });
}
