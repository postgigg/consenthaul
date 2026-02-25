'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Database } from '@/types/database';

type ServiceRequestRow = Database['public']['Tables']['service_requests']['Row'];

interface AcceptQuoteDialogProps {
  request: ServiceRequestRow;
  open: boolean;
  onClose: () => void;
}

export function AcceptQuoteDialog({ request, open, onClose }: AcceptQuoteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const quotedAmount = Number(request.quoted_amount ?? 0);
  const depositAmount = Math.ceil(quotedAmount * 0.05 * 100) / 100;

  async function handlePayDeposit() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/service-requests/${request.id}/accept`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create checkout');
      }

      const { data } = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white border border-[#e8e8e3] shadow-lg">
        <div className="border-b border-[#e8e8e3] px-6 py-4">
          <h3 className="text-sm font-bold text-[#0c0f14] uppercase tracking-wider">
            Accept Quote & Pay Deposit
          </h3>
        </div>

        <div className="p-6 space-y-4">
          <div className="border border-[#e8e8e3] divide-y divide-[#e8e8e3]">
            <div className="flex justify-between px-4 py-3">
              <span className="text-sm text-[#8b919a]">Quoted Amount</span>
              <span className="text-sm font-semibold text-[#0c0f14]">
                ${quotedAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between px-4 py-3 bg-[#fafaf8]">
              <span className="text-sm text-[#8b919a]">5% Security Deposit</span>
              <span className="text-sm font-bold text-[#C8A75E]">
                ${depositAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="bg-[#fafaf8] border border-[#e8e8e3] px-4 py-3">
            <p className="text-xs text-[#6b6f76] leading-relaxed">
              Refundable if cancelled before work begins. Once our team starts,
              the deposit is applied to your project.
            </p>
          </div>

          {error && (
            <div className="border-l-3 border-red-500 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayDeposit}
              disabled={loading}
              className="flex-1 bg-[#C8A75E] text-[#0c0f14] hover:bg-[#b8974e]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'PAY DEPOSIT'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
