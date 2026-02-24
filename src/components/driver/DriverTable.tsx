'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import {
  Search,
  Eye,
  Pencil,
  FileSignature,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import type { Database } from '@/types/database';

type DriverRow = Database['public']['Tables']['drivers']['Row'];

interface DriverTableProps {
  /** Callback when the user clicks "View" on a driver. */
  onView?: (driverId: string) => void;
  /** Callback when the user clicks "Edit" on a driver. */
  onEdit?: (driverId: string) => void;
  /** Callback when the user clicks "Send Consent" for a driver. */
  onSendConsent?: (driver: DriverRow) => void;
}

export function DriverTable({ onView, onEdit, onSendConsent }: DriverTableProps) {
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('active');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const perPage = 25;

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      if (search.trim()) params.set('search', search.trim());
      if (activeFilter !== 'all') {
        params.set('is_active', activeFilter === 'active' ? 'true' : 'false');
      }

      const res = await fetch(`/api/drivers?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setDrivers(data.data ?? []);
        setTotalPages(data.total_pages ?? 1);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, activeFilter]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  useEffect(() => {
    setPage(1);
  }, [search, activeFilter]);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b5b5ae]" />
          <Input
            placeholder="Search drivers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Drivers</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDrivers}
            aria-label="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-[#e8e8e3] bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Phone</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden lg:table-cell">CDL</TableHead>
              <TableHead className="hidden lg:table-cell">State</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Hire Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-[#8b919a]">
                  Loading drivers...
                </TableCell>
              </TableRow>
            ) : drivers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-[#8b919a]">
                  No drivers found.
                </TableCell>
              </TableRow>
            ) : (
              drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium text-[#0c0f14]">
                    {driver.first_name} {driver.last_name}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {driver.phone ?? '---'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {driver.email ?? '---'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell font-mono text-xs">
                    {driver.cdl_number ?? '---'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {driver.cdl_state ?? '---'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={driver.is_active ? 'success' : 'secondary'}>
                      {driver.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(driver.hire_date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView?.(driver.id)}
                        aria-label={`View ${driver.first_name} ${driver.last_name}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit?.(driver.id)}
                        aria-label={`Edit ${driver.first_name} ${driver.last_name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSendConsent?.(driver)}
                        aria-label={`Send consent to ${driver.first_name} ${driver.last_name}`}
                      >
                        <FileSignature className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-[#8b919a]">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
