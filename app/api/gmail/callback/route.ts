import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getGoogleOAuthClient } from '@/lib/google';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.redirect(new URL('/login', req.url));

  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.redirect(new URL('/settings?gmail=error', req.url));

  try {
    const client = getGoogleOAuthClient();
    const { tokens } = await client.getToken(code);

    // The send route needs gmail.send. Google's granular consent lets users
    // decline individual scopes, so verify it was actually granted before we
    // mark the account connected — otherwise sending fails later with a
    // cryptic "insufficient authentication scopes" error.
    const SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';
    const grantedScopes = (tokens.scope || '').split(' ');
    if (!grantedScopes.includes(SEND_SCOPE)) {
      return NextResponse.redirect(new URL('/settings?gmail=insufficient_scope', req.url));
    }

    await prisma.user.update({
      where: { id: (session.user as any).id },
      data: {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
        googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        gmailConnected: true,
      },
    });

    return NextResponse.redirect(new URL('/settings?gmail=connected', req.url));
  } catch (e) {
    return NextResponse.redirect(new URL('/settings?gmail=error', req.url));
  }
}
