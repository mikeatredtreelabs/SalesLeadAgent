export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Brain, Users, Mail, CheckCircle2, TrendingUp, Clock, Star, ChevronRight, Building2, ArrowUpRight } from 'lucide-react';
import ScoreBadge from '@/components/ScoreBadge';
import StatusBadge from '@/components/StatusBadge';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const userId = (session.user as any).id;

  const leads = await prisma.lead.findMany({
    where: { userId },
    include: {
      scoreDetail: true,
      research: { take: 1, orderBy: { createdAt: 'desc' } },
      activities: { take: 1, orderBy: { createdAt: 'desc' } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const total = leads.length;
  const scored = leads.filter(l => l.score);
  const avgScore = scored.length ? Math.round(scored.reduce((s, l) => s + (l.score || 0), 0) / scored.length) : null;
  const qualified = leads.filter(l => ['Qualified', 'Outreach Ready'].includes(l.status)).length;
  const meetings = leads.filter(l => l.status === 'Meeting Scheduled').length;
  const won = leads.filter(l => l.status === 'Won').length;
  const followUp = leads.filter(l => l.status === 'Follow-Up Needed').length;
  const topLeads = [...leads].filter(l => l.score).sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 6);
  const recent = leads.slice(0, 5);

  const pipelineStages = ['New', 'Researching', 'Qualified', 'Outreach Ready', 'Contacted', 'Meeting Scheduled', 'Won'];
  const pipelineData = pipelineStages.map(s => ({ stage: s, count: leads.filter(l => l.status === s).length }));
  const maxCount = Math.max(...pipelineData.map(d => d.count), 1);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Pipeline overview</h1>
          <p className="text-sm text-slate-500 mt-1">Welcome back, {session.user?.name || session.user?.email?.split('@')[0]}</p>
        </div>
        <Link href="/leads/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
          + Add lead
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        {/* Total leads */}
        <Link href="/leads" className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-red-200 hover:-translate-y-0.5 transition-all cursor-pointer group">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center mb-3">
            <Users size={15} className="text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600 leading-none mb-1">{total}</div>
          <p className="text-xs text-slate-500">Total leads</p>
        </Link>
        {/* Avg score */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
            <Star size={15} className="text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 leading-none mb-1">
            {avgScore ?? '—'}{avgScore && <span className="text-sm font-normal text-slate-400">/100</span>}
          </div>
          <p className="text-xs text-slate-500">Avg score</p>
        </div>
        {/* Outreach ready */}
        <Link href="/leads?status=Outreach+Ready" className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-emerald-200 hover:-translate-y-0.5 transition-all cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mb-3">
            <Mail size={15} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 leading-none mb-1">{qualified}</div>
          <p className="text-xs text-slate-500">Outreach ready</p>
        </Link>
        {/* Meetings */}
        <Link href="/leads?status=Meeting+Scheduled" className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-violet-200 hover:-translate-y-0.5 transition-all cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center mb-3">
            <CheckCircle2 size={15} className="text-violet-600" />
          </div>
          <div className="text-2xl font-bold text-violet-600 leading-none mb-1">{meetings}</div>
          <p className="text-xs text-slate-500">Meetings booked</p>
        </Link>
        {/* Won */}
        <Link href="/leads?status=Won" className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-green-200 hover:-translate-y-0.5 transition-all cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center mb-3">
            <TrendingUp size={15} className="text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600 leading-none mb-1">{won}</div>
          <p className="text-xs text-slate-500">Won</p>
        </Link>
        {/* Follow-up */}
        <Link href="/followups" className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-orange-200 hover:-translate-y-0.5 transition-all cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center mb-3">
            <Clock size={15} className="text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-600 leading-none mb-1">{followUp}</div>
          <p className="text-xs text-slate-500">Follow-up needed</p>
        </Link>
      </div>

      {/* Pipeline bar chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Pipeline stages</h2>
        <div className="flex items-end gap-2 h-16">
          {pipelineData.map(({ stage, count }) => {
            const height = count === 0 ? 4 : Math.max(10, (count / maxCount) * 56);
            return (
              <div key={stage} className="flex-1 flex flex-col items-center gap-1 group">
                <span className="text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">{count}</span>
                <div className="w-full bg-red-100 hover:bg-red-500 rounded-t transition-colors cursor-default" style={{ height }} />
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 mt-2">
          {pipelineData.map(({ stage }) => (
            <div key={stage} className="flex-1 text-center">
              <span className="text-[10px] text-slate-400 leading-tight block">{stage}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two column: top leads + recent activity */}
      <div className="grid grid-cols-5 gap-6">
        {/* Top scored leads */}
        <div className="col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Top scored leads</h2>
            <Link href="/leads" className="text-xs text-red-600 hover:underline flex items-center gap-1">
              View all <ArrowUpRight size={11} />
            </Link>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {topLeads.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">
                No scored leads yet — open a lead and run the Score agent
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-[2fr_1.5fr_auto_auto_auto] gap-4 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                  {['Company', 'Industry', 'Score', 'Status', ''].map((h, i) => (
                    <div key={i} className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</div>
                  ))}
                </div>
                <div className="divide-y divide-slate-100">
                  {topLeads.map(l => (
                    <Link key={l.id} href={`/leads/${l.id}`}
                      className="grid grid-cols-[2fr_1.5fr_auto_auto_auto] gap-4 px-4 py-3 items-center hover:bg-slate-50 transition-colors group">
                      <div>
                        <p className="text-sm font-medium text-slate-800 group-hover:text-red-700 transition-colors">{l.companyName}</p>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{l.industry || '—'}</p>
                      <ScoreBadge score={l.score} />
                      <StatusBadge status={l.status} />
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-red-500 transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="col-span-2">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Recent activity</h2>
          <div className="space-y-2">
            {recent.length === 0 && (
              <p className="text-sm text-slate-400 bg-white border border-slate-200 rounded-xl p-4 text-center">No activity yet</p>
            )}
            {recent.map(l => (
              <Link key={l.id} href={`/leads/${l.id}`}
                className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-red-200 hover:bg-red-50/30 transition-all group">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-red-100 transition-colors">
                  {l.research.length > 0
                    ? <Brain size={14} className="text-red-500" />
                    : <Building2 size={14} className="text-slate-400 group-hover:text-red-500 transition-colors" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate group-hover:text-red-700 transition-colors">{l.companyName}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {l.activities[0]?.action || 'Added · ' + new Date(l.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <ChevronRight size={14} className="text-slate-300 flex-shrink-0 group-hover:text-red-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
