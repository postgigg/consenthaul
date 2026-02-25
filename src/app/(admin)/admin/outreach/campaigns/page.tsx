'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminDataTable, type Column } from '@/components/admin/AdminDataTable';
import { formatDate } from '@/lib/utils';
import { Mail, Plus } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  status: string;
  steps_count: number;
  enrolled_count: number;
  stats_sent: number;
  stats_opened: number;
  stats_replied: number;
  created_at: string;
  [key: string]: unknown;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-700',
};

const columns: Column<Campaign>[] = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    render: (row) => <span className="font-medium text-[#0c0f14]">{row.name}</span>,
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => (
      <span
        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full capitalize ${
          STATUS_COLORS[row.status] ?? 'bg-gray-100 text-gray-700'
        }`}
      >
        {row.status}
      </span>
    ),
  },
  {
    key: 'steps_count',
    label: 'Steps',
    render: (row) => <span className="tabular-nums">{row.steps_count}</span>,
  },
  {
    key: 'enrolled_count',
    label: 'Enrolled',
    render: (row) => <span className="tabular-nums">{row.enrolled_count}</span>,
  },
  {
    key: 'stats_sent',
    label: 'Sent',
    render: (row) => <span className="tabular-nums">{row.stats_sent}</span>,
  },
  {
    key: 'open_rate',
    label: 'Open %',
    hideOnMobile: true,
    render: (row) => (
      <span className="tabular-nums">
        {row.stats_sent > 0
          ? `${Math.round((row.stats_opened / row.stats_sent) * 100)}%`
          : '---'}
      </span>
    ),
  },
  {
    key: 'reply_rate',
    label: 'Reply %',
    hideOnMobile: true,
    render: (row) => (
      <span className="tabular-nums">
        {row.stats_sent > 0
          ? `${Math.round((row.stats_replied / row.stats_sent) * 100)}%`
          : '---'}
      </span>
    ),
  },
  {
    key: 'created_at',
    label: 'Created',
    sortable: true,
    hideOnMobile: true,
    render: (row) => formatDate(row.created_at),
  },
];

export default function CampaignsPage() {
  const router = useRouter();
  const [data, setData] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      const res = await fetch(`/api/admin/outreach/campaigns?${params}`);
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-[#C8A75E]/10">
            <Mail className="h-5 w-5 text-[#C8A75E]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#0c0f14]">Campaigns</h1>
            <p className="text-sm text-[#8b919a]">{total} campaigns</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/admin/outreach/campaigns/new')}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#C8A75E] text-white hover:bg-[#b8974e] transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Campaign
        </button>
      </div>

      <AdminDataTable
        columns={columns}
        data={data}
        totalCount={total}
        currentPage={page}
        loading={loading}
        onPageChange={setPage}
        onRowClick={(row) => router.push(`/admin/outreach/campaigns/${row.id}`)}
        getRowKey={(row) => row.id}
      />
    </div>
  );
}
