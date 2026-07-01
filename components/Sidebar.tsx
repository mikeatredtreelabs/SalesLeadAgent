'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, Plus, Search, ListTodo, Settings, Zap } from 'lucide-react';

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/discover', label: 'Discover', icon: Search },
  { href: '/leads', label: 'Leads', icon: Building2 },
  { href: '/followups', label: 'Follow-ups', icon: ListTodo },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="w-60 flex flex-col h-screen fixed left-0 top-0 z-30 bg-white border-r border-slate-200 shadow-sm">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="font-bold text-white text-xs">RT</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-none tracking-tight">Red Tree AI</p>
            <p className="text-xs text-slate-400 mt-0.5">AI sales intelligence</p>
          </div>
        </div>
      </div>

      {/* Add lead CTA */}
      <div className="px-3 pt-4 pb-2">
        <Link href="/leads/new"
          className="flex items-center gap-2 w-full px-3 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Plus size={15} />
          Add lead
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const active = item.href === '/' ? path === '/' : path.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-red-50 text-red-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
              }`}>
              <item.icon size={16} className={active ? 'text-red-600' : 'text-slate-400'} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Pipeline indicator */}
      <div className="px-3 mb-3">
        <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
            <Zap size={11} className="text-red-500" /> Agent pipeline
          </p>
          {['Research', 'Score', 'Opportunities', 'Outreach', 'Call Prep'].map((step, i) => (
            <div key={step} className="flex items-center gap-1.5 py-0.5">
              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
              <span className="text-xs text-slate-500">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="px-3 pb-4 pt-2 border-t border-slate-100">
        <Link href="/settings"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
            path.startsWith('/settings')
              ? 'bg-red-50 text-red-700 font-medium'
              : 'text-slate-600 hover:bg-slate-100'
          }`}>
          <Settings size={16} className={path.startsWith('/settings') ? 'text-red-600' : 'text-slate-400'} />
          Settings
        </Link>
      </div>
    </aside>
  );
}
