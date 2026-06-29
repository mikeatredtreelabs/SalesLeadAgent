import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const DECISION_MAKER_TITLES = [
  'CEO', 'COO', 'President', 'Owner', 'Founder',
  'VP Operations', 'VP of Operations', 'Vice President Operations',
  'Director of Operations', 'Head of Operations',
  'CTO', 'VP Technology', 'IT Director',
];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { website, companyName } = await req.json();
  const apolloKey = process.env.APOLLO_API_KEY;

  if (!apolloKey) {
    return NextResponse.json({ error: 'Apollo API key not configured. Add APOLLO_API_KEY to your .env.local' }, { status: 400 });
  }

  const domain = (website || '').replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  if (!domain && !companyName) {
    return NextResponse.json({ error: 'Website or company name required' }, { status: 400 });
  }

  try {
    const res = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloKey },
      body: JSON.stringify({
        q_organization_domains: domain ? [domain] : undefined,
        organization_name: !domain ? companyName : undefined,
        person_titles: DECISION_MAKER_TITLES,
        page: 1,
        per_page: 5,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Apollo error: ${err}` }, { status: 502 });
    }

    const data = await res.json();
    const contacts = (data.people || []).map((p: any) => ({
      name: [p.first_name, p.last_name].filter(Boolean).join(' '),
      title: p.title,
      email: p.email,
      linkedin: p.linkedin_url,
      seniority: p.seniority,
    }));

    return NextResponse.json({ contacts, total: contacts.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
