export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Building2, Brain, ChevronRight, Plus, Download } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import ScoreBadge from '@/components/ScoreBadge';

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const userId = (session.user as any).id;
  const params = await searchParams;

  const where: any = { userId };
  if (params.status && params.status !== 'All') where.status = params.status;

  const leads = await prisma.lead.findMany({
    where,
    include: { contacts: true, research: { take: 1, orderBy: { createdAt: 'desc' } } },
    orderBy: { updatedAt: 'desc' },
  });

  const all = await prisma.lead.findMany({ where: { userId }, select: { status: true } });
  const statusCounts = all.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc; }, {} as Record<string, number>);
  const statuses = ['All', 'New', 'Researching', 'Qualified', 'Outreach Ready', 'Contacted', 'Meeting Scheduled', 'Won', 'Lost'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Leads</h1>
          <p className="text-sm text-slate-500 mt-1">
            {leads.length} {params.status && params.status !== 'All' ? params.status.toLowerCase() : 'total'} leads
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/leads/export"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:border-slate-300 hover:bg-slate-50 transition-colors">
            <Download size={15} /> Export CSV
          </a>
          <Link href="/leads/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
            <Plus size={15} /> Add lead
          </Link>
        </div>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {statuses.map(s => {
          const count = s === 'All' ? all.length : (statusCounts[s] || 0);
          const active = (params.status || 'All') === s;
          return (
            <Link key={s} href={s === 'All' ? '/leads' : `/leads?status=${encodeURIComponent(s)}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                active ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
              }`}>
              {s}
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${active ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {leads.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-500 mb-3">No leads found</p>
            <Link href="/leads/new" className="text-sm text-blue-600 hover:underline">Add your first lead</Link>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-[2fr_1.2fr_1.2fr_0.7fr_1fr_0.8fr_32px] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Company</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Industry</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Score</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Source</div>
              <div />
            </div>
            <div className="divide-y divide-slate-100">
              {leads.map(l => (
                <Link
                  key={l.id}
                  href={`/leads/${l.id}`}
                  className="grid grid-cols-[2fr_1.2fr_1.2fr_0.7fr_1fr_0.8fr_32px] gap-4 px-5 py-3.5 items-center hover:bg-blue-50 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                      {l.research.length > 0
                        ? <Brain size={14} className="text-blue-500" />
                        : <Building2 size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors truncate">{l.companyName}</p>
                      {l.location && <p className="text-xs text-slate-400 truncate">{l.location}</p>}
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 truncate">{l.industry || '—'}</div>
                  <div>
                    {l.contacts[0] ? (
                      <div>
                        <p className="text-xs font-medium text-slate-700 truncate">{l.contacts[0].name}</p>
                        <p className="text-xs text-slate-400 truncate">{l.contacts[0].title}</p>
                      </div>
                    ) : <span className="text-xs text-slate-300">—</span>}
                  </div>
                  <div><ScoreBadge score={l.score} /></div>
                  <div><StatusBadge status={l.status} /></div>
                  <div className="text-xs text-slate-400 truncate">{l.source || '—'}</div>
                  <div className="flex items-center justify-end">
                    <ChevronRight size={15} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
