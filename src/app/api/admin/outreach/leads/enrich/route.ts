import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { lookupByDOT } from '@/lib/outreach/fmcsa';
import { enrichLeadWithAI } from '@/lib/outreach/ai-lead-enricher';
import { calculateBaseScore } from '@/lib/outreach/lead-scoring';
import { checkRateLimit } from '@/lib/rate-limit';
import { adminLimiter } from '@/lib/rate-limiters';

export async function POST(request: NextRequest) {
  const blocked = await checkRateLimit(request, adminLimiter);
  if (blocked) return blocked;

  const admin = await getAdminUserApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { lead_ids } = await request.json();

    if (!Array.isArray(lead_ids) || lead_ids.length === 0) {
      return NextResponse.json({ error: 'lead_ids array is required' }, { status: 400 });
    }

    if (lead_ids.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 leads per batch' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: leads, error } = await supabase
      .from('outreach_leads')
      .select('*')
      .in('id', lead_ids);

    if (error || !leads?.length) {
      return NextResponse.json({ error: 'No leads found' }, { status: 404 });
    }

    const results: { id: string; enriched: boolean; error?: string }[] = [];

    for (const lead of leads) {
      try {
        const updates: Record<string, unknown> = {};

        // FMCSA lookup if DOT number exists
        if (lead.dot_number) {
          const fmcsaData = await lookupByDOT(lead.dot_number);
          if (fmcsaData) {
            Object.assign(updates, {
              fleet_size: fmcsaData.fleet_size ?? lead.fleet_size,
              driver_count: fmcsaData.driver_count ?? lead.driver_count,
              carrier_operation: fmcsaData.carrier_operation ?? lead.carrier_operation,
              operating_status: fmcsaData.operating_status ?? lead.operating_status,
              city: fmcsaData.city ?? lead.city,
              state: fmcsaData.state ?? lead.state,
              zip: fmcsaData.zip ?? lead.zip,
              address_line1: fmcsaData.address_line1 ?? lead.address_line1,
              phone: fmcsaData.phone ?? lead.phone,
            });
          }
        }

        // AI enrichment
        const mergedLead = { ...lead, ...updates };
        const aiData = await enrichLeadWithAI(mergedLead);
        updates.ai_summary = aiData.ai_summary;

        // Recalculate score with enriched data
        updates.lead_score = calculateBaseScore(mergedLead);

        await supabase.from('outreach_leads').update(updates).eq('id', lead.id);

        results.push({ id: lead.id, enriched: true });
      } catch (err) {
        results.push({
          id: lead.id,
          enriched: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({ data: results });
  } catch (err) {
    console.error('[POST /api/admin/outreach/leads/enrich]', err);
    return NextResponse.json({ error: 'Enrichment failed' }, { status: 500 });
  }
}
