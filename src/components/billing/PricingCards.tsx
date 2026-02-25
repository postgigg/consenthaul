'use client';

import { useState } from 'react';

interface CreditPackDisplay {
  id: string;
  credits: number;
  price_cents: number;
  label: string;
  perUnit: string;
  popular: boolean;
  savings: string | null;
}

const CREDIT_PACKS: CreditPackDisplay[] = [
  {
    id: 'pack_10',
    credits: 10,
    price_cents: 3000,
    label: 'Starter',
    perUnit: '$3.00',
    popular: false,
    savings: null,
  },
  {
    id: 'pack_50',
    credits: 50,
    price_cents: 12500,
    label: 'Fleet',
    perUnit: '$2.50',
    popular: true,
    savings: 'Save 17%',
  },
  {
    id: 'pack_200',
    credits: 200,
    price_cents: 40000,
    label: 'Carrier',
    perUnit: '$2.00',
    popular: false,
    savings: 'Save 33%',
  },
  {
    id: 'pack_1000',
    credits: 1000,
    price_cents: 150000,
    label: 'Enterprise',
    perUnit: '$1.50',
    popular: false,
    savings: 'Save 50%',
  },
];

function formatUSD(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function PricingCards() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePurchase(packId: string) {
    setLoadingId(packId);
    setError(null);

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack_id: packId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to start checkout.');
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div id="purchase">
      {error && (
        <div className="mb-6 border-l-[3px] border-red-500 bg-red-50/60 px-4 py-3" role="alert">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-0 border border-[#d4d4cf]">
        {CREDIT_PACKS.map((pack, i) => {
          const isLoading = loadingId === pack.id;

          return (
            <div
              key={pack.id}
              className={`relative flex flex-col p-6 ${
                i < CREDIT_PACKS.length - 1 ? 'border-b sm:border-b-0 sm:border-r border-[#d4d4cf]' : ''
              } ${
                pack.popular
                  ? 'bg-[#0c0f14] text-white'
                  : 'bg-white'
              }`}
            >
              {/* Popular flag */}
              {pack.popular && (
                <div className="absolute top-0 right-0">
                  <div className="bg-[#C8A75E] text-[#0c0f14] text-[0.65rem] font-bold uppercase tracking-widest px-3 py-1">
                    Popular
                  </div>
                </div>
              )}

              {/* Tier name */}
              <p className={`text-xs font-bold uppercase tracking-widest ${
                pack.popular ? 'text-[#8b919a]' : 'text-[#6b6f76]'
              }`}>
                {pack.label}
              </p>

              {/* Credits count */}
              <p className={`text-[2.5rem] font-bold tracking-tight mt-3 leading-none ${
                pack.popular ? 'text-white' : 'text-[#0c0f14]'
              }`}>
                {pack.credits.toLocaleString()}
              </p>
              <p className={`text-sm mt-1 ${
                pack.popular ? 'text-[#8b919a]' : 'text-[#6b6f76]'
              }`}>
                credits
              </p>

              {/* Price */}
              <div className="mt-6 pt-4 border-t border-dashed border-[#d4d4cf]/30">
                <p className={`text-2xl font-bold ${
                  pack.popular ? 'text-white' : 'text-[#0c0f14]'
                }`}>
                  {formatUSD(pack.price_cents)}
                </p>
                <p className={`text-sm mt-0.5 ${
                  pack.popular ? 'text-[#8b919a]' : 'text-[#6b6f76]'
                }`}>
                  {pack.perUnit} per consent
                </p>
              </div>

              {/* Savings badge */}
              {pack.savings && (
                <div className={`inline-flex self-start mt-3 text-[0.7rem] font-bold uppercase tracking-wider px-2 py-0.5 ${
                  pack.popular
                    ? 'bg-[#C8A75E] text-[#0c0f14]'
                    : 'bg-[#0c0f14]/5 text-[#0c0f14]'
                }`}>
                  {pack.savings}
                </div>
              )}

              {/* Buy button */}
              <button
                onClick={() => handlePurchase(pack.id)}
                disabled={isLoading}
                className={`mt-auto pt-6 w-full py-3 text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  pack.popular
                    ? 'bg-[#C8A75E] text-[#0c0f14] hover:bg-[#d4b33e] active:bg-[#c0a038]'
                    : 'bg-[#0c0f14] text-white hover:bg-[#1a1e27] active:bg-[#000]'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing
                  </>
                ) : (
                  'Buy now'
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Trust line */}
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#8b919a]">
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
          Credits never expire
        </span>
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
          </svg>
          Secure Stripe checkout
        </span>
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
          SMS + Email + WhatsApp
        </span>
      </div>
    </div>
  );
}
