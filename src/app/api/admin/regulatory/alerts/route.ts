import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import type { RegulatoryAlertStatus } from '@/types/database';

const VALID_STATUSES: RegulatoryAlertStatus[] = ['new', 'reviewing', 'action_required', 'resolved', 'dismissed'];

export async function GET(request: NextRequest) {
  const admin = await getAdminUserApi();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const minRelevance = parseInt(searchParams.get('min_relevance') ?? '0', 10);

  const supabase = createAdminClient();

  let query = supabase
    .from('regulatory_alerts')
    .select('*, regulatory_sources(name)')
    .gte('relevance_score', minRelevance)
    .order('created_at', { ascending: false })
    .limit(100);

  if (status && status !== 'all' && VALID_STATUSES.includes(status as RegulatoryAlertStatus)) {
    query = query.eq('status', status as RegulatoryAlertStatus);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
