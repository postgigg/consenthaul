import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateOutreachEmail } from '@/lib/outreach/ai-email-writer';
import { checkRateLimit } from '@/lib/rate-limit';
import { adminLimiter } from '@/lib/rate-limiters';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const blocked = await checkRateLimit(request, adminLimiter);
  if (blocked) return blocked;

  const admin = await getAdminUserApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { step = 1, campaignGoal, tone } = body;

    const supabase = createAdminClient();

    const { data: lead, error } = await supabase
      .from('outreach_leads')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Fetch previous emails for context
    const { data: events } = await supabase
      .from('outreach_events')
      .select('details')
      .eq('lead_id', params.id)
      .eq('event_type', 'sent')
      .order('created_at', { ascending: true });

    const previousEmails = (events ?? [])
      .map((e) => {
        const d = e.details as Record<string, unknown> | null;
        return d?.body as string | undefined;
      })
      .filter(Boolean) as string[];

    const email = await generateOutreachEmail(lead, {
      step,
      previousEmails,
      campaignGoal,
      tone,
    });

    return NextResponse.json({ data: email });
  } catch (err) {
    console.error('[POST /api/admin/outreach/leads/[id]/generate-email]', err);
    return NextResponse.json({ error: 'Email generation failed' }, { status: 500 });
  }
}
