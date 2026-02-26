import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateApiKey } from '@/lib/api-auth';
import { updateWebhookEndpointSchema } from '@/lib/validators';
import { webhookManagementLimiter } from '@/lib/rate-limiters';
import { getClientIp } from '@/lib/rate-limit';
import type { Database } from '@/types/database';

type WebhookEndpointRow = Database['public']['Tables']['webhook_endpoints']['Row'];

// ---------------------------------------------------------------------------
// GET /api/v1/webhooks/[id] — Get a single webhook endpoint (secret masked)
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

    const { data: endpoint, error } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('id', id)
      .eq('organization_id', auth.orgId)
      .single();

    if (error || !endpoint) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Webhook endpoint not found.' },
        { status: 404 },
      );
    }

    const row = endpoint as WebhookEndpointRow;

    return NextResponse.json({
      data: {
        id: row.id,
        organization_id: row.organization_id,
        url: row.url,
        description: row.description,
        events: row.events,
        is_active: row.is_active,
        secret: `${row.secret.slice(0, 10)}${'*'.repeat(20)}`,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
    });
  } catch (err) {
    console.error('[GET /api/v1/webhooks/[id]]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/webhooks/[id] — Update webhook endpoint
// ---------------------------------------------------------------------------
export async function PATCH(
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

    if (!auth.scopes.includes('webhooks:write') && !auth.scopes.includes('*')) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'API key does not have webhooks:write scope.' },
        { status: 403 },
      );
    }

    const supabase = createAdminClient();
    const { id } = params;

    // Verify ownership
    const { data: existing, error: findError } = await supabase
      .from('webhook_endpoints')
      .select('id')
      .eq('id', id)
      .eq('organization_id', auth.orgId)
      .single();

    if (findError || !existing) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Webhook endpoint not found.' },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = updateWebhookEndpointSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid update data.',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }

    const update: Record<string, unknown> = {};
    if (parsed.data.url !== undefined) update.url = parsed.data.url;
    if (parsed.data.events !== undefined) update.events = parsed.data.events;
    if (parsed.data.description !== undefined) update.description = parsed.data.description;
    if (parsed.data.is_active !== undefined) update.is_active = parsed.data.is_active;

    const { data: updated, error: updateError } = await supabase
      .from('webhook_endpoints')
      .update(update)
      .eq('id', id)
      .select('id, organization_id, url, description, events, is_active, created_at, updated_at')
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to update webhook endpoint.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error('[PATCH /api/v1/webhooks/[id]]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/webhooks/[id] — Delete a webhook endpoint
// ---------------------------------------------------------------------------
export async function DELETE(
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

    if (!auth.scopes.includes('webhooks:write') && !auth.scopes.includes('*')) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'API key does not have webhooks:write scope.' },
        { status: 403 },
      );
    }

    const supabase = createAdminClient();
    const { id } = params;

    const { error: deleteError } = await supabase
      .from('webhook_endpoints')
      .delete()
      .eq('id', id)
      .eq('organization_id', auth.orgId);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to delete webhook endpoint.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: { deleted: true } });
  } catch (err) {
    console.error('[DELETE /api/v1/webhooks/[id]]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
