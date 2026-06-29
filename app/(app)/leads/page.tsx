export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Building2, Brain, ChevronRight, Plus } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import ScoreBadge from '@/components/ScoreBadge';

export default async function LeadsPage({ searchParams }: { searchParams: { status?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const userId = (session.user as any).id;

  const where: any = { userId };
  if (searchParams.status && searchParams.status !== 'All') where.status = searchParams.status;

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
          <p className="text-sm text-slate-500 mt-1">{leads.length} {searchParams.status && searchParams.status !== 'All' ? searchParams.status.toLowerCase() : 'total'} leads</p>
        </div>
        <Link href="/leads/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={15} /> Add lead
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {statuses.map(s => {
          const count = s === 'All' ? all.length : (statusCounts[s] || 0);
          const active = (searchParams.status || 'All') === s;
          return (
            <Link key={s} href={s === 'All' ? '/leads' : `/leads?status=${encodeURIComponent(s)}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                active ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
              }`}>
              {s}
              {count > 0 && <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${active ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{count}</span>}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {leads.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-500 mb-3">No leads found</p>
            <Link href="/leads/new" className="text-sm text-blue-600 hover:underline">Add your first lead →</Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Company</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Industry</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Score</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Source</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map(l => (
                <tr key={l.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {l.research.length > 0
                          ? <Brain size={14} className="text-blue-500" />
                          : <Building2 size={14} className="text-slate-400" />}
                      </div>
                      <div>
                        <Link href={`/leads/${l.id}`} className="text-sm font-semibold text-slate-800 hover:text-blue-700 transition-colors">{l.companyName}</Link>
                        {l.location && <p className="text-xs text-slate-400">{l.location}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-600">{l.industry || <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-3.5">
                    {l.contacts[0] ? (
                      <div>
                        <p className="text-xs font-medium text-slate-700">{l.contacts[0].name}</p>
                        <p className="text-xs text-slate-400">{l.contacts[0].title}</p>
                      </div>
                    ) : <span className="text-xs text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5"><ScoreBadge score={l.score} /></td>
                  <td className="px-4 py-3.5"><StatusBadge status={l.status} /></td>
                  <td className="px-4 py-3.5 text-xs text-slate-400">{l.source || '—'}</td>
                  <td className="px-4 py-3.5">
                    <Link href={`/leads/${l.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={15} className="text-blue-500" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
