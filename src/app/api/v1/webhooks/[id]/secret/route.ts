import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateApiKey } from '@/lib/api-auth';
import { generateWebhookSecret } from '@/lib/webhooks';
import { webhookManagementLimiter } from '@/lib/rate-limiters';
import { getClientIp } from '@/lib/rate-limit';

// ---------------------------------------------------------------------------
// POST /api/v1/webhooks/[id]/secret — Rotate webhook secret
// ---------------------------------------------------------------------------
export async function POST(
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

    const newSecret = generateWebhookSecret();

    const { error: updateError } = await supabase
      .from('webhook_endpoints')
      .update({ secret: newSecret })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to rotate secret.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: { secret: newSecret },
    });
  } catch (err) {
    console.error('[POST /api/v1/webhooks/[id]/secret]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
