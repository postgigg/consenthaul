'use client';

import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Building2, Receipt } from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

interface RevenueData {
  totalRevenue: number;
  totalTransactions: number;
  monthlyRevenue: Array<{ month: string; amount: number }>;
  topOrganizations: Array<{ id: string; name: string; revenue: number }>;
  recentTransactions: Array<{
    id: string;
    organization_id: string;
    organization_name: string;
    amount: number;
    description: string;
    created_at: string;
    [key: string]: unknown;
  }>;
}

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/revenue')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-[#8b919a]">
        Loading revenue data...
      </div>
    );
  }

  const monthlyAmounts = data.monthlyRevenue.map((m) => m.amount);
  const maxMonthly = Math.max(...monthlyAmounts, 1);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`${data.totalRevenue} credits`}
          sparkline={monthlyAmounts}
        />
        <StatCard
          icon={Receipt}
          label="Transactions"
          value={data.totalTransactions}
        />
        <StatCard
          icon={TrendingUp}
          label="This Month"
          value={`${monthlyAmounts[monthlyAmounts.length - 1] ?? 0} credits`}
          changeType={
            monthlyAmounts.length >= 2 &&
            monthlyAmounts[monthlyAmounts.length - 1] >= monthlyAmounts[monthlyAmounts.length - 2]
              ? 'positive'
              : 'negative'
          }
        />
        <StatCard
          icon={Building2}
          label="Top Org Revenue"
          value={data.topOrganizations[0]?.revenue ?? 0}
          change={data.topOrganizations[0]?.name ?? '---'}
          changeType="neutral"
        />
      </div>

      {/* Monthly revenue bar chart */}
      <div className="border border-[#e8e8e3] bg-white p-5">
        <h3 className="text-xs font-bold text-[#0c0f14] uppercase tracking-wider mb-4">
          Monthly Revenue (Credits Purchased)
        </h3>
        <div className="flex items-end gap-2 h-40">
          {data.monthlyRevenue.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[0.6rem] text-[#8b919a] tabular-nums">
                {m.amount > 0 ? m.amount : ''}
              </span>
              <div
                className="w-full bg-[#C8A75E]/20 min-h-[2px] transition-all"
                style={{
                  height: `${Math.max((m.amount / maxMonthly) * 120, 2)}px`,
                  backgroundColor: m.amount > 0 ? 'rgba(200, 167, 94, 0.3)' : '#f0f0ec',
                }}
              >
                <div
                  className="w-full bg-[#C8A75E] transition-all"
                  style={{ height: '100%' }}
                />
              </div>
              <span className="text-[0.55rem] text-[#8b919a] whitespace-nowrap">
                {m.month.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top orgs */}
        <div className="border border-[#e8e8e3] bg-white">
          <div className="border-b border-[#e8e8e3] px-5 py-3">
            <h3 className="text-xs font-bold text-[#0c0f14] uppercase tracking-wider">
              Top Organizations by Revenue
            </h3>
          </div>
          <div className="divide-y divide-[#f0f0ec]">
            {data.topOrganizations.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[#8b919a] text-center">No data yet</p>
            ) : (
              data.topOrganizations.map((org, i) => (
                <div key={org.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#8b919a] w-5">{i + 1}</span>
                    <span className="text-sm font-medium text-[#0c0f14]">{org.name}</span>
                  </div>
                  <Badge variant="gold">{org.revenue} credits</Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="border border-[#e8e8e3] bg-white">
          <div className="border-b border-[#e8e8e3] px-5 py-3">
            <h3 className="text-xs font-bold text-[#0c0f14] uppercase tracking-wider">
              Recent Transactions
            </h3>
          </div>
          <div className="divide-y divide-[#f0f0ec] max-h-96 overflow-y-auto">
            {data.recentTransactions.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[#8b919a] text-center">No transactions yet</p>
            ) : (
              data.recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-[#0c0f14]">{t.description}</p>
                    <p className="text-xs text-[#8b919a]">
                      {t.organization_name} &middot; {formatDate(t.created_at)}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 tabular-nums">
                    +{t.amount}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
