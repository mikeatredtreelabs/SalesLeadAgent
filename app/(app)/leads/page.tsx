export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Building2, Brain, ChevronRight } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import ScoreBadge from '@/components/ScoreBadge';

export default async function LeadsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const userId = (session.user as any).id;
  const leads = await prisma.lead.findMany({
    where: { userId },
    include: { contacts: true, research: { take: 1, orderBy: { createdAt: 'desc' } } },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Leads <span className="text-slate-400 font-normal text-lg ml-1">{leads.length}</span>
        </h1>
        <Link href="/leads/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={15} /> Add lead
        </Link>
      </div>
      <div className="space-y-2">
        {leads.map(l => (
          <Link key={l.id} href={`/leads/${l.id}`}
            className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl px-5 py-4 hover:border-blue-300 hover:bg-blue-50/20 transition-all group">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 size={18} className="text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">{l.companyName}</p>
                {l.research.length > 0 && <Brain size={12} className="text-blue-400" />}
              </div>
              <p className="text-xs text-slate-500">{[l.industry, l.location, l.size].filter(Boolean).join(' · ')}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <ScoreBadge score={l.score} />
              <StatusBadge status={l.status} />
              <ChevronRight size={15} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
            </div>
          </Link>
        ))}
        {leads.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Building2 size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm mb-3">No leads yet</p>
            <Link href="/leads/new" className="text-sm text-blue-600 hover:underline">Add your first lead</Link>
          </div>
        )}
      </div>
    </div>
  );
}
