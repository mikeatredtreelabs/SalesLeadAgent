import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const DECISION_MAKER_TITLES = [
  'CEO', 'COO', 'President', 'Owner', 'Founder',
  'VP Operations', 'Director of Operations', 'Head of Operations',
];

async function fetchTopContact(domain: string, apolloKey: string) {
  try {
    const res = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloKey },
      body: JSON.stringify({
        q_organization_domains: [domain],
        person_titles: DECISION_MAKER_TITLES,
        page: 1,
        per_page: 1,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const p = data.people?.[0];
    if (!p) return null;
    return {
      name: [p.first_name, p.last_name].filter(Boolean).join(' '),
      title: p.title,
      email: p.email,
      linkedin: p.linkedin_url,
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { industries, minEmployees, maxEmployees } = await req.json();
  const apolloKey = process.env.APOLLO_API_KEY;

  if (!apolloKey) {
    return NextResponse.json({ error: 'Apollo API key not configured. Add APOLLO_API_KEY to your .env.local' }, { status: 400 });
  }

  const res = await fetch('https://api.apollo.io/v1/mixed_companies/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloKey },
    body: JSON.stringify({
      industry_tag_names: industries,
      num_employees_ranges: [`${minEmployees},${maxEmployees}`],
      page: 1,
      per_page: 25,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Apollo error: ${err}` }, { status: 502 });
  }

  const data = await res.json();
  const orgs = data.organizations || [];

  // Fetch top decision-maker contact for each company in parallel
  const companies = await Promise.all(
    orgs.map(async (org: any) => {
      const contact = org.primary_domain ? await fetchTopContact(org.primary_domain, apolloKey) : null;
      return {
        companyName: org.name,
        website: org.primary_domain,
        industry: org.industry,
        location: [org.city, org.state, org.country].filter(Boolean).join(', '),
        size: org.employee_count ? `~${org.employee_count} employees` : null,
        source: 'Apollo Discovery',
        contact,
      };
    })
  );

  return NextResponse.json({ companies, total: data.pagination?.total_entries || companies.length });
}
