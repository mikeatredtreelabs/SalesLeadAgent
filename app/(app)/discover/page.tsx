'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Loader2, Building2, AlertCircle, Globe, CheckSquare, Square, Sparkles, Users, MapPin } from 'lucide-react';

const INDUSTRIES = ['Logistics','Freight','Import/Export','Distribution','Wholesale','Manufacturing','Supply Chain','Transportation','Customs Brokerage','Trade Finance'];

const SIZE_FILTERS = [
  { label: 'Small business', description: '1–50 employees', min: 1, max: 50 },
  { label: 'Medium', description: '51–500 employees', min: 51, max: 500 },
  { label: 'Enterprise', description: '500+ employees', min: 500, max: 10000 },
];

const LOCATION_PRESETS = [
  { label: 'Atlanta Metro', region: 'Atlanta metropolitan area, Georgia (Atlanta, Marietta, Alpharetta, Duluth, Roswell, Sandy Springs, Smyrna, Decatur, GA)' },
  { label: 'Southeast US', region: 'Southeastern United States (Georgia, Florida, Alabama, Tennessee, South Carolina, North Carolina, Mississippi)' },
  { label: 'Northeast US', region: 'Northeastern United States (New York, New Jersey, Connecticut, Massachusetts, Pennsylvania, Maryland)' },
  { label: 'Midwest US', region: 'Midwestern United States (Illinois, Ohio, Michigan, Indiana, Wisconsin, Minnesota, Missouri)' },
  { label: 'Southwest US', region: 'Southwestern United States (Texas, Arizona, Nevada, New Mexico, Colorado)' },
  { label: 'West Coast', region: 'West Coast United States (California, Oregon, Washington)' },
  { label: 'Nationwide US', region: 'anywhere in the United States' },
  { label: 'Global', region: 'anywhere in the world' },
];

