import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGmailAuthUrl } from '@/lib/google';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.redirect('/login');
  const url = getGmailAuthUrl();
  return NextResponse.redirect(url);
}
