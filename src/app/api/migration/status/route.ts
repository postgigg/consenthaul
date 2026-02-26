import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { billingLimiter } from '@/lib/rate-limiters';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type OrganizationRow = Database['public']['Tables']['organizations']['Row'];

// ---------------------------------------------------------------------------
// GET /api/migration/status — Get migration status for current org
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

    // 2. Get profile + org
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

    const orgId = profile.organization_id;

    // 3. Check if org is a partner
    const { data: orgData } = await supabase
      .from('organizations')
      .select('is_partner')
      .eq('id', orgId)
      .single();

    const org = orgData as Pick<OrganizationRow, 'is_partner'> | null;

    // 4. Get active migration transfer for this org
    const { data: transferData } = await supabase
      .from('migration_transfers')
      .select('id, token, label, uploaded_files, total_bytes, carrier_count, driver_count, parsed_at, expires_at, created_at')
      .eq('organization_id', orgId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      data: {
        active_transfer: transferData ?? null,
        is_partner: org?.is_partner ?? false,
      },
    });
  } catch (err) {
    console.error('[GET /api/migration/status]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
