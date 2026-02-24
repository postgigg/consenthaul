import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type CreditBalanceRow = Database['public']['Tables']['credit_balances']['Row'];

// ---------------------------------------------------------------------------
// GET /api/billing/credits — Get credit balance for the current user's org
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const supabase = createClient();

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

    // 2. Get org id
    const { data: profileData } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const profile = profileData as Pick<ProfileRow, 'organization_id'> | null;

    if (!profile) {
      return NextResponse.json(
        { error: 'Not Found', message: 'User profile not found.' },
        { status: 404 },
      );
    }

    // 3. Fetch credit balance
    const { data: balanceData, error: balanceError } = await supabase
      .from('credit_balances')
      .select('balance, lifetime_purchased, lifetime_used, updated_at')
      .eq('organization_id', profile.organization_id)
      .single();

    const balance = balanceData as Pick<CreditBalanceRow, 'balance' | 'lifetime_purchased' | 'lifetime_used' | 'updated_at'> | null;

    if (balanceError || !balance) {
      // If no row exists the org has never had credits — return zeros
      return NextResponse.json({
        data: {
          balance: 0,
          lifetime_purchased: 0,
          lifetime_used: 0,
          updated_at: null,
        },
      });
    }

    return NextResponse.json({ data: balance });
  } catch (err) {
    console.error('[GET /api/billing/credits]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
