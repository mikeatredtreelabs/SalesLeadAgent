import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { industries, minEmployees, maxEmployees, location } = await req.json();
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
  const companies = (data.organizations || []).map((org: any) => ({
    companyName: org.name,
    website: org.primary_domain,
    industry: org.industry,
    location: [org.city, org.state, org.country].filter(Boolean).join(', '),
    size: org.employee_count ? `~${org.employee_count} employees` : null,
    source: 'Apollo Discovery',
  }));

  return NextResponse.json({ companies, total: data.pagination?.total_entries || companies.length });
}
