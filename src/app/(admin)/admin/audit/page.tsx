'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminDataTable, type Column } from '@/components/admin/AdminDataTable';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

interface AuditEntry {
  id: number;
  organization_id: string;
  organization_name: string;
  actor_id: string | null;
  actor_name: string;
  actor_email: string;
  actor_type: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
  [key: string]: unknown;
}

const actionColors: Record<string, 'success' | 'warning' | 'destructive' | 'secondary' | 'gold'> = {
  create: 'success',
  update: 'gold',
  delete: 'destructive',
  sign: 'success',
  send: 'gold',
  add_credits: 'success',
  update_user: 'warning',
  update_config: 'warning',
  reveal_config: 'secondary',
};

export default function AdminAuditPage() {
  const [data, setData] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        search,
        pageSize: '20',
      });
      const res = await fetch(`/api/admin/audit?${params}`);
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: Column<AuditEntry>[] = [
    {
      key: 'created_at',
      label: 'Time',
      render: (row) => (
        <span className="text-xs tabular-nums">
          {formatDate(row.created_at, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'actor_name',
      label: 'Actor',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-[#0c0f14]">{row.actor_name}</p>
          <p className="text-xs text-[#8b919a]">{row.actor_type}</p>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (row) => (
        <Badge variant={actionColors[row.action] ?? 'outline'}>
          {row.action}
        </Badge>
      ),
    },
    {
      key: 'resource_type',
      label: 'Resource',
      render: (row) => (
        <div>
          <p className="text-sm text-[#0c0f14]">{row.resource_type}</p>
          <p className="text-xs text-[#8b919a] font-mono truncate max-w-[200px]">
            {row.resource_id}
          </p>
        </div>
      ),
    },
    {
      key: 'organization_name',
      label: 'Organization',
      hideOnMobile: true,
    },
    {
      key: 'ip_address',
      label: 'IP',
      hideOnMobile: true,
      render: (row) => (
        <span className="text-xs font-mono text-[#8b919a]">
          {row.ip_address || '---'}
        </span>
      ),
    },
  ];

  return (
    <div>
      <AdminDataTable
        columns={columns}
        data={data}
        totalCount={total}
        currentPage={page}
        loading={loading}
        searchPlaceholder="Search audit log..."
        onSearch={(q) => {
          setSearch(q);
          setPage(0);
        }}
        onPageChange={setPage}
        getRowKey={(row) => String(row.id)}
      />
    </div>
  );
}
