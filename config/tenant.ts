export type Tenant = {
  name: string;
  shortName: string;
  tagline: string;
  logoText: string;
  colors: {
    primary: string;       // main brand color (buttons, links, active states)
    primaryHover: string;  // hover state
    primaryLight: string;  // light bg (badges, highlights)
    primaryLightText: string; // text on light bg
    accent: string;        // secondary accent
    sidebar: string;       // sidebar background
    sidebarBorder: string; // sidebar border
  };
  seedEmail: string;
};

const tenants: Record<string, Tenant> = {
  redtreeai: {
    name: 'Red Tree AI',
    shortName: 'RedTree',
    tagline: 'AI sales intelligence',
    logoText: 'RT',
    colors: {
      primary: '#dc2626',        // red-600
      primaryHover: '#b91c1c',   // red-700
      primaryLight: '#fef2f2',   // red-50
      primaryLightText: '#991b1b', // red-800
      accent: '#1c1c1c',         // near-black
      sidebar: '#0f0f0f',        // deep black sidebar
      sidebarBorder: '#262626',  // dark border
    },
    seedEmail: 'admin@redtreeai.com',
  },
  default: {
    name: 'SalesLeadAgent',
    shortName: 'SLA',
    tagline: 'AI sales intelligence',
    logoText: 'SLA',
    colors: {
      primary: '#2563eb',
      primaryHover: '#1d4ed8',
      primaryLight: '#eff6ff',
      primaryLightText: '#1e40af',
      accent: '#0ea5e9',
      sidebar: '#ffffff',
      sidebarBorder: '#e2e8f0',
    },
    seedEmail: 'admin@salesleadagent.io',
  },
};

export function getTenant(): Tenant {
  const key = process.env.NEXT_PUBLIC_TENANT || 'redtreeai';
  return tenants[key] || tenants.default;
}

export default tenants;
