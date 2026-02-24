import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConsentStatusBadge } from '@/components/consent/ConsentStatus';
import { formatDate } from '@/lib/utils';
import { DriverDetailActions } from './actions';
import type { Database } from '@/types/database';

type DriverRow = Database['public']['Tables']['drivers']['Row'];
type ConsentRow = Database['public']['Tables']['consents']['Row'];

export const metadata = {
  title: 'Driver Detail | ConsentHaul',
};

export default async function DriverDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch driver
  const { data: driverData } = await supabase
    .from('drivers')
    .select('*')
    .eq('id', params.id)
    .single();

  const driver = driverData as DriverRow | null;

  if (!driver) notFound();

  // Fetch consents for this driver
  const { data: consentsData } = await supabase
    .from('consents')
    .select('*')
    .eq('driver_id', params.id)
    .order('created_at', { ascending: false });

  const driverConsents = (consentsData ?? []) as ConsentRow[];

  const consentTypeLabel: Record<string, string> = {
    limited_query: 'Limited Query',
    pre_employment: 'Pre-Employment',
    blanket: 'Blanket',
  };

  const infoFields = [
    { label: 'Phone', value: driver.phone ?? '---' },
    { label: 'Email', value: driver.email ?? '---' },
    { label: 'CDL Number', value: driver.cdl_number ?? '---' },
    { label: 'CDL State', value: driver.cdl_state ?? '---' },
    { label: 'Date of Birth', value: formatDate(driver.date_of_birth) },
    { label: 'Hire Date', value: formatDate(driver.hire_date) },
    {
      label: 'Preferred Language',
      value: driver.preferred_language === 'es' ? 'Spanish' : 'English',
    },
    { label: 'Added', value: formatDate(driver.created_at) },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#0c0f14]">
              {driver.first_name} {driver.last_name}
            </h1>
            <Badge variant={driver.is_active ? 'success' : 'secondary'}>
              {driver.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-[#8b919a]">
            Driver profile and consent history.
          </p>
        </div>
        {/* Client component for interactive actions */}
        <DriverDetailActions driver={driver} />
      </div>

      {/* Driver info card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Driver Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            {infoFields.map((field) => (
              <div key={field.label}>
                <dt className="text-xs font-medium text-[#8b919a] uppercase tracking-wider">
                  {field.label}
                </dt>
                <dd className="mt-1 text-sm text-[#0c0f14]">{field.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* Consent history */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base">Consent History</CardTitle>
          <span className="text-sm text-[#8b919a]">
            {driverConsents.length} consent{driverConsents.length !== 1 ? 's' : ''}
          </span>
        </CardHeader>
        <CardContent>
          {driverConsents.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#8b919a]">
              No consent records for this driver yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f0f0ec]">
                    <th className="pb-3 text-left font-medium text-[#8b919a]">Type</th>
                    <th className="pb-3 text-left font-medium text-[#8b919a]">Status</th>
                    <th className="pb-3 text-left font-medium text-[#8b919a] hidden sm:table-cell">
                      Delivery
                    </th>
                    <th className="pb-3 text-left font-medium text-[#8b919a]">Created</th>
                    <th className="pb-3 text-left font-medium text-[#8b919a] hidden md:table-cell">
                      Signed
                    </th>
                    <th className="pb-3 text-right font-medium text-[#8b919a]">
                      {/* Action */}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#fafaf8]">
                  {driverConsents.map((consent) => (
                    <tr key={consent.id}>
                      <td className="py-3 text-[#0c0f14]">
                        {consentTypeLabel[consent.consent_type] ?? consent.consent_type}
                      </td>
                      <td className="py-3">
                        <ConsentStatusBadge status={consent.status} />
                      </td>
                      <td className="py-3 text-[#8b919a] capitalize hidden sm:table-cell">
                        {consent.delivery_method}
                      </td>
                      <td className="py-3 text-[#8b919a]">{formatDate(consent.created_at)}</td>
                      <td className="py-3 text-[#8b919a] hidden md:table-cell">
                        {formatDate(consent.signed_at)}
                      </td>
                      <td className="py-3 text-right">
                        <a
                          href={`/consents/${consent.id}`}
                          className="text-[#C8A75E] hover:text-[#C8A75E] text-xs font-medium"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
