'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AcceptQuoteDialog } from './AcceptQuoteDialog';
import type { Database } from '@/types/database';

type ServiceRequestRow = Database['public']['Tables']['service_requests']['Row'];
type ServiceRequestStatus = Database['public']['Tables']['service_requests']['Row']['status'];

const statusVariants: Record<ServiceRequestStatus, 'warning' | 'secondary' | 'success' | 'destructive' | 'gold'> = {
  pending: 'warning',
  quoted: 'gold',
  deposit_paid: 'success',
  in_progress: 'secondary',
  completed: 'success',
  cancelled: 'secondary',
  refunded: 'secondary',
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface ServiceRequestListProps {
  refreshKey: number;
}

export function ServiceRequestList({ refreshKey }: ServiceRequestListProps) {
  const [requests, setRequests] = useState<ServiceRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [quoteDialog, setQuoteDialog] = useState<ServiceRequestRow | null>(null);
  const searchParams = useSearchParams();

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/service-requests');
      if (res.ok) {
        const { data } = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests, refreshKey]);

  // Handle deposit verification after Stripe redirect
  useEffect(() => {
    const deposit = searchParams.get('deposit');
    const sessionId = searchParams.get('session_id');

    if (deposit === 'success' && sessionId) {
      // Find the pending request and verify deposit
      const pendingRequest = requests.find((r) => r.status === 'quoted');
      if (pendingRequest) {
        fetch(`/api/service-requests/${pendingRequest.id}/verify-deposit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        })
          .then(() => fetchRequests())
          .catch(console.error);
      }
    }
  }, [searchParams, requests, fetchRequests]);

  if (loading) {
    return (
      <div className="border border-[#e8e8e3] bg-white p-8 text-center text-sm text-[#8b919a]">
        Loading requests...
      </div>
    );
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <>
      <div className="border border-[#e8e8e3] bg-white">
        <div className="border-b border-[#e8e8e3] px-6 py-4">
          <h2 className="text-sm font-bold text-[#0c0f14] uppercase tracking-wider">
            Your Requests
          </h2>
        </div>

        <div className="divide-y divide-[#f0f0ec]">
          {requests.map((req) => {
            const categoryLabel = req.category
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase());

            return (
              <div key={req.id} className="flex items-center justify-between px-6 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-[#0c0f14]">
                      {categoryLabel}
                    </p>
                    <Badge variant={statusVariants[req.status] ?? 'secondary'}>
                      {req.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#8b919a] truncate max-w-md">
                    {req.description}
                  </p>
                  <p className="text-xs text-[#b5b5ae] mt-1">
                    {formatDate(req.created_at)}
                    {req.quoted_amount != null && (
                      <span className="ml-2 text-[#C8A75E] font-medium">
                        Quote: ${Number(req.quoted_amount).toFixed(2)}
                      </span>
                    )}
                  </p>
                </div>

                {req.status === 'quoted' && (
                  <Button
                    size="sm"
                    onClick={() => setQuoteDialog(req)}
                    className="ml-4 bg-[#C8A75E] text-[#0c0f14] hover:bg-[#b8974e]"
                  >
                    Accept Quote
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {quoteDialog && (
        <AcceptQuoteDialog
          request={quoteDialog}
          open={!!quoteDialog}
          onClose={() => setQuoteDialog(null)}
        />
      )}
    </>
  );
}
