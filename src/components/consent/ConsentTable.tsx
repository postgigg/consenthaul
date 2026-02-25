'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConsentStatusBadge } from '@/components/consent/ConsentStatus';
import { formatDate } from '@/lib/utils';
import { CONSENT_STATUSES } from '@/lib/constants';
import {
  Search,
  Eye,
  FileDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';
import type { ConsentStatus } from '@/types/database';

interface ConsentWithDriver {
  id: string;
  consent_type: string;
  status: ConsentStatus;
  delivery_method: string;
  delivery_address: string;
  language: string;
  created_at: string;
  signed_at: string | null;
  driver: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface ConsentTableProps {
  /** Optional callback when the user clicks "View" on a consent. */
  onView?: (consentId: string) => void;
}

export function ConsentTable({ onView }: ConsentTableProps) {
  const [consents, setConsents] = useState<ConsentWithDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const perPage = 25;

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>();

  function showFeedback(type: 'error' | 'success', message: string) {
    setFeedback({ type, message });
    clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 5000);
  }

  // Resend confirmation dialog
  const [resendTarget, setResendTarget] = useState<string | null>(null);
  const [resendingIds, setResendingIds] = useState<Set<string>>(new Set());

  const fetchConsents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
        sort: sortField,
        order: sortOrder,
      });
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/consents?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setConsents(data.data ?? []);
        setTotalPages(data.total_pages ?? 1);
      } else {
        showFeedback('error', data.message ?? 'Failed to load consents.');
      }
    } catch {
      showFeedback('error', 'Failed to load consents. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, sortField, sortOrder, search, statusFilter]);

  useEffect(() => {
    fetchConsents();
  }, [fetchConsents]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  function toggleSort(field: string) {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  }

  async function handleResend(consentId: string) {
    setResendTarget(null);
    setResendingIds((prev) => new Set(prev).add(consentId));
    try {
      const res = await fetch(`/api/consents/${consentId}/resend`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showFeedback('success', data.data?.message ?? 'Consent link resent successfully.');
        fetchConsents();
      } else {
        showFeedback('error', data.message ?? 'Failed to resend consent link.');
      }
    } catch {
      showFeedback('error', 'Failed to resend consent link. Please try again.');
    } finally {
      setResendingIds((prev) => {
        const next = new Set(prev);
        next.delete(consentId);
        return next;
      });
    }
  }

  async function handleDownloadPDF(consentId: string) {
    try {
      const res = await fetch(`/api/consents/${consentId}/pdf`);
      if (!res.ok) {
        showFeedback('error', 'Failed to download PDF.');
        return;
      }
      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank', 'noopener');
      }
    } catch {
      showFeedback('error', 'Failed to download PDF. Please try again.');
    }
  }

  const consentTypeLabel: Record<string, string> = {
    limited_query: 'Limited Query',
    pre_employment: 'Pre-Employment',
    blanket: 'Blanket',
  };

  return (
    <div className="space-y-4">
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`px-4 py-3 text-sm border ${
            feedback.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-green-200 bg-green-50 text-green-700'
          }`}
          role="alert"
        >
          {feedback.message}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b5b5ae]" />
          <Input
            placeholder="Search by driver name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
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
          <Button
            variant="outline"
            size="sm"
            onClick={fetchConsents}
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
              <TableHead>
                <button
                  className="inline-flex items-center gap-1"
                  onClick={() => toggleSort('driver')}
                >
                  Driver Name
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Delivery</TableHead>
              <TableHead>
                <button
                  className="inline-flex items-center gap-1"
                  onClick={() => toggleSort('created_at')}
                >
                  Sent Date
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="hidden md:table-cell">Signed Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-[#8b919a]">
                  Loading consents...
                </TableCell>
              </TableRow>
            ) : consents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-[#8b919a]">
                  No consents found.
                </TableCell>
              </TableRow>
            ) : (
              consents.map((consent) => (
                <TableRow key={consent.id}>
                  <TableCell className="font-medium text-[#0c0f14]">
                    {consent.driver.first_name} {consent.driver.last_name}
                  </TableCell>
                  <TableCell>{consentTypeLabel[consent.consent_type] ?? consent.consent_type}</TableCell>
                  <TableCell>
                    <ConsentStatusBadge status={consent.status} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell capitalize">
                    {consent.delivery_method}
                  </TableCell>
                  <TableCell>{formatDate(consent.created_at)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(consent.signed_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView?.(consent.id)}
                        aria-label={`View consent for ${consent.driver.first_name} ${consent.driver.last_name}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {consent.status === 'signed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPDF(consent.id)}
                          aria-label="Download PDF"
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                      )}
                      {['pending', 'sent', 'delivered'].includes(consent.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setResendTarget(consent.id)}
                          loading={resendingIds.has(consent.id)}
                          disabled={resendingIds.has(consent.id)}
                          aria-label="Resend consent"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
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

      {/* Resend confirmation dialog */}
      <Dialog open={!!resendTarget} onOpenChange={(open) => { if (!open) setResendTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resend Consent Link</DialogTitle>
            <DialogDescription>
              Are you sure you want to resend the signing link? The driver will receive a new notification.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={() => resendTarget && handleResend(resendTarget)}>
              Resend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
