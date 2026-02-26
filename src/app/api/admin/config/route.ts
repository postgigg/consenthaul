import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { encrypt } from '@/lib/encryption';
import { clearConfigCache } from '@/lib/config';

// Config keys grouped by category
const CONFIG_KEYS: Record<string, { key: string; label: string; description: string }[]> = {
  stripe: [
    { key: 'STRIPE_SECRET_KEY', label: 'Secret Key', description: 'Stripe API secret key' },
    { key: 'STRIPE_WEBHOOK_SECRET', label: 'Webhook Secret', description: 'Stripe webhook signing secret' },
    { key: 'STRIPE_PRICE_STARTER', label: 'Starter Price ID', description: 'Stripe price ID for starter plan' },
    { key: 'STRIPE_PRICE_STANDARD', label: 'Standard Price ID', description: 'Stripe price ID for standard plan' },
    { key: 'STRIPE_PRICE_BULK', label: 'Bulk Price ID', description: 'Stripe price ID for bulk plan' },
    { key: 'STRIPE_PRICE_ENTERPRISE', label: 'Enterprise Price ID', description: 'Stripe price ID for enterprise plan' },
  ],
  twilio: [
    { key: 'TWILIO_ACCOUNT_SID', label: 'Account SID', description: 'Twilio account SID' },
    { key: 'TWILIO_AUTH_TOKEN', label: 'Auth Token', description: 'Twilio auth token' },
    { key: 'TWILIO_PHONE_NUMBER', label: 'Phone Number', description: 'Twilio phone number for SMS' },
    { key: 'TWILIO_WHATSAPP_NUMBER', label: 'WhatsApp Number', description: 'Twilio WhatsApp sender number' },
    { key: 'TWILIO_WA_TEMPLATE_EN', label: 'WA Template (EN)', description: 'WhatsApp template SID (English)' },
    { key: 'TWILIO_WA_TEMPLATE_ES', label: 'WA Template (ES)', description: 'WhatsApp template SID (Spanish)' },
  ],
  resend: [
    { key: 'RESEND_API_KEY', label: 'API Key', description: 'Resend email API key' },
  ],
  supabase: [
    { key: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Project URL', description: 'Supabase project URL' },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', label: 'Anon Key', description: 'Supabase anonymous/public key' },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Service Role Key', description: 'Supabase service role key (bypasses RLS)' },
  ],
  app: [
    { key: 'NEXT_PUBLIC_APP_URL', label: 'App URL', description: 'Public URL of the application' },
    { key: 'SENTRY_DSN', label: 'Sentry DSN', description: 'Sentry error tracking DSN' },
  ],
};

function maskValue(val: string): string {
  if (val.length <= 8) return '****';
  return val.slice(0, 4) + '****' + val.slice(-4);
}

export async function GET() {
  const admin = await getAdminUserApi();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Fetch all config values from DB
  const { data: configs } = await supabase
    .from('platform_config')
    .select('key, encrypted_value, description, updated_at');

  const dbConfigMap: Record<string, { encrypted_value: string; updated_at: string }> = {};
  configs?.forEach((c) => {
    dbConfigMap[c.key] = { encrypted_value: c.encrypted_value, updated_at: c.updated_at };
  });

  // Build response: masked values showing whether value is from DB or env
  const result: Record<string, Array<{
    key: string;
    label: string;
    description: string;
    maskedValue: string | null;
    source: 'db' | 'env' | 'none';
    updatedAt: string | null;
  }>> = {};

  for (const [category, keys] of Object.entries(CONFIG_KEYS)) {
    result[category] = keys.map((k) => {
      const dbVal = dbConfigMap[k.key];
      const envVal = process.env[k.key];

      let maskedValue: string | null = null;
      let source: 'db' | 'env' | 'none' = 'none';

      if (dbVal) {
        // We can't mask the encrypted value directly, just show it's configured
        maskedValue = '(encrypted in database)';
        source = 'db';
      } else if (envVal) {
        maskedValue = maskValue(envVal);
        source = 'env';
      }

      return {
        key: k.key,
        label: k.label,
        description: k.description,
        maskedValue,
        source,
        updatedAt: dbVal?.updated_at ?? null,
      };
    });
  }

  return NextResponse.json({ config: result, categories: Object.keys(CONFIG_KEYS) });
}

export async function PUT(request: NextRequest) {
  const admin = await getAdminUserApi();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { key, value } = body;

  if (!key || !value) {
    return NextResponse.json({ error: 'Key and value are required' }, { status: 422 });
  }

  // Validate the key is one we allow
  const allKeys = Object.values(CONFIG_KEYS).flat().map((k) => k.key);
  if (!allKeys.includes(key)) {
    return NextResponse.json({ error: 'Invalid config key' }, { status: 422 });
  }

  // Validate value format per key prefix
  const VALUE_VALIDATORS: Record<string, (v: string) => string | null> = {
    STRIPE_SECRET_KEY: (v) => v.startsWith('sk_') ? null : 'Stripe secret keys must start with sk_',
    STRIPE_WEBHOOK_SECRET: (v) => v.startsWith('whsec_') ? null : 'Stripe webhook secrets must start with whsec_',
    STRIPE_PRICE_: (v) => v.startsWith('price_') ? null : 'Stripe price IDs must start with price_',
    TWILIO_ACCOUNT_SID: (v) => v.startsWith('AC') ? null : 'Twilio Account SID must start with AC',
    TWILIO_PHONE_NUMBER: (v) => /^\+\d{7,15}$/.test(v) ? null : 'Phone number must be E.164 format (e.g. +1234567890)',
    TWILIO_WHATSAPP_NUMBER: (v) => /^\+\d{7,15}$/.test(v) ? null : 'Phone number must be E.164 format (e.g. +1234567890)',
    NEXT_PUBLIC_SUPABASE_URL: (v) => /^https:\/\/.+\.supabase\.co$/.test(v) ? null : 'Must be a valid Supabase URL',
    NEXT_PUBLIC_APP_URL: (v) => /^https?:\/\/.+/.test(v) ? null : 'Must be a valid URL',
    RESEND_API_KEY: (v) => v.startsWith('re_') ? null : 'Resend API keys must start with re_',
  };

  // Check exact match first, then prefix match
  const validator = VALUE_VALIDATORS[key] ?? Object.entries(VALUE_VALIDATORS).find(
    ([prefix]) => key.startsWith(prefix)
  )?.[1];

  if (validator) {
    const validationError = validator(value);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 422 });
    }
  }

  const encrypted = encrypt(value);
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('platform_config')
    .upsert({
      key,
      encrypted_value: encrypted,
      updated_at: new Date().toISOString(),
      updated_by: admin.id,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Clear cache for this key
  clearConfigCache(key);

  // Audit log
  await supabase.from('audit_log').insert({
    organization_id: admin.organization_id,
    actor_id: admin.id,
    actor_type: 'platform_admin',
    action: 'update_config',
    resource_type: 'platform_config',
    resource_id: key,
    details: { key, note: 'Value encrypted' },
  });

  return NextResponse.json({ success: true });
}
