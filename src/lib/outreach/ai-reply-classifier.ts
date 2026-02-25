import { generateJSON, MODELS } from './openrouter';

interface ClassificationContext {
  leadName: string;
  originalEmail: string;
}

interface ClassificationResult {
  classification: 'interested' | 'not_interested' | 'wrong_person' | 'out_of_office' | 'question' | 'unsubscribe';
  confidence: number;
  suggestedAction: string;
  summary: string;
}

const SYSTEM_PROMPT = `You are an email reply classifier for ConsentHaul, a trucking industry SaaS. Classify incoming replies to sales outreach emails.

Classifications:
- "interested": They want to learn more, schedule a demo, or try the product
- "not_interested": Explicit decline, not looking, already have a solution
- "wrong_person": They say they're not the right contact, or forward request
- "out_of_office": Auto-reply, OOO, vacation notice
- "question": They have questions about the product/pricing before deciding
- "unsubscribe": They want to stop receiving emails

Respond with JSON:
{
  "classification": "interested|not_interested|wrong_person|out_of_office|question|unsubscribe",
  "confidence": 0.0-1.0,
  "suggestedAction": "brief action recommendation",
  "summary": "1-sentence summary of the reply"
}`;

export async function classifyReply(
  replyText: string,
  context: ClassificationContext,
): Promise<ClassificationResult> {
  const { data } = await generateJSON<ClassificationResult>(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Lead: ${context.leadName}\n\nOriginal email we sent:\n${context.originalEmail}\n\nTheir reply:\n${replyText}`,
      },
    ],
    { model: MODELS.classification, temperature: 0.1, max_tokens: 512 },
  );

  return data;
}
