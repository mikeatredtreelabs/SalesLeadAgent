import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runAgent } from '@/lib/ai';
import { fetchSiteText } from '@/lib/site';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { website, sizeRanges, region } = await req.json();
  if (!website) return NextResponse.json({ error: 'Website required' }, { status: 400 });

  const domain = website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

  // Fetch website content
  const siteContent = await fetchSiteText(website);

  // Build filter instructions
  const sizeInstruction = sizeRanges?.length > 0
    ? `SIZE FILTER: Only return competitors with ${sizeRanges.map((r: any) => `${r.min}–${r.max === 10000 ? '500+' : r.max} employees`).join(' or ')}.`
    : '';

  const locationInstruction = region
    ? `LOCATION FILTER: Only return competitors located in or primarily operating in: ${region}. Exclude companies outside this area.`
    : '';

  const filterBlock = [sizeInstruction, locationInstruction].filter(Boolean).join('\n');

  try {
    const result = await runAgent(
      `You are a business research analyst. Given a company's website content, identify what the company does and return a list of their direct competitors.
${filterBlock ? `\n${filterBlock}\n` : ''}
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
      "location": "City, State",
      "size": "approximate employee count or range",
      "reason": "one sentence on why they compete"
    }
  ]
}
Return 6-8 competitors that match all filter criteria. Only include real, verifiable companies. If you cannot find enough companies matching the filters, return fewer rather than inventing companies.`,
      `Website domain: ${domain}
Website content: ${siteContent}

Identify this company and list their top competitors${region ? ` located in ${region}` : ''}.`,
      2000
    );
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
