import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConsentStatusBadge } from '@/components/consent/ConsentStatus';
import { ConsentPDFPreview } from '@/components/consent/ConsentPDFPreview';
import { formatDate } from '@/lib/utils';
import { ConsentDetailActions } from './actions';
import type { Database } from '@/types/database';

type ConsentRow = Database['public']['Tables']['consents']['Row'];
type DriverRow = Database['public']['Tables']['drivers']['Row'];
type AuditLogRow = Database['public']['Tables']['audit_log']['Row'];

export const metadata = {
  title: 'Consent Detail | ConsentHaul',
};

export default async function ConsentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch consent
  const { data: consentData } = await supabase
    .from('consents')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!consentData) notFound();

  const consent = consentData as ConsentRow;

  // Fetch driver
  const { data: driverData } = await supabase
    .from('drivers')
    .select('*')
    .eq('id', consent.driver_id)
    .single();

  const driver = driverData as DriverRow | null;

  // Fetch audit trail
  const { data: auditLogs } = await supabase
    .from('audit_log')
    .select('*')
    .eq('resource_type', 'consent')
    .eq('resource_id', params.id)
    .order('created_at', { ascending: true });

  const trail = (auditLogs ?? []) as AuditLogRow[];

  const consentTypeLabel: Record<string, string> = {
    limited_query: 'Limited Query',
    pre_employment: 'Pre-Employment',
    blanket: 'Blanket',
  };

  const deliveryLabel: Record<string, string> = {
    sms: 'SMS',
    whatsapp: 'WhatsApp',
    email: 'Email',
    manual: 'Manual',
  };

  const isSigned = consent.status === 'signed';

  // Build timeline events
  const timeline: { label: string; date: string | null; highlight?: boolean }[] = [
    { label: 'Created', date: consent.created_at },
    { label: 'Sent', date: consent.delivery_sid ? consent.created_at : null },
    { label: 'Delivered', date: consent.delivered_at },
    { label: 'Opened', date: consent.opened_at },
    { label: 'Signed', date: consent.signed_at, highlight: true },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <div>
        <Link
          href="/consents"
          className="inline-flex items-center gap-1 text-sm text-[#8b919a] hover:text-[#3a3f49] transition-colors mb-3"
        >
          &larr; Back to Consents
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#0c0f14]">
              Consent Detail
            </h1>
            <ConsentStatusBadge status={consent.status} className="text-sm" />
          </div>
          <ConsentDetailActions consent={consent} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Consent info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Consent Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-[#8b919a] uppercase tracking-wider">
                    Type
                  </dt>
                  <dd className="mt-1 text-sm text-[#0c0f14]">
                    {consentTypeLabel[consent.consent_type] ?? consent.consent_type}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-[#8b919a] uppercase tracking-wider">
                    Language
                  </dt>
                  <dd className="mt-1 text-sm text-[#0c0f14]">
                    {consent.language === 'es' ? 'Spanish' : 'English'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-[#8b919a] uppercase tracking-wider">
                    Start Date
                  </dt>
                  <dd className="mt-1 text-sm text-[#0c0f14]">
                    {formatDate(consent.consent_start_date)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-[#8b919a] uppercase tracking-wider">
                    End Date
                  </dt>
                  <dd className="mt-1 text-sm text-[#0c0f14]">
                    {consent.consent_end_date
                      ? formatDate(consent.consent_end_date)
                      : 'Duration of Employment'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-[#8b919a] uppercase tracking-wider">
                    Query Frequency
                  </dt>
                  <dd className="mt-1 text-sm text-[#0c0f14] capitalize">
                    {consent.query_frequency ?? '---'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-[#8b919a] uppercase tracking-wider">
                    Delivery Method
                  </dt>
                  <dd className="mt-1 text-sm text-[#0c0f14]">
                    {deliveryLabel[consent.delivery_method] ?? consent.delivery_method}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-[#8b919a] uppercase tracking-wider">
                    Delivery Address
                  </dt>
                  <dd className="mt-1 text-sm text-[#0c0f14] font-mono">
                    {consent.delivery_address}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Driver info */}
          {driver && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-base">Driver</CardTitle>
                <Link
                  href={`/drivers/${driver.id}`}
                  className="text-xs font-medium text-[#C8A75E] hover:text-[#C8A75E]"
                >
                  View Profile
                </Link>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-xs font-medium text-[#8b919a] uppercase tracking-wider">
                      Name
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-[#0c0f14]">
                      {driver.first_name} {driver.last_name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-[#8b919a] uppercase tracking-wider">
                      Phone
                    </dt>
                    <dd className="mt-1 text-sm text-[#0c0f14]">{driver.phone ?? '---'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-[#8b919a] uppercase tracking-wider">
                      CDL
                    </dt>
                    <dd className="mt-1 text-sm text-[#0c0f14] font-mono">
                      {driver.cdl_number ?? '---'} {driver.cdl_state ? `(${driver.cdl_state})` : ''}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-[#8b919a] uppercase tracking-wider">
                      Status
                    </dt>
                    <dd className="mt-1">
                      <Badge variant={driver.is_active ? 'success' : 'secondary'}>
                        {driver.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          )}

          {/* PDF Preview (signed only) */}
          {isSigned && (
            <div>
              <ConsentPDFPreview consentId={consent.id} />
            </div>
          )}

          {/* Signature details (signed only) */}
          {isSigned && consent.signature_hash && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Signature Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium text-[#8b919a] uppercase tracking-wider">
                      Signed At
                    </dt>
                    <dd className="mt-1 text-sm text-[#0c0f14]">
                      {formatDate(consent.signed_at, {
                        hour: 'numeric',
                        minute: 'numeric',
                        second: 'numeric',
                        timeZoneName: 'short',
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-[#8b919a] uppercase tracking-wider">
                      Signer IP
                    </dt>
                    <dd className="mt-1 text-sm text-[#0c0f14] font-mono">
                      {consent.signer_ip ?? '---'}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium text-[#8b919a] uppercase tracking-wider">
                      Signature Hash (SHA-256)
                    </dt>
                    <dd className="mt-1 text-xs text-[#3a3f49] font-mono break-all bg-[#fafaf8] p-3">
                      {consent.signature_hash}
                    </dd>
                  </div>
                  {consent.pdf_hash && (
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-medium text-[#8b919a] uppercase tracking-wider">
                        PDF Hash (SHA-256)
                      </dt>
                      <dd className="mt-1 text-xs text-[#3a3f49] font-mono break-all bg-[#fafaf8] p-3">
                        {consent.pdf_hash}
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: timeline + audit */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative border-l border-[#e8e8e3] ml-3">
                {timeline.map((event) => (
                  <li key={event.label} className="mb-6 ml-6 last:mb-0">
                    <span
                      className={`absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${
                        event.date
                          ? event.highlight
                            ? 'bg-green-500'
                            : 'bg-[#0c0f14]'
                          : 'bg-[#e8e8e3]'
                      }`}
                    />
                    <h3
                      className={`text-sm font-medium ${
                        event.date ? 'text-[#0c0f14]' : 'text-[#b5b5ae]'
                      }`}
                    >
                      {event.label}
                    </h3>
                    {event.date && (
                      <time className="text-xs text-[#8b919a]">
                        {formatDate(event.date, {
                          hour: 'numeric',
                          minute: 'numeric',
                        })}
                      </time>
                    )}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Audit trail */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              {trail.length === 0 ? (
                <p className="text-sm text-[#8b919a]">No audit entries.</p>
              ) : (
                <ul className="space-y-3">
                  {trail.map((entry) => (
                    <li
                      key={entry.id}
                      className="border-b border-[#fafaf8] pb-3 last:border-0 last:pb-0"
                    >
                      <p className="text-sm text-[#0c0f14]">{entry.action}</p>
                      <p className="text-xs text-[#8b919a]">
                        {formatDate(entry.created_at, {
                          hour: 'numeric',
                          minute: 'numeric',
                          second: 'numeric',
                        })}
                        {entry.actor_type !== 'system' && entry.ip_address && (
                          <span className="ml-2 font-mono">{entry.ip_address}</span>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
