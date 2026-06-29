'use client';
import { useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

const f = "w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-white text-slate-800 placeholder-slate-400";

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess(false);

    if (next !== confirm) {
      setError('New passwords do not match');
      return;
    }
    if (next.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    const data = await res.json();

    if (res.ok) {
      setSuccess(true);
      setCurrent(''); setNext(''); setConfirm('');
    } else {
      setError(data.error || 'Something went wrong');
    }
    setLoading(false);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
          <KeyRound size={14} className="text-blue-600" />
        </div>
        <h2 className="text-sm font-semibold text-slate-700">Change password</h2>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 mb-4 text-sm text-emerald-700">
          <CheckCircle2 size={15} /> Password updated successfully
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Current password</label>
          <input
            type="password"
            value={current}
            onChange={e => setCurrent(e.target.value)}
            className={f}
            placeholder="••••••••"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">New password</label>
          <input
            type="password"
            value={next}
            onChange={e => setNext(e.target.value)}
            className={f}
            placeholder="Min. 8 characters"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Confirm new password</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className={f}
            placeholder="••••••••"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading || !current || !next || !confirm}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-2">
          {loading
            ? <><Loader2 size={14} className="animate-spin" /> Updating...</>
            : 'Update password'}
        </button>
      </form>
    </div>
  );
}
