import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.user.update({
    where: { id: (session.user as any).id },
    data: { googleAccessToken: null, googleRefreshToken: null, googleTokenExpiry: null, gmailConnected: false },
  });

  return NextResponse.json({ ok: true });
}
