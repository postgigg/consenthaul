import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MigrationApiPortal } from './MigrationApiPortal';
import type { Database } from '@/types/database';

type OrganizationRow = Database['public']['Tables']['organizations']['Row'];
type MigrationTransferRow = Database['public']['Tables']['migration_transfers']['Row'];

export const metadata = {
  title: 'Migration API | ConsentHaul',
};

export default async function MigrationApiPage() {
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

  // Fetch all migration transfers for this partner
  const { data: allApps } = await supabase
    .from('partner_applications')
    .select('id')
    .eq('organization_id', organization.id);

  type MigrationPick = Pick<
    MigrationTransferRow,
    | 'id'
    | 'token'
    | 'total_bytes'
    | 'carrier_count'
    | 'driver_count'
    | 'uploaded_files'
    | 'parsed_at'
    | 'expires_at'
    | 'created_at'
  >;

  let transfers: MigrationPick[] = [];

  if (allApps && allApps.length > 0) {
    const appIds = allApps.map((a: { id: string }) => a.id);
    const { data: migData } = await supabase
      .from('migration_transfers')
      .select('id, token, total_bytes, carrier_count, driver_count, uploaded_files, parsed_at, expires_at, created_at')
      .in('application_id', appIds)
      .order('created_at', { ascending: false });

    transfers = (migData ?? []) as MigrationPick[];
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#0c0f14]">Migration API</h1>
          <span className="inline-flex items-center px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-widest bg-[#C8A75E]/15 text-[#C8A75E] border border-[#C8A75E]/25">
            Secure
          </span>
        </div>
        <p className="mt-2 text-sm text-[#8b919a]">
          Dedicated API for migrating carrier and driver data into ConsentHaul. All endpoints are authenticated via transfer token.
        </p>
      </div>

      <MigrationApiPortal transfers={transfers} baseUrl={baseUrl} />
    </div>
  );
}
