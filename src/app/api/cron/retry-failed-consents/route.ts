import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendConsentSMS } from '@/lib/messaging/sms';
import { sendConsentWhatsApp } from '@/lib/messaging/whatsapp';
import { sendConsentEmail } from '@/lib/messaging/email';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Find failed consents created in last 48 hours with valid tokens
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data: consents } = await supabase
    .from('consents')
    .select('*, driver:drivers(first_name, last_name, phone, email), organization:organizations(name)')
    .eq('status', 'failed')
    .gt('created_at', cutoff)
    .gt('signing_token_expires_at', new Date().toISOString())
    .neq('delivery_method', 'manual')
    .limit(50);

  let retried = 0;
  let failed = 0;

  for (const consent of consents ?? []) {
    const driver = consent.driver as { first_name: string; last_name: string; phone: string | null; email: string | null };
    const org = consent.organization as { name: string };
    const signingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sign/${consent.signing_token}`;
    const driverName = `${driver.first_name} ${driver.last_name}`;

    try {
      if (consent.delivery_method === 'sms') {
        await sendConsentSMS({ to: consent.delivery_address, driverName, signingUrl, companyName: org.name, language: consent.language });
      } else if (consent.delivery_method === 'whatsapp') {
        await sendConsentWhatsApp({ to: consent.delivery_address, driverName, signingUrl, companyName: org.name, language: consent.language });
      } else if (consent.delivery_method === 'email') {
        await sendConsentEmail({ to: consent.delivery_address, driverName, signingUrl, companyName: org.name, language: consent.language });
      }

      await supabase.from('consents').update({ status: 'sent' }).eq('id', consent.id);
      await supabase.from('audit_log').insert({
        organization_id: consent.organization_id,
        actor_id: null,
        actor_type: 'system',
        action: 'consent.auto_retry_sent',
        resource_type: 'consent',
        resource_id: consent.id,
        details: { delivery_method: consent.delivery_method },
      });
      retried++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ data: { retried, failed, total: consents?.length ?? 0 } });
}
