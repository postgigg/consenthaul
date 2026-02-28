import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { billingLimiter } from '@/lib/rate-limiters';
import { z } from 'zod';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type CreditTransactionRow = Database['public']['Tables']['credit_transactions']['Row'];

const refundSchema = z.object({
  transaction_id: z.string().uuid(),
  amount: z.number().int().positive().optional(), // partial refund amount; defaults to full
  reason: z.string().min(1).max(500),
});

// ---------------------------------------------------------------------------
// POST /api/billing/refund — Initiate a credit purchase refund
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const blocked = await checkRateLimit(request, billingLimiter);
    if (blocked) return blocked;

    const supabase = createClient();
    const admin = createAdminClient();

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

    // 2. Get profile + role — only owner/admin may request refunds
    const { data: profileData } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    const profile = profileData as Pick<ProfileRow, 'organization_id' | 'role'> | null;

    if (!profile || !['owner', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only organization owners and admins can request refunds.' },
        { status: 403 },
      );
    }

    // 3. Validate request body
    const body = await request.json();
    const parsed = refundSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation Error', details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const { transaction_id, amount, reason } = parsed.data;

    // 4. Find the original purchase transaction — must belong to the user's org
    const { data: txData, error: txError } = await admin
      .from('credit_transactions')
      .select('*')
      .eq('id', transaction_id)
      .eq('organization_id', profile.organization_id)
      .eq('type', 'purchase')
      .single();

    const tx = txData as CreditTransactionRow | null;

    if (txError || !tx) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Purchase transaction not found.' },
        { status: 404 },
      );
    }

    const refundAmount = amount ?? tx.amount;

    // 5. Validate refund amount does not exceed the original purchase
    if (refundAmount > tx.amount) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: `Refund amount (${refundAmount}) exceeds original purchase amount (${tx.amount}).`,
        },
        { status: 422 },
      );
    }

    // 6. Process refund via RPC
    const { data: newBalance, error: rpcError } = await admin.rpc('refund_credits', {
      p_org_id: profile.organization_id,
      p_amount: refundAmount,
      p_reason: reason,
      p_reference_id: transaction_id,
      p_user_id: user.id,
    });

    if (rpcError) {
      console.error('[POST /api/billing/refund] refund_credits RPC error:', rpcError);
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to process refund.' },
        { status: 500 },
      );
    }

    // 7. Audit log
    await admin.from('audit_log').insert({
      organization_id: profile.organization_id,
      actor_id: user.id,
      actor_type: 'user',
      action: 'credits.refunded',
      resource_type: 'credit_transaction',
      resource_id: transaction_id,
      details: {
        amount: refundAmount,
        reason,
        new_balance: newBalance,
        original_transaction_id: transaction_id,
      },
    });

    return NextResponse.json({
      data: {
        refunded: refundAmount,
        new_balance: newBalance,
      },
    });
  } catch (err) {
    console.error('[POST /api/billing/refund]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
