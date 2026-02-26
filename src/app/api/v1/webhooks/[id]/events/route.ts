import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateApiKey } from '@/lib/api-auth';
import { paginationSchema } from '@/lib/validators';
import { webhookManagementLimiter } from '@/lib/rate-limiters';
import { getClientIp } from '@/lib/rate-limit';

// ---------------------------------------------------------------------------
// GET /api/v1/webhooks/[id]/events — List delivery events (paginated)
// ---------------------------------------------------------------------------
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const ip = getClientIp(request);
    const rl = webhookManagementLimiter.check(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too Many Requests', message: 'Rate limit exceeded. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
      );
    }

    const auth = await authenticateApiKey(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or missing API key.' },
        { status: 401 },
      );
    }

    if (!auth.scopes.includes('webhooks:read') && !auth.scopes.includes('*')) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'API key does not have webhooks:read scope.' },
        { status: 403 },
      );
    }

    const supabase = createAdminClient();
    const { id } = params;

    // Verify endpoint ownership
    const { data: endpoint, error: findError } = await supabase
      .from('webhook_endpoints')
      .select('id')
      .eq('id', id)
      .eq('organization_id', auth.orgId)
      .single();

    if (findError || !endpoint) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Webhook endpoint not found.' },
        { status: 404 },
      );
    }

    // Parse pagination
    const { searchParams } = request.nextUrl;
    const pagination = paginationSchema.safeParse({
      page: searchParams.get('page'),
      per_page: searchParams.get('per_page'),
    });

    if (!pagination.success) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Invalid pagination parameters.' },
        { status: 422 },
      );
    }

    const { page, per_page } = pagination.data;
    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    // Optional filters
    const status = searchParams.get('status');
    const eventType = searchParams.get('event_type');

    let query = supabase
      .from('webhook_events')
      .select('*', { count: 'exact' })
      .eq('endpoint_id', id)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status as 'pending' | 'delivering' | 'delivered' | 'failed' | 'exhausted');
    if (eventType) query = query.eq('event_type', eventType);

    query = query.range(from, to);

    const { data: events, error: listError, count } = await query;

    if (listError) {
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to fetch webhook events.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: events ?? [],
      pagination: {
        page,
        per_page,
        total: count ?? 0,
        total_pages: count ? Math.ceil(count / per_page) : 0,
      },
    });
  } catch (err) {
    console.error('[GET /api/v1/webhooks/[id]/events]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
