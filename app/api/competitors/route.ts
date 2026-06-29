import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runAgent } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { website } = await req.json();
  if (!website) return NextResponse.json({ error: 'Website is required' }, { status: 400 });

  try {
    const result = await runAgent(
      `You are a business intelligence analyst. Given a company website, identify the company and its top competitors.
Return ONLY valid JSON, no markdown, no preamble.
Return exactly this shape:
{
  "company": {
    "name": "company name",
    "description": "one sentence description of what they do",
    "industry": "industry name",
    "location": "city, state if known"
  },
  "competitors": [
    {
      "name": "competitor name",
      "website": "their website domain only e.g. ajcintl.com",
      "industry": "industry",
      "location": "city, state if known",
      "reason": "one sentence why they are a competitor",
      "size": "estimated employee count range e.g. 50-200 employees"
    }
  ]
}
Return 6-8 competitors. Be specific — real companies, not generic descriptions.
If you don't know the exact website, make your best inference from the company name (e.g. companyname.com).`,
      `Find the competitors of the company at this website: ${website}`,
      2000
    );

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
