export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ListTodo, ChevronRight } from 'lucide-react';

export default async function FollowUpsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const userId = (session.user as any).id;
  const tasks = await prisma.followUpTask.findMany({
    where: { completed: false, lead: { userId } },
    include: { lead: true },
    orderBy: { dueDate: 'asc' },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Follow-ups <span className="text-slate-400 font-normal text-lg ml-1">{tasks.length}</span></h1>
      {tasks.length === 0 ? (
        <div className="text-center py-16 text-slate-400"><ListTodo size={32} className="mx-auto mb-3 opacity-30" /><p className="text-sm">No pending follow-ups</p></div>
      ) : (
        <div className="space-y-2">
          {tasks.map(t => (
            <Link key={t.id} href={`/leads/${t.leadId}`}
              className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl px-5 py-4 hover:border-blue-300 transition-all">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">{t.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t.lead.companyName}</p>
              </div>
              {t.dueDate && <span className="text-xs text-slate-500">{new Date(t.dueDate).toLocaleDateString()}</span>}
              <ChevronRight size={14} className="text-slate-400" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
