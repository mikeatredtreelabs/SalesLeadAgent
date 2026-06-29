'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight } from 'lucide-react';

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

  const f = "w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 bg-white text-slate-800 placeholder-slate-400";

  return (
    <div className="min-h-screen flex">
      {/* Left panel — red brand */}
      <div className="hidden lg:flex w-1/2 bg-red-600 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="font-bold text-white text-sm">RT</span>
          </div>
          <span className="font-bold text-white text-lg">Red Tree AI</span>
        </div>
        <div>
          <p className="text-red-100 text-sm mb-4 font-medium uppercase tracking-wider">What it does</p>
          {[
            'Researches companies using AI agents',
            'Scores leads across 9 dimensions',
            'Generates pain-point-first outreach',
            'Preps you for discovery calls',
          ].map(item => (
            <div key={item} className="flex items-center gap-3 mb-3">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="text-red-50 text-sm">{item}</span>
            </div>
          ))}
        </div>
        <p className="text-red-300 text-xs">Powered by Red Tree AI</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-white text-xs">RT</span>
            </div>
            <span className="font-bold text-slate-900">Red Tree AI</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-1">Sign in</h1>
          <p className="text-sm text-slate-500 mb-7">Access your AI sales pipeline</p>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5">{error}</div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className={f} placeholder="you@redtreeai.com" required autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className={f} placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm mt-2">
              {loading
                ? <><Loader2 size={14} className="animate-spin" />Signing in...</>
                : <>Sign in <ArrowRight size={14} /></>}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            First time? Run <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">npm run seed</code> to create your account.
          </p>
        </div>
      </div>
    </div>
  );
}
