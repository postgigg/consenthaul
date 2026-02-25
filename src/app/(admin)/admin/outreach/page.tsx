'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { StatCard } from '@/components/admin/StatCard';
import {
  Target, Send, Eye, MessageSquare, Megaphone, Users, Sparkles, ArrowRight,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Stats {
  totalLeads: number;
  stageCounts: Record<string, number>;
  stats7d: Record<string, number>;
  stats30d: Record<string, number>;
  sparkline: number[];
  activeCampaigns: number;
  recentEvents: {
    id: string;
    event_type: string;
    ai_reply_classification: string | null;
    created_at: string;
    outreach_leads: { company_name: string } | null;
  }[];
  topLeads: {
    id: string;
    company_name: string;
    fleet_size: number | null;
    state: string | null;
    lead_score: number;
    ai_summary: string | null;
  }[];
}

const EVENT_ICONS: Record<string, string> = {
  opened: '#3b82f6',
  replied: '#22c55e',
  clicked: '#C8A75E',
};

const FUNNEL_STAGES = ['lead', 'contacted', 'replied', 'demo', 'trial', 'customer'];
const FUNNEL_COLORS = ['#6b7280', '#3b82f6', '#eab308', '#8b5cf6', '#6366f1', '#22c55e'];

export default function OutreachDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/outreach/stats');
      const json = await res.json();
      setStats(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading || !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C8A75E] border-t-transparent" />
      </div>
    );
  }

  const openRate = stats.stats7d.sent > 0
    ? Math.round((stats.stats7d.opened / stats.stats7d.sent) * 100)
    : 0;
  const replyRate = stats.stats7d.sent > 0
    ? Math.round((stats.stats7d.replied / stats.stats7d.sent) * 100)
    : 0;

  // Funnel max for width calculation
  const funnelMax = Math.max(...FUNNEL_STAGES.map((s) => stats.stageCounts[s] ?? 0), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center bg-[#C8A75E]/10">
          <Megaphone className="h-5 w-5 text-[#C8A75E]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[#0c0f14]">Outreach Dashboard</h1>
          <p className="text-sm text-[#8b919a]">Sales pipeline and campaign metrics</p>
        </div>
      </div>

      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={Target} label="Total Leads" value={stats.totalLeads} />
        <StatCard
          icon={Send}
          label="Sent (7d)"
          value={stats.stats7d.sent ?? 0}
          sparkline={stats.sparkline}
        />
        <StatCard icon={Eye} label="Open Rate" value={`${openRate}%`} />
        <StatCard icon={MessageSquare} label="Reply Rate" value={`${replyRate}%`} />
        <StatCard icon={Megaphone} label="Active Campaigns" value={stats.activeCampaigns} />
        <StatCard icon={Users} label="Customers" value={stats.stageCounts.customer ?? 0} />
      </div>

      {/* Row 2: Conversion Funnel */}
      <div className="border border-[#e8e8e3] bg-white p-4">
        <h3 className="font-medium text-[#0c0f14] mb-3">Conversion Funnel</h3>
        <div className="space-y-2">
          {FUNNEL_STAGES.map((stage, i) => {
            const count = stats.stageCounts[stage] ?? 0;
            const prevCount = i > 0 ? (stats.stageCounts[FUNNEL_STAGES[i - 1]] ?? 0) : count;
            const dropoff = i > 0 && prevCount > 0
              ? Math.round(((prevCount - count) / prevCount) * 100)
              : 0;

            return (
              <div key={stage} className="flex items-center gap-3">
                <span className="w-20 text-xs font-medium text-[#8b919a] capitalize text-right">
                  {stage}
                </span>
                <div className="flex-1 h-6 bg-[#f0f0ec] rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all"
                    style={{
                      width: `${(count / funnelMax) * 100}%`,
                      backgroundColor: FUNNEL_COLORS[i],
                      minWidth: count > 0 ? '2px' : '0',
                    }}
                  />
                </div>
                <span className="w-12 text-xs font-medium text-[#0c0f14] tabular-nums">{count}</span>
                {i > 0 && dropoff > 0 && (
                  <span className="w-14 text-xs text-red-500 tabular-nums">-{dropoff}%</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 3: Charts + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Sends */}
        <div className="border border-[#e8e8e3] bg-white p-4">
          <h3 className="font-medium text-[#0c0f14] mb-3">Emails Sent (14 days)</h3>
          <div className="h-40 flex items-end gap-1">
            {stats.sparkline.map((val, i) => {
              const max = Math.max(...stats.sparkline, 1);
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end">
                  <div
                    className="w-full bg-[#C8A75E] rounded-t transition-all"
                    style={{ height: `${(val / max) * 100}%`, minHeight: val > 0 ? '2px' : '0' }}
                  />
                  <span className="text-[9px] text-[#8b919a] mt-1 tabular-nums">{val}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Events */}
        <div className="border border-[#e8e8e3] bg-white p-4">
          <h3 className="font-medium text-[#0c0f14] mb-3">Recent Activity</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {stats.recentEvents.length === 0 ? (
              <p className="text-sm text-[#8b919a]">No recent activity</p>
            ) : (
              stats.recentEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-2 text-sm">
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: EVENT_ICONS[event.event_type] ?? '#8b919a' }}
                  />
                  <span className="text-[#0c0f14] truncate">
                    {event.outreach_leads?.company_name ?? 'Unknown'}
                  </span>
                  <span className="text-xs text-[#8b919a] capitalize">{event.event_type}</span>
                  {event.ai_reply_classification && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-[#C8A75E]/10 text-[#C8A75E] rounded">
                      {event.ai_reply_classification}
                    </span>
                  )}
                  <span className="text-xs text-[#8b919a] ml-auto shrink-0">
                    {formatDate(event.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 4: AI Insights */}
      <div className="border border-[#C8A75E]/20 bg-[#C8A75E]/5 p-4">
        <h3 className="font-medium text-[#0c0f14] mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#C8A75E]" />
          AI Insights — Top Uncontacted Leads
        </h3>
        {stats.topLeads.length === 0 ? (
          <p className="text-sm text-[#8b919a]">No uncontacted leads found</p>
        ) : (
          <div className="space-y-2">
            {stats.topLeads.map((lead) => (
              <div
                key={lead.id}
                onClick={() => router.push(`/admin/outreach/leads/${lead.id}`)}
                className="flex items-center gap-3 p-2 bg-white border border-[#e8e8e3] cursor-pointer hover:border-[#C8A75E]/40 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center bg-[#C8A75E]/10 text-sm font-bold text-[#C8A75E] shrink-0">
                  {lead.lead_score}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0c0f14] truncate">{lead.company_name}</p>
                  <p className="text-xs text-[#8b919a] truncate">
                    {lead.fleet_size ? `${lead.fleet_size} trucks` : ''} {lead.state ?? ''}
                    {lead.ai_summary ? ` — ${lead.ai_summary}` : ''}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#8b919a] shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
