'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, Building2, Plus, CheckSquare, Square, AlertCircle, Globe, ChevronRight, CheckCircle2, Users, MapPin, Zap } from 'lucide-react';

interface Competitor {
  name: string;
  website: string;
  industry: string;
  location: string;
  reason: string;
  size: string;
}

interface CompanyInfo {
  name: string;
  description: string;
  industry: string;
  location: string;
}

export default function CompetitorFinder() {
  const router = useRouter();
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState<Set<number>>(new Set());

  async function findCompetitors() {
    if (!website.trim()) return;
    setLoading(true); setError(''); setCompany(null); setCompetitors([]); setSelected(new Set()); setImported(new Set());
    try {
      const res = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website: website.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setCompany(data.company);
      setCompetitors(data.competitors || []);
      // Select all by default
      setSelected(new Set(data.competitors.map((_: any, i: number) => i)));
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  function toggleAll() {
    if (selected.size === competitors.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(competitors.map((_, i) => i)));
    }
  }

  function toggle(i: number) {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelected(next);
  }

  async function importSelected() {
    if (!selected.size) return;
    setImporting(true);
    const toImport = [...selected];

    for (const i of toImport) {
      const c = competitors[i];
      // Enrich firmographics via the free Apollo tier; prefer real data over the AI guess.
      let firm: any = null;
      if (c.website) {
        firm = await fetch('/api/apollo-enrich', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ website: c.website, companyName: c.name }),
        }).then(r => r.json()).then(d => d.firmographics || null).catch(() => null);
      }
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: c.name,
          website: firm?.website || c.website,
          industry: firm?.industry || c.industry,
          location: firm?.location || c.location,
          size: firm?.size || c.size,
          notes: `Competitor of ${company?.name}. ${c.reason}`,
          source: 'Competitor Research',
        }),
      });
      setImported(prev => new Set(prev).add(i));
    }

    setImporting(false);
    router.refresh();
  }

  const allSelected = selected.size === competitors.length && competitors.length > 0;
  const someSelected = selected.size > 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Competitor finder</h1>
        <p className="text-sm text-slate-500 mt-1">Enter a company's website to discover their competitors and add them as leads</p>
      </div>

      {/* Search bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <label className="block text-xs font-medium text-slate-500 mb-2">Company website</label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={website}
              onChange={e => setWebsite(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && findCompetitors()}
              placeholder="interrainternational.com"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-white text-slate-800 placeholder-slate-400"
            />
          </div>
          <button
            onClick={findCompetitors}
            disabled={loading || !website.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm whitespace-nowrap">
            {loading
              ? <><Loader2 size={14} className="animate-spin" /> Finding competitors...</>
              : <><Search size={14} /> Find competitors</>}
          </button>
        </div>
        {error && (
          <div className="flex items-center gap-2 mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
            <AlertCircle size={14} /> {error}
          </div>
        )}
      </div>

      {/* Company summary */}
      {company && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 flex items-start gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">{company.name}</p>
            <p className="text-xs text-blue-700 mt-0.5">{company.description}</p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-blue-600">
              {company.industry && <span className="flex items-center gap-1"><Zap size={11} />{company.industry}</span>}
              {company.location && <span className="flex items-center gap-1"><MapPin size={11} />{company.location}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {competitors.length > 0 && (
        <div>
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleAll}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
                {allSelected
                  ? <CheckSquare size={16} className="text-blue-600" />
                  : <Square size={16} className="text-slate-400" />}
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
              {someSelected && (
                <span className="text-xs text-slate-400">{selected.size} of {competitors.length} selected</span>
              )}
            </div>
            <button
              onClick={importSelected}
              disabled={!someSelected || importing || imported.size === selected.size}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
              {importing
                ? <><Loader2 size={14} className="animate-spin" /> Adding leads...</>
                : imported.size > 0 && imported.size === selected.size
                ? <><CheckCircle2 size={14} /> Added to leads</>
                : <><Plus size={14} /> Add {selected.size} lead{selected.size !== 1 ? 's' : ''}</>}
            </button>
          </div>

          {/* Competitor cards */}
          <div className="space-y-2">
            {competitors.map((c, i) => {
              const isSelected = selected.has(i);
              const isImported = imported.has(i);
              return (
                <div
                  key={i}
                  onClick={() => !isImported && toggle(i)}
                  className={`flex items-center gap-4 bg-white border rounded-xl px-5 py-4 transition-all cursor-pointer
                    ${isImported ? 'border-emerald-200 bg-emerald-50/50 cursor-default' :
                      isSelected ? 'border-blue-300 bg-blue-50/30' :
                      'border-slate-200 hover:border-slate-300'}`}>

                  {/* Checkbox */}
                  <div className="flex-shrink-0">
                    {isImported
                      ? <CheckCircle2 size={18} className="text-emerald-500" />
                      : isSelected
                      ? <CheckSquare size={18} className="text-blue-600" />
                      : <Square size={18} className="text-slate-300" />}
                  </div>

                  {/* Company icon */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected && !isImported ? 'bg-blue-100' : 'bg-slate-100'}`}>
                    <Building2 size={15} className={isSelected && !isImported ? 'text-blue-600' : 'text-slate-400'} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                      {isImported && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Added</span>}
                    </div>
                    <p className="text-xs text-slate-500 mb-1">{c.reason}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      {c.website && <span className="flex items-center gap-1"><Globe size={10} />{c.website}</span>}
                      {c.location && <span className="flex items-center gap-1"><MapPin size={10} />{c.location}</span>}
                      {c.size && <span className="flex items-center gap-1"><Users size={10} />{c.size}</span>}
                    </div>
                  </div>

                  {/* Industry badge */}
                  {c.industry && (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full flex-shrink-0">{c.industry}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom import bar */}
          {someSelected && imported.size < selected.size && (
            <div className="mt-4 flex items-center justify-between bg-slate-900 text-white rounded-xl px-5 py-3.5">
              <p className="text-sm">
                <span className="font-semibold">{selected.size} competitor{selected.size !== 1 ? 's' : ''}</span> selected — ready to add as leads
              </p>
              <button
                onClick={importSelected}
                disabled={importing}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                {importing
                  ? <><Loader2 size={14} className="animate-spin" /> Adding...</>
                  : <><Plus size={14} /> Add to leads</>}
              </button>
            </div>
          )}

          {imported.size === competitors.length && (
            <div className="mt-4 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3.5">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 size={16} />
                <p className="text-sm font-medium">All {imported.size} competitors added to your leads</p>
              </div>
              <button onClick={() => router.push('/leads')}
                className="flex items-center gap-1.5 text-sm text-emerald-700 font-medium hover:underline">
                View leads <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
