export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Brain, Users, Mail, CheckCircle2, TrendingUp, Clock, Star, ChevronRight, Building2, Zap, ArrowUpRight } from 'lucide-react';
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

  const stats = [
    { label: 'Total leads', value: total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', href: '/leads' },
    { label: 'Avg score', value: avgScore ? `${avgScore}` : '—', suffix: avgScore ? '/100' : '', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', href: null },
    { label: 'Outreach ready', value: qualified, icon: Mail, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', href: '/leads?status=Outreach+Ready' },
    { label: 'Meetings booked', value: meetings, icon: CheckCircle2, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100', href: '/leads?status=Meeting+Scheduled' },
    { label: 'Won', value: won, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', href: '/leads?status=Won' },
    { label: 'Follow-up needed', value: followUp, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', href: '/followups' },
  ];

  // Pipeline breakdown
  const pipelineStages = ['New','Researching','Qualified','Outreach Ready','Contacted','Meeting Scheduled','Won'];
  const pipelineData = pipelineStages.map(s => ({ stage: s, count: leads.filter(l => l.status === s).length }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Pipeline overview</h1>
          <p className="text-sm text-slate-500 mt-1">Welcome back, {session.user?.name || session.user?.email?.split('@')[0]}</p>
        </div>
        <Link href="/leads/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
          + Add lead
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-4 mb-8">
        {stats.map(s => {
          const inner = (
            <>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon size={15} className={s.color} />
              </div>
              <div className={`text-2xl font-bold ${s.color} leading-none mb-1`}>
                {s.value}{(s as any).suffix && <span className="text-sm font-normal text-slate-400">{(s as any).suffix}</span>}
              </div>
              <p className="text-xs text-slate-500">{s.label}</p>
            </>
          );
          return s.href ? (
            <Link key={s.label} href={s.href}
              className={`bg-white border ${s.border} rounded-xl p-4 hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer`}>
              {inner}
            </Link>
          ) : (
            <div key={s.label} className={`bg-white border ${s.border} rounded-xl p-4`}>
              {inner}
            </div>
          );
        })}
      </div>

      {/* Pipeline bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Pipeline stages</h2>
        <div className="flex items-end gap-1 h-16">
          {pipelineData.map(({ stage, count }) => {
            const max = Math.max(...pipelineData.map(d => d.count), 1);
            const height = count === 0 ? 4 : Math.max(12, (count / max) * 56);
            return (
              <div key={stage} className="flex-1 flex flex-col items-center gap-1 group">
                <span className="text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium">{count}</span>
                <div className="w-full bg-blue-100 rounded-t-sm group-hover:bg-blue-500 transition-colors" style={{ height }} />
              </div>
            );
          })}
        </div>
        <div className="flex gap-1 mt-2">
          {pipelineData.map(({ stage }) => (
            <div key={stage} className="flex-1 text-center">
              <span className="text-[10px] text-slate-400 leading-none">{stage.replace(' ', '\n')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two column: top leads + recent activity */}
      <div className="grid grid-cols-5 gap-6">
        {/* Top scored leads — 3 cols */}
        <div className="col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Top scored leads</h2>
            <Link href="/leads" className="text-xs text-blue-600 hover:underline flex items-center gap-1">View all <ArrowUpRight size={11} /></Link>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {topLeads.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">No scored leads yet — research a lead to generate a score</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Company</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Industry</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Score</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Status</th>
                    <th className="px-4" />
                  </tr>
                </thead>
                <tbody>
                  {topLeads.map((l, i) => (
                    <tr key={l.id} className={`hover:bg-slate-50 transition-colors ${i < topLeads.length - 1 ? 'border-b border-slate-100' : ''}`}>
                      <td className="px-4 py-3">
                        <Link href={`/leads/${l.id}`} className="text-sm font-medium text-slate-800 hover:text-blue-700 transition-colors">{l.companyName}</Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{l.industry || '—'}</td>
                      <td className="px-4 py-3"><ScoreBadge score={l.score} /></td>
                      <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                      <td className="px-4 py-3">
                        <Link href={`/leads/${l.id}`}><ChevronRight size={14} className="text-slate-300 hover:text-blue-500" /></Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent activity — 2 cols */}
        <div className="col-span-2">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Recent activity</h2>
          <div className="space-y-2">
            {recent.length === 0 && (
              <p className="text-sm text-slate-400 bg-white border border-slate-200 rounded-xl p-4 text-center">No activity yet</p>
            )}
            {recent.map(l => (
              <Link key={l.id} href={`/leads/${l.id}`}
                className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-blue-300 hover:bg-blue-50/30 transition-all group">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {l.research.length > 0 ? <Brain size={14} className="text-blue-500" /> : <Building2 size={14} className="text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate group-hover:text-blue-700 transition-colors">{l.companyName}</p>
                  <p className="text-xs text-slate-400">
                    {l.activities[0] ? l.activities[0].action : 'Added · ' + new Date(l.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
