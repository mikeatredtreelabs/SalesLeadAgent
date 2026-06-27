'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Loader2, Building2, AlertCircle } from 'lucide-react';

const INDUSTRIES = ['Logistics','Freight','Import/Export','Distribution','Wholesale','Manufacturing','Supply Chain','Transportation','Customs Brokerage','Trade Finance'];

export default function DiscoverPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [min, setMin] = useState('10');
  const [max, setMax] = useState('500');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState<Set<string>>(new Set());

  async function search() {
    if (!selected.length) return;
    setLoading(true); setError(''); setResults([]);
    const res = await fetch('/api/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ industries: selected, minEmployees: parseInt(min), maxEmployees: parseInt(max) }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || 'Search failed');
    else setResults(data.companies || []);
    setLoading(false);
  }

  async function importLead(company: any) {
    setImporting(s => new Set(s).add(company.companyName));
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(company),
    });
    router.refresh();
  }

  const f = "px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400 bg-white w-20 text-center";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Discover leads</h1>
        <p className="text-sm text-slate-500 mt-1">Search for companies via Apollo.io by industry and size</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 mb-2">Industries</p>
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map(i => (
              <button key={i} onClick={() => setSelected(s => s.includes(i) ? s.filter(x => x !== i) : [...s, i])}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selected.includes(i) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {i}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs text-slate-500">Employees:</span>
          <input value={min} onChange={e => setMin(e.target.value)} className={f} placeholder="10" />
          <span className="text-xs text-slate-400">to</span>
          <input value={max} onChange={e => setMax(e.target.value)} className={f} placeholder="500" />
        </div>
        <button onClick={search} disabled={loading || !selected.length}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {loading ? <><Loader2 size={14} className="animate-spin" />Searching...</> : <><Search size={14} />Search Apollo</>}
        </button>
        {!process.env.NEXT_PUBLIC_HAS_APOLLO && (
          <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Add <code>APOLLO_API_KEY</code> to your .env.local to enable live search. Get a free key at apollo.io.
          </p>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
          <AlertCircle size={15} />{error}
        </div>
      )}

      {results.length > 0 && (
        <div>
          <p className="text-sm text-slate-500 mb-3">{results.length} companies found</p>
          <div className="space-y-2">
            {results.map((c, i) => (
              <div key={i} className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl px-5 py-4">
                <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 size={16} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{c.companyName}</p>
                  <p className="text-xs text-slate-500">{[c.industry, c.location, c.size].filter(Boolean).join(' · ')}</p>
                </div>
                <button onClick={() => importLead(c)} disabled={importing.has(c.companyName)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-100 disabled:opacity-50 transition-colors">
                  {importing.has(c.companyName) ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  {importing.has(c.companyName) ? 'Added' : 'Add lead'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
