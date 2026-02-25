import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const admin = await getAdminUserApi();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '0', 10);
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10);
  const search = searchParams.get('search') ?? '';
  const sortBy = searchParams.get('sortBy') ?? 'created_at';
  const sortDir = (searchParams.get('sortDir') ?? 'desc') as 'asc' | 'desc';

  const supabase = createAdminClient();

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  query = query
    .order(sortBy, { ascending: sortDir === 'asc' })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get org names for each user
  const orgIds = Array.from(new Set((data ?? []).map((u) => u.organization_id)));
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .in('id', orgIds);

  const orgMap: Record<string, string> = {};
  orgs?.forEach((o) => {
    orgMap[o.id] = o.name;
  });

  const enrichedData = (data ?? []).map((user) => ({
    ...user,
    organization_name: orgMap[user.organization_id] ?? 'Unknown',
  }));

  return NextResponse.json({ data: enrichedData, total: count ?? 0 });
}
