// supabase/functions/send-reminders/index.ts
//
// Deno Edge Function (cron: daily).
// Finds consents expiring within 30 days that have not yet been reminded.
// Creates notification records for each. Respects the org's auto_remind setting.
//
// Intended to be triggered by a cron schedule via supabase config:
//   schedule: "0 9 * * *"  (daily at 09:00 UTC)
//
// Can also be invoked manually:
//   POST /functions/v1/send-reminders {}
// ---------------------------------------------------------------------------

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** How many days before expiry to send a reminder */
const REMINDER_WINDOW_DAYS = 30;

/** Notification type used to track reminders and prevent duplicates */
const REMINDER_NOTIFICATION_TYPE = 'consent_expiry_reminder';

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const now = new Date();
    const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const windowEndIso = windowEnd.toISOString();

    // 1. Find signed consents that:
    //    - Have a consent_end_date within the reminder window
    //    - Are not already revoked or expired
    //    - Have not been reminded yet (no notification of this type exists)
    const { data: expiringConsents, error: queryError } = await supabase
      .from('consents')
      .select(`
        id,
        organization_id,
        driver_id,
        consent_end_date,
        delivery_method,
        delivery_address,
        language,
        driver:drivers(first_name, last_name, phone, email),
        organization:organizations(name, settings)
      `)
      .eq('status', 'signed')
      .not('consent_end_date', 'is', null)
      .lte('consent_end_date', windowEndIso.slice(0, 10))
      .gte('consent_end_date', now.toISOString().slice(0, 10));

    if (queryError) {
      console.error('[send-reminders] query error:', queryError);
      return new Response(
        JSON.stringify({ error: 'Failed to query expiring consents', details: queryError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!expiringConsents || expiringConsents.length === 0) {
      return new Response(
        JSON.stringify({ success: true, reminders_created: 0, message: 'No consents expiring within window.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 2. Get consent IDs that already have a reminder notification
    const consentIds = expiringConsents.map((c) => c.id);

    const { data: existingReminders } = await supabase
      .from('notifications')
      .select('consent_id')
      .in('consent_id', consentIds)
      .eq('type', REMINDER_NOTIFICATION_TYPE);

    const alreadyRemindedIds = new Set(
      (existingReminders ?? []).map((n) => n.consent_id),
    );

    // 3. Filter out already-reminded and orgs that have auto_remind disabled
    const toRemind = expiringConsents.filter((consent) => {
      // Skip if already reminded
      if (alreadyRemindedIds.has(consent.id)) return false;

      // Check org auto_remind setting
      const org = consent.organization as { name: string; settings: Record<string, unknown> } | null;
      if (org?.settings) {
        const settings = org.settings as Record<string, unknown>;
        // If auto_remind is explicitly set to false, skip
        if (settings.auto_remind === false) return false;
      }

      return true;
    });

    if (toRemind.length === 0) {
      return new Response(
        JSON.stringify({ success: true, reminders_created: 0, message: 'All expiring consents already reminded or auto-remind disabled.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 4. Build notification records
    const notifications = toRemind.map((consent) => {
      const driver = consent.driver as { first_name: string; last_name: string; phone: string | null; email: string | null } | null;
      const org = consent.organization as { name: string } | null;
      const driverName = driver ? `${driver.first_name} ${driver.last_name}` : 'Driver';

      // Determine the recipient based on original delivery method
      let recipient = consent.delivery_address;
      if (!recipient) {
        if (consent.delivery_method === 'email') {
          recipient = driver?.email ?? '';
        } else {
          recipient = driver?.phone ?? '';
        }
      }

      const isSpanish = consent.language === 'es';
      const daysUntilExpiry = Math.ceil(
        (new Date(consent.consent_end_date!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      const messageBody = isSpanish
        ? `Hola ${driverName}, su consentimiento del FMCSA Clearinghouse con ${org?.name ?? 'su empleador'} vencera en ${daysUntilExpiry} dias. Comuniquese con su empleador para renovar.`
        : `Hi ${driverName}, your FMCSA Clearinghouse consent with ${org?.name ?? 'your employer'} expires in ${daysUntilExpiry} days. Please contact your employer to renew.`;

      return {
        organization_id: consent.organization_id,
        consent_id: consent.id,
        type: REMINDER_NOTIFICATION_TYPE,
        channel: consent.delivery_method,
        recipient,
        message_body: messageBody,
        status: 'queued' as const,
        attempts: 0,
        max_attempts: 3,
      };
    });

    // 5. Insert notification records in batch
    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (insertError) {
      console.error('[send-reminders] insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create reminder notifications', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 6. Log summary to audit trail
    // Group by org for a cleaner audit trail
    const orgCounts = new Map<string, number>();
    for (const n of notifications) {
      orgCounts.set(n.organization_id, (orgCounts.get(n.organization_id) ?? 0) + 1);
    }

    const auditEntries = Array.from(orgCounts.entries()).map(([orgId, count]) => ({
      organization_id: orgId,
      actor_id: null,
      actor_type: 'system',
      action: 'consent.reminder_batch',
      resource_type: 'notification',
      resource_id: orgId,
      details: { reminders_created: count, window_days: REMINDER_WINDOW_DAYS },
    }));

    await supabase.from('audit_log').insert(auditEntries);

    return new Response(
      JSON.stringify({
        success: true,
        reminders_created: notifications.length,
        consents_checked: expiringConsents.length,
        already_reminded: alreadyRemindedIds.size,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[send-reminders] unhandled error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
