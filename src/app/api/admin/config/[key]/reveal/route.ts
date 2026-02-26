import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { decrypt } from '@/lib/encryption';
import { generalLimiter } from '@/lib/rate-limiters';
import { getClientIp } from '@/lib/rate-limit';

export async function POST(
  _request: NextRequest,
  { params }: { params: { key: string } }
) {
  // Rate limit secret reveals
  const ip = getClientIp(_request);
  const rl = generalLimiter.check(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too Many Requests', message: 'Rate limit exceeded. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  const admin = await getAdminUserApi();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Whitelist check — only allow revealing known config keys
  const ALLOWED_CONFIG_KEYS = new Set([
    'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PRICE_STARTER',
    'STRIPE_PRICE_STANDARD', 'STRIPE_PRICE_BULK', 'STRIPE_PRICE_ENTERPRISE',
    'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER',
    'TWILIO_WHATSAPP_NUMBER', 'TWILIO_WA_TEMPLATE_EN', 'TWILIO_WA_TEMPLATE_ES',
    'RESEND_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_APP_URL', 'SENTRY_DSN',
  ]);

  if (!ALLOWED_CONFIG_KEYS.has(params.key)) {
    return NextResponse.json({ error: 'Invalid config key' }, { status: 422 });
  }

  const { data, error } = await supabase
    .from('platform_config')
    .select('encrypted_value')
    .eq('key', params.key)
    .single();

  if (error || !data) {
    // Fall back to env var (key is already validated against whitelist)
    const envVal = process.env[params.key];
    if (envVal) {
      return NextResponse.json({ value: envVal });
    }
    return NextResponse.json({ error: 'Config key not found' }, { status: 404 });
  }

  try {
    const value = decrypt(data.encrypted_value);

    // Audit the reveal
    await supabase.from('audit_log').insert({
      organization_id: admin.organization_id,
      actor_id: admin.id,
      actor_type: 'platform_admin',
      action: 'reveal_config',
      resource_type: 'platform_config',
      resource_id: params.key,
      details: { key: params.key },
    });

    return NextResponse.json({ value });
  } catch {
    return NextResponse.json({ error: 'Failed to decrypt value' }, { status: 500 });
  }
}
