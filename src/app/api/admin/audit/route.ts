import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { escapeSearchParam } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const admin = await getAdminUserApi();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '0', 10);
  const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') ?? '20', 10), 1), 100);
  const search = searchParams.get('search') ?? '';
  const action = searchParams.get('action') ?? '';
  const resourceType = searchParams.get('resourceType') ?? '';

  const supabase = createAdminClient();

  let query = supabase
    .from('audit_log')
    .select('*', { count: 'exact' });

  if (action) {
    query = query.eq('action', action);
  }
  if (resourceType) {
    query = query.eq('resource_type', resourceType);
  }
  if (search) {
    const s = escapeSearchParam(search);
    query = query.or(`action.ilike.%${s}%,resource_type.ilike.%${s}%,resource_id.ilike.%${s}%`);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('[GET /api/admin/audit]', error.message);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  // Get actor names
  const actorIds = Array.from(new Set((data ?? []).filter((d) => d.actor_id).map((d) => d.actor_id!)));
  const { data: actors } = actorIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, email').in('id', actorIds)
    : { data: [] };

  const actorMap: Record<string, { name: string; email: string }> = {};
  actors?.forEach((a) => {
    actorMap[a.id] = { name: a.full_name, email: a.email };
  });

  // Get org names
  const orgIds = Array.from(new Set((data ?? []).map((d) => d.organization_id)));
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .in('id', orgIds);

  const orgMap: Record<string, string> = {};
  orgs?.forEach((o) => {
    orgMap[o.id] = o.name;
  });

  const enrichedData = (data ?? []).map((entry) => ({
    ...entry,
    actor_name: entry.actor_id ? actorMap[entry.actor_id]?.name ?? 'Unknown' : 'System',
    actor_email: entry.actor_id ? actorMap[entry.actor_id]?.email ?? '' : '',
    organization_name: orgMap[entry.organization_id] ?? 'Unknown',
  }));

  return NextResponse.json({ data: enrichedData, total: count ?? 0 });
}
