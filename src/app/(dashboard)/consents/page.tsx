'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ConsentTable } from '@/components/consent/ConsentTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, X } from 'lucide-react';
import { CONSENT_STATUSES } from '@/lib/constants';

const CONSENT_TYPES = [
  { value: 'limited_query', label: 'Limited Query' },
  { value: 'pre_employment', label: 'Pre-Employment' },
  { value: 'blanket', label: 'Blanket' },
] as const;

export default function ConsentsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read initial values from URL query params
  const [driverSearch, setDriverSearch] = useState(searchParams.get('driver') ?? '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? 'all');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') ?? 'all');
  const [dateFrom, setDateFrom] = useState(searchParams.get('from') ?? '');
  const [dateTo, setDateTo] = useState(searchParams.get('to') ?? '');

  // Sync filters to URL query params
  const syncParams = useCallback(() => {
    const params = new URLSearchParams();
    if (driverSearch.trim()) params.set('driver', driverSearch.trim());
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (typeFilter !== 'all') params.set('type', typeFilter);
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [driverSearch, statusFilter, typeFilter, dateFrom, dateTo, pathname, router]);

  useEffect(() => {
    const timeout = setTimeout(syncParams, 300);
    return () => clearTimeout(timeout);
  }, [syncParams]);

  const hasFilters =
    driverSearch.trim() !== '' ||
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    dateFrom !== '' ||
    dateTo !== '';

  function clearFilters() {
    setDriverSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
    setDateFrom('');
    setDateTo('');
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0c0f14]">Consents</h1>
          <p className="mt-1 text-sm text-[#8b919a]">
            Track and manage all FMCSA Clearinghouse consent requests.
          </p>
        </div>
        <Button asChild>
          <Link href="/consents/new">
            <Plus className="h-4 w-4" />
            New Consent
          </Link>
        </Button>
      </div>

      {/* Advanced filters */}
      <div className="border border-[#e8e8e3] bg-white p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-[#3a3f49]">Filters</h2>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-3.5 w-3.5" />
              Clear Filters
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Driver name search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b5b5ae]" />
            <Input
              placeholder="Search by driver name..."
              value={driverSearch}
              onChange={(e) => setDriverSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {CONSENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Consent type filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {CONSENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date from */}
          <div className="space-y-1">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From date"
              aria-label="From date"
            />
          </div>

          {/* Date to */}
          <div className="space-y-1">
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="To date"
              aria-label="To date"
            />
          </div>
        </div>
      </div>

      {/* Consent table -- pass filters down so the table can include them in API calls */}
      <ConsentTable
        onView={(consentId) => router.push(`/consents/${consentId}`)}
        externalSearch={driverSearch}
        externalStatus={statusFilter}
        externalType={typeFilter}
        externalDateFrom={dateFrom}
        externalDateTo={dateTo}
      />
    </div>
  );
}
