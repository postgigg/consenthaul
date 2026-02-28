import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { billingLimiter } from '@/lib/rate-limiters';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type InvoiceRow = Database['public']['Tables']['invoices']['Row'];

// ---------------------------------------------------------------------------
// GET /api/billing/invoices/[id] — Get a single invoice by ID (org-scoped)
// ---------------------------------------------------------------------------
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const blocked = await checkRateLimit(request, billingLimiter);
    if (blocked) return blocked;

    const supabase = createClient();
    const { id } = params;

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

    // 3. Fetch the invoice — scoped to the user's organization
    const { data: invoiceData, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .single();

    const invoice = invoiceData as InvoiceRow | null;

    if (error || !invoice) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Invoice not found.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: invoice });
  } catch (err) {
    console.error('[GET /api/billing/invoices/[id]]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
