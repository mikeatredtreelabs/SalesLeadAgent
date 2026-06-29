'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Loader2, Building2, AlertCircle, Globe, CheckSquare, Square, ChevronDown, ChevronUp, Sparkles, Users } from 'lucide-react';

const INDUSTRIES = ['Logistics','Freight','Import/Export','Distribution','Wholesale','Manufacturing','Supply Chain','Transportation','Customs Brokerage','Trade Finance'];

const SIZE_FILTERS = [
  { label: 'Small business', description: '1–50 employees', min: 1, max: 50 },
  { label: 'Medium', description: '51–500 employees', min: 51, max: 500 },
  { label: 'Enterprise', description: '500+ employees', min: 500, max: 10000 },
];

export default function DiscoverPage() {
  const router = useRouter();

  // Competitor finder state
  const [compWebsite, setCompWebsite] = useState('');
  const [compSizes, setCompSizes] = useState<string[]>([]);
  const [compLoading, setCompLoading] = useState(false);
  const [compResult, setCompResult] = useState<any>(null);
  const [compError, setCompError] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState<Set<number>>(new Set());

  // Apollo state
  const [industries, setIndustries] = useState<string[]>([]);
  const [min, setMin] = useState('10');
  const [max, setMax] = useState('500');
  const [apolloLoading, setApolloLoading] = useState(false);
  const [apolloResults, setApolloResults] = useState<any[]>([]);
  const [apolloError, setApolloError] = useState('');
  const [apolloImporting, setApolloImporting] = useState<Set<string>>(new Set());
  const [showApollo, setShowApollo] = useState(false);

  function toggleCompSize(label: string) {
    setCompSizes(s => s.includes(label) ? s.filter(x => x !== label) : [...s, label]);
  }

  async function findCompetitors() {
    if (!compWebsite.trim()) return;
    setCompLoading(true); setCompError(''); setCompResult(null); setSelected(new Set()); setImportDone(new Set());

    // Build size ranges from selected filters
    const sizeRanges = compSizes.length > 0
      ? SIZE_FILTERS.filter(s => compSizes.includes(s.label)).map(s => ({ min: s.min, max: s.max }))
      : null;

    const res = await fetch('/api/competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ website: compWebsite.trim(), sizeRanges }),
    });
    const data = await res.json();
    if (!res.ok) setCompError(data.error || 'Search failed');
    else setCompResult(data);
    setCompLoading(false);
  }

  function toggleSelect(i: number) {
    setSelected(s => {
      const next = new Set(s);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function toggleAll() {
    if (!compResult) return;
    const available = compResult.competitors
      .map((_: any, i: number) => i)
      .filter((i: number) => !importDone.has(i));
    const allSelected = available.every((i: number) => selected.has(i));
    setSelected(allSelected ? new Set() : new Set(available));
  }

  async function importSelected() {
    if (!selected.size || !compResult) return;
    setImporting(true);
    const toImport = [...selected];
    await Promise.all(toImport.map(async (i) => {
      const c = compResult.competitors[i];
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: c.companyName,
          website: c.website,
          industry: c.industry,
          location: c.location,
          size: c.size,
          notes: c.reason,
          source: `Competitor of ${compResult.companyName}`,
        }),
      });
    }));
    setImportDone(d => new Set([...d, ...toImport]));
    setSelected(new Set());
    setImporting(false);
    router.refresh();
  }

  async function apolloSearch() {
    if (!industries.length) return;
    setApolloLoading(true); setApolloError(''); setApolloResults([]);
    const res = await fetch('/api/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ industries, minEmployees: parseInt(min), maxEmployees: parseInt(max) }),
    });
    const data = await res.json();
    if (!res.ok) setApolloError(data.error || 'Search failed');
    else setApolloResults(data.companies || []);
    setApolloLoading(false);
  }

  async function apolloImport(company: any) {
    setApolloImporting(s => new Set(s).add(company.companyName));
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(company),
    });
    router.refresh();
  }

  const availableToSelect = compResult?.competitors
    ?.map((_: any, i: number) => i)
    ?.filter((i: number) => !importDone.has(i)) ?? [];
  const allSelected = availableToSelect.length > 0 && availableToSelect.every((i: number) => selected.has(i));
  const f = "px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400 bg-white w-20 text-center";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Discover leads</h1>
        <p className="text-sm text-slate-500 mt-1">Find competitors of any company or search by industry</p>
      </div>

      {/* ── Competitor Finder ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} className="text-blue-600" />
          <h2 className="text-sm font-semibold text-slate-800">Competitor finder</h2>
        </div>
        <p className="text-xs text-slate-500 mb-5">Enter any company website and AI will identify their competitors — then add them as leads in one click.</p>

        {/* Website input */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1">
            <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={compWebsite}
              onChange={e => setCompWebsite(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && findCompetitors()}
              placeholder="interrainternational.com"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-white"
            />
          </div>
          <button
            onClick={findCompetitors}
            disabled={compLoading || !compWebsite.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {compLoading
              ? <><Loader2 size={14} className="animate-spin" />Researching...</>
              : <><Search size={14} />Find competitors</>}
          </button>
        </div>

        {/* Company size filter */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-slate-500" />
            <p className="text-xs font-semibold text-slate-600">Filter by company size</p>
            {compSizes.length > 0 && (
              <button onClick={() => setCompSizes([])} className="ml-auto text-xs text-slate-400 hover:text-slate-600 transition-colors">
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {SIZE_FILTERS.map(s => {
              const active = compSizes.includes(s.label);
              return (
                <button
                  key={s.label}
                  onClick={() => toggleCompSize(s.label)}
                  className={`flex flex-col items-start px-4 py-3 rounded-lg border text-left transition-all ${
                    active
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                  }`}>
                  <span className="text-sm font-semibold leading-none mb-1">{s.label}</span>
                  <span className={`text-xs ${active ? 'text-blue-100' : 'text-slate-400'}`}>{s.description}</span>
                </button>
              );
            })}
          </div>
          {compSizes.length === 0 && (
            <p className="text-xs text-slate-400 mt-2.5 text-center">No filter selected — will return competitors of all sizes</p>
          )}
          {compSizes.length > 0 && (
            <p className="text-xs text-blue-600 mt-2.5 text-center font-medium">
              Filtering for: {compSizes.join(', ')}
            </p>
          )}
        </div>

        {compError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mt-4 text-sm text-red-700">
            <AlertCircle size={15} />{compError}
          </div>
        )}

        {/* Results */}
        {compResult && (
          <div className="mt-5">
            {/* Company summary */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-4">
              <p className="text-xs font-semibold text-blue-700 mb-0.5">{compResult.companyName} · {compResult.industry}</p>
              <p className="text-xs text-blue-800">{compResult.description}</p>
              {compSizes.length > 0 && (
                <p className="text-xs text-blue-600 mt-1">Showing: {compSizes.join(', ')} competitors</p>
              )}
            </div>

            {/* Select all + import bar */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={toggleAll}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors">
                {allSelected
                  ? <CheckSquare size={16} className="text-blue-600" />
                  : <Square size={16} className="text-slate-400" />}
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
              {selected.size > 0 && (
                <button
                  onClick={importSelected}
                  disabled={importing}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {importing
                    ? <><Loader2 size={14} className="animate-spin" />Adding...</>
                    : <><Plus size={14} />Add {selected.size} lead{selected.size > 1 ? 's' : ''}</>}
                </button>
              )}
            </div>

            {/* Competitor list */}
            <div className="space-y-2">
              {compResult.competitors.map((c: any, i: number) => {
                const isDone = importDone.has(i);
                const isSelected = selected.has(i);
                return (
                  <div
                    key={i}
                    onClick={() => !isDone && toggleSelect(i)}
                    className={`flex items-center gap-4 rounded-xl px-4 py-3.5 border cursor-pointer transition-all
                      ${isDone
                        ? 'bg-emerald-50 border-emerald-200 cursor-default opacity-75'
                        : isSelected
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50'}`}>
                    <div className="flex-shrink-0">
                      {isDone
                        ? <CheckSquare size={18} className="text-emerald-500" />
                        : isSelected
                          ? <CheckSquare size={18} className="text-blue-600" />
                          : <Square size={18} className="text-slate-300" />}
                    </div>
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 size={14} className="text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800">{c.companyName}</p>
                        {c.website && (
                          <a href={`https://${c.website}`} target="_blank" rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-xs text-blue-500 hover:underline">{c.website}</a>
                        )}
                        {c.size && (
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{c.size}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {[c.industry, c.location].filter(Boolean).join(' · ')}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 italic">{c.reason}</p>
                    </div>
                    {isDone && <span className="text-xs text-emerald-600 font-medium flex-shrink-0">Added ✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Apollo section (collapsible) ── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowApollo(s => !s)}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors">
          <div>
            <p className="text-sm font-semibold text-slate-800">Apollo.io industry search</p>
            <p className="text-xs text-slate-500">Search for companies by industry and size — requires Apollo API key</p>
          </div>
          {showApollo ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </button>

        {showApollo && (
          <div className="px-6 pb-6 border-t border-slate-100 pt-5">
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-500 mb-2">Industries</p>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map(i => (
                  <button key={i} onClick={() => setIndustries(s => s.includes(i) ? s.filter(x => x !== i) : [...s, i])}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${industries.includes(i) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
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
            <button onClick={apolloSearch} disabled={apolloLoading || !industries.length}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors mb-4">
              {apolloLoading ? <><Loader2 size={14} className="animate-spin" />Searching...</> : <><Search size={14} />Search Apollo</>}
            </button>
            {apolloError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
                <AlertCircle size={15} />{apolloError}
              </div>
            )}
            {apolloResults.length > 0 && (
              <div className="space-y-2">
                {apolloResults.map((c, i) => (
                  <div key={i} className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5">
                    <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 size={14} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{c.companyName}</p>
                      <p className="text-xs text-slate-500">{[c.industry, c.location, c.size].filter(Boolean).join(' · ')}</p>
                    </div>
                    <button onClick={() => apolloImport(c)} disabled={apolloImporting.has(c.companyName)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-100 disabled:opacity-50 transition-colors">
                      {apolloImporting.has(c.companyName) ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                      {apolloImporting.has(c.companyName) ? 'Added' : 'Add lead'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
