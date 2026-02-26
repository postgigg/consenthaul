import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { adminLimiter } from '@/lib/rate-limiters';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const blocked = await checkRateLimit(request, adminLimiter);
  if (blocked) return blocked;

  const admin = await getAdminUserApi();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  const [
    { data: org, error: orgErr },
    { data: members },
    { data: creditBalance },
    { data: consents },
    { data: recentTransactions },
  ] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', params.id).single(),
    supabase.from('profiles').select('*').eq('organization_id', params.id).order('created_at'),
    supabase.from('credit_balances').select('*').eq('organization_id', params.id).single(),
    supabase
      .from('consents')
      .select('id, status, consent_type, delivery_method, created_at')
      .eq('organization_id', params.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('credit_transactions')
      .select('*')
      .eq('organization_id', params.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  if (orgErr || !org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  return NextResponse.json({
    organization: org,
    members: members ?? [],
    creditBalance: creditBalance ?? { balance: 0, lifetime_purchased: 0, lifetime_used: 0 },
    consents: consents ?? [],
    recentTransactions: recentTransactions ?? [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const blocked = await checkRateLimit(request, adminLimiter);
  if (blocked) return blocked;

  const admin = await getAdminUserApi();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // Whitelist updatable fields to prevent mass assignment
  const ALLOWED_FIELDS = new Set([
    'name', 'address_line1', 'address_line2', 'city', 'state', 'zip',
    'phone', 'dot_number', 'mc_number',
  ]);
  const sanitized: Record<string, unknown> = {};
  for (const key of Object.keys(body)) {
    if (ALLOWED_FIELDS.has(key)) {
      sanitized[key] = body[key];
    }
  }
  if (Object.keys(sanitized).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 422 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('organizations')
    .update(sanitized)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Audit log
  await supabase.from('audit_log').insert({
    organization_id: params.id,
    actor_id: admin.id,
    actor_type: 'platform_admin',
    action: 'update',
    resource_type: 'organization',
    resource_id: params.id,
    details: sanitized as Record<string, string | number | boolean | null>,
  });

  return NextResponse.json(data);
}
