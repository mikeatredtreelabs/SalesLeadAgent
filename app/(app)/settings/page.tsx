export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ChangePasswordForm from './ChangePasswordForm';
import GmailConnectCard from './GmailConnectCard';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { gmailConnected: true, email: true },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account and configuration</p>
      </div>

      <div className="grid grid-cols-2 gap-6 max-w-4xl">
        {/* Account info */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Account</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Email</p>
              <p className="text-sm text-slate-800">{session.user?.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Name</p>
              <p className="text-sm text-slate-800">{session.user?.name || '—'}</p>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Environment</h2>
            <div className="space-y-1.5 text-xs font-mono bg-slate-50 rounded-lg p-3 text-slate-500">
              <div><span className="text-slate-400">DATABASE_URL</span> ✓</div>
              <div><span className="text-slate-400">NEXTAUTH_SECRET</span> ✓</div>
              <div><span className="text-slate-400">ANTHROPIC_API_KEY</span> {process.env.ANTHROPIC_API_KEY ? '✓' : '✗ missing'}</div>
              <div><span className="text-slate-400">APOLLO_API_KEY</span> {process.env.APOLLO_API_KEY ? '✓' : 'not set'}</div>
              <div><span className="text-slate-400">GOOGLE_CLIENT_ID</span> {process.env.GOOGLE_CLIENT_ID ? '✓' : 'not set'}</div>
            </div>
          </div>
        </div>

        {/* Change password */}
        <ChangePasswordForm />

        {/* Gmail connect */}
        <GmailConnectCard connected={!!user?.gmailConnected} email={user?.email} />
      </div>
    </div>
  );
}
