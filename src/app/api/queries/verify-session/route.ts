import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';
import { checkRateLimit } from '@/lib/rate-limit';
import { queryLimiter } from '@/lib/rate-limiters';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  });
}

// ---------------------------------------------------------------------------
// POST /api/queries/verify-session — Verify Stripe session & activate subscription
// Fallback for when the webhook hasn't arrived yet (e.g., local dev without stripe listen)
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const blocked = await checkRateLimit(request, queryLimiter);
    if (blocked) return blocked;

    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const orgId = profile.organization_id;

    // Check if already active
    const { data: org } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', orgId)
      .single();

    const settings = (org?.settings ?? {}) as Record<string, unknown>;
    if (settings.query_subscription_active === true) {
      return NextResponse.json({ data: { active: true } });
    }

    // Parse session_id from request body
    const body = await request.json().catch(() => ({}));
    const sessionId = typeof body.session_id === 'string' ? body.session_id : null;

    if (!sessionId || !sessionId.startsWith('cs_')) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Invalid session_id.' },
        { status: 422 },
      );
    }

    // Retrieve checkout session from Stripe
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify this session belongs to this org and is the right type
    if (
      session.metadata?.organization_id !== orgId ||
      session.metadata?.type !== 'query_subscription'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ data: { active: false, payment_status: session.payment_status } });
    }

    // Payment succeeded — activate subscription using admin client
    const admin = createAdminClient();

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? session.id;

    const driverCount = session.metadata?.driver_count;
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const { error: updateError } = await admin
      .from('organizations')
      .update({
        settings: {
          ...settings,
          query_subscription_active: true,
          query_subscription_expires_at: expiresAt,
          query_subscription_driver_count: driverCount ? parseInt(driverCount, 10) : 0,
          query_subscription_payment_intent: paymentIntentId,
          query_subscription_activated_at: new Date().toISOString(),
        },
      })
      .eq('id', orgId);

    if (updateError) {
      console.error('[verify-session] Failed to activate subscription:', updateError);
      return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }

    // Audit log (idempotent — the webhook may also write one)
    await admin.from('audit_log').insert({
      organization_id: orgId,
      actor_id: user.id,
      actor_type: 'user',
      action: 'query_subscription.activated',
      resource_type: 'organization',
      resource_id: orgId,
      details: {
        source: 'verify-session',
        driver_count: driverCount,
        expires_at: expiresAt,
        stripe_session_id: session.id,
        stripe_payment_intent: paymentIntentId,
        amount_total: session.amount_total,
        currency: session.currency,
      },
    });

    return NextResponse.json({ data: { active: true } });
  } catch (err) {
    console.error('[POST /api/queries/verify-session]', err);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
