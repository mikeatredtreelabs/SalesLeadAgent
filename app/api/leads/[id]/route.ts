import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function getLead(id: string, userId: string) {
  return prisma.lead.findFirst({
    where: { id, userId },
    include: {
      contacts: true,
      research: { orderBy: { createdAt: 'desc' }, take: 1 },
      scoreDetail: true,
      opportunities: { orderBy: { createdAt: 'desc' } },
      outreach: { orderBy: { createdAt: 'desc' } },
      callPrep: true,
      activities: { orderBy: { createdAt: 'desc' } },
      followUps: { orderBy: { dueDate: 'asc' } },
    },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const lead = await getLead(id, (session.user as any).id);
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const lead = await prisma.lead.update({
    where: { id },
    data: { status: body.status, score: body.score, updatedAt: new Date() },
  });
  if (body.status) {
    await prisma.agentActivity.create({
      data: { leadId: id, agent: 'CRM Agent', action: `Status → ${body.status}`, detail: 'Manual status update' }
    });
  }
  return NextResponse.json(lead);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await prisma.lead.deleteMany({ where: { id, userId: (session.user as any).id } });
  return NextResponse.json({ ok: true });
}
