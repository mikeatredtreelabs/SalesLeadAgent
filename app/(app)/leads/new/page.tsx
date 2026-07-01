'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

const f = "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 placeholder-slate-400 bg-white";

export default function NewLeadPage() {
  const router = useRouter();
  const [bulk, setBulk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [enriching, setEnriching] = useState(false);
  const [enrichMsg, setEnrichMsg] = useState('');
  const [form, setForm] = useState({
    companyName: '', website: '', industry: '', location: '', size: '',
    contactName: '', contactTitle: '', contactEmail: '', notes: '', source: '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Free-tier Apollo: pull real firmographics for the entered website.
  async function enrich() {
    if (!form.website.trim()) return;
    setEnriching(true); setEnrichMsg('');
    try {
      const res = await fetch('/api/apollo-enrich', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website: form.website.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEnrichMsg(data.code === 'PAID_PLAN_REQUIRED' ? 'Enrichment needs a paid Apollo plan.' : (data.error || 'Enrichment failed.'));
      } else if (!data.firmographics) {
        setEnrichMsg('No Apollo match for that domain.');
      } else {
        const fm = data.firmographics;
        setForm(prev => ({
          ...prev,
          companyName: prev.companyName || fm.companyName || '',
          industry: fm.industry || prev.industry,
          location: fm.location || prev.location,
          size: fm.size || prev.size,
        }));
        setEnrichMsg('Filled from Apollo.');
      }
    } catch {
      setEnrichMsg('Enrichment failed.');
    }
    setEnriching(false);
  }

  async function submit() {
    if (!form.companyName.trim()) return;
    setLoading(true);
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, contact: { name: form.contactName, title: form.contactTitle, email: form.contactEmail } }),
    });
    router.push('/leads');
    router.refresh();
  }

  async function submitBulk() {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setLoading(true);
    await Promise.all(lines.map(line => {
      const isUrl = line.includes('.');
      const name = isUrl ? line.replace(/^https?:\/\//, '').replace(/www\./, '').split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : line;
      return fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: name, website: isUrl ? line : '', source: 'Bulk Import' }),
      });
    }));
    router.push('/leads');
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/leads" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to leads
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center"><Plus size={18} className="text-white" /></div>
        <h1 className="text-xl font-semibold text-slate-900">Add new lead</h1>
      </div>
      <div className="flex gap-2 mb-6">
        {['Single lead', 'Bulk paste'].map(t => (
          <button key={t} onClick={() => setBulk(t === 'Bulk paste')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${(t === 'Bulk paste') === bulk ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'}`}>
            {t}
          </button>
        ))}
      </div>
      {bulk ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <p className="text-sm text-slate-600 mb-3">Paste company names or URLs, one per line.</p>
          <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={8}
            className={f + ' resize-none'} placeholder={'hartwellfreight.com\nMeridian Import Group\ntruenorthdist.com'} />
          <button onClick={submitBulk} disabled={loading || !bulkText.trim()}
            className="mt-4 w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={14} className="animate-spin" /> Importing...</> : `Import ${bulkText.split('\n').filter(l => l.trim()).length} leads`}
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Company name *</label>
              <input value={form.companyName} onChange={e => set('companyName', e.target.value)} className={f} placeholder="Hartwell Freight Solutions" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-500">Website</label>
                <button type="button" onClick={enrich} disabled={enriching || !form.website.trim()}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors">
                  {enriching ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  {enriching ? 'Enriching...' : 'Auto-fill from Apollo'}
                </button>
              </div>
              <input value={form.website} onChange={e => { set('website', e.target.value); setEnrichMsg(''); }} className={f} placeholder="hartwellfreight.com" />
              {enrichMsg && <p className="text-xs text-slate-400 mt-1">{enrichMsg}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Industry</label>
              <input value={form.industry} onChange={e => set('industry', e.target.value)} className={f} placeholder="Logistics / Freight" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Location</label>
              <input value={form.location} onChange={e => set('location', e.target.value)} className={f} placeholder="Atlanta, GA" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Company size</label>
              <input value={form.size} onChange={e => set('size', e.target.value)} className={f} placeholder="45–80 employees" />
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-3">Primary contact</p>
            <div className="grid grid-cols-3 gap-3">
              <input value={form.contactName} onChange={e => set('contactName', e.target.value)} className={f} placeholder="Name" />
              <input value={form.contactTitle} onChange={e => set('contactTitle', e.target.value)} className={f} placeholder="Title" />
              <input value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} className={f} placeholder="Email" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Notes & intel</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
              className={f + ' resize-none'} placeholder="What do you know about this company? Any signals, pain points, or how you found them." />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Lead source</label>
            <input value={form.source} onChange={e => set('source', e.target.value)} className={f} placeholder="LinkedIn, referral, event, etc." />
          </div>
          <button onClick={submit} disabled={loading || !form.companyName.trim()}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={14} className="animate-spin" /> Adding...</> : 'Add lead'}
          </button>
        </div>
      )}
    </div>
  );
}
