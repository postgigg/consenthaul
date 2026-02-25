// ---------------------------------------------------------------------------
// OpenRouter API client — single API for Claude, GPT-4, Llama, etc.
// ---------------------------------------------------------------------------

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const MODELS = {
  email: 'anthropic/claude-sonnet-4-20250514',
  classification: 'anthropic/claude-haiku-4-5-20251001',
  enrichment: 'anthropic/claude-sonnet-4-20250514',
} as const;

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  retries?: number;
}

interface OpenRouterResponse {
  id: string;
  choices: { message: { content: string } }[];
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY is not set');
  return key;
}

export async function generateCompletion(
  messages: OpenRouterMessage[],
  options: OpenRouterOptions = {},
): Promise<{ content: string; usage: OpenRouterResponse['usage'] }> {
  const {
    model = MODELS.email,
    temperature = 0.7,
    max_tokens = 2048,
    retries = 2,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getApiKey()}`,
          'HTTP-Referer': 'https://consenthaul.com',
          'X-Title': 'ConsentHaul Sales Grinder',
        },
        body: JSON.stringify({ model, messages, temperature, max_tokens }),
      });

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('retry-after') ?? '5', 10);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`OpenRouter ${res.status}: ${body}`);
      }

      const data: OpenRouterResponse = await res.json();
      const content = data.choices?.[0]?.message?.content ?? '';

      return { content, usage: data.usage };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError ?? new Error('OpenRouter request failed');
}

export async function generateJSON<T>(
  messages: OpenRouterMessage[],
  options: OpenRouterOptions = {},
): Promise<{ data: T; usage: OpenRouterResponse['usage'] }> {
  const systemMsg = messages.find((m) => m.role === 'system');
  const otherMsgs = messages.filter((m) => m.role !== 'system');

  const jsonMessages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: `${systemMsg?.content ?? ''}\n\nYou MUST respond with valid JSON only. No markdown, no explanation, just raw JSON.`,
    },
    ...otherMsgs,
  ];

  const { content, usage } = await generateCompletion(jsonMessages, {
    ...options,
    temperature: options.temperature ?? 0.3,
  });

  // Extract JSON from response (handles potential markdown code blocks)
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const data = JSON.parse(jsonStr) as T;
  return { data, usage };
}
