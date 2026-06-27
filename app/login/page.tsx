'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Brain, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await signIn('credentials', { email, password, redirect: false });
    if (res?.ok) { router.push('/'); router.refresh(); }
    else { setError('Invalid email or password'); setLoading(false); }
  }

  const f = "w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <Brain size={18} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900 leading-none">LeadAgent</p>
            <p className="text-xs text-slate-400">AI sales intelligence</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h1 className="text-lg font-semibold text-slate-900 mb-5">Sign in</h1>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}
          <form onSubmit={submit} className="space-y-3">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={f} placeholder="Email" required />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={f} placeholder="Password" required />
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={14} className="animate-spin" />Signing in...</> : 'Sign in'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">
          No account? Run <code className="bg-slate-100 px-1 rounded">npm run seed</code> to create one.
        </p>
      </div>
    </div>
  );
}
