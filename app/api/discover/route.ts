import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { searchCompanies, searchDecisionMakers, toDomain } from '@/lib/apollo';

// Apollo industry/company search — PAID Apollo tier. For each company found,
// also pulls the top decision-maker contact. Returns a structured
// PAID_PLAN_REQUIRED code on a free key so the UI can prompt an upgrade.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { industries, minEmployees, maxEmployees, region, count } = await req.json();
  const search = await searchCompanies({
    industries, minEmployees, maxEmployees,
    locations: region ? [region] : undefined,
    perPage: Math.min(Math.max(parseInt(count) || 25, 1), 25),
  });

  if (!search.ok) {
    const status = search.reason === 'not_configured' ? 400 : search.reason === 'paid_required' ? 402 : 502;
    const code = search.reason === 'not_configured' ? 'NOT_CONFIGURED' : search.reason === 'paid_required' ? 'PAID_PLAN_REQUIRED' : 'ERROR';
    return NextResponse.json({ error: search.message, code }, { status });
  }

  const orgs = search.data.organizations;

  // Fetch the top decision-maker contact for each company in parallel.
  const companies = await Promise.all(
    orgs.map(async (org: any) => {
      let contact = null;
      const domain = toDomain(org.primary_domain || org.website_url);
      if (domain) {
        const people = await searchDecisionMakers({ domain, perPage: 1, revealEmails: true });
        if (people.ok) contact = people.data[0] || null;
      }
      return {
        companyName: org.name,
        website: org.primary_domain,
        industry: org.industry,
        location: [org.city, org.state, org.country].filter(Boolean).join(', '),
        size: org.estimated_num_employees ? `~${org.estimated_num_employees} employees` : null,
        source: 'Apollo Discovery',
        contact,
      };
    })
  );

  return NextResponse.json({ companies, total: search.data.total || companies.length });
}
