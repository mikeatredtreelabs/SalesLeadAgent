import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getGoogleOAuthClient, buildRawEmail } from '@/lib/google';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;

  const { to, subject, body, outreachMessageId } = await req.json();
  if (!to || !body) return NextResponse.json({ error: 'Recipient and body are required' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.gmailConnected || !user.googleRefreshToken) {
    return NextResponse.json({ error: 'Gmail not connected. Go to Settings to connect your Gmail account.' }, { status: 400 });
  }

  try {
    const client = getGoogleOAuthClient();
    client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
      expiry_date: user.googleTokenExpiry?.getTime(),
    });

    // Refresh token if needed
    const { credentials } = await client.refreshAccessToken();
    client.setCredentials(credentials);
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: credentials.access_token,
        googleTokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
      },
    });

    const gmail = google.gmail({ version: 'v1', auth: client });
    const raw = buildRawEmail({ to, subject: subject || '(no subject)', body, from: user.email });

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });

    // Mark the outreach message as sent if an ID was provided
    if (outreachMessageId) {
      await prisma.outreachMessage.update({
        where: { id: outreachMessageId },
        data: { sentAt: new Date() },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to send email' }, { status: 500 });
  }
}
