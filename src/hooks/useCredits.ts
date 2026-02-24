'use client';

import { useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreditBalance {
  balance: number;
  lifetime_purchased: number;
  lifetime_used: number;
  updated_at: string | null;
}

interface UseCreditsReturn {
  balance: CreditBalance | null;
  loading: boolean;
  error: string | null;
  fetchBalance: () => Promise<void>;
  createCheckout: (packId: string) => Promise<string | null>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCredits(): UseCreditsReturn {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // fetchBalance
  // -------------------------------------------------------------------------

  const fetchBalance = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/billing/credits');
      const json = await res.json();

      if (!res.ok) {
        setError(json?.message ?? 'Failed to fetch credit balance.');
        return;
      }

      setBalance(json.data as CreditBalance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch credit balance.');
    } finally {
      setLoading(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // createCheckout — returns the Stripe checkout URL
  // -------------------------------------------------------------------------

  const createCheckout = useCallback(
    async (packId: string): Promise<string | null> => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/billing/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pack_id: packId }),
        });

        const json = await res.json();

        if (!res.ok) {
          setError(json?.message ?? 'Failed to create checkout session.');
          return null;
        }

        return json.data?.checkout_url as string;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create checkout session.');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    balance,
    loading,
    error,
    fetchBalance,
    createCheckout,
  };
}
