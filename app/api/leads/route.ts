import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const leads = await prisma.lead.findMany({
    where: { userId },
    include: { contacts: true, scoreDetail: true, activities: { orderBy: { createdAt: 'desc' }, take: 1 } },
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const body = await req.json();
  const lead = await prisma.lead.create({
    data: {
      userId,
      companyName: body.companyName,
      website: body.website,
      industry: body.industry,
      location: body.location,
      size: body.size,
      notes: body.notes,
      source: body.source,
      status: 'New',
      contacts: body.contact?.name ? {
        create: { name: body.contact.name, title: body.contact.title, email: body.contact.email, linkedin: body.contact.linkedin, isPrimary: true }
      } : undefined,
    },
    include: { contacts: true },
  });
  await prisma.agentActivity.create({
    data: { leadId: lead.id, agent: 'Intake Agent', action: 'Lead created', detail: `Added via ${body.source || 'manual entry'}` }
  });
  return NextResponse.json(lead);
}
