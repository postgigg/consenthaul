import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConsentStatusBadge } from '@/components/consent/ConsentStatus';
import { formatDate } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Database } from '@/types/database';

type DriverRow = Database['public']['Tables']['drivers']['Row'];
type ConsentRow = Database['public']['Tables']['consents']['Row'];

interface AuditLogEntry {
  id: number;
  action: string;
  actor_type: string;
  actor_id: string | null;
  resource_type: string;
  resource_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

interface TimelineEvent {
  id: string;
  type: 'consent' | 'audit';
  date: string;
  title: string;
  description: string;
  status?: string;
  consent?: ConsentRow;
  auditEntry?: AuditLogEntry;
}

export const metadata = {
  title: 'Driver Timeline | ConsentHaul',
};

export default async function DriverTimelinePage({
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

  const consents = (consentsData ?? []) as ConsentRow[];

  // Fetch audit log entries for this driver
  const { data: auditData } = await supabase
    .from('audit_log')
    .select('*')
    .eq('resource_type', 'driver')
    .eq('resource_id', params.id)
    .order('created_at', { ascending: false })
    .limit(100);

  // Also fetch audit entries for all consent resources belonging to this driver
  const consentIds = consents.map((c) => c.id);
  let consentAuditData: AuditLogEntry[] = [];
  if (consentIds.length > 0) {
    const { data } = await supabase
      .from('audit_log')
      .select('*')
      .eq('resource_type', 'consent')
      .in('resource_id', consentIds)
      .order('created_at', { ascending: false })
      .limit(200);
    consentAuditData = (data ?? []) as AuditLogEntry[];
  }

  const allAuditEntries = [
    ...((auditData ?? []) as AuditLogEntry[]),
    ...consentAuditData,
  ];

  const consentTypeLabel: Record<string, string> = {
    limited_query: 'Limited Query',
    pre_employment: 'Pre-Employment',
    blanket: 'Blanket',
  };

  // Build timeline events
  const events: TimelineEvent[] = [];

  // Add consent creation events
  for (const consent of consents) {
    events.push({
      id: `consent-created-${consent.id}`,
      type: 'consent',
      date: consent.created_at,
      title: `Consent Request Created`,
      description: `${consentTypeLabel[consent.consent_type] ?? consent.consent_type} consent via ${consent.delivery_method}`,
      status: consent.status,
      consent,
    });

    if (consent.signed_at) {
      events.push({
        id: `consent-signed-${consent.id}`,
        type: 'consent',
        date: consent.signed_at,
        title: 'Consent Signed',
        description: `${consentTypeLabel[consent.consent_type] ?? consent.consent_type} consent was signed by the driver`,
        status: 'signed',
        consent,
      });
    }
  }

  // Add audit log events
  for (const entry of allAuditEntries) {
    const actionLabel = entry.action
      .replace(/\./g, ' ')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    events.push({
      id: `audit-${entry.id}`,
      type: 'audit',
      date: entry.created_at,
      title: actionLabel,
      description: entry.details
        ? Object.entries(entry.details)
            .map(([k, v]) => `${k}: ${String(v)}`)
            .join(', ')
        : `${entry.resource_type} ${entry.resource_id.slice(0, 8)}...`,
      auditEntry: entry,
    });
  }

  // Sort by date descending
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  function getEventColor(event: TimelineEvent): string {
    if (event.type === 'consent') {
      switch (event.status) {
        case 'signed':
          return 'bg-emerald-500';
        case 'expired':
        case 'revoked':
        case 'failed':
          return 'bg-red-400';
        case 'pending':
        case 'sent':
        case 'delivered':
        case 'opened':
          return 'bg-amber-400';
        default:
          return 'bg-[#d4d4cf]';
      }
    }
    return 'bg-[#8b919a]';
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href={`/drivers/${params.id}`}>
            <ChevronLeft className="h-4 w-4" />
            Back to Driver
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#0c0f14]">
            {driver.first_name} {driver.last_name}
          </h1>
          <Badge variant={driver.is_active ? 'success' : 'secondary'}>
            {driver.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-[#8b919a]">
          Consent and activity timeline
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[#0c0f14]">{consents.length}</p>
            <p className="text-xs text-[#8b919a] mt-1">Total Consents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {consents.filter((c) => c.status === 'signed').length}
            </p>
            <p className="text-xs text-[#8b919a] mt-1">Signed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">
              {consents.filter((c) => ['pending', 'sent', 'delivered', 'opened'].includes(c.status)).length}
            </p>
            <p className="text-xs text-[#8b919a] mt-1">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-500">
              {consents.filter((c) => ['expired', 'revoked', 'failed'].includes(c.status)).length}
            </p>
            <p className="text-xs text-[#8b919a] mt-1">Expired / Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#8b919a]">
              No activity recorded for this driver yet.
            </p>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-[#e8e8e3]" />

              <div className="space-y-6">
                {events.map((event) => (
                  <div key={event.id} className="relative flex gap-4 pl-10">
                    {/* Dot */}
                    <div
                      className={`absolute left-2.5 top-1.5 h-3 w-3 rounded-full ring-2 ring-white ${getEventColor(event)}`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-[#0c0f14]">
                            {event.title}
                          </p>
                          {event.type === 'consent' && event.status && (
                            <ConsentStatusBadge status={event.status as ConsentRow['status']} />
                          )}
                          {event.type === 'audit' && (
                            <Badge variant="outline" className="text-xs">
                              Audit
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-[#8b919a] shrink-0">
                          {formatDate(event.date, {
                            hour: 'numeric',
                            minute: 'numeric',
                          })}
                        </p>
                      </div>
                      <p className="text-sm text-[#8b919a] mt-0.5 truncate">
                        {event.description}
                      </p>
                      {event.consent && (
                        <Link
                          href={`/consents/${event.consent.id}`}
                          className="text-xs text-[#C8A75E] hover:underline mt-1 inline-block"
                        >
                          View Consent
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
