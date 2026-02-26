import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';
import { CREDIT_PACKS } from '@/lib/stripe/credits';
import { checkRateLimit } from '@/lib/rate-limit';
import { billingLimiter } from '@/lib/rate-limiters';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  });
}

// ---------------------------------------------------------------------------
// POST /api/billing/verify-session — Verify checkout & add credits (no webhook needed)
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const blocked = await checkRateLimit(request, billingLimiter);
    if (blocked) return blocked;

    const supabase = createClient();

    // 1. Authenticate
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get user's profile to verify org ownership
    const adminClient = createAdminClient();
    const { data: profileData } = await adminClient
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profileData) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 3. Get session_id from body
    const body = await request.json();
    const { session_id } = body as { session_id?: string };
    if (!session_id) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 422 });
    }

    // 4. Retrieve the session from Stripe
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const orgId = session.metadata?.organization_id;
    const packId = session.metadata?.pack_id;
    const userId = session.metadata?.user_id;

    if (!orgId || !packId) {
      return NextResponse.json({ error: 'Invalid session metadata' }, { status: 400 });
    }

    // Verify the session's org matches the authenticated user's org
    if (orgId !== profileData.organization_id) {
      return NextResponse.json({ error: 'Session does not belong to your organization' }, { status: 403 });
    }

    // 4. Find the pack
    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) {
      return NextResponse.json({ error: 'Unknown pack' }, { status: 400 });
    }

    // 5. Idempotency check
    const admin = createAdminClient();
    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? session.id;

    const { data: existing } = await admin
      .from('credit_transactions')
      .select('id')
      .eq('reference_id', paymentIntentId)
      .eq('reference_type', 'stripe_payment')
      .limit(1)
      .single();

    if (existing) {
      // Already processed — just return success
      return NextResponse.json({ status: 'already_processed' });
    }

    // 6. Add credits via RPC
    const { data: newBalance, error: rpcError } = await admin.rpc('add_credits', {
      p_org_id: orgId,
      p_amount: pack.credits,
      p_stripe_payment_id: paymentIntentId,
      p_description: `Purchased ${pack.label} pack (${pack.credits} credits)`,
    });

    if (rpcError) {
      console.error('[verify-session] add_credits RPC error:', rpcError);
      return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 });
    }

    // 7. Audit log
    await admin.from('audit_log').insert({
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

    return NextResponse.json({ status: 'credits_added', credits: pack.credits, balance: newBalance });
  } catch (err) {
    console.error('[POST /api/billing/verify-session]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