export default function DiscoverPage() {
  const router = useRouter();

  // Competitor finder state
  const [compWebsite, setCompWebsite] = useState('');
  const [compSizes, setCompSizes] = useState<string[]>([]);
  const [compLocation, setCompLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [compLoading, setCompLoading] = useState(false);
  const [compResult, setCompResult] = useState<any>(null);
  const [compError, setCompError] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState<Set<number>>(new Set());

  // Industry search state
  const [indSource, setIndSource] = useState<'ai' | 'apollo'>('ai');
  const [indText, setIndText] = useState('');
  const [indSizes, setIndSizes] = useState<string[]>([]);
  const [indLocation, setIndLocation] = useState('');
  const [indCustomLocation, setIndCustomLocation] = useState('');
  const [indCount, setIndCount] = useState(10);
  const [indLoading, setIndLoading] = useState(false);
  const [indResults, setIndResults] = useState<any[]>([]);
  const [indError, setIndError] = useState('');
  const [indPaidRequired, setIndPaidRequired] = useState(false);
  const [indImporting, setIndImporting] = useState<Set<string>>(new Set());

  // Single-company research state
  const [researchWebsite, setResearchWebsite] = useState('');
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchStep, setResearchStep] = useState('');
  const [researchError, setResearchError] = useState('');
  const [researchLeadId, setResearchLeadId] = useState('');

  // Run one agent against a lead; throw so the caller can stop the pipeline.
  async function runAgentStep(leadId: string, agent: string, input?: string) {
    const res = await fetch(`/api/leads/${leadId}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent, input }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `${agent} agent failed`);
    }
  }

  // Enter a single company -> create + enrich the lead, then run
  // Research -> Score -> Opportunities and open the finished lead.
  async function researchCompany() {
    if (!researchWebsite.trim() || researchLoading) return;
    setResearchError(''); setResearchLeadId(''); setResearchLoading(true);
    try {
      setResearchStep('Enriching company and reading their site…');
      const createRes = await fetch('/api/leads/research-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website: researchWebsite.trim() }),
      });
      const created = await createRes.json();
      if (!createRes.ok) throw new Error(created.error || 'Could not create the lead.');
      const { leadId, siteContent } = created;
      setResearchLeadId(leadId);

      setResearchStep('Researching the company…');
      await runAgentStep(leadId, 'research', siteContent);
      setResearchStep('Scoring the lead…');
      await runAgentStep(leadId, 'score');
      setResearchStep('Finding AI opportunities…');
      await runAgentStep(leadId, 'opportunities');

      setResearchStep('Done — opening the lead…');
      router.push(`/leads/${leadId}`);
    } catch (e: any) {
      setResearchError(e.message || 'Research failed.');
      setResearchLoading(false);
    }
  }

  function toggleCompSize(label: string) {
    setCompSizes(s => s.includes(label) ? s.filter(x => x !== label) : [...s, label]);
  }

  function selectLocation(label: string) {
    setCompLocation(prev => prev === label ? '' : label);
    setCustomLocation('');
  }

  // Resolve the active region string to pass to the API
  const activeRegion = customLocation.trim()
    || LOCATION_PRESETS.find(p => p.label === compLocation)?.region
    || '';

  async function findCompetitors() {
    if (!compWebsite.trim()) return;
    setCompLoading(true); setCompError(''); setCompResult(null); setSelected(new Set()); setImportDone(new Set());

    const sizeRanges = compSizes.length > 0
      ? SIZE_FILTERS.filter(s => compSizes.includes(s.label)).map(s => ({ min: s.min, max: s.max }))
      : null;

    const res = await fetch('/api/competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ website: compWebsite.trim(), sizeRanges, region: activeRegion || null }),
    });
    const data = await res.json();
    if (!res.ok) setCompError(data.error || 'Search failed');
    else setCompResult(data);
    setCompLoading(false);
  }

  function toggleSelect(i: number) {
    setSelected(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });
  }

  function toggleAll() {
    if (!compResult) return;
    const available = compResult.competitors.map((_: any, i: number) => i).filter((i: number) => !importDone.has(i));
    const allSelected = available.every((i: number) => selected.has(i));
    setSelected(allSelected ? new Set() : new Set(available));
  }

  async function importSelected() {
    if (!selected.size || !compResult) return;
    setImporting(true);
    const toImport = [...selected];
    await Promise.all(toImport.map(async (i) => {
      const c = compResult.competitors[i];
      // Enrich firmographics (free Apollo tier) and look for a decision-maker
      // contact (paid tier — degrades to null on a free key) in parallel.
      let contact = null;
      let firm: any = null;
      if (c.website) {
        const [contactData, enrichData] = await Promise.all([
          fetch('/api/apollo-contacts', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ website: c.website, companyName: c.companyName }),
          }).then(r => r.json()).catch(() => null),
          fetch('/api/apollo-enrich', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ website: c.website, companyName: c.companyName }),
          }).then(r => r.json()).catch(() => null),
        ]);
        contact = contactData?.contacts?.[0] || null;
        firm = enrichData?.firmographics || null;
      }
      // Prefer Apollo's real firmographics; fall back to the AI's best guess.
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: c.companyName,
          website: firm?.website || c.website,
          industry: firm?.industry || c.industry,
          location: firm?.location || c.location,
          size: firm?.size || c.size,
          notes: c.reason,
          source: `Competitor of ${compResult.companyName}`,
          contact,
        }),
      });
    }));
    setImportDone(d => new Set([...d, ...toImport]));
    setSelected(new Set());
    setImporting(false);
    router.refresh();
  }

  // Resolve the industry-search filters shared by both data sources.
  const indSizeRanges = indSizes.length > 0
    ? SIZE_FILTERS.filter(s => indSizes.includes(s.label)).map(s => ({ min: s.min, max: s.max }))
    : null;
  const indActiveRegion = indCustomLocation.trim()
    || LOCATION_PRESETS.find(p => p.label === indLocation)?.region
    || '';

  function toggleIndSize(label: string) {
    setIndSizes(s => s.includes(label) ? s.filter(x => x !== label) : [...s, label]);
  }

  async function industrySearch() {
    if (!indText.trim() || indLoading) return;
    setIndLoading(true); setIndError(''); setIndPaidRequired(false); setIndResults([]);
    try {
      let data: any;
      if (indSource === 'ai') {
        const res = await fetch('/api/industry-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ industry: indText.trim(), region: indActiveRegion || null, sizeRanges: indSizeRanges, count: indCount }),
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Search failed');
      } else {
        const minEmployees = indSizeRanges ? Math.min(...indSizeRanges.map(r => r.min)) : 1;
        const maxEmployees = indSizeRanges ? Math.max(...indSizeRanges.map(r => r.max)) : 100000;
        const res = await fetch('/api/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ industries: [indText.trim()], minEmployees, maxEmployees, region: indActiveRegion || null, count: indCount }),
        });
        data = await res.json();
        if (!res.ok) {
          setIndPaidRequired(data.code === 'PAID_PLAN_REQUIRED');
          throw new Error(data.error || 'Search failed');
        }
      }
      setIndResults(data.companies || []);
    } catch (e: any) {
      setIndError(e.message || 'Search failed');
    }
    setIndLoading(false);
  }

  async function industryImport(company: any) {
    setIndImporting(s => new Set(s).add(company.companyName));
    // Enrich firmographics (free) and, if the result has no contact, try Apollo (paid, graceful).
    let firm: any = null;
    let contact = company.contact || null;
    if (company.website) {
      const [enrichData, contactData] = await Promise.all([
        fetch('/api/apollo-enrich', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ website: company.website, companyName: company.companyName }),
        }).then(r => r.json()).catch(() => null),
        contact ? Promise.resolve(null) : fetch('/api/apollo-contacts', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ website: company.website, companyName: company.companyName }),
        }).then(r => r.json()).catch(() => null),
      ]);
      firm = enrichData?.firmographics || null;
      if (!contact) contact = contactData?.contacts?.[0] || null;
    }
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: company.companyName,
        website: firm?.website || company.website,
        industry: firm?.industry || company.industry,
        location: firm?.location || company.location,
        size: firm?.size || company.size,
        notes: company.reason || '',
        source: indSource === 'ai' ? `Industry search: ${indText.trim()}` : 'Apollo Discovery',
        contact,
      }),
    });
    router.refresh();
  }

  const availableToSelect = compResult?.competitors?.map((_: any, i: number) => i)?.filter((i: number) => !importDone.has(i)) ?? [];
  const allSelected = availableToSelect.length > 0 && availableToSelect.every((i: number) => selected.has(i));

  // Active filter summary
  const activeFilters = [
    ...(compSizes.length > 0 ? [compSizes.join(', ')] : []),
    ...(activeRegion ? [compLocation || customLocation] : []),
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Discover leads</h1>
        <p className="text-sm text-slate-500 mt-1">Research one company, find competitors, or search by industry</p>
      </div>

      {/* ── Research a single company ── */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 mb-6 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} />
          <h2 className="text-sm font-semibold">Research a company</h2>
        </div>
        <p className="text-xs text-blue-100 mb-5">Enter a company website — AI reads their site, then researches, scores, and finds AI opportunities automatically.</p>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" />
            <input value={researchWebsite} onChange={e => { setResearchWebsite(e.target.value); setResearchError(''); }}
              onKeyDown={e => e.key === 'Enter' && researchCompany()}
              disabled={researchLoading}
              placeholder="interrainternational.com"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-70" />
          </div>
          <button onClick={researchCompany} disabled={researchLoading || !researchWebsite.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-50 disabled:opacity-60 transition-colors whitespace-nowrap">
            {researchLoading ? <><Loader2 size={14} className="animate-spin" />Working…</> : <><Sparkles size={14} />Research company</>}
          </button>
        </div>

        {researchLoading && researchStep && (
          <div className="flex items-center gap-2 mt-4 text-sm text-blue-50">
            <Loader2 size={14} className="animate-spin flex-shrink-0" />
            {researchStep}
          </div>
        )}
        {researchError && (
          <div className="flex flex-wrap items-center gap-2 mt-4 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{researchError}</span>
            {researchLeadId && (
              <a href={`/leads/${researchLeadId}`} className="underline font-medium ml-1">Open the lead to finish manually →</a>
            )}
          </div>
        )}
      </div>

      {/* ── Competitor Finder ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} className="text-blue-600" />
          <h2 className="text-sm font-semibold text-slate-800">Competitor finder</h2>
        </div>
        <p className="text-xs text-slate-500 mb-5">Enter any company website — AI identifies competitors, filter by size and location before searching.</p>

        {/* Website input */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1">
            <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={compWebsite} onChange={e => setCompWebsite(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && findCompetitors()}
              placeholder="interrainternational.com"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-white" />
          </div>
          <button onClick={findCompetitors} disabled={compLoading || !compWebsite.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {compLoading ? <><Loader2 size={14} className="animate-spin" />Researching...</> : <><Search size={14} />Find competitors</>}
          </button>
        </div>

        {/* Filters row */}
        <div className="grid grid-cols-2 gap-4">

          {/* Company size */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users size={13} className="text-slate-500" />
                <p className="text-xs font-semibold text-slate-600">Company size</p>
              </div>
              {compSizes.length > 0 && (
                <button onClick={() => setCompSizes([])} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Clear</button>
              )}
            </div>
            <div className="space-y-2">
              {SIZE_FILTERS.map(s => {
                const active = compSizes.includes(s.label);
                return (
                  <button key={s.label} onClick={() => toggleCompSize(s.label)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-all ${
                      active ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                    }`}>
                    <span className="text-sm font-medium">{s.label}</span>
                    <span className={`text-xs ${active ? 'text-blue-100' : 'text-slate-400'}`}>{s.description}</span>
                  </button>
                );
              })}
            </div>
            {compSizes.length === 0 && <p className="text-xs text-slate-400 mt-2 text-center">All sizes</p>}
          </div>

          {/* Location */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-slate-500" />
                <p className="text-xs font-semibold text-slate-600">Location</p>
              </div>
              {(compLocation || customLocation) && (
                <button onClick={() => { setCompLocation(''); setCustomLocation(''); }} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Clear</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {LOCATION_PRESETS.map(p => {
                const active = compLocation === p.label && !customLocation;
                return (
                  <button key={p.label} onClick={() => selectLocation(p.label)}
                    className={`px-2.5 py-2 rounded-lg border text-xs font-medium text-left transition-all ${
                      active ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'
                    }`}>
                    {p.label}
                  </button>
                );
              })}
            </div>
            <div className="relative">
              <input
                value={customLocation}
                onChange={e => { setCustomLocation(e.target.value); setCompLocation(''); }}
                placeholder="Custom: e.g. Dallas TX, or Pacific Northwest..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-white placeholder-slate-400"
              />
            </div>
            {!compLocation && !customLocation && <p className="text-xs text-slate-400 mt-2 text-center">No location filter</p>}
          </div>
        </div>

        {/* Active filter summary */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs text-slate-400">Filters:</span>
            {activeFilters.map(f => (
              <span key={f} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">{f}</span>
            ))}
          </div>
        )}

        {compError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mt-4 text-sm text-red-700">
            <AlertCircle size={15} />{compError}
          </div>
        )}

        {/* Results */}
        {compResult && (
          <div className="mt-5">
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-4">
              <p className="text-xs font-semibold text-blue-700 mb-0.5">{compResult.companyName} · {compResult.industry}</p>
              <p className="text-xs text-blue-800">{compResult.description}</p>
              {activeFilters.length > 0 && (
                <p className="text-xs text-blue-600 mt-1">Filtered by: {activeFilters.join(' · ')}</p>
              )}
            </div>

            <div className="flex items-center justify-between mb-3">
              <button onClick={toggleAll} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors">
                {allSelected ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} className="text-slate-400" />}
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
              {selected.size > 0 && (
                <button onClick={importSelected} disabled={importing}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {importing ? <><Loader2 size={14} className="animate-spin" />Adding...</> : <><Plus size={14} />Add {selected.size} lead{selected.size > 1 ? 's' : ''}</>}
                </button>
              )}
            </div>

            <div className="space-y-2">
              {compResult.competitors.map((c: any, i: number) => {
                const isDone = importDone.has(i);
                const isSelected = selected.has(i);
                return (
                  <div key={i} onClick={() => !isDone && toggleSelect(i)}
                    className={`flex items-center gap-4 rounded-xl px-4 py-3.5 border cursor-pointer transition-all
                      ${isDone ? 'bg-emerald-50 border-emerald-200 cursor-default opacity-75'
                        : isSelected ? 'bg-blue-50 border-blue-300'
                        : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50'}`}>
                    <div className="flex-shrink-0">
                      {isDone ? <CheckSquare size={18} className="text-emerald-500" />
                        : isSelected ? <CheckSquare size={18} className="text-blue-600" />
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
                            onClick={e => e.stopPropagation()} className="text-xs text-blue-500 hover:underline">{c.website}</a>
                        )}
                        {c.size && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{c.size}</span>}
                        {c.location && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full flex items-center gap-1"><MapPin size={10} />{c.location}</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{c.industry}</p>
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

      {/* ── Search by industry ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-800">Search by industry</h2>
          </div>
          {/* Data source toggle */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
            <button onClick={() => setIndSource('ai')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${indSource === 'ai' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              AI-generated
            </button>
            <button onClick={() => setIndSource('apollo')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${indSource === 'apollo' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              Apollo real data
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500 mb-5">
          {indSource === 'ai'
            ? 'Type an industry — AI lists real companies in the locations and sizes you pick.'
            : 'Authoritative Apollo firmographic search — requires a paid Apollo plan.'}
        </p>

        {/* Industry input + quick picks */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={indText} onChange={e => { setIndText(e.target.value); setIndError(''); }}
              onKeyDown={e => e.key === 'Enter' && industrySearch()}
              placeholder="e.g. Logistics, Freight, Customs Brokerage"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-white" />
          </div>
          <button onClick={industrySearch} disabled={indLoading || !indText.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap">
            {indLoading ? <><Loader2 size={14} className="animate-spin" />Searching…</> : <><Search size={14} />Search</>}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {INDUSTRIES.map(i => (
            <button key={i} onClick={() => { setIndText(i); setIndError(''); }}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${indText === i ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {i}
            </button>
          ))}
        </div>

        {/* Filters: location + size + count */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><MapPin size={13} className="text-slate-500" /><p className="text-xs font-semibold text-slate-600">Location</p></div>
              {(indLocation || indCustomLocation) && <button onClick={() => { setIndLocation(''); setIndCustomLocation(''); }} className="text-xs text-slate-400 hover:text-slate-600">Clear</button>}
            </div>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {LOCATION_PRESETS.map(p => {
                const active = indLocation === p.label && !indCustomLocation;
                return (
                  <button key={p.label} onClick={() => { setIndLocation(prev => prev === p.label ? '' : p.label); setIndCustomLocation(''); }}
                    className={`px-2.5 py-2 rounded-lg border text-xs font-medium text-left transition-all ${active ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'}`}>
                    {p.label}
                  </button>
                );
              })}
            </div>
            <input value={indCustomLocation} onChange={e => { setIndCustomLocation(e.target.value); setIndLocation(''); }}
              placeholder="Custom: e.g. Dallas TX…"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-white placeholder-slate-400" />
          </div>
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><Users size={13} className="text-slate-500" /><p className="text-xs font-semibold text-slate-600">Company size</p></div>
              {indSizes.length > 0 && <button onClick={() => setIndSizes([])} className="text-xs text-slate-400 hover:text-slate-600">Clear</button>}
            </div>
            <div className="space-y-2 mb-4">
              {SIZE_FILTERS.map(s => {
                const active = indSizes.includes(s.label);
                return (
                  <button key={s.label} onClick={() => toggleIndSize(s.label)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all ${active ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50'}`}>
                    <span className="text-sm font-medium">{s.label}</span>
                    <span className={`text-xs ${active ? 'text-blue-100' : 'text-slate-400'}`}>{s.description}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Results:</span>
              {[6, 10, 20].map(n => (
                <button key={n} onClick={() => setIndCount(n)}
                  className={`px-3 py-1 rounded-lg border text-xs font-medium transition-all ${indCount === n ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {indError && indPaidRequired && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-sm text-amber-800">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Apollo real-data search needs a paid Apollo plan.</p>
              <p className="text-xs text-amber-700 mt-0.5">Switch to <button onClick={() => { setIndSource('ai'); setIndError(''); }} className="underline font-medium">AI-generated</button> to search now on your free key, or <a href="https://app.apollo.io/#/settings/plans/upgrade" target="_blank" rel="noreferrer" className="underline font-medium">upgrade Apollo</a> for authoritative data.</p>
            </div>
          </div>
        )}
        {indError && !indPaidRequired && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
            <AlertCircle size={15} />{indError}
          </div>
        )}

        {indResults.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400 mb-1">{indResults.length} {indSource === 'ai' ? 'AI-suggested' : 'Apollo'} companies{indActiveRegion ? ' · filtered by location' : ''}</p>
            {indResults.map((c, i) => (
              <div key={i} className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5">
                <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 size={14} className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-800">{c.companyName}</p>
                    {c.website && <a href={`https://${c.website}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-xs text-blue-500 hover:underline">{c.website}</a>}
                  </div>
                  <p className="text-xs text-slate-500">{[c.industry, c.location, c.size].filter(Boolean).join(' · ')}</p>
                  {c.reason && <p className="text-xs text-slate-400 mt-0.5 italic">{c.reason}</p>}
                </div>
                {c.contact?.name && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg flex-shrink-0">
                    <Users size={12} className="text-emerald-600" />
                    <div>
                      <p className="text-xs font-medium text-emerald-800">{c.contact.name}</p>
                      <p className="text-xs text-emerald-600">{c.contact.title}</p>
                    </div>
                  </div>
                )}
                <button onClick={() => industryImport(c)} disabled={indImporting.has(c.companyName)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-100 disabled:opacity-50 transition-colors flex-shrink-0">
                  {indImporting.has(c.companyName) ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  {indImporting.has(c.companyName) ? 'Added' : 'Add lead'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
