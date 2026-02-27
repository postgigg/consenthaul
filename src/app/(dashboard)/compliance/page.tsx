'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HitEscalationBanner, type EscalationRecord } from '@/components/compliance/HitEscalationBanner';
import { BatchConsentModal, type BatchDriver } from '@/components/compliance/BatchConsentModal';
import Link from 'next/link';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Download,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  FileArchive,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';

interface ComplianceRow {
  driver_id: string;
  first_name: string;
  last_name: string;
  cdl_number: string | null;
  cdl_state: string | null;
  phone: string | null;
  email: string | null;
  latest_consent_status: string | null;
  consent_type: string | null;
  consent_end_date: string | null;
  days_until_expiration: number | null;
  last_query_date: string | null;
  days_since_query: number | null;
  last_query_result: string | null;
  consent_gap: boolean;
  query_overdue: boolean;
  overall_compliant: boolean;
  has_any_consent: boolean;
}

interface Summary {
  total: number;
  compliant: number;
  consent_gaps: number;
  query_overdue: number;
  expiring_30d: number;
}

export default function CompliancePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ComplianceRow[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    compliant: 0,
    consent_gaps: 0,
    query_overdue: 0,
    expiring_30d: 0,
  });
  const [downloading, setDownloading] = useState(false);
  const [downloadingAudit, setDownloadingAudit] = useState(false);
  const [escalations, setEscalations] = useState<EscalationRecord[]>([]);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchDrivers, setBatchDrivers] = useState<BatchDriver[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reportRes] = await Promise.all([
        fetch('/api/consents/compliance-report?format=json'),
      ]);
      if (reportRes.ok) {
        const data = await reportRes.json();
        setRows(data.data ?? []);
        setSummary(data.summary ?? { total: 0, compliant: 0, consent_gaps: 0, query_overdue: 0, expiring_30d: 0 });
      }

      // Fetch escalations
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single();
        if (profile) {
          const { data: pendingEscalations } = await supabase
            .from('query_records')
            .select('id, driver_id, escalation_deadline, escalation_status, driver:drivers(first_name, last_name, cdl_number)')
            .eq('organization_id', profile.organization_id)
            .in('escalation_status', ['pending', 'expired'])
            .not('escalation_deadline', 'is', null);

          setEscalations(
            (pendingEscalations ?? []).map((e) => ({
              id: e.id,
              driver_id: e.driver_id,
              escalation_deadline: e.escalation_deadline!,
              escalation_status: e.escalation_status!,
              driver: e.driver as unknown as EscalationRecord['driver'],
            })),
          );
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch('/api/consents/compliance-report');
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const disposition = res.headers.get('Content-Disposition');
        const filename = disposition?.match(/filename="(.+)"/)?.[1] ?? 'compliance-report.csv';
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // silently fail
    } finally {
      setDownloading(false);
    }
  }

  async function handleDownloadAudit() {
    setDownloadingAudit(true);
    try {
      const res = await fetch('/api/consents/audit-package');
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const disposition = res.headers.get('Content-Disposition');
        const filename = disposition?.match(/filename="(.+)"/)?.[1] ?? 'audit-package.zip';
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // silently fail
    } finally {
      setDownloadingAudit(false);
    }
  }

  async function handleResolveEscalation(queryRecordId: string, resolution: 'full_query_completed' | 'driver_removed') {
    await fetch('/api/queries/escalate', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query_record_id: queryRecordId, resolution }),
    });
    fetchData();
  }

  function getRowColor(row: ComplianceRow) {
    if (row.overall_compliant) return '';
    if (
      row.consent_gap ||
      row.query_overdue ||
      (row.days_until_expiration !== null && row.days_until_expiration < 0)
    ) {
      return 'bg-red-50/50';
    }
    if (
      (row.days_until_expiration !== null && row.days_until_expiration <= 30) ||
      (row.days_since_query !== null && row.days_since_query > 330)
    ) {
      return 'bg-amber-50/50';
    }
    return '';
  }

  function getStatusBadge(row: ComplianceRow) {
    if (row.overall_compliant) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle2 className="h-3 w-3" /> Compliant
        </span>
      );
    }
    if (row.consent_gap) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800">
          <ShieldAlert className="h-3 w-3" /> Consent Gap
        </span>
      );
    }
    if (row.query_overdue) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800">
          <Clock className="h-3 w-3" /> Query Overdue
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800">
        <AlertTriangle className="h-3 w-3" /> Attention
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#0c0f14]" />
      </div>
    );
  }

  const stats = [
    { label: 'Total Drivers', value: summary.total, icon: Shield, color: 'text-[#8b919a]' },
    { label: 'Fully Compliant', value: summary.compliant, icon: ShieldCheck, color: 'text-green-600' },
    { label: 'Consent Gaps', value: summary.consent_gaps, icon: ShieldAlert, color: 'text-red-600' },
    { label: 'Query Overdue', value: summary.query_overdue, icon: Search, color: 'text-amber-600' },
    { label: 'Expiring (30d)', value: summary.expiring_30d, icon: Clock, color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Escalation Banner */}
      <HitEscalationBanner
        escalations={escalations}
        onResolve={handleResolveEscalation}
      />

      <div className="flex items-start justify-between">
        <div>
          <div className="w-8 h-0.5 bg-[#C8A75E] mb-4" />
          <h1 className="text-xl font-bold text-[#0c0f14] tracking-tight">
            Compliance Report
          </h1>
          <p className="mt-1 text-sm text-[#8b919a]">
            Audit-ready view of driver consent and query compliance status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleDownloadAudit} disabled={downloadingAudit} variant="outline">
            {downloadingAudit ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <FileArchive className="h-4 w-4 mr-1.5" />
            )}
            Audit Package
          </Button>
          <Button onClick={handleDownload} disabled={downloading} variant="outline">
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Download className="h-4 w-4 mr-1.5" />
            )}
            Download CSV
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <stat.icon className={`h-4 w-4 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold text-[#0c0f14] tabular-nums">
                {stat.value}
              </p>
              <p className="text-xs font-bold text-[#3a3f49] uppercase tracking-wider mt-1">
                {stat.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Consent gap action banner */}
      {summary.consent_gaps > 0 && (
        <div className="flex items-center gap-3 border border-red-200 bg-red-50/60 px-4 py-3">
          <ShieldAlert className="h-4 w-4 text-red-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-[#3a3f49]">
              <strong className="text-red-700">{summary.consent_gaps} driver{summary.consent_gaps !== 1 ? 's' : ''}</strong> {summary.consent_gaps !== 1 ? 'have' : 'has'} consent gaps — no valid signed consent on file.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              const gapDrivers = rows.filter((r) => r.consent_gap);
              setBatchDrivers(
                gapDrivers.map((r) => ({
                  driver_id: r.driver_id,
                  first_name: r.first_name,
                  last_name: r.last_name,
                  cdl_number: r.cdl_number,
                  phone: r.phone,
                  email: r.email,
                })),
              );
              setBatchModalOpen(true);
            }}
            className="shrink-0 uppercase tracking-wider text-xs font-bold"
          >
            Send Consents
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Blanket consent education banner */}
      {(() => {
        const limitedCount = rows.filter((r) => r.consent_type === 'limited_query').length;
        const totalWithConsent = rows.filter((r) => r.consent_type).length;
        if (totalWithConsent > 0 && limitedCount > totalWithConsent * 0.5) {
          return (
            <div className="flex items-center gap-3 border border-[#C8A75E]/30 bg-[#fdfcf8] px-4 py-3">
              <Lightbulb className="h-4 w-4 text-[#C8A75E] shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-[#3a3f49]">
                  <strong>{limitedCount} of {totalWithConsent}</strong> drivers have single-year limited query consent. Per 49 CFR 382.701(b), general consent for limited queries may cover the full duration of employment — no annual re-collection needed.
                </p>
              </div>
              <Link
                href="/consents/new"
                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-[#0c0f14] uppercase tracking-wider hover:text-[#C8A75E] transition-colors"
              >
                Send Multi-Year Consent
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          );
        }
        return null;
      })()}

      {/* Compliance table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Driver Compliance Status</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="py-12 text-center">
              <Shield className="mx-auto h-6 w-6 text-[#d4d4cf]" />
              <p className="mt-3 text-sm text-[#8b919a]">
                No active drivers found. Add drivers to see compliance status.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e8e8e3]">
                    <th className="pb-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="pb-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">
                      CDL #
                    </th>
                    <th className="pb-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">
                      Consent Type
                    </th>
                    <th className="pb-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">
                      Consent Status
                    </th>
                    <th className="pb-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">
                      Consent Expires
                    </th>
                    <th className="pb-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider hidden lg:table-cell">
                      Last Query
                    </th>
                    <th className="pb-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider hidden lg:table-cell">
                      Query Result
                    </th>
                    <th className="pb-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">
                      Overall
                    </th>
                    <th className="pb-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0ec]">
                  {rows.map((row) => (
                    <tr key={row.driver_id} className={`hover:bg-[#fafaf8] ${getRowColor(row)}`}>
                      <td className="py-3 font-medium text-[#0c0f14]">
                        {row.first_name} {row.last_name}
                      </td>
                      <td className="py-3 text-[#6b6f76] font-mono text-xs">
                        {row.cdl_number ?? '—'}
                      </td>
                      <td className="py-3">
                        {row.consent_type ? (
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${
                            row.consent_type === 'blanket'
                              ? 'bg-green-100 text-green-800'
                              : row.consent_type === 'pre_employment'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {row.consent_type === 'blanket' ? 'Blanket' : row.consent_type === 'pre_employment' ? 'Pre-Employment' : 'Limited Query'}
                          </span>
                        ) : (
                          <span className="text-xs text-[#b5b5ae]">—</span>
                        )}
                        {row.consent_type === 'limited_query' && row.days_until_expiration !== null && row.days_until_expiration >= 0 && row.days_until_expiration <= 60 && (
                          <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 text-[0.6rem] font-medium bg-amber-100 text-amber-800">
                            Expiring — renew or switch to multi-year
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        {row.latest_consent_status ? (
                          <span className={`text-xs font-medium ${
                            row.latest_consent_status === 'signed' ? 'text-green-700' :
                            row.latest_consent_status === 'sent' || row.latest_consent_status === 'delivered' || row.latest_consent_status === 'opened' ? 'text-blue-700' :
                            row.latest_consent_status === 'revoked' || row.latest_consent_status === 'expired' ? 'text-red-700' :
                            'text-[#6b6f76]'
                          }`}>
                            {row.latest_consent_status}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 text-[0.65rem] font-medium bg-red-50 text-red-600 border border-red-200">
                            No consent sent
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-[#8b919a]">
                        {row.consent_end_date ?? '—'}
                        {row.days_until_expiration !== null && row.days_until_expiration >= 0 && row.days_until_expiration <= 30 && (
                          <span className="ml-1.5 text-[0.65rem] text-amber-600 font-medium">
                            ({row.days_until_expiration}d)
                          </span>
                        )}
                        {row.days_until_expiration !== null && row.days_until_expiration < 0 && (
                          <span className="ml-1.5 text-[0.65rem] text-red-600 font-medium">
                            (expired)
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-[#8b919a] hidden lg:table-cell">
                        {row.last_query_date ?? 'Never'}
                      </td>
                      <td className="py-3 hidden lg:table-cell">
                        {row.last_query_result ? (
                          <span
                            className={`text-xs font-medium ${
                              row.last_query_result === 'no_violations'
                                ? 'text-green-700'
                                : row.last_query_result === 'violations_found'
                                  ? 'text-red-700'
                                  : 'text-[#8b919a]'
                            }`}
                          >
                            {row.last_query_result.replace(/_/g, ' ')}
                          </span>
                        ) : (
                          <span className="text-xs text-[#b5b5ae]">—</span>
                        )}
                      </td>
                      <td className="py-3">{getStatusBadge(row)}</td>
                      <td className="py-3">
                        {row.consent_gap && !row.has_any_consent ? (
                          <Button
                            size="sm"
                            className="h-auto px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider"
                            onClick={() => {
                              setBatchDrivers([{
                                driver_id: row.driver_id,
                                first_name: row.first_name,
                                last_name: row.last_name,
                                cdl_number: row.cdl_number,
                                phone: row.phone,
                                email: row.email,
                              }]);
                              setBatchModalOpen(true);
                            }}
                          >
                            Send Consent
                          </Button>
                        ) : row.consent_gap && row.has_any_consent ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-auto px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider"
                            onClick={() => {
                              setBatchDrivers([{
                                driver_id: row.driver_id,
                                first_name: row.first_name,
                                last_name: row.last_name,
                                cdl_number: row.cdl_number,
                                phone: row.phone,
                                email: row.email,
                              }]);
                              setBatchModalOpen(true);
                            }}
                          >
                            Resend
                          </Button>
                        ) : row.overall_compliant ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <BatchConsentModal
        open={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        drivers={batchDrivers}
        onComplete={fetchData}
      />
    </div>
  );
}
