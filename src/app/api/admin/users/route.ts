import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { escapeSearchParam } from '@/lib/utils';
import { checkRateLimit } from '@/lib/rate-limit';
import { adminLimiter } from '@/lib/rate-limiters';

const ALLOWED_SORT_COLUMNS: ReadonlySet<string> = new Set([
  'created_at', 'updated_at', 'full_name', 'email', 'role', 'is_active',
]);

const ALLOWED_SORT_DIRS: ReadonlySet<string> = new Set(['asc', 'desc']);

export async function GET(request: NextRequest) {
  const blocked = await checkRateLimit(request, adminLimiter);
  if (blocked) return blocked;

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
    .from('profiles')
    .select('*', { count: 'exact' });

  if (search) {
    const s = escapeSearchParam(search);
    query = query.or(`full_name.ilike.%${s}%,email.ilike.%${s}%`);
  }

  query = query
    .order(sortBy, { ascending: sortDir === 'asc' })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('[GET /api/admin/users]', error.message);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
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
