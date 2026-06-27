'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain, LayoutDashboard, Building2, Plus, Search, ListTodo, Settings } from 'lucide-react';
import { cn } from '@/lib/cn';

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Building2 },
  { href: '/leads/new', label: 'Add lead', icon: Plus },
  { href: '/discover', label: 'Discover', icon: Search },
  { href: '/followups', label: 'Follow-ups', icon: ListTodo },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col h-screen fixed left-0 top-0 z-30">
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Brain size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-none">LeadAgent</p>
            <p className="text-xs text-slate-400 mt-0.5">AI sales intelligence</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const active = item.href === '/' ? path === '/' : path.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100')}>
              <item.icon size={15} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
