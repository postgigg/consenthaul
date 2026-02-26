import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';
import { renderTemplate } from './template-renderer';
import { generateOutreachEmail } from './ai-email-writer';
import type { Database } from '@/types/database';

type Enrollment = Database['public']['Tables']['outreach_enrollments']['Row'];

const CAN_SPAM_FOOTER = `\n\n---\nConsentHaul | Flotac Ltd\n1401 Lavaca St, #800, Austin, TX 78701\nTo stop receiving these emails: {{unsubscribe_link}}`;

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

interface ProcessResult {
  sent: number;
  skipped: number;
  errors: number;
}

export async function processOutreachQueue(): Promise<ProcessResult> {
  const supabase = createAdminClient();
  const result: ProcessResult = { sent: 0, skipped: 0, errors: 0 };

  // Find active enrollments ready to send
  const { data: enrollments, error: fetchError } = await supabase
    .from('outreach_enrollments')
    .select('*')
    .eq('status', 'active')
    .lte('next_send_at', new Date().toISOString())
    .limit(100);

  if (fetchError || !enrollments?.length) return result;

  // Group by campaign to check daily limits
  const campaignIds = Array.from(new Set(enrollments.map((e) => e.campaign_id)));
  const { data: campaigns } = await supabase
    .from('outreach_campaigns')
    .select('*')
    .in('id', campaignIds)
    .eq('status', 'active');

  if (!campaigns?.length) return result;

  const campaignMap = new Map(campaigns.map((c) => [c.id, c]));

  // Check send window (business hours in campaign timezone)
  const now = new Date();
  const dailySentCounts = new Map<string, number>();

  for (const enrollment of enrollments) {
    const campaign = campaignMap.get(enrollment.campaign_id);
    if (!campaign) {
      result.skipped++;
      continue;
    }

    const settings = campaign.send_settings as Record<string, unknown>;
    const dailyLimit = (settings.daily_limit as number) ?? 50;
    const windowStart = (settings.send_window_start as string) ?? '09:00';
    const windowEnd = (settings.send_window_end as string) ?? '17:00';

    // Check business hours
    const hourStr = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      timeZone: (settings.timezone as string) ?? 'America/Chicago',
    });

    if (hourStr < windowStart || hourStr > windowEnd) {
      result.skipped++;
      continue;
    }

    // Check daily limit
    const dailyKey = `${campaign.id}-${now.toISOString().slice(0, 10)}`;
    const sentToday = dailySentCounts.get(dailyKey) ?? 0;
    if (sentToday >= dailyLimit) {
      result.skipped++;
      continue;
    }

    try {
      await processEnrollment(supabase, enrollment, campaign);
      dailySentCounts.set(dailyKey, sentToday + 1);
      result.sent++;
    } catch (err) {
      console.error('[Send Engine Error]', err);
      result.errors++;
    }
  }

  return result;
}

