import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { generateCompletion, MODELS } from '@/lib/outreach/openrouter';

export async function POST(
  request: NextRequest,
) {
  const admin = await getAdminUserApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { step_number, ai_prompt, campaign_goal, tone } = await request.json();

    if (!ai_prompt) {
      return NextResponse.json({ error: 'ai_prompt is required' }, { status: 400 });
    }

    const stepNum = step_number ?? 1;
    const isFollowUp = stepNum > 1;

    const systemMsg = `You are a sales email writer for ConsentHaul, a trucking industry SaaS for FMCSA Clearinghouse consent management. Write ${
      isFollowUp ? `follow-up email #${stepNum - 1}` : 'an initial outreach email'
    } template.

The email should use {{variable}} placeholders: {{company_name}}, {{contact_name}}, {{dot_number}}, {{fleet_size}}, {{state}}.

Rules:
- Keep under 150 words
- Sound like a real person in trucking, not a marketer
- One clear CTA
- Tone: ${tone ?? 'direct'}
- Campaign goal: ${campaign_goal ?? 'Get them to sign up for a free trial'}

Respond with JSON: { "subject": "...", "body_text": "...", "body_html": "..." }
body_text is plain text. body_html is simple HTML with <p> and <br> tags only.`;

    const { content } = await generateCompletion(
      [
        { role: 'system', content: systemMsg },
        { role: 'user', content: ai_prompt },
      ],
      { model: MODELS.email, temperature: 0.8, max_tokens: 1024 },
    );

    let jsonStr = content.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const data = JSON.parse(jsonStr);

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[POST generate-step]', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
