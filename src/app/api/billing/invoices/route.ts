import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { billingLimiter } from '@/lib/rate-limiters';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type InvoiceRow = Database['public']['Tables']['invoices']['Row'];

// ---------------------------------------------------------------------------
// GET /api/billing/invoices — List invoices for the authenticated user's org
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const blocked = await checkRateLimit(request, billingLimiter);
    if (blocked) return blocked;

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

    // 2. Get org id from profile
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

    // 3. Parse pagination params
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') ?? '25', 10)));
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    // 4. Fetch invoices with count
    const { data, error, count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact' })
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('[GET /api/billing/invoices] query error:', error);
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to fetch invoices.' },
        { status: 500 },
      );
    }

    const invoices = (data ?? []) as InvoiceRow[];

    return NextResponse.json({
      data: invoices,
      pagination: {
        page,
        per_page: perPage,
        total: count ?? 0,
      },
    });
  } catch (err) {
    console.error('[GET /api/billing/invoices]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
