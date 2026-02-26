import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { escapeSearchParam } from '@/lib/utils';

const ALLOWED_SORT_COLUMNS: ReadonlySet<string> = new Set<string>([
  'created_at', 'updated_at', 'name', 'dot_number', 'mc_number', 'city', 'state',
]);

const ALLOWED_SORT_DIRS: ReadonlySet<string> = new Set(['asc', 'desc']);

export async function GET(request: NextRequest) {
  const admin = await getAdminUserApi();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '0', 10);
  const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') ?? '20', 10), 1), 100);
  const search = searchParams.get('search') ?? '';
  const sortBy = searchParams.get('sortBy') ?? 'created_at';
  const sortDirRaw = searchParams.get('sortDir') ?? 'desc';

  if (!ALLOWED_SORT_COLUMNS.has(sortBy)) {
    return NextResponse.json({ error: `Invalid sort column: ${sortBy}` }, { status: 422 });
  }
  if (!ALLOWED_SORT_DIRS.has(sortDirRaw)) {
    return NextResponse.json({ error: `Invalid sort direction: ${sortDirRaw}` }, { status: 422 });
  }
  const sortDir = sortDirRaw as 'asc' | 'desc';

  const supabase = createAdminClient();

  let query = supabase
    .from('organizations')
    .select('*', { count: 'exact' });

  if (search) {
    const s = escapeSearchParam(search);
    query = query.or(`name.ilike.%${s}%,dot_number.ilike.%${s}%,mc_number.ilike.%${s}%`);
  }

  query = query
    .order(sortBy, { ascending: sortDir === 'asc' })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get member counts and credit balances for each org
  const orgIds = (data ?? []).map((o) => o.id);
  const [{ data: memberCounts }, { data: creditBalances }] = await Promise.all([
    supabase
      .from('profiles')
      .select('organization_id')
      .in('organization_id', orgIds),
    supabase
      .from('credit_balances')
      .select('organization_id, balance')
      .in('organization_id', orgIds),
  ]);

  const memberCountMap: Record<string, number> = {};
  memberCounts?.forEach((m) => {
    memberCountMap[m.organization_id] = (memberCountMap[m.organization_id] ?? 0) + 1;
  });

  const creditMap: Record<string, number> = {};
  creditBalances?.forEach((c) => {
    creditMap[c.organization_id] = c.balance;
  });

  const enrichedData = (data ?? []).map((org) => ({
    ...org,
    member_count: memberCountMap[org.id] ?? 0,
    credit_balance: creditMap[org.id] ?? 0,
  }));

  return NextResponse.json({ data: enrichedData, total: count ?? 0 });
}
