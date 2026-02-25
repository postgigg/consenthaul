'use client';

import { useEffect, useState } from 'react';
import { Building2, Users, FileSignature, CheckCircle, DollarSign, Activity } from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Stats {
  organizations: number;
  users: number;
  consents: number;
  activeUsers: number;
  signedConsents: number;
  totalRevenueCents: number;
}

interface DashboardData {
  stats: Stats;
  sparklines: { consents: number[] };
  recentConsents: Array<{
    id: string;
    status: string;
    consent_type: string;
    delivery_method: string;
    created_at: string;
    organization_id: string;
  }>;
  recentOrgs: Array<{
    id: string;
    name: string;
    created_at: string;
  }>;
}

const statusColors: Record<string, 'success' | 'warning' | 'destructive' | 'secondary' | 'gold'> = {
  signed: 'success',
  pending: 'warning',
  sent: 'gold',
  delivered: 'gold',
  opened: 'gold',
  expired: 'secondary',
  revoked: 'destructive',
  failed: 'destructive',
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-[#8b919a]">
        Loading dashboard...
      </div>
    );
  }

  const { stats, sparklines, recentConsents, recentOrgs } = data;

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={Building2}
          label="Organizations"
          value={stats.organizations}
          sparkline={sparklines.consents}
        />
        <StatCard
          icon={Users}
          label="Users"
          value={stats.users}
          change={`${stats.activeUsers} active`}
          changeType="positive"
        />
        <StatCard
          icon={FileSignature}
          label="Total Consents"
          value={stats.consents}
          sparkline={sparklines.consents}
        />
        <StatCard
          icon={CheckCircle}
          label="Signed"
          value={stats.signedConsents}
          change={stats.consents > 0 ? `${Math.round((stats.signedConsents / stats.consents) * 100)}% rate` : '---'}
          changeType="positive"
        />
        <StatCard
          icon={DollarSign}
          label="Revenue (Credits)"
          value={stats.totalRevenueCents > 0 ? formatCurrency(stats.totalRevenueCents) : '$0.00'}
        />
        <StatCard
          icon={Activity}
          label="14-day Trend"
          value={sparklines.consents.reduce((a, b) => a + b, 0)}
          change="consents in last 14 days"
          changeType="neutral"
          sparkline={sparklines.consents}
        />
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent consents */}
        <div className="border border-[#e8e8e3] bg-white">
          <div className="border-b border-[#e8e8e3] px-5 py-3">
            <h2 className="text-xs font-bold text-[#0c0f14] uppercase tracking-wider">
              Recent Consents
            </h2>
          </div>
          <div className="divide-y divide-[#f0f0ec]">
            {recentConsents.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[#8b919a] text-center">No consents yet</p>
            ) : (
              recentConsents.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-[#0c0f14]">
                      {c.consent_type.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-[#8b919a]">{formatDate(c.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusColors[c.status] ?? 'secondary'}>
                      {c.status}
                    </Badge>
                    <Badge variant="outline">{c.delivery_method}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent organizations */}
        <div className="border border-[#e8e8e3] bg-white">
          <div className="border-b border-[#e8e8e3] px-5 py-3">
            <h2 className="text-xs font-bold text-[#0c0f14] uppercase tracking-wider">
              Recent Organizations
            </h2>
          </div>
          <div className="divide-y divide-[#f0f0ec]">
            {recentOrgs.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[#8b919a] text-center">No organizations yet</p>
            ) : (
              recentOrgs.map((org) => (
                <div key={org.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-[#0c0f14]">{org.name}</p>
                    <p className="text-xs text-[#8b919a]">Joined {formatDate(org.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
