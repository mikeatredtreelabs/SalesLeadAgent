import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runAgent } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { website, sizeRanges } = await req.json();
  if (!website) return NextResponse.json({ error: 'Website required' }, { status: 400 });

  const domain = website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

  // Fetch website content
  let siteContent = '';
  try {
    const res = await fetch(`https://${domain}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; research-bot/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    siteContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000);
  } catch {
    siteContent = `Company website: ${domain}`;
  }

  // Build size constraint instruction for the prompt
  const sizeInstruction = sizeRanges && sizeRanges.length > 0
    ? `IMPORTANT: Only return competitors that match these company size ranges: ${sizeRanges.map((r: any) => `${r.min}–${r.max === 10000 ? '500+' : r.max} employees`).join(' or ')}. Filter out any competitors outside these ranges.`
    : 'Return competitors of any size.';

  try {
    const result = await runAgent(
      `You are a business research analyst. Given a company's website content, identify what the company does and return a list of their direct competitors.
${sizeInstruction}
Return ONLY valid JSON, no markdown, no preamble.
Return exactly this shape:
{
  "companyName": "company name",
  "industry": "industry / sector",
  "description": "one sentence description of what they do",
  "competitors": [
    {
      "companyName": "competitor name",
      "website": "domain.com",
      "industry": "industry",
      "location": "City, State if known",
      "size": "approximate employee count or range",
      "reason": "one sentence on why they compete"
    }
  ]
}
Return 6-8 competitors that match the size criteria. Only include real, verifiable companies. If you are not confident about a detail, omit it rather than guess.`,
      `Website domain: ${domain}
Website content: ${siteContent}

Identify this company and list their top competitors.`,
      2000
    );
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
