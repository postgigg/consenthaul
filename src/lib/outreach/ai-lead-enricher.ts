import type { Database } from '@/types/database';
import { generateJSON, MODELS } from './openrouter';

type Lead = Database['public']['Tables']['outreach_leads']['Row'];

interface EnrichmentResult {
  ai_summary: string;
  suggested_angle: string;
  estimated_value: string;
}

export async function enrichLeadWithAI(
  lead: Partial<Lead>,
): Promise<EnrichmentResult> {
  const fleet = lead.fleet_size ?? lead.driver_count ?? 0;

  const { data } = await generateJSON<EnrichmentResult>(
    [
      {
        role: 'system',
        content: `You are a sales analyst for ConsentHaul, a SaaS that handles FMCSA Clearinghouse electronic consent management. ConsentHaul charges ~$2.50 per consent. Each CDL driver needs valid limited query consent on file (a blanket consent at hire can cover the full duration of employment per 49 CFR 382.701(b), or carriers can collect per-query).

Analyze this prospect and provide:
1. ai_summary: A concise description of this carrier and their likely consent needs (1 sentence)
2. suggested_angle: The best sales angle for this specific carrier (1 sentence)
3. estimated_value: Estimated annual revenue from this carrier based on driver count × $2.50/consent

Respond with JSON: { "ai_summary": "...", "suggested_angle": "...", "estimated_value": "..." }`,
      },
      {
        role: 'user',
        content: `Company: ${lead.company_name ?? 'Unknown'}
DOT#: ${lead.dot_number ?? 'N/A'}
MC#: ${lead.mc_number ?? 'N/A'}
Fleet size: ${fleet} trucks
Driver count: ${lead.driver_count ?? fleet ?? 'unknown'}
State: ${lead.state ?? 'unknown'}
City: ${lead.city ?? 'unknown'}
Operation: ${lead.carrier_operation ?? 'unknown'}
Operating status: ${lead.operating_status ?? 'unknown'}
Contact: ${lead.contact_name ?? 'none'}`,
      },
    ],
    { model: MODELS.enrichment, temperature: 0.3, max_tokens: 512 },
  );

  return data;
}
