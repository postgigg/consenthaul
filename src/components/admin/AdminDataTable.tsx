'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  /** Hide on mobile */
  hideOnMobile?: boolean;
  render?: (row: T) => React.ReactNode;
}

interface AdminDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  /** Total server-side count (for server pagination) */
  totalCount?: number;
  pageSize?: number;
  searchPlaceholder?: string;
  /** Server-side search callback */
  onSearch?: (query: string) => void;
  /** Server-side pagination callback */
  onPageChange?: (page: number) => void;
  /** Server-side sort callback */
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  /** Current page (for server-side pagination) */
  currentPage?: number;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  getRowKey?: (row: T) => string;
}

export function AdminDataTable<T extends Record<string, unknown>>({
  columns,
  data,
  totalCount,
  pageSize = 20,
  searchPlaceholder = 'Search...',
  onSearch,
  onPageChange,
  onSort,
  currentPage: controlledPage,
  loading,
  onRowClick,
  getRowKey,
}: AdminDataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const effectivePage = controlledPage ?? page;

  // Client-side filtering if no server search
  const filteredData = useMemo(() => {
    if (onSearch) return data; // Server handles filtering
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some(
        (v) => v != null && String(v).toLowerCase().includes(q)
      )
    );
  }, [data, search, onSearch]);

  // Client-side sorting if no server sort
  const sortedData = useMemo(() => {
    if (onSort || !sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortDir, onSort]);

  // Client-side pagination if no server pagination
  const paginatedData = useMemo(() => {
    if (onPageChange) return sortedData;
    const start = effectivePage * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, effectivePage, pageSize, onPageChange]);

  const total = totalCount ?? filteredData.length;
  const totalPages = Math.ceil(total / pageSize);

  // Debounced server search
  useEffect(() => {
    if (!onSearch) return;
    const timer = setTimeout(() => onSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search, onSearch]);

  const handleSort = useCallback(
    (key: string) => {
      const newDir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc';
      setSortKey(key);
      setSortDir(newDir);
      onSort?.(key, newDir);
    },
    [sortKey, sortDir, onSort]
  );

  const goToPage = useCallback(
    (p: number) => {
      const clamped = Math.max(0, Math.min(p, totalPages - 1));
      setPage(clamped);
      onPageChange?.(clamped);
    },
    [totalPages, onPageChange]
  );

  return (
    <div>
      {/* Search */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b919a]" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (!onSearch) setPage(0);
            }}
            className="pl-9"
          />
        </div>
        <span className="text-xs text-[#8b919a]">
          {total.toLocaleString()} result{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="border border-[#e8e8e3] bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={`text-[0.7rem] font-bold uppercase tracking-wider text-[#8b919a] ${
                    col.hideOnMobile ? 'hidden md:table-cell' : ''
                  } ${col.sortable ? 'cursor-pointer select-none hover:text-[#3a3f49]' : ''}`}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <ArrowUpDown className={`h-3 w-3 ${sortKey === col.key ? 'text-[#0c0f14]' : ''}`} />
                    )}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-12 text-[#8b919a]">
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-12 text-[#8b919a]">
                  No results found
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, i) => (
                <TableRow
                  key={getRowKey ? getRowKey(row) : i}
                  className={onRowClick ? 'cursor-pointer hover:bg-[#fafaf8]' : ''}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={`text-sm ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}
                    >
                      {col.render
                        ? col.render(row)
                        : row[col.key] != null
                          ? String(row[col.key])
                          : '---'}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-[#8b919a]">
            Page {effectivePage + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(0)}
              disabled={effectivePage === 0}
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(effectivePage - 1)}
              disabled={effectivePage === 0}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(effectivePage + 1)}
              disabled={effectivePage >= totalPages - 1}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(totalPages - 1)}
              disabled={effectivePage >= totalPages - 1}
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
