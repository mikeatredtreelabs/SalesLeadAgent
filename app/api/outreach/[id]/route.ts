import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { subject, body } = await req.json();
  if (typeof body !== 'string' || !body.trim()) {
    return NextResponse.json({ error: 'Body is required' }, { status: 400 });
  }

  // Ownership-scoped: only update if the message's lead belongs to this user.
  // Edits go to editedBody so the original AI draft in `body` is preserved.
  const result = await prisma.outreachMessage.updateMany({
    where: { id, lead: { userId: (session.user as any).id } },
    data: { subject: subject || null, editedBody: body },
  });

  if (result.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
