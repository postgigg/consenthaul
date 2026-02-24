'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface CreditBalanceData {
  balance: number;
  lifetime_purchased: number;
  lifetime_used: number;
}

interface CreditBalanceProps {
  /** If provided, uses this data instead of fetching from Supabase. */
  initialData?: CreditBalanceData;
}

export function CreditBalance({ initialData }: CreditBalanceProps) {
  const supabase = createClient();
  const [data, setData] = useState<CreditBalanceData | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) return;

    async function fetchBalance() {
      setLoading(true);
      try {
        const { data: balanceData } = await supabase
          .from('credit_balances')
          .select('balance, lifetime_purchased, lifetime_used')
          .single();

        if (balanceData) {
          setData(balanceData);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchBalance();
  }, [initialData, supabase]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#C8A75E]" />
        </CardContent>
      </Card>
    );
  }

  const balance = data?.balance ?? 0;
  const purchased = data?.lifetime_purchased ?? 0;
  const used = data?.lifetime_used ?? 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:justify-between">
          {/* Main balance */}
          <div className="mb-4 sm:mb-0">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="h-5 w-5 text-[#C8A75E]" />
              <span className="text-sm font-medium text-[#8b919a] uppercase tracking-wider">
                Credit Balance
              </span>
            </div>
            <p className="text-5xl font-bold text-[#0c0f14] tabular-nums">
              {balance.toLocaleString()}
            </p>
            <p className="text-sm text-[#8b919a] mt-1">
              consent credit{balance !== 1 ? 's' : ''} available
            </p>
          </div>

          {/* Buy more button */}
          <Button asChild size="lg">
            <Link href="/billing#purchase">
              Buy More Credits
            </Link>
          </Button>
        </div>

        {/* Lifetime stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[#e8e8e3] pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-green-50">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[#0c0f14] tabular-nums">
                {purchased.toLocaleString()}
              </p>
              <p className="text-xs text-[#8b919a]">Lifetime Purchased</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-orange-50">
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[#0c0f14] tabular-nums">
                {used.toLocaleString()}
              </p>
              <p className="text-xs text-[#8b919a]">Lifetime Used</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
