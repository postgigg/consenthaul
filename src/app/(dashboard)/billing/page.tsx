'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreditBalance } from '@/components/billing/CreditBalance';
import { PricingCards } from '@/components/billing/PricingCards';
import { PurchaseHistory } from '@/components/billing/PurchaseHistory';

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setToast({
        type: 'success',
        message: 'Payment successful. Credits added to your account.',
      });
      window.history.replaceState({}, '', '/billing');
    } else if (searchParams.get('canceled') === 'true') {
      setToast({
        type: 'error',
        message: 'Payment canceled. No credits were added.',
      });
      window.history.replaceState({}, '', '/billing');
    }
  }, [searchParams]);

  return (
    <div className="space-y-10">
      {/* Toast */}
      {toast && (
        <div
          className={`flex items-center justify-between border-l-[3px] px-5 py-4 ${
            toast.type === 'success'
              ? 'border-emerald-500 bg-emerald-50/60'
              : 'border-red-500 bg-red-50/60'
          }`}
          role="alert"
        >
          <p className={`text-sm font-medium ${
            toast.type === 'success' ? 'text-emerald-800' : 'text-red-800'
          }`}>
            {toast.message}
          </p>
          <button
            onClick={() => setToast(null)}
            className="text-[#8b919a] hover:text-[#0c0f14] transition-colors ml-4 shrink-0"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold text-[#0c0f14] tracking-tight"
          style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
        >
          Billing
        </h1>
        <p className="mt-1 text-[#6b6f76] text-sm">
          Your credit balance and purchase history.
        </p>
      </div>

      {/* Balance */}
      <CreditBalance />

      {/* Pricing */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <h2
            className="text-lg font-bold text-[#0c0f14] tracking-tight"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            Purchase Credits
          </h2>
          <div className="flex-1 h-px bg-[#e8e8e3]" />
        </div>
        <PricingCards />
      </div>

      {/* History */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <h2
            className="text-lg font-bold text-[#0c0f14] tracking-tight"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            Transaction History
          </h2>
          <div className="flex-1 h-px bg-[#e8e8e3]" />
        </div>
        <PurchaseHistory />
      </div>
    </div>
  );
}
