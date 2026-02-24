'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { Database } from '@/types/database';

type CreditTransaction = Database['public']['Tables']['credit_transactions']['Row'];

const PER_PAGE = 20;

const typeConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  purchase: { label: 'Purchase', variant: 'success' },
  usage: { label: 'Usage', variant: 'default' },
  refund: { label: 'Refund', variant: 'warning' },
  bonus: { label: 'Bonus', variant: 'secondary' },
};

export function PurchaseHistory() {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const from = (page - 1) * PER_PAGE;
      const to = from + PER_PAGE;

      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (!error && data) {
        // If we got PER_PAGE + 1 items, there are more pages
        setHasMore(data.length > PER_PAGE);
        setTransactions(data.slice(0, PER_PAGE));
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [supabase, page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#C8A75E]" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="py-12 text-center text-sm text-[#8b919a]">
            No transactions yet.
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Balance After</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => {
                  const config = typeConfig[tx.type] ?? {
                    label: tx.type,
                    variant: 'secondary' as const,
                  };
                  const isPositive = tx.amount > 0;

                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(tx.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium tabular-nums ${
                          isPositive ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {tx.amount}
                      </TableCell>
                      <TableCell className="text-right tabular-nums hidden sm:table-cell">
                        {tx.balance_after}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-[#8b919a] text-xs max-w-xs truncate">
                        {tx.description}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-[#8b919a]">Page {page}</p>
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
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasMore}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
