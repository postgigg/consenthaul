import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ConsentStatus, ConsentType } from '@/types/database';

export async function GET(request: NextRequest) {
  const admin = await getAdminUserApi();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '0', 10);
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10);
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const consentType = searchParams.get('consentType') ?? '';
  const orgId = searchParams.get('orgId') ?? '';
  const sortBy = searchParams.get('sortBy') ?? 'created_at';
  const sortDir = (searchParams.get('sortDir') ?? 'desc') as 'asc' | 'desc';

  const supabase = createAdminClient();

  let query = supabase
    .from('consents')
    .select('*', { count: 'exact' });

  if (status) {
    query = query.eq('status', status as ConsentStatus);
  }
  if (consentType) {
    query = query.eq('consent_type', consentType as ConsentType);
  }
  if (orgId) {
    query = query.eq('organization_id', orgId);
  }
  if (search) {
    query = query.or(`delivery_address.ilike.%${search}%,id.ilike.%${search}%`);
  }

  query = query
    .order(sortBy, { ascending: sortDir === 'asc' })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get org names
  const orgIds = Array.from(new Set((data ?? []).map((c) => c.organization_id)));
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .in('id', orgIds);

  const orgMap: Record<string, string> = {};
  orgs?.forEach((o) => {
    orgMap[o.id] = o.name;
  });

  // Get driver names
  const driverIds = Array.from(new Set((data ?? []).map((c) => c.driver_id)));
  const { data: drivers } = await supabase
    .from('drivers')
    .select('id, first_name, last_name')
    .in('id', driverIds);

  const driverMap: Record<string, string> = {};
  drivers?.forEach((d) => {
    driverMap[d.id] = `${d.first_name} ${d.last_name}`;
  });

  const enrichedData = (data ?? []).map((consent) => ({
    ...consent,
    organization_name: orgMap[consent.organization_id] ?? 'Unknown',
    driver_name: driverMap[consent.driver_id] ?? 'Unknown',
  }));

  return NextResponse.json({ data: enrichedData, total: count ?? 0 });
}
