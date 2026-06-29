export type Tenant = {
  name: string;
  shortName: string;
  tagline: string;
  logoText: string;
  theme: 'red' | 'blue';
  seedEmail: string;
};

const tenants: Record<string, Tenant> = {
  redtreeai: {
    name: 'Red Tree AI',
    shortName: 'RedTree',
    tagline: 'AI sales intelligence',
    logoText: 'RT',
    theme: 'red',
    seedEmail: 'admin@redtreeai.com',
  },
  default: {
    name: 'SalesLeadAgent',
    shortName: 'SLA',
    tagline: 'AI sales intelligence',
    logoText: 'SLA',
    theme: 'blue',
    seedEmail: 'admin@salesleadagent.io',
  },
};

export function getTenant(): Tenant {
  const key = process.env.NEXT_PUBLIC_TENANT || 'redtreeai';
  return tenants[key] || tenants.default;
}

export default tenants;
