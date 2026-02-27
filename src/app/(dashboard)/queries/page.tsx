'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HitEscalationBanner, type EscalationRecord } from '@/components/compliance/HitEscalationBanner';
import { QueryResultImport } from '@/components/queries/QueryResultImport';
import {
  Search,
  Download,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Plus,
  Users,
  ListChecks,
  FileUp,
} from 'lucide-react';

interface QueryStats {
  totalDrivers: number;
  queriedThisYear: number;
  dueForQuery: number;
  overdue: number;
  neverQueried: number;
}

interface QueryRecord {
  id: string;
  driver_id: string;
  query_date: string;
  result: string;
  result_notes: string | null;
  escalation_status: string | null;
  escalation_deadline: string | null;
  driver: {
    id: string;
    first_name: string;
    last_name: string;
    cdl_number: string | null;
  };
}

interface OrgSettings {
  query_subscription_active?: boolean;
  query_subscription_expires_at?: string;
  query_subscription_driver_count?: number;
}

interface DriverWithQueryInfo {
  id: string;
  first_name: string;
  last_name: string;
  cdl_number: string | null;
  lastQueryDate: string | null;
  daysSinceQuery: number | null;
  isDue: boolean;
}

export default function QueriesPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [activeDriverCount, setActiveDriverCount] = useState(0);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [activating, setActivating] = useState(false);
  const [stats, setStats] = useState<QueryStats>({
    totalDrivers: 0,
    queriedThisYear: 0,
    dueForQuery: 0,
    overdue: 0,
    neverQueried: 0,
  });
  const [records, setRecords] = useState<QueryRecord[]>([]);
  const [downloading, setDownloading] = useState(false);

  // Record query dialog state
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [recordDriverId, setRecordDriverId] = useState('');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().slice(0, 10));
  const [recordResult, setRecordResult] = useState('no_violations');
  const [recordNotes, setRecordNotes] = useState('');
  const [recording, setRecording] = useState(false);
  const [drivers, setDrivers] = useState<{ id: string; first_name: string; last_name: string; cdl_number: string | null }[]>([]);

  // Batch recording state
  const [showBatchRecord, setShowBatchRecord] = useState(false);
  const [dueDrivers, setDueDrivers] = useState<DriverWithQueryInfo[]>([]);
  const [batchSelections, setBatchSelections] = useState<Record<string, boolean>>({});
  const [batchResults, setBatchResults] = useState<Record<string, string>>({});
  const [batchDate, setBatchDate] = useState(new Date().toISOString().slice(0, 10));
  const [batchRecording, setBatchRecording] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchSuccess, setBatchSuccess] = useState<string | null>(null);

  // CSV import state
  const [showCsvImport, setShowCsvImport] = useState(false);

  // TSV download tracking state
  const [lastTsvDownload, setLastTsvDownload] = useState<string | null>(null);

  // Escalation state
  const [escalations, setEscalations] = useState<EscalationRecord[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      if (!profile) return;

      const orgId = profile.organization_id;

      // Check subscription
      const { data: org } = await supabase
        .from('organizations')
        .select('settings, last_tsv_download_at')
        .eq('id', orgId)
        .single();

      const settings = ((org?.settings ?? {}) as OrgSettings);
      const isActive = settings.query_subscription_active === true;
      const expiresAt = settings.query_subscription_expires_at;
      const isValid = isActive && (!expiresAt || new Date(expiresAt) > new Date());
      setSubscribed(isValid);

      // Track TSV download for reminder banner
      const orgData = org as { last_tsv_download_at?: string | null } | null;
      setLastTsvDownload(orgData?.last_tsv_download_at ?? null);

      // Get active driver count
      const { count: driverCount } = await supabase
        .from('drivers')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('is_active', true);
      setActiveDriverCount(driverCount ?? 0);

      if (!isValid) {
        setLoading(false);
        return;
      }

      // Get drivers list for record dialog
      const { data: driverList } = await supabase
        .from('drivers')
        .select('id, first_name, last_name, cdl_number')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('last_name', { ascending: true });
      setDrivers(driverList ?? []);

      // Get recent query records
      const res = await fetch('/api/queries?per_page=50');
      if (res.ok) {
        const data = await res.json();
        setRecords(data.data ?? []);
      }

      // Fetch pending escalations
      const { data: pendingEscalations } = await supabase
        .from('query_records')
        .select('id, driver_id, escalation_deadline, escalation_status, driver:drivers(first_name, last_name, cdl_number)')
        .eq('organization_id', orgId)
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

      // Calculate stats and due drivers
      const allDriverIds = (driverList ?? []).map((d) => d.id);
      const total = allDriverIds.length;

      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const oneYearAgoStr = oneYearAgo.toISOString().slice(0, 10);

      const elevenMonthsAgo = new Date();
      elevenMonthsAgo.setMonth(elevenMonthsAgo.getMonth() - 11);
      const elevenMonthsAgoStr = elevenMonthsAgo.toISOString().slice(0, 10);

      // Get all query records for these drivers
      const { data: allQueries } = await supabase
        .from('query_records')
        .select('driver_id, query_date')
        .eq('organization_id', orgId)
        .in('driver_id', allDriverIds.length > 0 ? allDriverIds : ['__none__'])
        .order('query_date', { ascending: false });

      const lastQueryMap = new Map<string, string>();
      for (const q of allQueries ?? []) {
        if (!lastQueryMap.has(q.driver_id)) {
          lastQueryMap.set(q.driver_id, q.query_date);
        }
      }

      let queriedThisYear = 0;
      let dueForQuery = 0;
      let overdue = 0;
      let neverQueried = 0;
      const dueList: DriverWithQueryInfo[] = [];

      for (const d of driverList ?? []) {
        const lastQuery = lastQueryMap.get(d.id);
        const daysSince = lastQuery
          ? Math.ceil((Date.now() - new Date(lastQuery).getTime()) / (1000 * 60 * 60 * 24))
          : null;

        if (!lastQuery) {
          neverQueried++;
          overdue++;
          dueList.push({ ...d, lastQueryDate: null, daysSinceQuery: null, isDue: true });
        } else if (lastQuery > oneYearAgoStr) {
          queriedThisYear++;
          if (lastQuery <= elevenMonthsAgoStr) {
            dueForQuery++;
            dueList.push({ ...d, lastQueryDate: lastQuery, daysSinceQuery: daysSince, isDue: true });
          }
        } else {
          overdue++;
          dueList.push({ ...d, lastQueryDate: lastQuery, daysSinceQuery: daysSince, isDue: true });
        }
      }

      setDueDrivers(dueList);
      setStats({
        totalDrivers: total,
        queriedThisYear,
        dueForQuery,
        overdue,
        neverQueried,
      });
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle checkout=success redirect — poll until webhook activates, with verify fallback
  useEffect(() => {
    if (searchParams.get('checkout') !== 'success') return;

    const sessionId = searchParams.get('session_id');
    setCheckoutSuccess(true);
    setActivating(true);

    let attempts = 0;
    const maxAttempts = 15;
    let verifyAttempted = false;

    const poll = setInterval(async () => {
      attempts++;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single();
        if (!profile) return;

        const { data: org } = await supabase
          .from('organizations')
          .select('settings')
          .eq('id', profile.organization_id)
          .single();

        const settings = (org?.settings ?? {}) as OrgSettings;
        if (settings.query_subscription_active === true) {
          clearInterval(poll);
          setActivating(false);
          setSubscribed(true);
          router.replace('/queries');
          fetchData();
          return;
        }

        // After 3 failed polls (~6s), try direct Stripe verification as fallback
        if (attempts >= 3 && !verifyAttempted && sessionId) {
          verifyAttempted = true;
          const res = await fetch('/api/queries/verify-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId }),
          });
          if (res.ok) {
            const json = await res.json();
            if (json.data?.active) {
              clearInterval(poll);
              setActivating(false);
              setSubscribed(true);
              router.replace('/queries');
              fetchData();
              return;
            }
          }
        }

        if (attempts >= maxAttempts) {
          clearInterval(poll);
          setActivating(false);
          router.replace('/queries');
          fetchData();
        }
      } catch {
        // ignore polling errors
      }
    }, 2000);

    return () => clearInterval(poll);
  }, [searchParams, supabase, router, fetchData]);

  async function handleSubscribe() {
    setSubscribing(true);
    try {
      const res = await fetch('/api/queries/subscribe', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.data?.checkout_url) {
          window.location.href = data.data.checkout_url;
          return;
        }
      }
    } catch {
      // silently fail
    } finally {
      setSubscribing(false);
    }
  }

  async function handleDownloadTsv() {
    setDownloading(true);
    try {
      const res = await fetch('/api/queries/generate-tsv');
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const disposition = res.headers.get('Content-Disposition');
        const filename = disposition?.match(/filename="(.+)"/)?.[1] ?? 'clearinghouse-bulk-query.tsv';
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

  async function handleRecordQuery() {
    if (!recordDriverId || !recordDate) return;
    setRecording(true);
    try {
      const res = await fetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driver_id: recordDriverId,
          query_date: recordDate,
          result: recordResult,
          result_notes: recordNotes || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        // If violations found, trigger escalation
        if (recordResult === 'violations_found' && data.data?.id) {
          await fetch('/api/queries/escalate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query_record_id: data.data.id }),
          });
        }
        setShowRecordDialog(false);
        setRecordDriverId('');
        setRecordNotes('');
        fetchData();
      }
    } catch {
      // silently fail
    } finally {
      setRecording(false);
    }
  }

  async function handleBatchRecord() {
    const selectedIds = Object.entries(batchSelections)
      .filter(([, selected]) => selected)
      .map(([id]) => id);

    if (selectedIds.length === 0) {
      setBatchError('Select at least one driver.');
      return;
    }

    setBatchRecording(true);
    setBatchError(null);
    setBatchSuccess(null);

    let recorded = 0;
    let violations = 0;

    for (const driverId of selectedIds) {
      const result = batchResults[driverId] ?? 'no_violations';
      try {
        const res = await fetch('/api/queries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            driver_id: driverId,
            query_date: batchDate,
            result,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          recorded++;
          if (result === 'violations_found' && data.data?.id) {
            violations++;
            await fetch('/api/queries/escalate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query_record_id: data.data.id }),
            });
          }
        }
      } catch {
        // continue with next
      }
    }

    setBatchRecording(false);
    setBatchSuccess(
      `Recorded ${recorded} result${recorded !== 1 ? 's' : ''}${violations > 0 ? `. ${violations} hit${violations !== 1 ? 's' : ''} escalated.` : '.'}`,
    );
    setBatchSelections({});
    setBatchResults({});
    fetchData();
  }

  async function handleResolveEscalation(queryRecordId: string, resolution: 'full_query_completed' | 'driver_removed') {
    await fetch('/api/queries/escalate', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query_record_id: queryRecordId, resolution }),
    });
    fetchData();
  }

  function toggleSelectAll() {
    const allSelected = dueDrivers.every((d) => batchSelections[d.id]);
    const newSelections: Record<string, boolean> = {};
    for (const d of dueDrivers) {
      newSelections[d.id] = !allSelected;
    }
    setBatchSelections(newSelections);
  }

  function getQueryStatusBadge(daysSinceQuery: number | null) {
    if (daysSinceQuery === null) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800">Never</span>;
    }
    if (daysSinceQuery > 365) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800">Overdue</span>;
    }
    if (daysSinceQuery > 330) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800">Due Soon</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800">Current</span>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#0c0f14]" />
      </div>
    );
  }

  // Checkout success — waiting for webhook to activate subscription
  if (checkoutSuccess && activating) {
    return (
      <div className="space-y-8">
        <div>
          <div className="w-8 h-0.5 bg-[#C8A75E] mb-4" />
          <h1 className="text-xl font-bold text-[#0c0f14] tracking-tight">
            Annual Query Management
          </h1>
          <p className="mt-1 text-sm text-[#8b919a]">
            FMCSA Clearinghouse query tracking, reminders, and bulk upload file generation.
          </p>
        </div>
        <Card className="max-w-lg mx-auto">
          <CardContent className="py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#C8A75E] mx-auto mb-4" />
            <p className="text-lg font-bold text-[#0c0f14]">Payment received!</p>
            <p className="mt-2 text-sm text-[#8b919a]">
              Activating your Annual Query Service subscription...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Subscription gate
  if (!subscribed) {
    const totalCents = activeDriverCount * 125;
    const totalDollars = (totalCents / 100).toFixed(2);

    return (
      <div className="space-y-8">
        <div>
          <div className="w-8 h-0.5 bg-[#C8A75E] mb-4" />
          <h1 className="text-xl font-bold text-[#0c0f14] tracking-tight">
            Annual Query Management
          </h1>
          <p className="mt-1 text-sm text-[#8b919a]">
            FMCSA Clearinghouse query tracking, reminders, and bulk upload file generation.
          </p>
        </div>

        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center bg-[#0c0f14]">
              <Search className="h-5 w-5 text-[#C8A75E]" />
            </div>
            <CardTitle>Annual Query Service</CardTitle>
            <CardDescription>
              Stay compliant with 49 CFR 382.701 annual query requirements.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-[#0c0f14]">$1.25</p>
              <p className="text-sm text-[#8b919a]">per driver per year</p>
              {activeDriverCount > 0 && (
                <p className="mt-2 text-sm text-[#3a3f49]">
                  {activeDriverCount} active drivers = <span className="font-bold">${totalDollars}/year</span>
                </p>
              )}
            </div>

            <ul className="space-y-3 text-sm text-[#3a3f49]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                Monthly email reminders when drivers are due for annual queries
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                One-click FMCSA Clearinghouse bulk upload TSV file download
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                Query result tracking integrated with compliance reports
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                Step-by-step Clearinghouse upload instructions
              </li>
            </ul>

            <Button
              onClick={handleSubscribe}
              disabled={subscribing || activeDriverCount === 0}
              className="w-full"
            >
              {subscribing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : null}
              {activeDriverCount === 0
                ? 'Add drivers first'
                : `Subscribe — $${totalDollars}/year`}
            </Button>

            <p className="text-xs text-center text-[#8b919a]">
              Penalties for missing annual queries: up to $5,833 per driver per violation.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedCount = Object.values(batchSelections).filter(Boolean).length;

  const statCards = [
    { label: 'Total Drivers', value: stats.totalDrivers, icon: Users, color: 'text-[#8b919a]' },
    { label: 'Queried This Year', value: stats.queriedThisYear, icon: CheckCircle2, color: 'text-green-600' },
    { label: 'Due for Query', value: stats.dueForQuery, icon: Clock, color: 'text-amber-600' },
    { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'text-red-600' },
    { label: 'Never Queried', value: stats.neverQueried, icon: Search, color: 'text-red-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Escalation Banner */}
      <HitEscalationBanner
        escalations={escalations}
        onResolve={handleResolveEscalation}
      />

      {/* TSV download reminder banner */}
      {lastTsvDownload && (() => {
        const downloadDate = new Date(lastTsvDownload);
        const daysSince = Math.ceil((Date.now() - downloadDate.getTime()) / (1000 * 60 * 60 * 24));
        // Show if downloaded but there are still drivers due/overdue/never queried
        if (daysSince >= 1 && (stats.dueForQuery > 0 || stats.overdue > 0 || stats.neverQueried > 0)) {
          return (
            <div className="flex items-center gap-3 border border-amber-200 bg-amber-50/50 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-800">
                  Record your results
                </p>
                <p className="text-xs text-amber-700">
                  You downloaded a batch file {daysSince} day{daysSince !== 1 ? 's' : ''} ago. Have you run your queries? Record your results now to stay compliant.
                </p>
              </div>
              <button
                onClick={() => setShowCsvImport(true)}
                className="shrink-0 bg-[#0c0f14] px-4 py-2 text-xs font-bold text-white hover:bg-[#1a1e27] transition-colors"
              >
                IMPORT RESULTS
              </button>
            </div>
          );
        }
        return null;
      })()}

      <div className="flex items-start justify-between">
        <div>
          <div className="w-8 h-0.5 bg-[#C8A75E] mb-4" />
          <h1 className="text-xl font-bold text-[#0c0f14] tracking-tight">
            Annual Query Management
          </h1>
          <p className="mt-1 text-sm text-[#8b919a]">
            Track FMCSA Clearinghouse queries and generate bulk upload files.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setShowRecordDialog(true)} variant="outline" size="sm">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Record Result
          </Button>
          <Button onClick={() => setShowCsvImport(!showCsvImport)} variant="outline" size="sm">
            <FileUp className="h-3.5 w-3.5 mr-1.5" />
            Import Results (CSV)
          </Button>
          {dueDrivers.length > 0 && (
            <Button onClick={() => setShowBatchRecord(!showBatchRecord)} variant="outline" size="sm">
              <ListChecks className="h-3.5 w-3.5 mr-1.5" />
              Record Batch Results
            </Button>
          )}
          <Button onClick={handleDownloadTsv} disabled={downloading} size="sm">
            {downloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Download className="h-3.5 w-3.5 mr-1.5" />
            )}
            Download TSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <stat.icon className={`h-4 w-4 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold text-[#0c0f14] tabular-nums">{stat.value}</p>
              <p className="text-xs font-bold text-[#3a3f49] uppercase tracking-wider mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Batch Record Results */}
      {showBatchRecord && dueDrivers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Record Batch Results</CardTitle>
                <CardDescription className="mt-1">
                  Select drivers and record their query results in bulk. {dueDrivers.length} driver{dueDrivers.length !== 1 ? 's' : ''} due or overdue.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#8b919a]">Query Date</label>
                  <input
                    type="date"
                    value={batchDate}
                    onChange={(e) => setBatchDate(e.target.value)}
                    className="rounded-md border border-[#d4d4cf] bg-white px-3 py-1.5 text-sm"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {batchError && (
              <div className="border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 mb-4">{batchError}</div>
            )}
            {batchSuccess && (
              <div className="border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700 mb-4">{batchSuccess}</div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e8e8e3]">
                    <th className="pb-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={dueDrivers.length > 0 && dueDrivers.every((d) => batchSelections[d.id])}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-[#d4d4cf] text-[#0c0f14] focus:ring-[#0c0f14]"
                      />
                    </th>
                    <th className="pb-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Driver</th>
                    <th className="pb-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">CDL #</th>
                    <th className="pb-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Last Query</th>
                    <th className="pb-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Status</th>
                    <th className="pb-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0ec]">
                  {dueDrivers.map((d) => (
                    <tr key={d.id} className={`hover:bg-[#fafaf8] ${batchSelections[d.id] ? 'bg-blue-50/50' : ''}`}>
                      <td className="py-2.5">
                        <input
                          type="checkbox"
                          checked={!!batchSelections[d.id]}
                          onChange={(e) =>
                            setBatchSelections((prev) => ({ ...prev, [d.id]: e.target.checked }))
                          }
                          className="h-4 w-4 rounded border-[#d4d4cf] text-[#0c0f14] focus:ring-[#0c0f14]"
                        />
                      </td>
                      <td className="py-2.5 font-medium text-[#0c0f14]">
                        {d.first_name} {d.last_name}
                      </td>
                      <td className="py-2.5 text-[#6b6f76] font-mono text-xs">
                        {d.cdl_number ?? '—'}
                      </td>
                      <td className="py-2.5 text-[#8b919a]">
                        {d.lastQueryDate ?? 'Never'}
                      </td>
                      <td className="py-2.5">
                        {d.daysSinceQuery === null ? (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800">Never Queried</span>
                        ) : d.daysSinceQuery > 365 ? (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800">Overdue ({d.daysSinceQuery}d)</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800">Due Soon ({d.daysSinceQuery}d)</span>
                        )}
                      </td>
                      <td className="py-2.5">
                        <select
                          value={batchResults[d.id] ?? 'no_violations'}
                          onChange={(e) =>
                            setBatchResults((prev) => ({ ...prev, [d.id]: e.target.value }))
                          }
                          disabled={!batchSelections[d.id]}
                          className="rounded-md border border-[#d4d4cf] bg-white px-2 py-1 text-xs disabled:opacity-40"
                        >
                          <option value="no_violations">No Violations</option>
                          <option value="violations_found">Violations Found</option>
                          <option value="pending">Pending</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#e8e8e3]">
              <p className="text-xs text-[#8b919a]">
                {selectedCount} driver{selectedCount !== 1 ? 's' : ''} selected
                {Object.entries(batchResults).some(([id, r]) => batchSelections[id] && r === 'violations_found') && (
                  <span className="text-red-600 font-medium ml-2">
                    — includes violations (will trigger 24-hour escalation)
                  </span>
                )}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={() => setShowBatchRecord(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleBatchRecord}
                  disabled={batchRecording || selectedCount === 0}
                >
                  {batchRecording ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                  Record {selectedCount} Result{selectedCount !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CSV Import */}
      {showCsvImport && (
        <QueryResultImport onComplete={() => { fetchData(); }} />
      )}

      {/* Instructions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">How to Submit Bulk Queries</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm text-[#3a3f49]">
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 items-center justify-center bg-[#0c0f14] text-[0.65rem] font-bold text-white shrink-0">1</span>
              Click &ldquo;Download TSV&rdquo; above to get your Clearinghouse-ready file
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 items-center justify-center bg-[#0c0f14] text-[0.65rem] font-bold text-white shrink-0">2</span>
              <span>
                Log into the{' '}
                <a
                  href="https://clearinghouse.fmcsa.dot.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C8A75E] hover:underline inline-flex items-center gap-1"
                >
                  FMCSA Clearinghouse <ExternalLink className="h-3 w-3" />
                </a>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 items-center justify-center bg-[#0c0f14] text-[0.65rem] font-bold text-white shrink-0">3</span>
              Navigate to Queries &rarr; Bulk Upload and upload the TSV file
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 items-center justify-center bg-[#0c0f14] text-[0.65rem] font-bold text-white shrink-0">4</span>
              Queries process overnight (8pm&ndash;8am ET). Cost: $1.25/query paid to FMCSA
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 items-center justify-center bg-[#0c0f14] text-[0.65rem] font-bold text-white shrink-0">5</span>
              Come back here and click &ldquo;Record Batch Results&rdquo; to log all outcomes at once
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Record query dialog */}
      {showRecordDialog && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Record Query Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-xl">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#8b919a]">Driver</label>
                <select
                  value={recordDriverId}
                  onChange={(e) => setRecordDriverId(e.target.value)}
                  className="w-full rounded-md border border-[#d4d4cf] bg-white px-3 py-2 text-sm"
                >
                  <option value="">Select driver...</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.last_name}, {d.first_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#8b919a]">Query Date</label>
                <input
                  type="date"
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                  className="w-full rounded-md border border-[#d4d4cf] bg-white px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#8b919a]">Result</label>
                <select
                  value={recordResult}
                  onChange={(e) => setRecordResult(e.target.value)}
                  className="w-full rounded-md border border-[#d4d4cf] bg-white px-3 py-2 text-sm"
                >
                  <option value="no_violations">No Violations</option>
                  <option value="violations_found">Violations Found</option>
                  <option value="pending">Pending</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#8b919a]">Notes (optional)</label>
                <input
                  type="text"
                  value={recordNotes}
                  onChange={(e) => setRecordNotes(e.target.value)}
                  placeholder="Optional notes"
                  className="w-full rounded-md border border-[#d4d4cf] bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>
            {recordResult === 'violations_found' && (
              <div className="mt-3 border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
                Recording &ldquo;Violations Found&rdquo; will trigger a 24-hour escalation with email alerts to all org admins.
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <Button onClick={handleRecordQuery} disabled={recording || !recordDriverId} size="sm">
                {recording ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowRecordDialog(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Query records table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Query History</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="mx-auto h-6 w-6 text-[#d4d4cf]" />
              <p className="mt-3 text-sm text-[#8b919a]">
                No query records yet. Run your first bulk query and record the results here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e8e8e3]">
                    <th className="pb-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Driver</th>
                    <th className="pb-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">CDL #</th>
                    <th className="pb-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Query Date</th>
                    <th className="pb-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Days Ago</th>
                    <th className="pb-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Result</th>
                    <th className="pb-3 text-left text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0ec]">
                  {records.map((record) => {
                    const qDate = new Date(record.query_date);
                    const daysSince = Math.ceil(
                      (Date.now() - qDate.getTime()) / (1000 * 60 * 60 * 24),
                    );
                    return (
                      <tr key={record.id} className={`hover:bg-[#fafaf8] ${record.escalation_status === 'pending' ? 'bg-red-50/50' : ''}`}>
                        <td className="py-3 font-medium text-[#0c0f14]">
                          {record.driver?.first_name} {record.driver?.last_name}
                        </td>
                        <td className="py-3 text-[#6b6f76] font-mono text-xs">
                          {record.driver?.cdl_number ?? '—'}
                        </td>
                        <td className="py-3 text-[#8b919a]">{record.query_date}</td>
                        <td className="py-3 text-[#8b919a] tabular-nums">{daysSince}d</td>
                        <td className="py-3">
                          <span
                            className={`text-xs font-medium ${
                              record.result === 'no_violations'
                                ? 'text-green-700'
                                : record.result === 'violations_found'
                                  ? 'text-red-700'
                                  : 'text-[#8b919a]'
                            }`}
                          >
                            {record.result.replace(/_/g, ' ')}
                          </span>
                          {record.escalation_status && (
                            <span className={`ml-2 text-[0.65rem] font-medium ${
                              record.escalation_status === 'pending' ? 'text-red-600' :
                              record.escalation_status === 'expired' ? 'text-red-800' :
                              'text-green-600'
                            }`}>
                              ({record.escalation_status.replace(/_/g, ' ')})
                            </span>
                          )}
                        </td>
                        <td className="py-3">{getQueryStatusBadge(daysSince)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
