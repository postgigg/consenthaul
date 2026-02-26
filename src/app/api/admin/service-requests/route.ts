import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { adminLimiter } from '@/lib/rate-limiters';

// ---------------------------------------------------------------------------
// GET /api/admin/service-requests — List all service requests (admin only)
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const blocked = await checkRateLimit(request, adminLimiter);
    if (blocked) return blocked;

    const admin = await getAdminUserApi();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Fetch service requests with joined profile + org data (single query)
    const { data: requests, error: reqError } = await supabase
      .from('service_requests')
      .select('*, profiles:requested_by(full_name, email), organizations(name)')
      .order('created_at', { ascending: false });

    if (reqError) {
      console.error('[GET /api/admin/service-requests]', reqError);
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }

    return NextResponse.json({ data: requests ?? [] });
  } catch (err) {
    console.error('[GET /api/admin/service-requests]', err);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
