import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { deliverWebhook } from '@/lib/webhooks';
import type { Database } from '@/types/database';

type WebhookEventRow = Database['public']['Tables']['webhook_events']['Row'];
type WebhookEndpointRow = Database['public']['Tables']['webhook_endpoints']['Row'];

const MAX_PER_RUN = 20;

// ---------------------------------------------------------------------------
// GET /api/cron/webhook-retry — Process failed webhook deliveries
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[Cron webhook-retry] CRON_SECRET not configured');
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // Find events due for retry
    const { data: events, error } = await supabase
      .from('webhook_events')
      .select('*')
      .in('status', ['pending', 'failed'])
      .lte('next_retry_at', new Date().toISOString())
      .order('next_retry_at', { ascending: true })
      .limit(MAX_PER_RUN);

    if (error || !events || events.length === 0) {
      return NextResponse.json({
        ok: true,
        processed: 0,
        timestamp: new Date().toISOString(),
      });
    }

    const typedEvents = events as WebhookEventRow[];

    // Fetch all relevant endpoint data in one query
    const endpointIds = Array.from(new Set(typedEvents.map((e) => e.endpoint_id)));
    const { data: endpointsData } = await supabase
      .from('webhook_endpoints')
      .select('id, url, secret, is_active')
      .in('id', endpointIds);

    const endpointMap = new Map<string, Pick<WebhookEndpointRow, 'id' | 'url' | 'secret' | 'is_active'>>();
    if (endpointsData) {
      for (const ep of endpointsData as Pick<WebhookEndpointRow, 'id' | 'url' | 'secret' | 'is_active'>[]) {
        endpointMap.set(ep.id, ep);
      }
    }

    let processed = 0;
    let skipped = 0;

    for (const event of typedEvents) {
      const endpoint = endpointMap.get(event.endpoint_id);

      // Skip if endpoint was deactivated or deleted
      if (!endpoint || !endpoint.is_active) {
        await supabase
          .from('webhook_events')
          .update({
            status: 'exhausted',
            error_message: 'Endpoint deactivated',
            next_retry_at: null,
          })
          .eq('id', event.id);
        skipped++;
        continue;
      }

      const payload = event.payload as Record<string, unknown>;
      await deliverWebhook(event.id, endpoint.url, endpoint.secret, payload);
      processed++;
    }

    return NextResponse.json({
      ok: true,
      processed,
      skipped,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Cron webhook-retry]', err);
    return NextResponse.json(
      { error: 'Retry processing failed' },
      { status: 500 },
    );
  }
}
