export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Settings</h1>
      <div className="bg-white border border-slate-200 rounded-xl p-5 max-w-lg">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Account</h2>
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex justify-between"><span className="text-slate-500">Email</span><span>{session.user?.email}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Name</span><span>{session.user?.name || '—'}</span></div>
        </div>
        <div className="mt-6 pt-5 border-t border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Environment variables</h2>
          <div className="space-y-2 text-xs font-mono bg-slate-50 rounded-lg p-3 text-slate-600">
            <div>DATABASE_URL=postgresql://...</div>
            <div>NEXTAUTH_SECRET=your-secret</div>
            <div>NEXTAUTH_URL=http://localhost:3000</div>
            <div>ANTHROPIC_API_KEY=sk-ant-...</div>
            <div className="text-slate-400">APOLLO_API_KEY=optional</div>
          </div>
        </div>
      </div>
    </div>
  );
}
