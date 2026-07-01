import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { enrichOrganization } from '@/lib/apollo';

// Free-tier Apollo: enrich a company by website/domain into real firmographics
// (industry, size, location, phone, LinkedIn). Used by the lead import flows.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { website, companyName } = await req.json();
  const out = await enrichOrganization(website || companyName);

  if (!out.ok) {
    const status = out.reason === 'not_configured' ? 400 : out.reason === 'paid_required' ? 402 : 502;
    const code = out.reason === 'not_configured' ? 'NOT_CONFIGURED' : out.reason === 'paid_required' ? 'PAID_PLAN_REQUIRED' : 'ERROR';
    return NextResponse.json({ error: out.message, code }, { status });
  }

  return NextResponse.json({ firmographics: out.data });
}
