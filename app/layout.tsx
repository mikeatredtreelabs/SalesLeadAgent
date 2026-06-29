import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { getTenant } from '@/config/tenant';

const inter = Inter({ subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  const tenant = getTenant();
  return {
    title: `${tenant.name} — AI Sales Intelligence`,
    description: `AI-powered lead research and outreach by ${tenant.name}`,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const tenant = getTenant();
  const { colors } = tenant;

  return (
    <html lang="en">
      <head>
        <style>{`
          :root {
            --tenant-primary: ${colors.primary};
            --tenant-primary-hover: ${colors.primaryHover};
            --tenant-primary-light: ${colors.primaryLight};
            --tenant-primary-light-text: ${colors.primaryLightText};
            --tenant-sidebar: ${colors.sidebar};
            --tenant-sidebar-border: ${colors.sidebarBorder};
          }
        `}</style>
      </head>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
