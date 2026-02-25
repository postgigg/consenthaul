import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConsentStatusBadge } from '@/components/consent/ConsentStatus';
import { formatDate } from '@/lib/utils';
import {
  Users,
  UserCheck,
  FileSignature,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Coins,
  ArrowRight,
  CalendarClock,
} from 'lucide-react';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ConsentRow = Database['public']['Tables']['consents']['Row'];
type DriverRow = Database['public']['Tables']['drivers']['Row'];
type CreditBalanceRow = Database['public']['Tables']['credit_balances']['Row'];

interface RecentConsent extends ConsentRow {
  driver: Pick<DriverRow, 'id' | 'first_name' | 'last_name'>;
}

export const metadata = {
  title: 'Dashboard | ConsentHaul',
};

export default async function DashboardPage() {
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

  const profile = profileData as Pick<ProfileRow, 'organization_id'> | null;

  if (!profile) redirect('/login');

  const orgId = profile.organization_id;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const thirtyDaysFromNowISO = thirtyDaysFromNow.toISOString().slice(0, 10);

  const [
    driversResult,
    activeDriversResult,
    totalConsentsResult,
    pendingConsentsResult,
    signedConsentsResult,
    expiredConsentsResult,
    creditBalanceResult,
    recentConsentsResult,
    expiringConsentsResult,
  ] = await Promise.all([
    supabase
      .from('drivers')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    supabase
      .from('drivers')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('is_active', true),
    supabase
      .from('consents')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('created_at', thirtyDaysAgoISO),
    supabase
      .from('consents')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .in('status', ['pending', 'sent', 'delivered', 'opened'])
      .gte('created_at', thirtyDaysAgoISO),
    supabase
      .from('consents')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'signed')
      .gte('created_at', thirtyDaysAgoISO),
    supabase
      .from('consents')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .in('status', ['expired', 'revoked', 'failed'])
      .gte('created_at', thirtyDaysAgoISO),
    supabase
      .from('credit_balances')
      .select('balance')
      .eq('organization_id', orgId)
      .single(),
    supabase
      .from('consents')
      .select('*, driver:drivers(id, first_name, last_name)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('consents')
      .select('*, driver:drivers(id, first_name, last_name)')
      .eq('organization_id', orgId)
      .eq('status', 'signed')
      .gte('consent_end_date', today)
      .lte('consent_end_date', thirtyDaysFromNowISO)
      .order('consent_end_date', { ascending: true }),
  ]);

  const totalDrivers = driversResult.count ?? 0;
  const activeDrivers = activeDriversResult.count ?? 0;
  const totalConsents = totalConsentsResult.count ?? 0;
  const pendingConsents = pendingConsentsResult.count ?? 0;
  const signedConsents = signedConsentsResult.count ?? 0;
  const expiredConsents = expiredConsentsResult.count ?? 0;
  const creditBalanceData = creditBalanceResult.data as CreditBalanceRow | null;
  const creditBalance = creditBalanceData?.balance ?? 0;
  const recentConsents = (recentConsentsResult.data ?? []) as unknown as RecentConsent[];
  const expiringConsents = (expiringConsentsResult.data ?? []) as unknown as RecentConsent[];

  const consentTypeLabel: Record<string, string> = {
    limited_query: 'Limited Query',
    pre_employment: 'Pre-Employment',
    blanket: 'Blanket',
  };

  const stats = [
    {
      label: 'Total Drivers',
      value: totalDrivers,
      sublabel: `${activeDrivers} active`,
      icon: Users,
      href: '/drivers',
    },
    {
      label: 'Consents (30d)',
      value: totalConsents,
      sublabel: `${signedConsents} signed`,
      icon: FileSignature,
      href: '/consents',
    },
    {
      label: 'Pending',
      value: pendingConsents,
      sublabel: `${expiredConsents} expired/failed`,
      icon: Clock,
      href: '/consents',
    },
    {
      label: 'Credit Balance',
      value: creditBalance,
      sublabel: 'credits available',
      icon: Coins,
      href: '/billing',
      isGold: true,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <div className="w-8 h-0.5 bg-[#C8A75E] mb-4" />
        <h1 className="text-xl font-bold text-[#0c0f14] tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-[#8b919a]">
          Your consent management activity at a glance.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-all hover:border-[#d4d4cf] hover:shadow-sm group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <stat.icon className={`h-4 w-4 ${(stat as { isGold?: boolean }).isGold ? 'text-[#C8A75E]' : 'text-[#8b919a]'}`} />
                  <ArrowRight className="h-3 w-3 text-[#d4d4cf] group-hover:text-[#8b919a] transition-colors" />
                </div>
                <p className="text-3xl font-bold text-[#0c0f14] tabular-nums">
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-xs font-bold text-[#3a3f49] uppercase tracking-wider mt-1">{stat.label}</p>
                <p className="text-[0.7rem] text-[#b5b5ae] mt-0.5">{stat.sublabel}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Low credit warning */}
      {creditBalance < 5 && (
        <div className="flex items-center gap-3 border border-amber-200 bg-amber-50/50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">
              Low credit balance
            </p>
            <p className="text-xs text-amber-700">
              {creditBalance} credit{creditBalance !== 1 ? 's' : ''} remaining.
              Purchase more to continue sending consent requests.
            </p>
          </div>
          <Link
            href="/billing#purchase"
            className="shrink-0 bg-[#0c0f14] px-4 py-2 text-xs font-bold text-white hover:bg-[#1a1e27] transition-colors"
          >
            BUY CREDITS
          </Link>
        </div>
      )}

      {/* Compliance Forecast */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-[#8b919a]" />
            <CardTitle>Compliance Forecast</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {expiringConsents.length === 0 ? (
            <div className="flex items-center gap-3 border border-green-200 bg-green-50/50 px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              <p className="text-sm text-green-800">
                All systems operational. No consents expiring in the next 30 days.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border border-amber-200 bg-amber-50/50 px-4 py-3 mb-4">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800">
                  {expiringConsents.length} consent{expiringConsents.length !== 1 ? 's' : ''} expiring in the next 30 days.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e8e8e3]">
                      <th className="pb-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Driver</th>
                      <th className="pb-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Type</th>
                      <th className="pb-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Expires</th>
                      <th className="pb-3 text-right">
                        {/* Action column */}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0ec]">
                    {expiringConsents.map((consent) => (
                      <tr key={consent.id} className="group hover:bg-[#fafaf8]">
                        <td className="py-3 font-medium text-[#0c0f14]">
                          {consent.driver?.first_name} {consent.driver?.last_name}
                        </td>
                        <td className="py-3 text-[#6b6f76]">
                          {consentTypeLabel[consent.consent_type] ?? consent.consent_type}
                        </td>
                        <td className="py-3 text-[#8b919a]">
                          {formatDate(consent.consent_end_date)}
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            href={`/consents/${consent.id}`}
                            className="text-[#0c0f14] hover:text-[#C8A75E] text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent consents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Recent Consents</CardTitle>
          <Link
            href="/consents"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0c0f14] uppercase tracking-wider hover:text-[#C8A75E] transition-colors"
          >
            View All
            <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentConsents.length === 0 ? (
            <div className="py-12 text-center">
              <FileSignature className="mx-auto h-6 w-6 text-[#d4d4cf]" />
              <p className="mt-3 text-sm text-[#8b919a]">
                No consents yet. Send your first consent request to get started.
              </p>
              <Link
                href="/consents/new"
                className="mt-4 inline-block bg-[#0c0f14] px-5 py-2.5 text-xs font-bold text-white uppercase tracking-wider hover:bg-[#1a1e27] transition-colors"
              >
                New Consent
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e8e8e3]">
                    <th className="pb-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Driver</th>
                    <th className="pb-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Type</th>
                    <th className="pb-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Status</th>
                    <th className="pb-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider hidden sm:table-cell">
                      Date
                    </th>
                    <th className="pb-3 text-right">
                      {/* Action column */}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0ec]">
                  {recentConsents.map((consent) => (
                    <tr key={consent.id} className="group hover:bg-[#fafaf8]">
                      <td className="py-3 font-medium text-[#0c0f14]">
                        {consent.driver?.first_name} {consent.driver?.last_name}
                      </td>
                      <td className="py-3 text-[#6b6f76]">
                        {consentTypeLabel[consent.consent_type] ?? consent.consent_type}
                      </td>
                      <td className="py-3">
                        <ConsentStatusBadge status={consent.status} />
                      </td>
                      <td className="py-3 text-[#8b919a] hidden sm:table-cell">
                        {formatDate(consent.created_at)}
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/consents/${consent.id}`}
                          className="text-[#0c0f14] hover:text-[#C8A75E] text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href="/consents/new">
          <Card className="transition-all hover:border-[#d4d4cf] hover:shadow-sm cursor-pointer group">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center bg-[#0c0f14]">
                <FileSignature className="h-4 w-4 text-[#C8A75E]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0c0f14]">New Consent</p>
                <p className="text-xs text-[#8b919a]">Send a consent request</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/drivers">
          <Card className="transition-all hover:border-[#d4d4cf] hover:shadow-sm cursor-pointer group">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center bg-[#0c0f14]">
                <UserCheck className="h-4 w-4 text-[#C8A75E]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0c0f14]">Add Driver</p>
                <p className="text-xs text-[#8b919a]">Register a new driver</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/drivers/import">
          <Card className="transition-all hover:border-[#d4d4cf] hover:shadow-sm cursor-pointer group">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center bg-[#0c0f14]">
                <CheckCircle2 className="h-4 w-4 text-[#C8A75E]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0c0f14]">Import Drivers</p>
                <p className="text-xs text-[#8b919a]">Bulk import via CSV</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
