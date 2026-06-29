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
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
