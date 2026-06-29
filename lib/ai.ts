import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
