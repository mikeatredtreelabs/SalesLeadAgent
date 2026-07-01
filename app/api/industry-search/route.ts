import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runAgent } from '@/lib/ai';

// AI-generated company discovery by industry (+ optional location/size). Works
// on the free plan — Apollo's authoritative company search is paid-only, so this
// uses Claude to list real companies, mirroring the competitor finder.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { industry, region, sizeRanges, count } = await req.json();
  if (!industry || !String(industry).trim()) {
    return NextResponse.json({ error: 'An industry is required.' }, { status: 400 });
  }
  const n = Math.min(Math.max(parseInt(count) || 10, 1), 25);

  const sizeInstruction = sizeRanges?.length > 0
    ? `SIZE FILTER: Only include companies with ${sizeRanges.map((r: any) => `${r.min}–${r.max >= 10000 ? '500+' : r.max} employees`).join(' or ')}.`
    : '';
  const locationInstruction = region
    ? `LOCATION FILTER: Only include companies located in or primarily operating in: ${region}. Exclude companies outside this area.`
    : '';
  const filterBlock = [sizeInstruction, locationInstruction].filter(Boolean).join('\n');

  try {
    const result = await runAgent(
      `You are a business research analyst with broad, accurate knowledge of real companies.
List real, verifiable companies in the given industry.
${filterBlock ? `\n${filterBlock}\n` : ''}
Return ONLY valid JSON, no markdown, no preamble, in exactly this shape:
{
  "companies": [
    {
      "companyName": "company name",
      "website": "domain.com",
      "industry": "specific sub-industry",
      "location": "City, State",
      "size": "approximate employee count or range",
      "reason": "one sentence on what they do"
    }
  ]
}
Return up to ${n} companies that match ALL filter criteria. Only include real companies you are confident exist, with real domains — never invent companies or fabricate domains. If you cannot find enough real matches, return fewer.`,
      `Industry: ${String(industry).trim()}
Find up to ${n} real companies in this industry${region ? ` located in ${region}` : ''}.`,
      2500,
    );
    return NextResponse.json({ companies: result.companies || [], source: 'ai' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
