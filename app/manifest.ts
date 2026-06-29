import type { MetadataRoute } from 'next';
import { getTenant } from '@/config/tenant';

export default function manifest(): MetadataRoute.Manifest {
  const tenant = getTenant();
  return {
    name: tenant.name,
    short_name: tenant.shortName,
    description: 'AI-powered sales lead intelligence',
    start_url: '/',
    display: 'browser',
    background_color: '#ffffff',
    theme_color: tenant.theme === 'red' ? '#dc2626' : '#2563eb',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
