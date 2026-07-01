'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Brain, Star, Lightbulb, Mail, ClipboardList, Activity, Building2, Globe, Users, FileText, Zap, Loader2, CheckCircle2, AlertCircle, Copy, Check, Sparkles, Clock, MessageSquare, X, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import StatusBadge, { STATUS_COLORS } from '@/components/StatusBadge';
import ScoreBadge from '@/components/ScoreBadge';

const ALL_STATUSES = Object.keys(STATUS_COLORS);

function SendEmailButton({ subject, body, messageId, contactEmail, alreadySent }: { subject?: string; body: string; messageId: string; contactEmail?: string; alreadySent?: boolean }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(!!alreadySent);
  const [error, setError] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [toEmail, setToEmail] = useState(contactEmail || '');

  async function send() {
    if (!toEmail.trim()) { setShowInput(true); return; }
    const placeholders = [...new Set([...`${subject || ''}\n${body || ''}`.matchAll(/\[[^\]]+\]/g)].map(m => m[0]))];
    if (placeholders.length) {
      setError(`Fill in ${placeholders.join(', ')} before sending.`);
      setShowInput(false);
      return;
    }
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: toEmail, subject, body, outreachMessageId: messageId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');
      setSent(true);
      setShowInput(false);
    } catch (e: any) {
      setError(e.message);
    }
    setSending(false);
  }

  if (sent) {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
        <CheckCircle2 size={11} /> Sent
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {showInput && (
        <input
          value={toEmail}
          onChange={e => setToEmail(e.target.value)}
          placeholder="recipient@company.com"
          className="px-2 py-1 rounded border border-slate-200 text-xs w-44 focus:outline-none focus:border-blue-400"
        />
      )}
      <button onClick={send} disabled={sending}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 text-xs font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50">
        {sending ? <Loader2 size={11} className="animate-spin" /> : <Mail size={11} />}
        {sending ? 'Sending...' : showInput ? 'Confirm send' : 'Send via Gmail'}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

function OutreachCard({ msg, contactEmail }: { msg: any; contactEmail?: string }) {
  const hasSubject = msg.type !== 'linkedin';
  const [baseSubject, setBaseSubject] = useState(msg.subject || '');
  const [baseBody, setBaseBody] = useState(msg.editedBody ?? msg.body ?? '');
  const [subject, setSubject] = useState(baseSubject);
  const [body, setBody] = useState(baseBody);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const dirty = subject !== baseSubject || body !== baseBody;

  const typeLabel = msg.type === 'shortEmail' ? 'Short email' : msg.type === 'linkedin' ? 'LinkedIn message' : 'Executive email';

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/outreach/${msg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: hasSubject ? subject : null, body }),
      });
      if (res.ok) {
        setBaseSubject(subject);
        setBaseBody(body);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      /* network error — leave dirty so the user can retry */
    }
    setSaving(false);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-700">{typeLabel}</span>
        <div className="flex items-center gap-2">
          {hasSubject && <SendEmailButton subject={subject} body={body} messageId={msg.id} contactEmail={contactEmail} alreadySent={!!msg.sentAt} />}
          <CopyBtn text={hasSubject && subject ? `Subject: ${subject}\n\n${body}` : body} />
        </div>
      </div>
      {hasSubject && (
        <div className="mb-2">
          <label className="text-xs font-medium text-slate-500">Subject</label>
          <input value={subject} onChange={e => setSubject(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
        </div>
      )}
      <textarea value={body} onChange={e => setBody(e.target.value)}
        rows={Math.min(18, Math.max(6, body.split('\n').length + 1))}
        className="w-full text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 resize-y" />
      <div className="flex items-center gap-2 mt-2">
        <button onClick={save} disabled={!dirty || saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save changes'}
        </button>
        {dirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
      </div>
    </div>
  );
}

function AgentBtn({ label, icon: Icon, onClick, loading, done, disabled }: any) {
  return (
    <button onClick={onClick} disabled={loading || disabled}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
        ${done ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
          loading ? 'bg-blue-50 text-blue-600 border border-blue-200 cursor-wait' :
          disabled ? 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed' :
          'bg-white text-slate-700 border border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'}`}>
      {loading ? <Loader2 size={14} className="animate-spin" /> : done ? <CheckCircle2 size={14} /> : <Icon size={14} />}
      {label}
    </button>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
    </button>
  );
}

export default function LeadDetailClient({ lead: initialLead }: { lead: any }) {
  const router = useRouter();
  const [lead, setLead] = useState(initialLead);
  const [tab, setTab] = useState('overview');
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState<Record<string, boolean>>({
    research: !!initialLead.research?.length,
    score: !!initialLead.score,
    opportunities: !!initialLead.opportunities?.length,
    outreach: !!initialLead.outreach?.length,
    callprep: !!initialLead.callPrep,
  });
  const [researchInput, setResearchInput] = useState(initialLead.notes || '');
  const [error, setError] = useState<string | null>(null);
  const [elaborating, setElaborating] = useState<Record<string, boolean>>({});
  const [elaborations, setElaborations] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    (initialLead.opportunities || []).forEach((op: any) => {
      if (op.elaboration) seed[op.id] = op.elaboration;
    });
    return seed;
  });
  const [elaborationsOpen, setElaborationsOpen] = useState<Record<string, boolean>>({});
  const [demoPlanLoading, setDemoPlanLoading] = useState<Record<string, boolean>>({});
  const [demoPlans, setDemoPlans] = useState<Record<string, any>>(() => {
    const seed: Record<string, any> = {};
    (initialLead.opportunities || []).forEach((op: any) => {
      if (op.demoPlan) {
        try { seed[op.id] = typeof op.demoPlan === 'string' ? JSON.parse(op.demoPlan) : op.demoPlan; } catch {}
      }
    });
    return seed;
  });
  const [demoPlansOpen, setDemoPlansOpen] = useState<Record<string, boolean>>({});
  const [demoArtifactLoading, setDemoArtifactLoading] = useState<Record<string, boolean>>({});
  const [demoArtifacts, setDemoArtifacts] = useState<Record<string, any>>(() => {
    const seed: Record<string, any> = {};
    (initialLead.opportunities || []).forEach((op: any) => {
      if (op.demoArtifact) {
        try { seed[op.id] = typeof op.demoArtifact === 'string' ? JSON.parse(op.demoArtifact) : op.demoArtifact; } catch {}
      }
    });
    return seed;
  });
  const [demoArtifactsOpen, setDemoArtifactsOpen] = useState<Record<string, boolean>>({});

  async function elaborate(op: any) {
    const id = op.id;
    // Already in state — just toggle visibility, no API call
    if (elaborations[id]) {
      console.log(`[elaborate] Already in state — instant toggle`);
      setElaborationsOpen(s => ({ ...s, [id]: !s[id] }));
      return;
    }
    // On the op object directly (from DB seed on page load)
    if (op.elaboration) {
      console.log(`[elaborate] Reading from op object (page load seed) — instant`);
      setElaborations(s => ({ ...s, [id]: op.elaboration }));
      setElaborationsOpen(s => ({ ...s, [id]: true }));
      return;
    }
    // Not cached anywhere — call API
    console.log(`[elaborate] No cache found — hitting API...`);
    const t0 = performance.now();
    setElaborating(s => ({ ...s, [id]: true }));
    setElaborationsOpen(s => ({ ...s, [id]: true }));
    try {
      const res = await fetch('/api/elaborate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity: op, companyName: lead.companyName }),
      });
      const t1 = performance.now();
      console.log(`[elaborate] API response received in ${Math.round(t1 - t0)}ms`);
      const data = await res.json();
      console.log(`[elaborate] cached=${data.cached} | explanation length=${data.explanation?.length}`);
      setElaborations(s => ({ ...s, [id]: data.explanation || 'No explanation returned.' }));
    } catch (e) {
      console.error(`[elaborate] Error:`, e);
      setElaborations(s => ({ ...s, [id]: 'Could not generate explanation. Please try again.' }));
    }
    setElaborating(s => ({ ...s, [id]: false }));
  }

  async function runAgentCall(agentName: string, extraBody = {}) {
    setRunning(r => ({ ...r, [agentName]: true }));
    setError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agentName, input: researchInput, ...extraBody }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Agent failed');
      setDone(d => ({ ...d, [agentName]: true }));
      // Refresh lead data from server
      const updated = await fetch(`/api/leads/${lead.id}`).then(r => r.json());
      setLead(updated);
    } catch (e: any) {
      setError(`${agentName} failed: ${e.message}`);
    }
    setRunning(r => ({ ...r, [agentName]: false }));
  }

  async function getDemoPlan(op: any) {
    const id = op.id;
    // Already in state — just toggle
    if (demoPlans[id]) { setDemoPlansOpen(s => ({ ...s, [id]: !s[id] })); return; }
    // On the op object directly
    if (op.demoPlan) {
      try {
        const parsed = typeof op.demoPlan === 'string' ? JSON.parse(op.demoPlan) : op.demoPlan;
        setDemoPlans(s => ({ ...s, [id]: parsed }));
        setDemoPlansOpen(s => ({ ...s, [id]: true }));
        return;
      } catch {}
    }
    // Generate and save
    setDemoPlanLoading(s => ({ ...s, [id]: true }));
    setDemoPlansOpen(s => ({ ...s, [id]: true }));
    try {
      const res = await fetch('/api/demo-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity: op, companyName: lead.companyName }),
      });
      const data = await res.json();
      setDemoPlans(s => ({ ...s, [id]: data.demoPlan }));
    } catch {
      setDemoPlans(s => ({ ...s, [id]: { error: 'Could not generate demo plan. Please try again.' } }));
    }
    setDemoPlanLoading(s => ({ ...s, [id]: false }));
  }

  async function getDemoArtifact(op: any) {
    const id = op.id;
    if (demoArtifacts[id]) { setDemoArtifactsOpen(s => ({ ...s, [id]: !s[id] })); return; }
    if (op.demoArtifact) {
      try {
        const parsed = typeof op.demoArtifact === 'string' ? JSON.parse(op.demoArtifact) : op.demoArtifact;
        setDemoArtifacts(s => ({ ...s, [id]: parsed }));
        setDemoArtifactsOpen(s => ({ ...s, [id]: true }));
        return;
      } catch {}
    }
    setDemoArtifactLoading(s => ({ ...s, [id]: true }));
    setDemoArtifactsOpen(s => ({ ...s, [id]: true }));
    try {
      const res = await fetch('/api/demo-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity: op, demoPlan: demoPlans[id], companyName: lead.companyName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDemoArtifacts(s => ({ ...s, [id]: data.artifact }));
    } catch (e: any) {
      setDemoArtifacts(s => ({ ...s, [id]: { error: e.message } }));
    }
    setDemoArtifactLoading(s => ({ ...s, [id]: false }));
  }

  async function updateStatus(status: string) {
    await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setLead((l: any) => ({ ...l, status }));
    router.refresh();
  }

  const research = lead.research?.[0];
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'opportunities', label: 'Opportunities', icon: Lightbulb, badge: lead.opportunities?.length },
    { id: 'outreach', label: 'Outreach', icon: MessageSquare },
    { id: 'callprep', label: 'Call prep', icon: ClipboardList },
    { id: 'activity', label: 'Activity', icon: Activity, badge: lead.activities?.length },
  ];

  const diffLabel: Record<number, string> = { 1: 'Very easy', 2: 'Easy', 3: 'Moderate', 4: 'Complex', 5: 'Advanced' };
  const diffColor: Record<number, string> = { 1: 'bg-emerald-100 text-emerald-700', 2: 'bg-emerald-100 text-emerald-700', 3: 'bg-amber-100 text-amber-700', 4: 'bg-orange-100 text-orange-700', 5: 'bg-red-100 text-red-600' };
  const contact = lead.contacts?.[0];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <Link href="/leads" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-3 transition-colors">
            <ArrowLeft size={14} /> All leads
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{lead.companyName}</h1>
              <p className="text-sm text-slate-500">{[lead.industry, lead.location].filter(Boolean).join(' · ')}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 pt-6">
          <ScoreBadge score={lead.score} />
          <select value={lead.status} onChange={e => updateStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-blue-400 bg-white">
            {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Agent bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-5 flex flex-wrap gap-2">
        <span className="text-xs text-slate-400 self-center mr-1">Agents:</span>
        <AgentBtn label="Research" icon={Brain} onClick={() => runAgentCall('research')} loading={running.research} done={done.research} />
        <AgentBtn label="Score" icon={Star} onClick={() => runAgentCall('score')} loading={running.score} done={done.score} />
        <AgentBtn label="Opportunities" icon={Lightbulb} onClick={() => runAgentCall('opportunities')} loading={running.opportunities} done={done.opportunities} />
        <AgentBtn label="Outreach" icon={Mail} onClick={() => runAgentCall('outreach')} loading={running.outreach} done={done.outreach} />
        <AgentBtn label="Call prep" icon={ClipboardList} onClick={() => runAgentCall('callprep')} loading={running.callprep} done={done.callprep} />
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
          <AlertCircle size={15} />{error}
          <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-5">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <t.icon size={14} />{t.label}
            {(t.badge ?? 0) > 0 && <span className="bg-slate-200 text-slate-600 text-xs px-1.5 py-0.5 rounded-full leading-none">{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-700">Research input</h3>
                <span className="text-xs text-slate-400">Paste website text, LinkedIn, or notes</span>
              </div>
              <textarea value={researchInput} onChange={e => setResearchInput(e.target.value)} rows={4}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 resize-none bg-slate-50 placeholder-slate-400"
                placeholder="Paste in content from their website, LinkedIn, or any intel you have." />
              <button onClick={() => runAgentCall('research')} disabled={running.research}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {running.research ? <><Loader2 size={14} className="animate-spin" />Researching...</> : <><Sparkles size={14} />Run Research Agent</>}
              </button>
            </div>
            {research?.summary && (
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">Research summary</h3>
                  {research.confidence && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{Math.round(research.confidence * 100)}% confidence</span>}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed mb-4">{research.summary}</p>
                {(research.painPoints as string[])?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-2">Likely pain points</p>
                    <div className="space-y-1.5">
                      {(research.painPoints as string[]).map((p, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <Zap size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />{p}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {research.consultingAngle && (
                  <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Consulting angle</p>
                    <p className="text-sm text-blue-800">{research.consultingAngle}</p>
                  </div>
                )}
              </div>
            )}
            {lead.scoreDetail && (
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">Score breakdown</h3>
                  <span className={`text-xl font-bold ${lead.score >= 75 ? 'text-emerald-600' : lead.score >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{lead.score}<span className="text-sm font-normal text-slate-400">/100</span></span>
                </div>
                <div className="space-y-2 mb-3">
                  {[['Industry fit', lead.scoreDetail.industryFit, 20],['Manual process signals', lead.scoreDetail.manualProcessSignals, 20],['Document heaviness', lead.scoreDetail.documentHeaviness, 15],['Budget potential', lead.scoreDetail.budgetPotential, 10],['Background match', lead.scoreDetail.backgroundRelevance, 10],['Urgency signals', lead.scoreDetail.urgencySignals, 10],['Company size fit', lead.scoreDetail.companySize, 10],['Strategic value', lead.scoreDetail.strategicValue, 5]].map(([label, val, max]) => val != null && (
                    <div key={label as string}>
                      <div className="flex justify-between text-xs text-slate-500 mb-1"><span>{label}</span><span className="font-medium">{val}/{max}</span></div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${((val as number) / (max as number)) * 100}%` }} /></div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2.5 leading-relaxed">{lead.scoreDetail.explanation}</p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-slate-500 mb-3">Company</h3>
              <div className="space-y-2.5">
                {lead.website && <div className="flex items-center gap-2 text-sm"><Globe size={13} className="text-slate-400" /><a href={`https://${lead.website}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs truncate">{lead.website}</a></div>}
                {lead.size && <div className="flex items-center gap-2 text-sm text-slate-600"><Users size={13} className="text-slate-400" />{lead.size}</div>}
                {lead.location && <div className="flex items-center gap-2 text-sm text-slate-600"><Building2 size={13} className="text-slate-400" />{lead.location}</div>}
                {lead.source && <div className="flex items-center gap-2 text-sm text-slate-600"><FileText size={13} className="text-slate-400" />via {lead.source}</div>}
              </div>
            </div>
            {contact?.name && (
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-slate-500 mb-3">Primary contact</h3>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-700">
                    {contact.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div><p className="text-sm font-medium text-slate-800">{contact.name}</p><p className="text-xs text-slate-500">{contact.title}</p></div>
                </div>
                {contact.email && <div className="flex items-center gap-2 text-xs text-slate-500"><Mail size={12} />{contact.email}</div>}
              </div>
            )}
            {lead.notes && <div className="bg-amber-50 border border-amber-200 rounded-xl p-4"><h3 className="text-xs font-semibold text-amber-700 mb-2">Notes</h3><p className="text-xs text-amber-800 leading-relaxed">{lead.notes}</p></div>}
          </div>
        </div>
      )}

      {/* Opportunities */}
      {tab === 'opportunities' && (
        <div>
          {!lead.opportunities?.length ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
              <Lightbulb size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-600 mb-1">No opportunities yet</p>
              <p className="text-xs text-slate-400 mb-4">Run Research first, then generate opportunities</p>
              <button onClick={() => runAgentCall('opportunities')} disabled={running.opportunities}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {running.opportunities ? 'Generating...' : 'Generate Opportunities'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {lead.opportunities.map((op: any) => (
                <div key={op.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-200 transition-colors">
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-800 leading-snug flex-1">{op.title}</h3>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${diffColor[op.difficulty] || diffColor[3]}`}>
                        {diffLabel[op.difficulty] || 'Moderate'}
                      </span>
                      <button
                        onClick={() => elaborate(op)}
                        disabled={elaborating[op.id]}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 text-xs font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50 whitespace-nowrap">
                        {elaborating[op.id]
                          ? <Loader2 size={11} className="animate-spin" />
                          : elaborationsOpen[op.id] ? <ChevronUp size={11} /> : <BookOpen size={11} />}
                        {elaborating[op.id] ? 'Explaining...' : elaborationsOpen[op.id] ? 'Hide' : 'Elaborate'}
                      </button>
                    </div>
                  </div>
                  {/* Content row */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-slate-500 leading-relaxed">{op.problem}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2.5">
                      <p className="text-xs font-medium text-blue-700 mb-0.5">Solution</p>
                      <p className="text-xs text-blue-800">{op.solution}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-2.5">
                      <p className="text-xs font-medium text-emerald-700 mb-0.5">Business value</p>
                      <p className="text-xs text-emerald-800">{op.value}</p>
                    </div>
                  </div>
                  {/* Elaborate expansion — inside the card */}
                  {elaborationsOpen[op.id] && (
                    <div className="mb-3 bg-slate-50 border border-slate-200 rounded-lg p-4">
                      {elaborating[op.id] ? (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Loader2 size={12} className="animate-spin text-blue-500" />
                          Generating plain English explanation...
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-1.5">
                              <Sparkles size={12} className="text-blue-500" />
                              <span className="text-xs font-semibold text-slate-600">Plain English explanation</span>
                            </div>
                            <button
                              onClick={() => getDemoPlan(op)}
                              disabled={demoPlanLoading[op.id]}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-violet-200 bg-violet-50 text-xs font-medium text-violet-700 hover:bg-violet-100 transition-all disabled:opacity-50 whitespace-nowrap">
                              {demoPlanLoading[op.id]
                                ? <Loader2 size={11} className="animate-spin" />
                                : demoPlansOpen[op.id] ? <ChevronUp size={11} /> : <Zap size={11} />}
                              {demoPlanLoading[op.id] ? 'Building...' : demoPlansOpen[op.id] ? 'Hide demo plan' : 'Demo plan'}
                            </button>
                          </div>
                          <div className="space-y-2.5">
                            {(elaborations[op.id] || '').split('\n\n').filter(Boolean).map((para, i) => (
                              <p key={i} className="text-xs text-slate-700 leading-relaxed">{para}</p>
                            ))}
                          </div>
                          {/* Demo plan panel */}
                          {demoPlansOpen[op.id] && (
                            <div className="mt-4 border-t border-slate-200 pt-4">
                              {demoPlanLoading[op.id] ? (
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <Loader2 size={12} className="animate-spin text-violet-500" />
                                  Building demo plan...
                                </div>
                              ) : demoPlans[op.id]?.error ? (
                                <p className="text-xs text-red-500">{demoPlans[op.id].error}</p>
                              ) : demoPlans[op.id] && (
                                <div className="grid grid-cols-2 gap-4">
                                  {/* What we need from client */}
                                  <div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                      <div className="w-4 h-4 rounded bg-amber-100 flex items-center justify-center flex-shrink-0">
                                        <FileText size={10} className="text-amber-600" />
                                      </div>
                                      <p className="text-xs font-semibold text-slate-700">What we need from them</p>
                                    </div>
                                    <ul className="space-y-1.5">
                                      {(demoPlans[op.id].whatWeNeedFromClient || []).map((item: string, i: number) => (
                                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                                          <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  {/* What we will do */}
                                  <div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                      <div className="w-4 h-4 rounded bg-violet-100 flex items-center justify-center flex-shrink-0">
                                        <Zap size={10} className="text-violet-600" />
                                      </div>
                                      <p className="text-xs font-semibold text-slate-700">What we will do</p>
                                    </div>
                                    <ul className="space-y-1.5">
                                      {(demoPlans[op.id].whatWeWillDo || []).map((item: string, i: number) => (
                                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                                          <span className="w-4 h-4 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  {/* Deliverable + time + Build Demo button */}
                                  {(demoPlans[op.id].demoDeliverable || demoPlans[op.id].timeToDemo) && (
                                    <div className="col-span-2 flex gap-3 pt-2 border-t border-slate-200">
                                      {demoPlans[op.id].demoDeliverable && (
                                        <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
                                          <p className="text-xs font-semibold text-emerald-700 mb-0.5">What they'll see</p>
                                          <p className="text-xs text-emerald-800">{demoPlans[op.id].demoDeliverable}</p>
                                        </div>
                                      )}
                                      {demoPlans[op.id].timeToDemo && (
                                        <div className="bg-slate-100 border border-slate-200 rounded-lg p-2.5 flex items-center gap-2">
                                          <Clock size={12} className="text-slate-500 flex-shrink-0" />
                                          <div>
                                            <p className="text-xs font-semibold text-slate-600">Time to demo</p>
                                            <p className="text-xs text-slate-700">{demoPlans[op.id].timeToDemo}</p>
                                          </div>
                                        </div>
                                      )}
                                      <button
                                        onClick={() => getDemoArtifact(op)}
                                        disabled={demoArtifactLoading[op.id]}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-300 bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-all disabled:opacity-50 whitespace-nowrap self-center">
                                        {demoArtifactLoading[op.id]
                                          ? <><Loader2 size={11} className="animate-spin" />Building demo...</>
                                          : demoArtifactsOpen[op.id]
                                            ? <><ChevronUp size={11} />Hide demo</>
                                            : <><Sparkles size={11} />Build demo with fake data</>}
                                      </button>
                                    </div>
                                  )}
                                  {/* Demo artifact viewer */}
                                  {demoArtifactsOpen[op.id] && (
                                    <div className="col-span-2 mt-2 border-t border-slate-200 pt-4">
                                      {demoArtifactLoading[op.id] ? (
                                        <div className="flex items-center gap-2 text-xs text-slate-500 py-4">
                                          <Loader2 size={12} className="animate-spin text-emerald-500" />
                                          Generating synthetic demo data — this may take 15-20 seconds...
                                        </div>
                                      ) : demoArtifacts[op.id]?.error ? (
                                        <p className="text-xs text-red-500">{demoArtifacts[op.id].error}</p>
                                      ) : demoArtifacts[op.id] && (
                                        <div className="space-y-4">
                                          {/* Header */}
                                          <div>
                                            <div className="flex items-center gap-2 mb-1">
                                              <Sparkles size={13} className="text-emerald-600" />
                                              <h4 className="text-sm font-semibold text-slate-800">{demoArtifacts[op.id].title}</h4>
                                            </div>
                                            <p className="text-xs text-slate-500">{demoArtifacts[op.id].description}</p>
                                          </div>

                                          {/* Insights */}
                                          {demoArtifacts[op.id].insights?.length > 0 && (
                                            <div>
                                              <p className="text-xs font-semibold text-slate-600 mb-2">Key insights</p>
                                              <div className="grid grid-cols-2 gap-2">
                                                {demoArtifacts[op.id].insights.map((ins: any, i: number) => {
                                                  const colors: Record<string, string> = {
                                                    positive: 'bg-emerald-50 border-emerald-200',
                                                    negative: 'bg-red-50 border-red-200',
                                                    warning: 'bg-amber-50 border-amber-200',
                                                    neutral: 'bg-slate-50 border-slate-200',
                                                  };
                                                  const valColors: Record<string, string> = {
                                                    positive: 'text-emerald-700',
                                                    negative: 'text-red-600',
                                                    warning: 'text-amber-700',
                                                    neutral: 'text-slate-700',
                                                  };
                                                  return (
                                                    <div key={i} className={`rounded-lg border p-2.5 ${colors[ins.type] || colors.neutral}`}>
                                                      <p className="text-xs text-slate-500 mb-0.5">{ins.title}</p>
                                                      <p className={`text-sm font-bold ${valColors[ins.type] || valColors.neutral}`}>{ins.value}</p>
                                                      <p className="text-xs text-slate-500 mt-0.5">{ins.description}</p>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}

                                          {/* Chart */}
                                          {demoArtifacts[op.id].chartData && (
                                            <div>
                                              <p className="text-xs font-semibold text-slate-600 mb-2">{demoArtifacts[op.id].chartData.title}</p>
                                              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                                {demoArtifacts[op.id].chartData.datasets?.map((ds: any, di: number) => (
                                                  <div key={di} className="mb-3">
                                                    <p className="text-xs text-slate-500 mb-1.5 font-medium">{ds.name}</p>
                                                    <div className="flex items-end gap-1 h-16">
                                                      {ds.values?.map((val: number, vi: number) => {
                                                        const max = Math.max(...(ds.values || [1]));
                                                        const height = Math.max(4, (val / max) * 56);
                                                        const barColors: Record<string, string> = { blue: 'bg-blue-400 hover:bg-blue-500', red: 'bg-red-400 hover:bg-red-500', green: 'bg-emerald-400 hover:bg-emerald-500', amber: 'bg-amber-400 hover:bg-amber-500' };
                                                        return (
                                                          <div key={vi} className="flex-1 flex flex-col items-center gap-0.5 group">
                                                            <span className="text-[9px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">{val}</span>
                                                            <div className={`w-full rounded-t transition-colors ${barColors[ds.color] || barColors.blue}`} style={{ height }} />
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                    <div className="flex gap-1 mt-1 overflow-hidden">
                                                      {demoArtifacts[op.id].chartData.labels?.map((lbl: string, li: number) => (
                                                        <div key={li} className="flex-1 text-center">
                                                          <span className="text-[9px] text-slate-400 truncate block">{lbl}</span>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {/* Sample data table */}
                                          {demoArtifacts[op.id].datasets?.[0] && (
                                            <div>
                                              <p className="text-xs font-semibold text-slate-600 mb-2">
                                                Sample data — {demoArtifacts[op.id].datasets[0].name}
                                                <span className="ml-1 text-slate-400 font-normal">(synthetic)</span>
                                              </p>
                                              <div className="overflow-x-auto rounded-lg border border-slate-200">
                                                <table className="w-full text-xs">
                                                  <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-200">
                                                      {demoArtifacts[op.id].datasets[0].columns?.map((col: string, ci: number) => (
                                                        <th key={ci} className="text-left px-3 py-2 text-slate-500 font-semibold whitespace-nowrap">{col}</th>
                                                      ))}
                                                    </tr>
                                                  </thead>
                                                  <tbody className="divide-y divide-slate-100">
                                                    {demoArtifacts[op.id].datasets[0].rows?.slice(0, 8).map((row: any[], ri: number) => (
                                                      <tr key={ri} className="hover:bg-slate-50 transition-colors">
                                                        {row.map((cell, ci) => (
                                                          <td key={ci} className="px-3 py-1.5 text-slate-600 whitespace-nowrap">{cell}</td>
                                                        ))}
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                                {demoArtifacts[op.id].datasets[0].rows?.length > 8 && (
                                                  <p className="text-xs text-slate-400 px-3 py-2 bg-slate-50 border-t border-slate-100">
                                                    Showing 8 of {demoArtifacts[op.id].datasets[0].rows.length} rows
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          )}

                                          {/* Key findings + next steps */}
                                          <div className="grid grid-cols-2 gap-4">
                                            {demoArtifacts[op.id].keyFindings?.length > 0 && (
                                              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                                <p className="text-xs font-semibold text-blue-700 mb-2">Key findings</p>
                                                <ul className="space-y-1">
                                                  {demoArtifacts[op.id].keyFindings.map((f: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-2 text-xs text-blue-800">
                                                      <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span>{f}
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}
                                            {demoArtifacts[op.id].nextSteps?.length > 0 && (
                                              <div className="bg-violet-50 border border-violet-100 rounded-lg p-3">
                                                <p className="text-xs font-semibold text-violet-700 mb-2">Recommended next steps</p>
                                                <ul className="space-y-1">
                                                  {demoArtifacts[op.id].nextSteps.map((s: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-2 text-xs text-violet-800">
                                                      <span className="w-4 h-4 rounded-full bg-violet-200 text-violet-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>{s}
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  {/* Footer row */}
                  <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1"><Clock size={11} />{op.timeline}</div>
                    <div className="font-semibold text-slate-700">${Math.round((op.valueLow || 0)/1000)}K–${Math.round((op.valueHigh || 0)/1000)}K</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Outreach */}
      {tab === 'outreach' && (
        <div className="space-y-4">
          {!lead.outreach?.length ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
              <Mail size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-600 mb-1">No outreach generated yet</p>
              <button onClick={() => runAgentCall('outreach')} disabled={running.outreach}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {running.outreach ? 'Generating...' : 'Generate Outreach'}
              </button>
            </div>
          ) : (
            lead.outreach.map((msg: any) => (
              <OutreachCard key={msg.id} msg={msg} contactEmail={contact?.email} />
            ))
          )}
        </div>
      )}

      {/* Call Prep */}
      {tab === 'callprep' && (
        <div>
          {!lead.callPrep ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
              <ClipboardList size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-600 mb-1">No call prep yet</p>
              <button onClick={() => runAgentCall('callprep')} disabled={running.callprep}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {running.callprep ? 'Generating...' : 'Generate Call Prep'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-blue-700 mb-2">Suggested opening</h3>
                  <p className="text-sm text-blue-900 leading-relaxed italic">"{lead.callPrep.opening}"</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Discovery questions</h3>
                  <div className="space-y-3">
                    {(lead.callPrep.questions as string[])?.map((q, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 bg-blue-100 rounded-full text-xs font-semibold text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                        <p className="text-sm text-slate-700">{q}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Objections & responses</h3>
                  <div className="space-y-4">
                    {(lead.callPrep.objections as any[])?.map((o, i) => (
                      <div key={i} className="text-sm">
                        <p className="font-medium text-slate-700 mb-1">"<em>{o.objection}</em>"</p>
                        <p className="text-slate-600 bg-slate-50 rounded-lg p-2.5">{o.response}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-violet-700 mb-2">Demo idea</h3>
                  <p className="text-sm text-violet-900">{lead.callPrep.demoIdea}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-emerald-700 mb-2">Recommended next step</h3>
                  <p className="text-sm text-emerald-900">{lead.callPrep.nextStep}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Activity */}
      {tab === 'activity' && (
        <div>
          {!lead.activities?.length ? (
            <p className="text-center text-sm text-slate-400 py-8">No activity yet. Run agents to build history.</p>
          ) : (
            <div className="space-y-2">
              {lead.activities.map((a: any) => (
                <div key={a.id} className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles size={12} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-800">{a.action}</p>
                      <span className="text-xs text-slate-400 flex-shrink-0">{new Date(a.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{a.agent} · {a.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
