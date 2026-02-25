'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminDataTable, type Column } from '@/components/admin/AdminDataTable';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate } from '@/lib/utils';

interface Consent {
  id: string;
  status: string;
  consent_type: string;
  delivery_method: string;
  delivery_address: string;
  created_at: string;
  signed_at: string | null;
  organization_id: string;
  organization_name: string;
  driver_name: string;
  [key: string]: unknown;
}

const statusColors: Record<string, 'success' | 'warning' | 'destructive' | 'secondary' | 'gold'> = {
  signed: 'success',
  pending: 'warning',
  sent: 'gold',
  delivered: 'gold',
  opened: 'gold',
  expired: 'secondary',
  revoked: 'destructive',
  failed: 'destructive',
};

export default function AdminConsentsPage() {
  const router = useRouter();
  const [data, setData] = useState<Consent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        search,
        pageSize: '20',
      });
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('consentType', typeFilter);

      const res = await fetch(`/api/admin/consents?${params}`);
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: Column<Consent>[] = [
    {
      key: 'driver_name',
      label: 'Driver',
      render: (row) => (
        <span className="font-medium text-[#0c0f14]">{row.driver_name}</span>
      ),
    },
    {
      key: 'organization_name',
      label: 'Organization',
      hideOnMobile: true,
    },
    {
      key: 'consent_type',
      label: 'Type',
      hideOnMobile: true,
      render: (row) => (
        <Badge variant="outline">{row.consent_type.replace('_', ' ')}</Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => (
        <Badge variant={statusColors[row.status] ?? 'secondary'}>{row.status}</Badge>
      ),
    },
    {
      key: 'delivery_method',
      label: 'Method',
      hideOnMobile: true,
      render: (row) => (
        <Badge variant="secondary">{row.delivery_method}</Badge>
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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(0); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="opened">Opened</SelectItem>
            <SelectItem value="signed">Signed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v === 'all' ? '' : v); setPage(0); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="limited_query">Limited Query</SelectItem>
            <SelectItem value="pre_employment">Pre-Employment</SelectItem>
            <SelectItem value="blanket">Blanket</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AdminDataTable
        columns={columns}
        data={data}
        totalCount={total}
        currentPage={page}
        loading={loading}
        searchPlaceholder="Search consents..."
        onSearch={(q) => {
          setSearch(q);
          setPage(0);
        }}
        onPageChange={setPage}
        onRowClick={(row) => router.push(`/admin/consents/${row.id}`)}
        getRowKey={(row) => row.id}
      />
    </div>
  );
}
