'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, CheckCircle2, Loader2, ExternalLink, Unlink } from 'lucide-react';

export default function GmailConnectCard({ connected, email }: { connected: boolean; email?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [disconnecting, setDisconnecting] = useState(false);
  const gmailStatus = params.get('gmail');

  async function disconnect() {
    setDisconnecting(true);
    await fetch('/api/gmail/disconnect', { method: 'POST' });
    router.refresh();
    setDisconnecting(false);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
          <Mail size={14} className="text-red-500" />
        </div>
        <h2 className="text-sm font-semibold text-slate-700">Gmail</h2>
      </div>

      {gmailStatus === 'connected' && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-4 text-sm text-emerald-700">
          <CheckCircle2 size={14} /> Gmail connected successfully
        </div>
      )}
      {gmailStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 text-sm text-red-700">
          Connection failed. Please try again.
        </div>
      )}

      {connected ? (
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-700 mb-4">
            <CheckCircle2 size={15} className="text-emerald-500" />
            Connected as <span className="font-medium">{email}</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            You can now send outreach messages directly from the Lead Detail page without leaving the app.
          </p>
          <button onClick={disconnect} disabled={disconnecting}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
            {disconnecting ? <Loader2 size={12} className="animate-spin" /> : <Unlink size={12} />}
            Disconnect Gmail
          </button>
        </div>
      ) : (
        <div>
          <p className="text-xs text-slate-500 mb-4">
            Connect your Gmail account to send outreach emails directly from SalesLeadAgent — no copy-paste required.
          </p>
          <a href="/api/gmail/connect"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
            <ExternalLink size={14} /> Connect Gmail
          </a>
        </div>
      )}
    </div>
  );
}
