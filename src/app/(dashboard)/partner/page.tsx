import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CreditBalance } from '@/components/billing/CreditBalance';
import { PurchaseHistory } from '@/components/billing/PurchaseHistory';
import { PartnerApiKeys } from '@/components/partner/PartnerApiKeys';
import { PartnerMigrationStatus } from '@/components/partner/PartnerMigrationStatus';
import { PartnerWebhookEndpoints } from '@/components/partner/PartnerWebhookEndpoints';
import type { Database } from '@/types/database';

type OrganizationRow = Database['public']['Tables']['organizations']['Row'];
type PartnerApplicationRow = Database['public']['Tables']['partner_applications']['Row'];
type MigrationTransferRow = Database['public']['Tables']['migration_transfers']['Row'];

export const metadata = {
  title: 'TMS Partner | ConsentHaul',
};

export default async function PartnerDashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profileData } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!profileData) redirect('/login');

  const { data: orgData } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', profileData.organization_id)
    .single();

  const organization = orgData as OrganizationRow | null;

  if (!organization || !organization.is_partner) {
    redirect('/dashboard');
  }

  // Fetch partner application for pack name
  const { data: appData } = await supabase
    .from('partner_applications')
    .select('id, selected_pack_id, selected_pack_credits, provisioned_at, created_at')
    .eq('organization_id', organization.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const partnerApp = appData as Pick<
    PartnerApplicationRow,
    'id' | 'selected_pack_id' | 'selected_pack_credits' | 'provisioned_at' | 'created_at'
  > | null;

  // Derive pack name from ID
  const packNames: Record<string, string> = {
    tms_starter: 'Starter',
    tms_growth: 'Growth',
    tms_scale: 'Scale',
    tms_enterprise: 'Enterprise',
  };
  const packName = partnerApp?.selected_pack_id
    ? packNames[partnerApp.selected_pack_id] ?? null
    : null;

  const memberSince = partnerApp?.provisioned_at ?? partnerApp?.created_at ?? organization.created_at;

  // Fetch API keys
  const { data: apiKeys } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, is_active, last_used_at, created_at')
    .eq('organization_id', organization.id)
    .order('created_at', { ascending: false });

  // Fetch migration transfer (if any)
  type MigrationPick = Pick<
    MigrationTransferRow,
    'id' | 'total_bytes' | 'carrier_count' | 'driver_count' | 'uploaded_files' | 'parsed_at' | 'created_at'
  >;

  let migration: MigrationPick | null = null;

  // Look up by the partner application, or fall back to any application for this org
  const { data: allApps } = await supabase
    .from('partner_applications')
    .select('id')
    .eq('organization_id', organization.id);

  if (allApps && allApps.length > 0) {
    const appIds = allApps.map((a: { id: string }) => a.id);
    const { data: migData } = await supabase
      .from('migration_transfers')
      .select('id, total_bytes, carrier_count, driver_count, uploaded_files, parsed_at, created_at')
      .in('application_id', appIds)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    migration = migData as MigrationPick | null;
  }

  // Fetch webhook endpoints
  const { data: webhookEndpoints } = await supabase
    .from('webhook_endpoints')
    .select('id, url, description, events, is_active, created_at, updated_at')
    .eq('organization_id', organization.id)
    .order('created_at', { ascending: false });

  const memberDate = new Date(memberSince).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div className="space-y-8">
      {/* Org Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#0c0f14]">{organization.name}</h1>
            <span className="inline-flex items-center px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-widest bg-[#C8A75E]/15 text-[#C8A75E] border border-[#C8A75E]/25">
              TMS Partner
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-[#8b919a]">
            <span>Member since {memberDate}</span>
            {packName && (
              <>
                <span className="text-[#e8e8e3]">&middot;</span>
                <span>{packName} Pack</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Credit Overview */}
      <section>
        <h2 className="text-sm font-bold text-[#8b919a] uppercase tracking-wider mb-4">
          Credit Overview
        </h2>
        <CreditBalance />
      </section>

      {/* Transaction History */}
      <section>
        <h2 className="text-sm font-bold text-[#8b919a] uppercase tracking-wider mb-4">
          Transaction History
        </h2>
        <PurchaseHistory />
      </section>

      {/* API Keys */}
      <section>
        <h2 className="text-sm font-bold text-[#8b919a] uppercase tracking-wider mb-4">
          API Keys
        </h2>
        <PartnerApiKeys
          apiKeys={
            (apiKeys ?? []).map((k) => ({
              id: k.id,
              name: k.name,
              key_prefix: k.key_prefix,
              is_active: k.is_active,
              last_used_at: k.last_used_at,
              created_at: k.created_at,
            }))
          }
        />
      </section>

      {/* Webhook Endpoints */}
      <section>
        <h2 className="text-sm font-bold text-[#8b919a] uppercase tracking-wider mb-4">
          Webhook Endpoints
        </h2>
        <PartnerWebhookEndpoints
          endpoints={
            (webhookEndpoints ?? []).map((ep) => ({
              id: ep.id,
              url: ep.url,
              description: ep.description,
              events: ep.events,
              is_active: ep.is_active,
              created_at: ep.created_at,
              updated_at: ep.updated_at,
            }))
          }
        />
      </section>

      {/* Migration Status */}
      {migration && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#8b919a] uppercase tracking-wider">
              Migration Status
            </h2>
            <Link
              href="/partner/migration"
              className="text-xs font-medium text-[#C8A75E] hover:text-[#b8974e] transition-colors"
            >
              Migration API Docs &rarr;
            </Link>
          </div>
          <PartnerMigrationStatus
            totalBytes={migration.total_bytes}
            carrierCount={migration.carrier_count}
            driverCount={migration.driver_count}
            uploadedFiles={migration.uploaded_files as Array<{ name: string; size_bytes: number }>}
            parsedAt={migration.parsed_at}
          />
        </section>
      )}
    </div>
  );
}
