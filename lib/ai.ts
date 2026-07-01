import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Em-dashes and en-dashes read as an AI "tell" in outreach copy. Replace them
// (and any surrounding spaces/tabs) with a comma, which reads naturally in prose.
// Regular hyphens are left untouched, so compound words ("AI-powered") and number
// ranges ("60-90") are preserved. Newlines around a dash are kept so lists/layout
// don't collapse.
export function stripEmphasisDashes<T>(value: T): T {
  if (typeof value === 'string') {
    return value.replace(/[ \t]*[—–][ \t]*/g, ', ') as unknown as T;
  }
  return value;
}

export async function runAgent(systemPrompt: string, userPrompt: string, maxTokens = 1200) {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });
  const raw = msg.content.find((b) => b.type === 'text')?.text ?? '';

  // Strip markdown fences
  let clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  // Extract just the JSON object or array — find first { or [ and match to its closing pair
  const firstBrace = clean.indexOf('{');
  const firstBracket = clean.indexOf('[');
  let start = -1;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
  } else if (firstBracket !== -1) {
    start = firstBracket;
  }

  if (start > 0) clean = clean.slice(start);

  // Find the matching closing brace/bracket from the end
  const openChar = clean[0];
  const closeChar = openChar === '{' ? '}' : ']';
  const lastClose = clean.lastIndexOf(closeChar);
  if (lastClose !== -1) clean = clean.slice(0, lastClose + 1);

  return JSON.parse(clean);
}
