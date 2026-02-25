import type { Database } from '@/types/database';
import { generateJSON, MODELS } from './openrouter';

type Lead = Database['public']['Tables']['outreach_leads']['Row'];

interface EmailContext {
  step: number;
  previousEmails?: string[];
  campaignGoal?: string;
  tone?: 'direct' | 'consultative' | 'casual';
}

interface GeneratedEmail {
  subject: string;
  body: string;
}

const SYSTEM_PROMPT = `You are a sales email writer for ConsentHaul, a SaaS platform that handles FMCSA Drug & Alcohol Clearinghouse electronic consent management for motor carriers.

PRODUCT CONTEXT:
- ConsentHaul lets carriers send electronic consent requests to CDL drivers via SMS/email
- Drivers sign digitally on their phone — no paper forms, no chasing signatures
- Covers limited queries (annual requirement), pre-employment, and blanket consent
- 3-year document retention built in (FMCSA requirement)
- Typical cost: ~$2.50/consent
- Target market: small-to-mid carriers (1-200 trucks) who are still doing paper consent forms

INDUSTRY CONTEXT:
- FMCSA requires carriers to obtain written/electronic consent before querying the Clearinghouse
- Limited queries must be done at least annually for every CDL driver
- Many small carriers still use paper forms — time-consuming, easy to lose, compliance risk
- Annual query season peaks in January/February
- Carriers face fines for non-compliance

WRITING RULES:
- Keep emails SHORT (under 150 words for body)
- Write like a trucking industry insider, not a marketer
- No marketing fluff, no buzzwords, no "revolutionize" or "game-changing"
- Be specific about their situation (fleet size, state, driver count)
- One clear call-to-action per email
- Sound like a real person, not a template
- Use plain language a fleet manager would use

Respond with JSON: { "subject": "...", "body": "..." }
The body should be plain text with \\n for line breaks. No HTML.`;

export async function generateOutreachEmail(
  lead: Lead,
  context: EmailContext,
): Promise<GeneratedEmail> {
  const fleet = lead.fleet_size ?? lead.driver_count ?? 'unknown number of';
  const contactName = lead.contact_name ?? 'there';
  const isFollowUp = context.step > 1;

  let userPrompt = `Generate ${isFollowUp ? `follow-up #${context.step - 1}` : 'an initial outreach'} email for:

Company: ${lead.company_name}
DOT#: ${lead.dot_number ?? 'N/A'}
Fleet size: ${fleet} trucks
Driver count: ${lead.driver_count ?? 'N/A'}
State: ${lead.state ?? 'N/A'}
Contact: ${contactName}${lead.contact_title ? ` (${lead.contact_title})` : ''}
Operating status: ${lead.operating_status ?? 'N/A'}

Goal: ${context.campaignGoal ?? 'Get them to sign up for a free trial'}
Tone: ${context.tone ?? 'direct'}`;

  if (context.previousEmails?.length) {
    userPrompt += `\n\nPrevious emails in this sequence:\n${context.previousEmails.map((e, i) => `--- Email ${i + 1} ---\n${e}`).join('\n')}`;
    userPrompt += '\n\nWrite a follow-up that references but does not repeat the previous email. Try a different angle.';
  }

  const { data } = await generateJSON<GeneratedEmail>(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    { model: MODELS.email, temperature: 0.8, max_tokens: 1024 },
  );

  return data;
}
