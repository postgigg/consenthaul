import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';
import type { Database } from '@/types/database';

type ServiceRequestRow = Database['public']['Tables']['service_requests']['Row'];

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  });
}

// ---------------------------------------------------------------------------
// POST /api/admin/service-requests/[id]/refund — Refund deposit (admin)
// ---------------------------------------------------------------------------
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getAdminUserApi();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminClient();

    // Fetch the service request
    const { data: requestData } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', id)
      .single();

    const serviceRequest = requestData as ServiceRequestRow | null;
    if (!serviceRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Only refund if deposit_paid (not in_progress or later)
    if (serviceRequest.status !== 'deposit_paid') {
      return NextResponse.json(
        { error: 'Can only refund deposits before work begins' },
        { status: 400 },
      );
    }

    if (!serviceRequest.deposit_stripe_payment_intent) {
      return NextResponse.json(
        { error: 'No payment intent found for refund' },
        { status: 400 },
      );
    }

    // Issue Stripe refund
    const stripe = getStripe();
    await stripe.refunds.create({
      payment_intent: serviceRequest.deposit_stripe_payment_intent,
    });

    // Update service request
    const { data: updated, error: updateError } = await supabase
      .from('service_requests')
      .update({ status: 'refunded' })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[refund] Update error:', updateError);
      return NextResponse.json({ error: 'Refund issued but failed to update status' }, { status: 500 });
    }

    // Audit log
    await supabase.from('audit_log').insert({
      organization_id: serviceRequest.organization_id,
      actor_id: admin.id,
      actor_type: 'admin',
      action: 'service_request.refunded',
      resource_type: 'service_request',
      resource_id: id,
      details: {
        deposit_amount: serviceRequest.deposit_amount,
        stripe_payment_intent: serviceRequest.deposit_stripe_payment_intent,
      },
    });

    return NextResponse.json({ data: updated as ServiceRequestRow });
  } catch (err) {
    console.error('[POST /api/admin/service-requests/[id]/refund]', err);

    if (err instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: 'Stripe Error', message: err.message },
        { status: 502 },
      );
    }

    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
