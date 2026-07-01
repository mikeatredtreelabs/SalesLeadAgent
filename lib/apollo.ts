// Central Apollo.io API client.
//
// Plan reality (verified live against a free key, 2026-07): Apollo's free API
// tier only exposes ENRICHMENT endpoints. Search endpoints
// (mixed_companies/search, mixed_people/search) and people/match email reveal
// all return HTTP 403 { error_code: 'API_INACCESSIBLE' } until the account is on
// a paid plan. So `enrichOrganization` works today; the search/email helpers are
// written correctly and gated — they light up the moment the key is upgraded.

const BASE = 'https://api.apollo.io/api/v1';

export const DECISION_MAKER_TITLES = [
  'CEO', 'COO', 'President', 'Owner', 'Founder',
  'VP Operations', 'VP of Operations', 'Vice President Operations',
  'Director of Operations', 'Head of Operations',
  'CTO', 'VP Technology', 'IT Director',
];

// A discriminated result so callers can distinguish "no key", "needs paid plan",
// and a generic error — the UI renders a different message for each.
export type ApolloOutcome<T> =
  | { ok: true; data: T }
  | { ok: false; reason: 'not_configured' | 'paid_required' | 'error'; message: string };

export interface ApolloFirmographics {
  companyName?: string;
  website?: string;
  industry?: string;
  size?: string;
  location?: string;
  phone?: string;
  linkedin?: string;
  foundedYear?: number;
  description?: string;
}

export interface ApolloContact {
  name: string;
  title?: string;
  email?: string;
  linkedin?: string;
  seniority?: string;
}

/** Strip protocol/path/www to the bare registrable domain Apollo expects. */
export function toDomain(websiteOrDomain?: string): string {
  return (websiteOrDomain || '')
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .trim()
    .toLowerCase();
}

/** True only for the real placeholder Apollo returns when an email is locked. */
export function isLockedEmail(email?: string): boolean {
  return !email || /email_not_unlocked@/i.test(email) || email === 'not_unlocked';
}

async function apolloFetch<T>(path: string, init: RequestInit): Promise<ApolloOutcome<T>> {
  const key = process.env.APOLLO_API_KEY;
  if (!key) {
    return { ok: false, reason: 'not_configured', message: 'Apollo API key not configured. Add APOLLO_API_KEY to your .env.' };
  }

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', 'X-Api-Key': key, ...(init.headers || {}) },
    });
  } catch (e: any) {
    return { ok: false, reason: 'error', message: e?.message || 'Apollo request failed' };
  }

  const text = await res.text();
  let json: any = {};
  try { json = text ? JSON.parse(text) : {}; } catch { json = { error: text }; }

  if (!res.ok) {
    if (res.status === 403 && json?.error_code === 'API_INACCESSIBLE') {
      return { ok: false, reason: 'paid_required', message: 'This Apollo feature requires a paid Apollo plan.' };
    }
    return { ok: false, reason: 'error', message: json?.error || `Apollo error (HTTP ${res.status})` };
  }
  return { ok: true, data: json as T };
}

function mapFirmographics(o: any): ApolloFirmographics {
  return {
    companyName: o.name || undefined,
    website: o.primary_domain || toDomain(o.website_url) || undefined,
    industry: o.industry || (Array.isArray(o.industries) ? o.industries[0] : undefined) || undefined,
    size: o.estimated_num_employees ? `~${o.estimated_num_employees} employees` : undefined,
    location: [o.city, o.state, o.country].filter(Boolean).join(', ') || undefined,
    phone: o.primary_phone?.sanitized_number || o.primary_phone?.number || undefined,
    linkedin: o.linkedin_url || undefined,
    foundedYear: typeof o.founded_year === 'number' ? o.founded_year : undefined,
    description: o.short_description || undefined,
  };
}

/**
 * Organization enrichment — FREE tier. Given a website/domain, return real
 * firmographics (industry, size, location, phone, LinkedIn, ...). Resolves to
 * `data: null` when Apollo has no record for the domain.
 */
export async function enrichOrganization(websiteOrDomain?: string): Promise<ApolloOutcome<ApolloFirmographics | null>> {
  const domain = toDomain(websiteOrDomain);
  if (!domain) return { ok: false, reason: 'error', message: 'A website or domain is required.' };
  const out = await apolloFetch<{ organization?: any }>(`/organizations/enrich?domain=${encodeURIComponent(domain)}`, { method: 'GET' });
  if (!out.ok) return out;
  const org = out.data.organization;
  return { ok: true, data: org ? mapFirmographics(org) : null };
}

/**
 * People search for decision-maker contacts at a company — PAID tier.
 * Optionally reveals real emails via a follow-up match call.
 */
export async function searchDecisionMakers(
  opts: { domain?: string; companyName?: string; perPage?: number; revealEmails?: boolean },
): Promise<ApolloOutcome<ApolloContact[]>> {
  const domain = toDomain(opts.domain);
  if (!domain && !opts.companyName) return { ok: false, reason: 'error', message: 'A website or company name is required.' };

  const out = await apolloFetch<{ people?: any[] }>(`/mixed_people/search`, {
    method: 'POST',
    body: JSON.stringify({
      q_organization_domains: domain ? [domain] : undefined,
      organization_name: !domain ? opts.companyName : undefined,
      person_titles: DECISION_MAKER_TITLES,
      page: 1,
      per_page: opts.perPage ?? 5,
    }),
  });
  if (!out.ok) return out;

  const contacts: ApolloContact[] = (out.data.people || []).map((p: any) => ({
    name: [p.first_name, p.last_name].filter(Boolean).join(' '),
    title: p.title,
    email: p.email,
    linkedin: p.linkedin_url,
    seniority: p.seniority,
  }));

  if (opts.revealEmails) {
    await Promise.all(contacts.map(async (c, i) => {
      if (!isLockedEmail(c.email)) return;
      const p = (out.data.people || [])[i] || {};
      const revealed = await matchPersonEmail({ personId: p.id, firstName: p.first_name, lastName: p.last_name, domain });
      if (revealed.ok && revealed.data) c.email = revealed.data;
    }));
  }

  return { ok: true, data: contacts };
}

/** Reveal a single person's email — PAID tier (consumes an email credit). */
export async function matchPersonEmail(
  opts: { personId?: string; firstName?: string; lastName?: string; domain?: string },
): Promise<ApolloOutcome<string | null>> {
  const out = await apolloFetch<{ person?: any }>(`/people/match?reveal_personal_emails=true`, {
    method: 'POST',
    body: JSON.stringify({
      id: opts.personId,
      first_name: opts.firstName,
      last_name: opts.lastName,
      domain: opts.domain,
    }),
  });
  if (!out.ok) return out;
  const email = out.data.person?.email;
  return { ok: true, data: isLockedEmail(email) ? null : email };
}

/** Company search by industry/size — PAID tier. */
export async function searchCompanies(
  opts: { industries: string[]; minEmployees: number; maxEmployees: number; perPage?: number },
): Promise<ApolloOutcome<{ organizations: any[]; total: number }>> {
  const out = await apolloFetch<{ organizations?: any[]; pagination?: any }>(`/mixed_companies/search`, {
    method: 'POST',
    body: JSON.stringify({
      industry_tag_names: opts.industries,
      num_employees_ranges: [`${opts.minEmployees},${opts.maxEmployees}`],
      page: 1,
      per_page: opts.perPage ?? 25,
    }),
  });
  if (!out.ok) return out;
  return { ok: true, data: { organizations: out.data.organizations || [], total: out.data.pagination?.total_entries || 0 } };
}
