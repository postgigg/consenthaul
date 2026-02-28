'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Pause,
  XCircle,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

interface ExpiringConsent {
  id: string;
  driver_id: string;
  consent_type: string;
  consent_end_date: string | null;
  status: string;
  driver: {
    id: string;
    first_name: string;
    last_name: string;
  };
  days_until_expiration: number;
}

interface CampaignStats {
  total_sent: number;
  pending: number;
  completed: number;
}

interface BatchReconsentResult {
  ok: boolean;
  sent: number;
  skipped: number;
  errors: number;
}

type CampaignStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

const consentTypeLabel: Record<string, string> = {
  limited_query: 'Limited Query',
  pre_employment: 'Pre-Employment',
  blanket: 'Blanket',
};

export default function ReconsentCampaignPage() {
  const [expiringConsents, setExpiringConsents] = useState<ExpiringConsent[]>([]);
  const [stats, setStats] = useState<CampaignStats>({
    total_sent: 0,
    pending: 0,
    completed: 0,
  });
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatus>('idle');
  const [lastResult, setLastResult] = useState<BatchReconsentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch compliance report data as JSON to get expiring consents
      const res = await fetch('/api/consents/compliance-report?format=json');
      if (!res.ok) throw new Error('Failed to fetch compliance data');

      const json = await res.json();
      const rows = json.data ?? [];

      // Filter to consents expiring within 30 days
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const expiring: ExpiringConsent[] = rows
        .filter(
          (r: {
            consent_end_date: string | null;
            days_until_expiration: number | null;
            latest_consent_status: string | null;
          }) =>
            r.days_until_expiration !== null &&
            r.days_until_expiration >= 0 &&
            r.days_until_expiration <= 30,
        )
        .map(
          (r: {
            driver_id: string;
            first_name: string;
            last_name: string;
            consent_end_date: string | null;
            consent_type: string | null;
            latest_consent_status: string | null;
            days_until_expiration: number | null;
          }) => ({
            id: r.driver_id,
            driver_id: r.driver_id,
            consent_type: r.consent_type ?? 'limited_query',
            consent_end_date: r.consent_end_date,
            status: r.latest_consent_status ?? 'unknown',
            driver: {
              id: r.driver_id,
              first_name: r.first_name,
              last_name: r.last_name,
            },
            days_until_expiration: r.days_until_expiration ?? 0,
          }),
        )
        .sort(
          (a: ExpiringConsent, b: ExpiringConsent) =>
            a.days_until_expiration - b.days_until_expiration,
        );

      setExpiringConsents(expiring);

      // Compute campaign stats from the full data set
      const allRows = rows as {
        latest_consent_status: string | null;
        has_any_consent: boolean;
      }[];
      const totalSent = allRows.filter(
        (r) =>
          r.latest_consent_status === 'sent' ||
          r.latest_consent_status === 'delivered' ||
          r.latest_consent_status === 'opened',
      ).length;
      const pending = allRows.filter(
        (r) => r.latest_consent_status === 'pending',
      ).length;
      const completed = allRows.filter(
        (r) => r.latest_consent_status === 'signed',
      ).length;

      setStats({ total_sent: totalSent, pending, completed });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRunBatchReconsent = async () => {
    try {
      setActionLoading(true);
      setCampaignStatus('running');
      setError(null);

      const res = await fetch('/api/consents/batch-reconsent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message ?? 'Batch reconsent failed');
      }

      const result: BatchReconsentResult = await res.json();
      setLastResult(result);
      setCampaignStatus('completed');

      // Refresh data to show updated stats
      await fetchData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred.',
      );
      setCampaignStatus('error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = () => {
    setCampaignStatus('paused');
  };

  const handleCancel = () => {
    setCampaignStatus('idle');
    setLastResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/consents"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#8b919a] uppercase tracking-wider hover:text-[#0c0f14] transition-colors mb-3"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Consents
          </Link>
          <h1 className="text-2xl font-bold text-[#0c0f14]">
            Reconsent Campaigns
          </h1>
          <p className="mt-1 text-sm text-[#8b919a]">
            Manage batch reconsent requests for expiring driver consents.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {campaignStatus === 'running' && (
            <>
              <button
                onClick={handlePause}
                className="inline-flex items-center gap-2 border border-[#e8e8e3] bg-white px-4 py-2 text-xs font-bold text-[#0c0f14] uppercase tracking-wider hover:bg-[#fafaf8] transition-colors"
              >
                <Pause className="h-3.5 w-3.5" />
                Pause
              </button>
              <button
                onClick={handleCancel}
                className="inline-flex items-center gap-2 border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-700 uppercase tracking-wider hover:bg-red-50 transition-colors"
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancel
              </button>
            </>
          )}
          {campaignStatus === 'paused' && (
            <button
              onClick={() => setCampaignStatus('idle')}
              className="inline-flex items-center gap-2 border border-[#e8e8e3] bg-white px-4 py-2 text-xs font-bold text-[#0c0f14] uppercase tracking-wider hover:bg-[#fafaf8] transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" />
              Cancel
            </button>
          )}
          <button
            onClick={handleRunBatchReconsent}
            disabled={
              actionLoading ||
              campaignStatus === 'running' ||
              expiringConsents.length === 0
            }
            className="inline-flex items-center gap-2 bg-[#0c0f14] px-5 py-2 text-xs font-bold text-white uppercase tracking-wider hover:bg-[#1a1e27] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Run Batch Reconsent
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 border border-red-200 bg-red-50/50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Campaign status banner */}
      {campaignStatus === 'running' && (
        <div className="flex items-center gap-3 border border-blue-200 bg-blue-50/50 px-4 py-3">
          <Loader2 className="h-4 w-4 text-blue-600 shrink-0 animate-spin" />
          <p className="text-sm text-blue-800">
            Batch reconsent campaign is running...
          </p>
        </div>
      )}
      {campaignStatus === 'paused' && (
        <div className="flex items-center gap-3 border border-amber-200 bg-amber-50/50 px-4 py-3">
          <Pause className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            Campaign is paused. Resume or cancel to continue.
          </p>
        </div>
      )}
      {campaignStatus === 'completed' && lastResult && (
        <div className="flex items-center gap-3 border border-green-200 bg-green-50/50 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <p className="text-sm text-green-800">
            Batch reconsent completed. Sent: {lastResult.sent}, Skipped:{' '}
            {lastResult.skipped}, Errors: {lastResult.errors}.
          </p>
        </div>
      )}

      {/* Campaign stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border border-[#e8e8e3] bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Send className="h-4 w-4 text-[#8b919a]" />
            <p className="text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">
              Total Sent
            </p>
          </div>
          <p className="text-3xl font-bold text-[#0c0f14] tabular-nums">
            {loading ? '---' : stats.total_sent}
          </p>
        </div>
        <div className="border border-[#e8e8e3] bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <p className="text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">
              Pending
            </p>
          </div>
          <p className="text-3xl font-bold text-[#0c0f14] tabular-nums">
            {loading ? '---' : stats.pending}
          </p>
        </div>
        <div className="border border-[#e8e8e3] bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <p className="text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">
              Completed
            </p>
          </div>
          <p className="text-3xl font-bold text-[#0c0f14] tabular-nums">
            {loading ? '---' : stats.completed}
          </p>
        </div>
      </div>

      {/* Expiring consents table */}
      <div className="border border-[#e8e8e3] bg-white">
        <div className="flex items-center justify-between border-b border-[#e8e8e3] px-5 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold text-[#0c0f14]">
              Consents Expiring Within 30 Days
            </h2>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#8b919a] uppercase tracking-wider hover:text-[#0c0f14] transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 text-[#8b919a] animate-spin" />
            <span className="ml-2 text-sm text-[#8b919a]">Loading...</span>
          </div>
        ) : expiringConsents.length === 0 ? (
          <div className="flex items-center gap-3 px-5 py-8">
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            <p className="text-sm text-green-800">
              No consents expiring in the next 30 days. All clear.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8e8e3]">
                  <th className="px-5 py-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-5 py-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-5 py-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-5 py-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">
                    Days Left
                  </th>
                  <th className="px-5 py-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0ec]">
                {expiringConsents.map((consent) => (
                  <tr
                    key={consent.id}
                    className="group hover:bg-[#fafaf8] transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-[#0c0f14]">
                      <Link
                        href={`/drivers/${consent.driver_id}`}
                        className="hover:text-[#C8A75E] transition-colors"
                      >
                        {consent.driver.first_name} {consent.driver.last_name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-[#6b6f76]">
                      {consentTypeLabel[consent.consent_type] ??
                        consent.consent_type}
                    </td>
                    <td className="px-5 py-3 text-[#8b919a]">
                      {formatDate(consent.consent_end_date)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-bold ${
                          consent.days_until_expiration <= 7
                            ? 'bg-red-100 text-red-800'
                            : consent.days_until_expiration <= 14
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-yellow-50 text-yellow-800'
                        }`}
                      >
                        {consent.days_until_expiration}d
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold bg-[#f0f0ec] text-[#3a3f49]">
                        {consent.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
