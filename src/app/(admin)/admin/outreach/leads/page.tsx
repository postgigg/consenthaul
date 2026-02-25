'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminDataTable, type Column } from '@/components/admin/AdminDataTable';
import { formatDate } from '@/lib/utils';
import { Target, Upload, Sparkles, ChevronDown } from 'lucide-react';

interface Lead {
  id: string;
  company_name: string;
  dot_number: string | null;
  email: string | null;
  contact_name: string | null;
  state: string | null;
  fleet_size: number | null;
  pipeline_stage: string;
  lead_score: number;
  last_contacted_at: string | null;
  tags: string[];
  created_at: string;
  [key: string]: unknown;
}

const STAGE_COLORS: Record<string, string> = {
  lead: 'bg-gray-100 text-gray-700',
  contacted: 'bg-blue-100 text-blue-700',
  replied: 'bg-yellow-100 text-yellow-800',
  demo: 'bg-purple-100 text-purple-700',
  trial: 'bg-indigo-100 text-indigo-700',
  customer: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
};

const columns: Column<Lead>[] = [
  {
    key: 'company_name',
    label: 'Company',
    sortable: true,
    render: (row) => (
      <div>
        <span className="font-medium text-[#0c0f14]">{row.company_name}</span>
        {row.contact_name && (
          <p className="text-xs text-[#8b919a]">{row.contact_name}</p>
        )}
      </div>
    ),
  },
  {
    key: 'dot_number',
    label: 'DOT #',
    hideOnMobile: true,
    render: (row) => row.dot_number || '---',
  },
  {
    key: 'fleet_size',
    label: 'Fleet',
    sortable: true,
    render: (row) => (
      <span className="tabular-nums">{row.fleet_size ?? '---'}</span>
    ),
  },
  {
    key: 'state',
    label: 'State',
    hideOnMobile: true,
    render: (row) => row.state || '---',
  },
  {
    key: 'pipeline_stage',
    label: 'Stage',
    sortable: true,
    render: (row) => (
      <span
        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
          STAGE_COLORS[row.pipeline_stage] ?? 'bg-gray-100 text-gray-700'
        }`}
      >
        {row.pipeline_stage}
      </span>
    ),
  },
  {
    key: 'lead_score',
    label: 'AI Score',
    sortable: true,
    render: (row) => (
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-16 bg-[#e8e8e3] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${row.lead_score}%`,
              backgroundColor:
                row.lead_score >= 70
                  ? '#22c55e'
                  : row.lead_score >= 40
                    ? '#C8A75E'
                    : '#ef4444',
            }}
          />
        </div>
        <span className="text-xs tabular-nums text-[#5c6370]">{row.lead_score}</span>
      </div>
    ),
  },
  {
    key: 'last_contacted_at',
    label: 'Last Contact',
    sortable: true,
    hideOnMobile: true,
    render: (row) =>
      row.last_contacted_at ? formatDate(row.last_contacted_at) : 'Never',
  },
];

export default function OutreachLeadsPage() {
  const router = useRouter();
  const [data, setData] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [enriching, setEnriching] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        search,
        pageSize: '20',
      });
      if (stageFilter) params.set('stage', stageFilter);
      const res = await fetch(`/api/admin/outreach/leads?${params}`);
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, stageFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEnrich = async () => {
    if (selected.size === 0) return;
    setEnriching(true);
    try {
      await fetch('/api/admin/outreach/leads/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_ids: Array.from(selected) }),
      });
      setSelected(new Set());
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setEnriching(false);
    }
  };

  const handleBulkStage = async (stage: string) => {
    if (selected.size === 0) return;
    await fetch('/api/admin/outreach/leads/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_ids: Array.from(selected),
        action: 'change_stage',
        stage,
      }),
    });
    setSelected(new Set());
    setBulkAction('');
    fetchData();
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-[#C8A75E]/10">
            <Target className="h-5 w-5 text-[#C8A75E]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#0c0f14]">Leads</h1>
            <p className="text-sm text-[#8b919a]">{total} prospects</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/admin/outreach/leads/import')}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-[#e8e8e3] bg-white text-[#0c0f14] hover:bg-[#f0f0ec] transition-colors"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
          {selected.size > 0 && (
            <>
              <button
                onClick={handleEnrich}
                disabled={enriching}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#C8A75E] text-white hover:bg-[#b8974e] transition-colors disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {enriching ? 'Enriching...' : `Enrich (${selected.size})`}
              </button>
              <div className="relative">
                <button
                  onClick={() => setBulkAction(bulkAction ? '' : 'stage')}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium border border-[#e8e8e3] bg-white text-[#0c0f14] hover:bg-[#f0f0ec] transition-colors"
                >
                  Move ({selected.size})
                  <ChevronDown className="h-3 w-3" />
                </button>
                {bulkAction === 'stage' && (
                  <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-[#e8e8e3] shadow-lg py-1 min-w-[140px]">
                    {Object.keys(STAGE_COLORS).map((s) => (
                      <button
                        key={s}
                        onClick={() => handleBulkStage(s)}
                        className="block w-full text-left px-3 py-1.5 text-sm hover:bg-[#f0f0ec] capitalize"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stage filter tabs */}
      <div className="flex gap-1 border-b border-[#e8e8e3] pb-px overflow-x-auto">
        {['', 'lead', 'contacted', 'replied', 'demo', 'trial', 'customer', 'lost'].map(
          (s) => (
            <button
              key={s}
              onClick={() => {
                setStageFilter(s);
                setPage(0);
              }}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors capitalize whitespace-nowrap ${
                stageFilter === s
                  ? 'border-[#C8A75E] text-[#C8A75E]'
                  : 'border-transparent text-[#8b919a] hover:text-[#0c0f14]'
              }`}
            >
              {s || 'All'}
            </button>
          ),
        )}
      </div>

      {/* Table */}
      <AdminDataTable
        columns={[
          {
            key: '_select',
            label: '',
            render: (row) => (
              <input
                type="checkbox"
                checked={selected.has(row.id)}
                onChange={() => toggleSelect(row.id)}
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4 accent-[#C8A75E]"
              />
            ),
          },
          ...columns,
        ]}
        data={data}
        totalCount={total}
        currentPage={page}
        loading={loading}
        searchPlaceholder="Search leads..."
        onSearch={(q) => {
          setSearch(q);
          setPage(0);
        }}
        onPageChange={setPage}
        onRowClick={(row) => router.push(`/admin/outreach/leads/${row.id}`)}
        getRowKey={(row) => row.id}
      />
    </div>
  );
}
