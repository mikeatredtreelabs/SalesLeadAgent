export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Brain, Users, Mail, CheckCircle2, TrendingUp, Clock, Star, ChevronRight } from 'lucide-react';
import ScoreBadge from '@/components/ScoreBadge';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const userId = (session.user as any).id;

  const leads = await prisma.lead.findMany({
    where: { userId },
    include: { scoreDetail: true, research: { take: 1, orderBy: { createdAt: 'desc' } } },
    orderBy: { updatedAt: 'desc' },
  });

  const total = leads.length;
  const scored = leads.filter(l => l.score);
  const avgScore = scored.length ? Math.round(scored.reduce((s, l) => s + (l.score || 0), 0) / scored.length) : null;
  const qualified = leads.filter(l => ['Qualified','Outreach Ready'].includes(l.status)).length;
  const meetings = leads.filter(l => l.status === 'Meeting Scheduled').length;
  const won = leads.filter(l => l.status === 'Won').length;
  const followUp = leads.filter(l => l.status === 'Follow-Up Needed').length;
  const topLeads = [...leads].filter(l => l.score).sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5);
  const researched = leads.filter(l => l.research.length > 0).slice(0, 4);

  const stats = [
    { label: 'Total leads', value: total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Avg score', value: avgScore ? `${avgScore}/100` : '—', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Outreach ready', value: qualified, icon: Mail, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Meetings booked', value: meetings, icon: CheckCircle2, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Won', value: won, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Follow-up needed', value: followUp, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Pipeline overview</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome back, {session.user?.name || session.user?.email}</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon size={14} className={s.color} />
              </div>
              <span className="text-xs text-slate-500">{s.label}</span>
            </div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Top scored leads</h2>
          <div className="space-y-2">
            {topLeads.length === 0 && <p className="text-sm text-slate-400 bg-slate-50 rounded-xl p-4 text-center">No scored leads yet</p>}
            {topLeads.map(l => (
              <Link key={l.id} href={`/leads/${l.id}`}
                className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                <div>
                  <p className="text-sm font-medium text-slate-800">{l.companyName}</p>
                  <p className="text-xs text-slate-500">{l.industry}</p>
                </div>
                <div className="flex items-center gap-2">
                  <ScoreBadge score={l.score} />
                  <ChevronRight size={14} className="text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Recently researched</h2>
          <div className="space-y-2">
            {researched.length === 0 && <p className="text-sm text-slate-400 bg-slate-50 rounded-xl p-4 text-center">No research yet</p>}
            {researched.map(l => (
              <Link key={l.id} href={`/leads/${l.id}`}
                className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Brain size={14} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{l.companyName}</p>
                  <p className="text-xs text-slate-500 truncate">{(l.research[0]?.summary as string)?.slice(0, 65)}...</p>
                </div>
                <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