async function processEnrollment(
  supabase: ReturnType<typeof createAdminClient>,
  enrollment: Enrollment,
  campaign: Database['public']['Tables']['outreach_campaigns']['Row'],
) {
  const nextStepOrder = enrollment.current_step + 1;

  // Get the next step
  const { data: step } = await supabase
    .from('outreach_sequence_steps')
    .select('*')
    .eq('campaign_id', campaign.id)
    .eq('step_order', nextStepOrder)
    .single();

  if (!step) {
    // No more steps — mark enrollment as completed
    await supabase
      .from('outreach_enrollments')
      .update({ status: 'completed', next_send_at: null })
      .eq('id', enrollment.id);
    return;
  }

  // Get lead
  const { data: lead } = await supabase
    .from('outreach_leads')
    .select('*')
    .eq('id', enrollment.lead_id)
    .single();

  if (!lead || !lead.email || lead.do_not_contact) {
    await supabase
      .from('outreach_enrollments')
      .update({ status: 'paused', next_send_at: null })
      .eq('id', enrollment.id);
    return;
  }

  // Check skip conditions
  if (step.skip_if_replied) {
    const { count } = await supabase
      .from('outreach_events')
      .select('*', { count: 'exact', head: true })
      .eq('lead_id', lead.id)
      .eq('event_type', 'replied');

    if ((count ?? 0) > 0) {
      await supabase
        .from('outreach_enrollments')
        .update({ status: 'replied', next_send_at: null })
        .eq('id', enrollment.id);
      return;
    }
  }

  // Generate email content
  let subject: string;
  let bodyHtml: string;
  let bodyText: string;

  if (step.use_ai_generation) {
    const generated = await generateOutreachEmail(lead, {
      step: nextStepOrder,
      campaignGoal: step.ai_prompt ?? undefined,
    });
    subject = generated.subject;
    bodyText = generated.body;
    bodyHtml = `<p>${generated.body.replace(/\n/g, '</p><p>')}</p>`;
  } else {
    subject = renderTemplate(step.subject ?? '', lead);
    bodyHtml = renderTemplate(step.body_html ?? '', lead);
    bodyText = renderTemplate(step.body_text ?? '', lead);
  }

  // Add CAN-SPAM footer with unsubscribe link
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://consenthaul.com';
  const unsubscribeUrl = `${appUrl}/api/outreach/unsubscribe/${enrollment.id}`;
  const footerHtml = `<hr style="margin-top:24px;border:none;border-top:1px solid #e4e4e7"><p style="font-size:11px;color:#a1a1aa;margin-top:12px;">ConsentHaul | Flotac Ltd | 1401 Lavaca St, #800, Austin, TX 78701<br><a href="${unsubscribeUrl}" style="color:#a1a1aa;">Unsubscribe</a></p>`;
  bodyHtml += footerHtml;
  bodyText += CAN_SPAM_FOOTER.replace('{{unsubscribe_link}}', unsubscribeUrl);

  // Add tracking pixel
  const eventId = crypto.randomUUID();
  const trackingPixel = `<img src="${appUrl}/api/outreach/track/open/${eventId}" width="1" height="1" style="display:none" alt="" />`;
  bodyHtml += trackingPixel;

  // Send via Resend
  const settings = campaign.send_settings as Record<string, unknown>;
  const fromName = (settings.from_name as string) ?? 'ConsentHaul';
  const fromEmail = (settings.from_email as string) ?? 'outreach@consenthaul.com';

  const { data: sendResult, error: sendError } = await getResend().emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: lead.email,
    subject,
    html: bodyHtml,
    text: bodyText,
  });

  if (sendError || !sendResult?.id) {
    throw new Error(`Resend failed: ${sendError?.message ?? 'No ID'}`);
  }

  // Record sent event
  await supabase.from('outreach_events').insert({
    id: eventId,
    enrollment_id: enrollment.id,
    lead_id: lead.id,
    campaign_id: campaign.id,
    step_id: step.id,
    event_type: 'sent',
    resend_message_id: sendResult.id,
    details: { subject, body: bodyText },
  });

  // Update enrollment
  const nextStepAfter = nextStepOrder + 1;
  const { data: followingStep } = await supabase
    .from('outreach_sequence_steps')
    .select('delay_days')
    .eq('campaign_id', campaign.id)
    .eq('step_order', nextStepAfter)
    .single();

  const nextSendAt = followingStep
    ? new Date(Date.now() + (followingStep.delay_days ?? 3) * 86400000).toISOString()
    : null;

  await supabase
    .from('outreach_enrollments')
    .update({
      current_step: nextStepOrder,
      next_send_at: nextSendAt,
      status: nextSendAt ? 'active' : 'completed',
    })
    .eq('id', enrollment.id);

  // Update campaign stats
  await supabase
    .from('outreach_campaigns')
    .update({ stats_sent: campaign.stats_sent + 1 })
    .eq('id', campaign.id);

  // Update lead
  await supabase
    .from('outreach_leads')
    .update({
      last_contacted_at: new Date().toISOString(),
      pipeline_stage: lead.pipeline_stage === 'lead' ? 'contacted' : lead.pipeline_stage,
    })
    .eq('id', lead.id);
}
