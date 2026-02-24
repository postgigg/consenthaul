// supabase/functions/cleanup-expired/index.ts
//
// Deno Edge Function (cron: hourly).
// Marks expired signing tokens by updating consents whose
// signing_token_expires_at is in the past to status 'expired'.
//
// Only transitions consents in pre-sign states (pending, sent, delivered, opened).
// Already signed, revoked, failed, or expired consents are left untouched.
//
// Intended schedule: "0 * * * *" (every hour at :00)
//
// Can also be invoked manually:
//   POST /functions/v1/cleanup-expired {}
// ---------------------------------------------------------------------------

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Statuses that can transition to 'expired'
const EXPIRABLE_STATUSES = ['pending', 'sent', 'delivered', 'opened'];

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();

    // 1. Find consents with expired signing tokens that are still in an
    //    active pre-sign state.
    const { data: expiredConsents, error: queryError } = await supabase
      .from('consents')
      .select('id, organization_id, status, signing_token_expires_at')
      .in('status', EXPIRABLE_STATUSES)
      .not('signing_token_expires_at', 'is', null)
      .lt('signing_token_expires_at', now);

    if (queryError) {
      console.error('[cleanup-expired] query error:', queryError);
      return new Response(
        JSON.stringify({ error: 'Failed to query expired consents', details: queryError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!expiredConsents || expiredConsents.length === 0) {
      return new Response(
        JSON.stringify({ success: true, expired_count: 0, message: 'No expired consents found.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 2. Update all expired consents to status 'expired' in a batch.
    //    Supabase JS does not support batch update with an IN clause on id,
    //    so we update each status group.
    const expiredIds = expiredConsents.map((c) => c.id);

    // Batch update — process in chunks to avoid payload size limits
    const BATCH_SIZE = 200;
    let totalUpdated = 0;

    for (let i = 0; i < expiredIds.length; i += BATCH_SIZE) {
      const batch = expiredIds.slice(i, i + BATCH_SIZE);

      const { error: updateError, count } = await supabase
        .from('consents')
        .update({ status: 'expired' })
        .in('id', batch);

      if (updateError) {
        console.error('[cleanup-expired] update error for batch:', updateError);
        // Continue with remaining batches
      } else {
        totalUpdated += count ?? batch.length;
      }
    }

    // 3. Insert audit log entries (grouped by org)
    const orgCounts = new Map<string, number>();
    for (const consent of expiredConsents) {
      orgCounts.set(
        consent.organization_id,
        (orgCounts.get(consent.organization_id) ?? 0) + 1,
      );
    }

    const auditEntries = Array.from(orgCounts.entries()).map(([orgId, count]) => ({
      organization_id: orgId,
      actor_id: null,
      actor_type: 'system',
      action: 'consent.expired_batch',
      resource_type: 'consent',
      resource_id: orgId,
      details: {
        expired_count: count,
        consent_ids: expiredConsents
          .filter((c) => c.organization_id === orgId)
          .map((c) => c.id),
      },
    }));

    if (auditEntries.length > 0) {
      const { error: auditError } = await supabase
        .from('audit_log')
        .insert(auditEntries);

      if (auditError) {
        // Audit log failure is non-fatal
        console.error('[cleanup-expired] audit log error:', auditError);
      }
    }

    // 4. Nullify the signing tokens for expired consents to prevent any
    //    future use, even if the status check is somehow bypassed.
    for (let i = 0; i < expiredIds.length; i += BATCH_SIZE) {
      const batch = expiredIds.slice(i, i + BATCH_SIZE);

      await supabase
        .from('consents')
        .update({ signing_token: null })
        .in('id', batch);
    }

    return new Response(
      JSON.stringify({
        success: true,
        expired_count: totalUpdated,
        consents_checked: expiredConsents.length,
        organizations_affected: orgCounts.size,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[cleanup-expired] unhandled error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
