import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { bulkActionSchema } from '@/lib/outreach/validators';
import { scoreLead } from '@/lib/outreach/lead-scoring';
import { checkRateLimit } from '@/lib/rate-limit';
import { adminLimiter } from '@/lib/rate-limiters';

export async function POST(request: NextRequest) {
  const blocked = await checkRateLimit(request, adminLimiter);
  if (blocked) return blocked;

  const admin = await getAdminUserApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = bulkActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation Error', details: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const { lead_ids, action, stage, tag, campaign_id } = parsed.data;
    const supabase = createAdminClient();
    let affected = 0;

    switch (action) {
      case 'change_stage': {
        if (!stage) {
          return NextResponse.json({ error: 'Stage is required' }, { status: 400 });
        }
        const { count } = await supabase
          .from('outreach_leads')
          .update({ pipeline_stage: stage })
          .in('id', lead_ids);
        affected = count ?? 0;
        break;
      }

      case 'add_tag': {
        if (!tag) {
          return NextResponse.json({ error: 'Tag is required' }, { status: 400 });
        }
        const { data: leads } = await supabase
          .from('outreach_leads')
          .select('id, tags')
          .in('id', lead_ids);
        for (const lead of leads ?? []) {
          const tags = Array.isArray(lead.tags) ? lead.tags : [];
          if (!tags.includes(tag)) {
            await supabase
              .from('outreach_leads')
              .update({ tags: [...tags, tag] })
              .eq('id', lead.id);
            affected++;
          }
        }
        break;
      }

      case 'remove_tag': {
        if (!tag) {
          return NextResponse.json({ error: 'Tag is required' }, { status: 400 });
        }
        const { data: tagLeads } = await supabase
          .from('outreach_leads')
          .select('id, tags')
          .in('id', lead_ids);
        for (const lead of tagLeads ?? []) {
          const tags = Array.isArray(lead.tags) ? lead.tags : [];
          if (tags.includes(tag)) {
            await supabase
              .from('outreach_leads')
              .update({ tags: tags.filter((t: string) => t !== tag) })
              .eq('id', lead.id);
            affected++;
          }
        }
        break;
      }

      case 'enroll_campaign': {
        if (!campaign_id) {
          return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
        }
        const enrollments = lead_ids.map((lead_id) => ({
          campaign_id,
          lead_id,
          status: 'active' as const,
          current_step: 0,
          next_send_at: new Date().toISOString(),
        }));
        const { error } = await supabase
          .from('outreach_enrollments')
          .upsert(enrollments, { onConflict: 'campaign_id,lead_id' });
        if (!error) affected = enrollments.length;
        break;
      }

      case 'score': {
        const { data: scoreLeads } = await supabase
          .from('outreach_leads')
          .select('*')
          .in('id', lead_ids);
        for (const lead of scoreLeads ?? []) {
          const { score, summary } = await scoreLead(lead);
          await supabase
            .from('outreach_leads')
            .update({ lead_score: score, ai_summary: summary || lead.ai_summary })
            .eq('id', lead.id);
          affected++;
        }
        break;
      }
    }

    return NextResponse.json({ data: { action, affected } });
  } catch (err) {
    console.error('[POST /api/admin/outreach/leads/bulk]', err);
    return NextResponse.json({ error: 'Bulk action failed' }, { status: 500 });
  }
}
