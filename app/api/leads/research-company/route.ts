import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enrichOrganization, toDomain } from '@/lib/apollo';
import { fetchSiteText } from '@/lib/site';

// Derive a readable company name from a domain, e.g. "hartwellfreight.com" -> "Hartwellfreight".
function nameFromDomain(domain: string): string {
  const base = domain.split('.')[0].replace(/-/g, ' ').trim();
  return base.replace(/\b\w/g, c => c.toUpperCase());
}

// Single-company research: create (or enrich) a lead from a website, fetch the
// site text, and hand both back so the client can run the agent pipeline. The
// agents themselves stay in /api/leads/[id]/agents — this just seeds the lead.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;

  const { website, companyName } = await req.json();
  const domain = toDomain(website);
  if (!domain && !companyName) {
    return NextResponse.json({ error: 'A company website is required.' }, { status: 400 });
  }

  // Enrich firmographics (free Apollo tier) and fetch the site text in parallel.
  const [enriched, siteContent] = await Promise.all([
    enrichOrganization(website || companyName),
    domain ? fetchSiteText(website) : Promise.resolve(''),
  ]);
  const firm = enriched.ok ? enriched.data : null;

  const lead = await prisma.lead.create({
    data: {
      userId,
      companyName: firm?.companyName || companyName || (domain ? nameFromDomain(domain) : 'Unknown company'),
      website: firm?.website || domain || null,
      industry: firm?.industry || null,
      location: firm?.location || null,
      size: firm?.size || null,
      source: 'Single-company research',
      status: 'New',
    },
  });
  await prisma.agentActivity.create({
    data: { leadId: lead.id, agent: 'Intake Agent', action: 'Lead created', detail: 'Added via single-company research' },
  });

  return NextResponse.json({ leadId: lead.id, companyName: lead.companyName, siteContent });
}
