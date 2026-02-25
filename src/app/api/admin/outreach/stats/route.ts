import { NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import type { PipelineStage, OutreachEventType } from '@/types/database';

export async function GET() {
  const admin = await getAdminUserApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();

  // Lead counts by stage
  const stages: PipelineStage[] = ['lead', 'contacted', 'replied', 'demo', 'trial', 'customer', 'lost'];
  const stageCounts: Record<string, number> = {};

  for (const stage of stages) {
    const { count } = await supabase
      .from('outreach_leads')
      .select('*', { count: 'exact', head: true })
      .eq('pipeline_stage', stage);
    stageCounts[stage] = count ?? 0;
  }

  const totalLeads = Object.values(stageCounts).reduce((a, b) => a + b, 0);

  // Email stats for last 7 and 30 days
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 86400000).toISOString();
  const d30 = new Date(now.getTime() - 30 * 86400000).toISOString();

  const eventTypes: OutreachEventType[] = ['sent', 'opened', 'clicked', 'replied'];
  const stats7d: Record<string, number> = {};
  const stats30d: Record<string, number> = {};

  for (const eventType of eventTypes) {
    const { count: c7 } = await supabase
      .from('outreach_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', eventType)
      .gte('created_at', d7);
    stats7d[eventType] = c7 ?? 0;

    const { count: c30 } = await supabase
      .from('outreach_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', eventType)
      .gte('created_at', d30);
    stats30d[eventType] = c30 ?? 0;
  }

  // Daily send sparkline (14 days)
  const sparkline: number[] = [];
  for (let i = 13; i >= 0; i--) {
    const dayStart = new Date(now.getTime() - i * 86400000);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 86400000);

    const { count } = await supabase
      .from('outreach_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'sent')
      .gte('created_at', dayStart.toISOString())
      .lt('created_at', dayEnd.toISOString());

    sparkline.push(count ?? 0);
  }

  // Active campaigns
  const { count: activeCampaigns } = await supabase
    .from('outreach_campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Recent events (last 20)
  const { data: recentEvents } = await supabase
    .from('outreach_events')
    .select('*, outreach_leads(company_name)')
    .in('event_type', ['opened', 'replied', 'clicked'])
    .order('created_at', { ascending: false })
    .limit(20);

  // Top 5 highest-scored uncontacted leads
  const { data: topLeads } = await supabase
    .from('outreach_leads')
    .select('id, company_name, fleet_size, state, lead_score, ai_summary')
    .eq('pipeline_stage', 'lead')
    .eq('do_not_contact', false)
    .order('lead_score', { ascending: false })
    .limit(5);

  return NextResponse.json({
    data: {
      totalLeads,
      stageCounts,
      stats7d,
      stats30d,
      sparkline,
      activeCampaigns: activeCampaigns ?? 0,
      recentEvents: recentEvents ?? [],
      topLeads: topLeads ?? [],
    },
  });
}
