'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { Database } from '@/types/database';

type ServiceRequestRow = Database['public']['Tables']['service_requests']['Row'];
type ServiceRequestStatus = ServiceRequestRow['status'];

interface ServiceRequestWithRelations extends ServiceRequestRow {
  profiles: { full_name: string; email: string };
  organizations: { name: string };
}

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
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function AdminServiceRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequestWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [refunding, setRefunding] = useState<string | null>(null);

  async function fetchRequests() {
    try {
      const res = await fetch('/api/admin/service-requests');
      if (res.ok) {
        const { data } = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  async function handleSetQuote(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/service-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoted_amount: parseFloat(quoteAmount),
          admin_notes: adminNotes || undefined,
          status: 'quoted',
        }),
      });
      if (res.ok) {
        setEditingId(null);
        setQuoteAmount('');
        setAdminNotes('');
        fetchRequests();
      }
    } catch (err) {
      console.error('Failed to set quote:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      await fetch(`/api/admin/service-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchRequests();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  }

  async function handleRefund(id: string) {
    setRefunding(id);
    try {
      const res = await fetch(`/api/admin/service-requests/${id}/refund`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Refund failed');
      }
      fetchRequests();
    } catch (err) {
      console.error('Refund failed:', err);
    } finally {
      setRefunding(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#8b919a]">
        Loading service requests...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-[#0c0f14] tracking-tight">
          Service Requests
        </h1>
        <p className="mt-1 text-sm text-[#8b919a]">
          Manage integration requests, quotes, and deposits.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="border border-[#e8e8e3] bg-white p-8 text-center text-sm text-[#8b919a]">
          No service requests yet.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const categoryLabel = req.category
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase());
            const isEditing = editingId === req.id;

            return (
              <div key={req.id} className="border border-[#e8e8e3] bg-white">
                {/* Header */}
                <div className="border-b border-[#e8e8e3] px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#0c0f14]">{categoryLabel}</span>
                    <Badge variant={statusVariants[req.status] ?? 'secondary'}>
                      {req.status.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-xs text-[#8b919a] capitalize">{req.urgency} priority</span>
                  </div>
                  <span className="text-xs text-[#b5b5ae]">{formatDate(req.created_at)}</span>
                </div>

                {/* Details */}
                <div className="px-5 py-3 space-y-2">
                  <div className="flex gap-4 text-xs text-[#8b919a]">
                    <span>Org: <span className="text-[#0c0f14] font-medium">{req.organizations?.name}</span></span>
                    <span>By: <span className="text-[#0c0f14] font-medium">{req.profiles?.full_name}</span> ({req.profiles?.email})</span>
                    {req.tms_system && <span>TMS: <span className="text-[#0c0f14] font-medium">{req.tms_system}</span></span>}
                  </div>
                  <p className="text-sm text-[#3a3f49]">{req.description}</p>

                  {req.quoted_amount != null && (
                    <div className="flex gap-4 text-xs">
                      <span className="text-[#8b919a]">
                        Quote: <span className="text-[#C8A75E] font-semibold">${Number(req.quoted_amount).toFixed(2)}</span>
                      </span>
                      {req.deposit_amount != null && (
                        <span className="text-[#8b919a]">
                          Deposit: <span className="text-emerald-600 font-semibold">${Number(req.deposit_amount).toFixed(2)}</span>
                        </span>
                      )}
                    </div>
                  )}
                  {req.admin_notes && (
                    <p className="text-xs text-[#6b6f76] italic">Notes: {req.admin_notes}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="border-t border-[#e8e8e3] px-5 py-3">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Quote amount ($)"
                          value={quoteAmount}
                          onChange={(e) => setQuoteAmount(e.target.value)}
                          className="border border-[#e8e8e3] px-3 py-1.5 text-sm w-40 focus:border-[#C8A75E] focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Admin notes (optional)"
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          className="border border-[#e8e8e3] px-3 py-1.5 text-sm flex-1 focus:border-[#C8A75E] focus:outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSetQuote(req.id)}
                          disabled={saving || !quoteAmount}
                          className="bg-[#C8A75E] text-[#0c0f14] hover:bg-[#b8974e]"
                        >
                          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Send Quote'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setEditingId(null); setQuoteAmount(''); setAdminNotes(''); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      {req.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => setEditingId(req.id)}
                          className="bg-[#C8A75E] text-[#0c0f14] hover:bg-[#b8974e]"
                        >
                          Set Quote
                        </Button>
                      )}
                      {req.status === 'deposit_paid' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(req.id, 'in_progress')}
                          >
                            Start Work
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRefund(req.id)}
                            disabled={refunding === req.id}
                          >
                            {refunding === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Refund Deposit'}
                          </Button>
                        </>
                      )}
                      {req.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(req.id, 'completed')}
                        >
                          Mark Complete
                        </Button>
                      )}
                      {(req.status === 'pending' || req.status === 'quoted') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(req.id, 'cancelled')}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
