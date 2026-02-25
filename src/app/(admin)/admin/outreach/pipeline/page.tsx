'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminDataTable, type Column } from '@/components/admin/AdminDataTable';
import { PipelineBoard } from '@/components/outreach/PipelineBoard';
import { GitBranch, LayoutGrid, List } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Lead {
  id: string;
  company_name: string;
  dot_number: string | null;
  email: string | null;
  state: string | null;
  fleet_size: number | null;
  pipeline_stage: string;
  lead_score: number;
  last_contacted_at: string | null;
  [key: string]: unknown;
}

const STAGES = ['lead', 'contacted', 'replied', 'demo', 'trial', 'customer', 'lost'];
const STAGE_COLORS: Record<string, string> = {
  lead: 'bg-gray-100 text-gray-700',
  contacted: 'bg-blue-100 text-blue-700',
  replied: 'bg-yellow-100 text-yellow-800',
  demo: 'bg-purple-100 text-purple-700',
  trial: 'bg-indigo-100 text-indigo-700',
  customer: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
};

const STAGE_ICONS: Record<string, string> = {
  lead: '#6b7280',
  contacted: '#3b82f6',
  replied: '#eab308',
  demo: '#8b5cf6',
  trial: '#6366f1',
  customer: '#22c55e',
  lost: '#ef4444',
};

const columns: Column<Lead>[] = [
  {
    key: 'company_name',
    label: 'Company',
    sortable: true,
    render: (row) => <span className="font-medium text-[#0c0f14]">{row.company_name}</span>,
  },
  { key: 'state', label: 'State', render: (row) => row.state || '---' },
  {
    key: 'fleet_size',
    label: 'Fleet',
    sortable: true,
    render: (row) => <span className="tabular-nums">{row.fleet_size ?? '---'}</span>,
  },
  {
    key: 'pipeline_stage',
    label: 'Stage',
    render: (row) => (
      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full capitalize ${STAGE_COLORS[row.pipeline_stage] ?? ''}`}>
        {row.pipeline_stage}
      </span>
    ),
  },
  {
    key: 'lead_score',
    label: 'Score',
    sortable: true,
    render: (row) => <span className="tabular-nums">{row.lead_score}</span>,
  },
  {
    key: 'last_contacted_at',
    label: 'Last Contact',
    hideOnMobile: true,
    render: (row) => row.last_contacted_at ? formatDate(row.last_contacted_at) : 'Never',
  },
];

export default function PipelinePage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'table'>('kanban');

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/outreach/leads?pageSize=500');
      const json = await res.json();
      setLeads(json.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleStageChange = async (leadId: string, newStage: string) => {
    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, pipeline_stage: newStage } : l)),
    );

    await fetch(`/api/admin/outreach/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pipeline_stage: newStage }),
    });
  };

  // Stage counts
  const stageCounts = STAGES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = leads.filter((l) => l.pipeline_stage === s).length;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-[#C8A75E]/10">
            <GitBranch className="h-5 w-5 text-[#C8A75E]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#0c0f14]">Pipeline</h1>
            <p className="text-sm text-[#8b919a]">{leads.length} leads</p>
          </div>
        </div>
        <div className="flex border border-[#e8e8e3]">
          <button
            onClick={() => setView('kanban')}
            className={`p-2 transition-colors ${
              view === 'kanban' ? 'bg-[#C8A75E]/10 text-[#C8A75E]' : 'text-[#8b919a] hover:bg-[#f0f0ec]'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView('table')}
            className={`p-2 transition-colors ${
              view === 'table' ? 'bg-[#C8A75E]/10 text-[#C8A75E]' : 'text-[#8b919a] hover:bg-[#f0f0ec]'
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stage count cards */}
      <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
        {STAGES.map((s) => (
          <div key={s} className="border border-[#e8e8e3] bg-white p-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: STAGE_ICONS[s] }} />
              <span className="text-xs font-medium text-[#8b919a] capitalize">{s}</span>
            </div>
            <span className="text-lg font-bold text-[#0c0f14] tabular-nums">{stageCounts[s] ?? 0}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C8A75E] border-t-transparent" />
        </div>
      ) : view === 'kanban' ? (
        <PipelineBoard leads={leads} onStageChange={handleStageChange} />
      ) : (
        <AdminDataTable
          columns={columns}
          data={leads}
          onRowClick={(row) => router.push(`/admin/outreach/leads/${row.id}`)}
          getRowKey={(row) => row.id}
        />
      )}
    </div>
  );
}
