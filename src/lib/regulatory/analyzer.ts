// ---------------------------------------------------------------------------
// Two-stage AI analysis for regulatory content
// ---------------------------------------------------------------------------

import { generateJSON, MODELS } from '@/lib/outreach/openrouter';

// ---------------------------------------------------------------------------
// Stage 1: Relevance classification (Haiku — fast + cheap)
// ---------------------------------------------------------------------------

interface ClassificationResult {
  relevance_score: number;
  category: string;
  reason: string;
}

export async function classifyRelevance(
  title: string,
  description: string,
): Promise<ClassificationResult> {
  const { data } = await generateJSON<ClassificationResult>(
    [
      {
        role: 'system',
        content: `You are a regulatory analyst for a company that manages FMCSA Drug & Alcohol Clearinghouse consent forms for trucking fleets.

Score the following article for relevance on a 1-10 scale:
- 9-10: Directly changes FMCSA Clearinghouse consent requirements or drug/alcohol testing rules
- 7-8: Affects CDL driver compliance, Clearinghouse procedures, or DOT testing
- 5-6: Related to FMCSA regulations, fleet safety, or driver privacy
- 3-4: General trucking industry news with minor regulatory implications
- 1-2: Unrelated to our domain

Return JSON: { "relevance_score": <1-10>, "category": "<short category>", "reason": "<1-sentence reason>" }`,
      },
      {
        role: 'user',
        content: `Title: ${title}\n\nContent: ${description.slice(0, 3000)}`,
      },
    ],
    { model: MODELS.classification, temperature: 0.2, max_tokens: 256 },
  );

  return {
    relevance_score: Math.max(1, Math.min(10, data.relevance_score)),
    category: data.category || 'uncategorized',
    reason: data.reason || '',
  };
}

// ---------------------------------------------------------------------------
// Stage 2: Detailed analysis (Sonnet — deeper reasoning)
// ---------------------------------------------------------------------------

interface AnalysisResult {
  impact_assessment: string;
  recommended_actions: string;
  affected_areas: string[];
}

export async function analyzeImpact(
  title: string,
  description: string,
  category: string,
): Promise<AnalysisResult> {
  const { data } = await generateJSON<AnalysisResult>(
    [
      {
        role: 'system',
        content: `You are a regulatory compliance expert for ConsentHaul, a platform that manages FMCSA Drug & Alcohol Clearinghouse consent forms for trucking fleets.

Analyze this regulatory change and provide:
1. Impact assessment: How does this affect our platform, consent forms, or customers?
2. Recommended actions: What should we do? (update templates, notify customers, change procedures, etc.)
3. Affected areas: Which parts of our business are impacted?

Return JSON:
{
  "impact_assessment": "<2-3 paragraph assessment>",
  "recommended_actions": "<bullet-point style actions>",
  "affected_areas": ["<area1>", "<area2>"]
}

Possible affected areas: consent_forms, pdf_templates, compliance_rules, customer_notifications, driver_communications, clearinghouse_integration, billing, legal`,
      },
      {
        role: 'user',
        content: `Category: ${category}\nTitle: ${title}\n\nContent: ${description.slice(0, 5000)}`,
      },
    ],
    { model: MODELS.enrichment, temperature: 0.3, max_tokens: 1024 },
  );

  return {
    impact_assessment: data.impact_assessment || '',
    recommended_actions: data.recommended_actions || '',
    affected_areas: Array.isArray(data.affected_areas) ? data.affected_areas : [],
  };
}
