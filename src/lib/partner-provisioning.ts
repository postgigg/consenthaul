import { createAdminClient } from '@/lib/supabase/admin';
import { TMS_PARTNER_PACKS } from '@/lib/stripe/credits';
import { generateApiKey } from '@/lib/tokens';
import { sendPartnerWelcomeEmail } from '@/lib/messaging/email';
import type { Database } from '@/types/database';

type PartnerApplicationRow = Database['public']['Tables']['partner_applications']['Row'];

/**
 * Provision a partner account: create user, org, API keys, credits, migration token, and send welcome email.
 *
 * Called from:
 *  - Stripe webhook (after payment)
 *  - API route (for $0 applications that skip Stripe)
 */
export async function provisionPartner(
  applicationId: string,
  opts?: {
    stripePaymentIntentId?: string;
    stripeCustomerId?: string | null;
    stripeSessionId?: string;
  },
) {
  const supabase = createAdminClient();
  const tag = '[provisionPartner]';

  // Load application
  const { data: appData, error: appError } = await supabase
    .from('partner_applications')
    .select('*')
    .eq('id', applicationId)
    .single();

  if (appError || !appData) {
    console.error(`${tag} Application not found: ${applicationId}`, appError);
    return;
  }

  const application = appData as PartnerApplicationRow;

  // Mark as provisioning
  await supabase
    .from('partner_applications')
    .update({ status: 'provisioning' })
    .eq('id', applicationId);

  const pack = application.selected_pack_id
    ? TMS_PARTNER_PACKS.find((p) => p.id === application.selected_pack_id)
    : null;

  const paymentIntentId = opts?.stripePaymentIntentId ?? `free_${applicationId}`;

  try {
    // 1. Create auth user → handle_new_user() trigger fires (creates org + profile)
    const tempPassword = `Partner_${Date.now()}_${Math.random().toString(36).slice(2)}!`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: application.contact_email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: application.contact_name,
        company_name: application.company_name,
      },
    });

    if (authError || !authData.user) {
      console.error(`${tag} Failed to create partner user:`, authError);
      return;
    }

    const userId = authData.user.id;

    // Fetch the org created by the handle_new_user trigger
    const { data: profileData } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (!profileData) {
      console.error(`${tag} Profile not found after user creation`);
      return;
    }

    const orgId = (profileData as { organization_id: string }).organization_id;

    // 2. Update org: set name, is_partner, stripe_customer_id
    await supabase
      .from('organizations')
      .update({
        name: application.company_name,
        is_partner: true,
        stripe_customer_id: opts?.stripeCustomerId ?? null,
      })
      .eq('id', orgId);

    // 3. Add selected credit pack via RPC
    if (pack) {
      await supabase.rpc('add_credits', {
        p_org_id: orgId,
        p_amount: pack.credits,
        p_stripe_payment_id: paymentIntentId,
        p_description: `TMS Partner ${pack.name} pack (${pack.credits.toLocaleString()} credits)`,
      });
    }

    // 4. Generate sandbox + live API keys
    const sandboxKey = generateApiKey('test');
    const liveKey = generateApiKey('live');

    await supabase.from('api_keys').insert({
      organization_id: orgId,
      name: 'Partner Sandbox Key',
      key_prefix: sandboxKey.prefix,
      key_hash: sandboxKey.hash,
      scopes: ['consents:read', 'consents:write', 'drivers:read', 'drivers:write'],
      is_active: true,
      created_by: userId,
      last_used_at: null,
      expires_at: null,
    });

    await supabase.from('api_keys').insert({
      organization_id: orgId,
      name: 'Partner Live Key',
      key_prefix: liveKey.prefix,
      key_hash: liveKey.hash,
      scopes: ['consents:read', 'consents:write', 'drivers:read', 'drivers:write'],
      is_active: true,
      created_by: userId,
      last_used_at: null,
      expires_at: null,
    });

    // 5. If partner has migration data, auto-generate a transfer token
    if (application.has_migration_data) {
      const crypto = await import('crypto');
      const migrationToken = crypto.randomBytes(16).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      await supabase.from('migration_transfers').insert({
        application_id: applicationId,
        token: migrationToken,
        label: `${application.company_name} migration`,
        uploaded_files: [],
        total_bytes: 0,
        expires_at: expiresAt,
      });

      console.log(`${tag} Migration transfer token created for application ${applicationId}`);
    }

    // 6. Generate magic link so partner can log in
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://consenthaul.com';
    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: application.contact_email,
      options: {
        redirectTo: `${appUrl}/partner`,
      },
    });

    const magicLink = linkData?.properties?.action_link ?? null;

    // 7. Update application → active
    await supabase
      .from('partner_applications')
      .update({
        status: 'active',
        organization_id: orgId,
        provisioned_at: new Date().toISOString(),
        magic_link: magicLink,
      })
      .eq('id', applicationId);

    // 8. Audit log
    await supabase.from('audit_log').insert({
      organization_id: orgId,
      actor_id: null,
      actor_type: 'system',
      action: 'partner.provisioned',
      resource_type: 'partner_application',
      resource_id: applicationId,
      details: {
        company_name: application.company_name,
        pack_id: application.selected_pack_id,
        credits: pack?.credits ?? 0,
        stripe_session_id: opts?.stripeSessionId ?? null,
        stripe_payment_intent: paymentIntentId,
        auto_create_carriers: application.auto_create_carriers,
        has_migration_data: application.has_migration_data,
      },
    });

    // 9. Send partner welcome email
    try {
      await sendPartnerWelcomeEmail({
        to: application.contact_email,
        contactName: application.contact_name,
        companyName: application.company_name,
        packName: pack?.name ?? 'Partner',
        packCredits: pack?.credits ?? application.selected_pack_credits,
        sandboxKeyPrefix: sandboxKey.prefix,
        liveKeyPrefix: liveKey.prefix,
        loginLink: magicLink,
      });
      console.log(`${tag} Partner welcome email sent to ${application.contact_email}`);
    } catch (emailErr) {
      console.error(`${tag} Failed to send partner welcome email:`, emailErr);
    }

    console.log(
      `${tag} Partner ${application.company_name} provisioned: org=${orgId}, ` +
      `credits=${pack?.credits ?? 0}, api_keys=2`,
    );
  } catch (provisionError) {
    console.error(`${tag} Partner provisioning failed:`, provisionError);
    // Leave status as 'provisioning' — admin can manually retry
  }
}
