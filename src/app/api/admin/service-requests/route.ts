import { NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

// ---------------------------------------------------------------------------
// GET /api/admin/service-requests — List all service requests (admin only)
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const admin = await getAdminUserApi();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Fetch service requests
    const { data: requests, error: reqError } = await supabase
      .from('service_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (reqError) {
      console.error('[GET /api/admin/service-requests]', reqError);
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }

    // Enrich with profile and org data
    const enriched = await Promise.all(
      (requests ?? []).map(async (req) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', req.requested_by)
          .single();

        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', req.organization_id)
          .single();

        return {
          ...req,
          profiles: profile ?? { full_name: 'Unknown', email: '' },
          organizations: org ?? { name: 'Unknown' },
        };
      })
    );

    return NextResponse.json({ data: enriched });
  } catch (err) {
    console.error('[GET /api/admin/service-requests]', err);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
