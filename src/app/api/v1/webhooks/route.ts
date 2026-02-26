import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateApiKey } from '@/lib/api-auth';
import { createWebhookEndpointSchema } from '@/lib/validators';
import { generateWebhookSecret } from '@/lib/webhooks';
import { webhookManagementLimiter } from '@/lib/rate-limiters';
import { getClientIp } from '@/lib/rate-limit';
import type { Database } from '@/types/database';

type WebhookEndpointRow = Database['public']['Tables']['webhook_endpoints']['Row'];

// ---------------------------------------------------------------------------
// GET /api/v1/webhooks — List webhook endpoints
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
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

    const { data: endpoints, error } = await supabase
      .from('webhook_endpoints')
      .select('id, organization_id, url, description, events, is_active, created_at, updated_at')
      .eq('organization_id', auth.orgId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to fetch webhook endpoints.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: endpoints ?? [] });
  } catch (err) {
    console.error('[GET /api/v1/webhooks]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/webhooks — Create a webhook endpoint (returns secret once)
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
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

    if (!auth.scopes.includes('webhooks:write') && !auth.scopes.includes('*')) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'API key does not have webhooks:write scope.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = createWebhookEndpointSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid webhook endpoint data.',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }

    const { url, events, description } = parsed.data;
    const secret = generateWebhookSecret();

    const supabase = createAdminClient();

    const { data: endpoint, error: insertError } = await supabase
      .from('webhook_endpoints')
      .insert({
        organization_id: auth.orgId,
        url,
        description: description ?? null,
        secret,
        events,
        is_active: true,
        created_by: auth.keyId,
      })
      .select()
      .single();

    if (insertError || !endpoint) {
      console.error('[POST /api/v1/webhooks] insert error:', insertError);
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to create webhook endpoint.' },
        { status: 500 },
      );
    }

    const row = endpoint as WebhookEndpointRow;

    // Return with secret (shown only once)
    return NextResponse.json(
      {
        data: {
          id: row.id,
          organization_id: row.organization_id,
          url: row.url,
          description: row.description,
          events: row.events,
          is_active: row.is_active,
          secret,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('[POST /api/v1/webhooks]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
