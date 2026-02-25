import type { Database } from '@/types/database';
import { generateJSON, MODELS } from './openrouter';

type Lead = Database['public']['Tables']['outreach_leads']['Row'];

// ---------------------------------------------------------------------------
// Rule-based scoring (0-100)
// ---------------------------------------------------------------------------

export function calculateBaseScore(lead: Partial<Lead>): number {
  let score = 0;

  // Fleet size scoring (bigger fleet = more consent volume = more value)
  const fleet = lead.fleet_size ?? lead.driver_count ?? 0;
  if (fleet >= 100) score += 30;
  else if (fleet >= 50) score += 25;
  else if (fleet >= 20) score += 20;
  else if (fleet >= 10) score += 15;
  else if (fleet >= 1) score += 10;

  // Contact quality
  if (lead.email) score += 15;
  if (lead.contact_name) score += 10;
  if (lead.phone) score += 5;

  // Operating status
  if (lead.operating_status === 'AUTHORIZED') score += 15;
  else if (lead.operating_status === 'NOT AUTHORIZED') score -= 10;

  // Carrier operation — interstate carriers have more compliance burden
  if (lead.carrier_operation?.toLowerCase().includes('interstate')) score += 10;

  // State — high-trucking states get a bonus
  const highTruckingStates = ['TX', 'CA', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'TN', 'IN'];
  if (lead.state && highTruckingStates.includes(lead.state.toUpperCase())) score += 5;

  // Has DOT number = verified carrier
  if (lead.dot_number) score += 5;

  return Math.max(0, Math.min(100, score));
}

// ---------------------------------------------------------------------------
// AI enrichment for scoring summary
// ---------------------------------------------------------------------------

export async function generateScoreSummary(
  lead: Partial<Lead>,
): Promise<string> {
  const fleet = lead.fleet_size ?? lead.driver_count ?? 'unknown';

  const { data } = await generateJSON<{ summary: string }>(
    [
      {
        role: 'system',
        content:
          'You are a sales analyst for ConsentHaul, a SaaS that handles FMCSA Drug & Alcohol Clearinghouse electronic consent management for motor carriers. Generate a 1-sentence summary of why this lead is worth pursuing (or not). Be specific and practical.',
      },
      {
        role: 'user',
        content: `Lead: ${lead.company_name ?? 'Unknown'}, DOT# ${lead.dot_number ?? 'N/A'}, ${fleet} trucks/drivers, ${lead.state ?? 'unknown state'}, status: ${lead.operating_status ?? 'unknown'}, contact: ${lead.contact_name ?? 'none'}, email: ${lead.email ? 'yes' : 'no'}. Respond with JSON: { "summary": "..." }`,
      },
    ],
    { model: MODELS.classification, max_tokens: 200 },
  );

  return data.summary;
}

// ---------------------------------------------------------------------------
// Combined scoring: base rules + AI summary
// ---------------------------------------------------------------------------

export async function scoreLead(
  lead: Partial<Lead>,
): Promise<{ score: number; summary: string }> {
  const score = calculateBaseScore(lead);

  try {
    const summary = await generateScoreSummary(lead);
    return { score, summary };
  } catch {
    return { score, summary: '' };
  }
}
