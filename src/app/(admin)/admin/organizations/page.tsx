'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminDataTable, type Column } from '@/components/admin/AdminDataTable';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

interface Org {
  id: string;
  name: string;
  dot_number: string | null;
  mc_number: string | null;
  created_at: string;
  member_count: number;
  credit_balance: number;
  [key: string]: unknown;
}

const columns: Column<Org>[] = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    render: (row) => (
      <span className="font-medium text-[#0c0f14]">{row.name}</span>
    ),
  },
  {
    key: 'dot_number',
    label: 'DOT #',
    hideOnMobile: true,
    render: (row) => row.dot_number || '---',
  },
  {
    key: 'member_count',
    label: 'Members',
    sortable: true,
    render: (row) => (
      <Badge variant="secondary">{row.member_count}</Badge>
    ),
  },
  {
    key: 'credit_balance',
    label: 'Credits',
    sortable: true,
    render: (row) => (
      <span className="tabular-nums font-medium">{row.credit_balance}</span>
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

export default function AdminOrganizationsPage() {
  const router = useRouter();
  const [data, setData] = useState<Org[]>([]);
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
      const res = await fetch(`/api/admin/organizations?${params}`);
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

  return (
    <div>
      <AdminDataTable
        columns={columns}
        data={data}
        totalCount={total}
        currentPage={page}
        loading={loading}
        searchPlaceholder="Search organizations..."
        onSearch={(q) => {
          setSearch(q);
          setPage(0);
        }}
        onPageChange={setPage}
        onRowClick={(row) => router.push(`/admin/organizations/${row.id}`)}
        getRowKey={(row) => row.id}
      />
    </div>
  );
}
