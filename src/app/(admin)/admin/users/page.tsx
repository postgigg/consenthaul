'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminDataTable, type Column } from '@/components/admin/AdminDataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  is_platform_admin: boolean;
  organization_id: string;
  organization_name: string;
  created_at: string;
  last_login_at: string | null;
  [key: string]: unknown;
}

export default function AdminUsersPage() {
  const [data, setData] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit dialog
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editAdmin, setEditAdmin] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        search,
        pageSize: '20',
      });
      const res = await fetch(`/api/admin/users?${params}`);
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

  function openEdit(user: User) {
    setEditUser(user);
    setEditRole(user.role);
    setEditActive(user.is_active);
    setEditAdmin(user.is_platform_admin ?? false);
  }

  async function handleSave() {
    if (!editUser) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: editRole,
          is_active: editActive,
          is_platform_admin: editAdmin,
        }),
      });
      setEditUser(null);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<User>[] = [
    {
      key: 'full_name',
      label: 'Name',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-[#0c0f14]">{row.full_name}</p>
          <p className="text-xs text-[#8b919a]">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'organization_name',
      label: 'Organization',
      hideOnMobile: true,
      render: (row) => row.organization_name,
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1">
          <Badge variant="outline">{row.role}</Badge>
          {row.is_platform_admin && (
            <Badge variant="destructive" className="text-[0.6rem]">Admin</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.is_active ? 'success' : 'destructive'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Joined',
      sortable: true,
      hideOnMobile: true,
      render: (row) => formatDate(row.created_at),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            openEdit(row);
          }}
        >
          Edit
        </Button>
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
        searchPlaceholder="Search users..."
        onSearch={(q) => {
          setSearch(q);
          setPage(0);
        }}
        onPageChange={setPage}
        getRowKey={(row) => row.id}
      />

      {/* Edit dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm font-bold text-[#0c0f14]">{editUser.full_name}</p>
                <p className="text-xs text-[#8b919a]">{editUser.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-[#0c0f14]">Role</label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="active" className="text-sm text-[#0c0f14]">Active</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="admin"
                  checked={editAdmin}
                  onChange={(e) => setEditAdmin(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="admin" className="text-sm text-[#0c0f14]">Platform Admin</label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
