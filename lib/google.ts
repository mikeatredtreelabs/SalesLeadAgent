import { google } from 'googleapis';

export function getGoogleOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/gmail/callback`
  );
}

export function getGmailAuthUrl() {
  const client = getGoogleOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  });
}

// Email headers must be ASCII (RFC 5322). A raw UTF-8 character like an
// em-dash (—) in the Subject gets misdecoded by mail clients into mojibake
// ("Ã¢Â€Â"). RFC 2047 "encoded-word" wraps non-ASCII header values so clients
// decode them back to the exact UTF-8 string. Pure-ASCII values pass through.
function encodeHeaderWord(value: string) {
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

export function buildRawEmail({ to, subject, body, from }: { to: string; subject: string; body: string; from: string }) {
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeHeaderWord(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    body,
  ];
  const message = lines.join('\r\n');
  return Buffer.from(message, 'utf8').toString('base64url');
}
