export type Tenant = {
  name: string;
  shortName: string;
  tagline: string;
  seedEmail: string;
};

const tenants: Record<string, Tenant> = {
  redtreeai: {
    name: 'Red Tree AI',
    shortName: 'RedTree',
    tagline: 'AI sales intelligence',
    seedEmail: 'admin@redtreeai.com',
  },
  default: {
    name: 'SalesLeadAgent',
    shortName: 'SLA',
    tagline: 'AI sales intelligence',
    seedEmail: 'admin@salesleadagent.io',
  },
};

export function getTenant(): Tenant {
  const key = process.env.NEXT_PUBLIC_TENANT || 'redtreeai';
  return tenants[key] || tenants.default;
}

export default tenants;
