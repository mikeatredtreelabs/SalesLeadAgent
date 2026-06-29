export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import LeadDetailClient from './LeadDetailClient';

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const userId = (session.user as any).id;
  const { id } = await params;

  const lead = await prisma.lead.findFirst({
    where: { id, userId },
    include: {
      contacts: true,
      research: { orderBy: { createdAt: 'desc' }, take: 1 },
      scoreDetail: true,
      opportunities: { orderBy: { createdAt: 'desc' } },
      outreach: { orderBy: { createdAt: 'desc' } },
      callPrep: true,
      activities: { orderBy: { createdAt: 'desc' } },
      followUps: { where: { completed: false }, orderBy: { dueDate: 'asc' } },
    },
  });

  if (!lead) notFound();
  return <LeadDetailClient lead={JSON.parse(JSON.stringify(lead))} />;
}
