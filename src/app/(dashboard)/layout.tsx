import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type OrganizationRow = Database['public']['Tables']['organizations']['Row'];
type CreditBalanceRow = Database['public']['Tables']['credit_balances']['Row'];

export interface DashboardContext {
  profile: ProfileRow;
  organization: OrganizationRow;
  creditBalance: number;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  // Get the current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch the user's profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const profile = profileData as ProfileRow | null;

  if (!profile) {
    redirect('/login');
  }

  // Fetch the user's organization
  const { data: organizationData } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', profile.organization_id)
    .single();

  const organization = organizationData as OrganizationRow | null;

  if (!organization) {
    redirect('/login');
  }

  // Fetch credit balance
  const { data: creditBalanceData } = await supabase
    .from('credit_balances')
    .select('*')
    .eq('organization_id', organization.id)
    .single();

  const creditBalanceRow = creditBalanceData as CreditBalanceRow | null;
  const creditBalance = creditBalanceRow?.balance ?? 0;

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafaf8]">
      {/* Sidebar */}
      <Sidebar
        profile={profile}
        organization={organization}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          profile={profile}
          organization={organization}
          creditBalance={creditBalance}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
