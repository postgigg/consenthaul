import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';
import { CREDIT_PACKS } from '@/lib/stripe/credits';
import type { Database } from '@/types/database';

type CreditTransactionRow = Database['public']['Tables']['credit_transactions']['Row'];

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// ---------------------------------------------------------------------------
// POST /api/webhooks/stripe — Handle Stripe webhook events
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  let event: Stripe.Event;

  try {
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
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
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
