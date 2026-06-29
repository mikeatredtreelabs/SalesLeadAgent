'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, Plus, Search, ListTodo, Settings, Zap } from 'lucide-react';
import { cn } from '@/lib/cn';

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Building2 },
  { href: '/discover', label: 'Discover', icon: Search },
  { href: '/followups', label: 'Follow-ups', icon: ListTodo },
];

type Theme = 'red' | 'blue';

interface SidebarProps {
  tenantName: string;
  tenantTagline: string;
  tenantLogoText: string;
  theme: Theme;
}

const themes = {
  red: {
    sidebar: 'bg-zinc-950',
    sidebarBorder: 'border-zinc-800',
    logo: 'bg-red-600',
    addBtn: 'bg-red-600 hover:bg-red-700 text-white',
    navActive: 'bg-red-600/20 text-red-400 font-medium',
    navInactive: 'text-zinc-400 hover:bg-zinc-800 hover:text-white',
    navIcon: 'text-zinc-500',
    navIconActive: 'text-red-400',
    text: 'text-white',
    subtext: 'text-zinc-400',
    pipelineBox: 'bg-zinc-900 border-zinc-800',
    pipelineText: 'text-zinc-500',
    pipelineNum: 'bg-zinc-800 text-zinc-500',
    dot: 'bg-red-500',
    bottomBorder: 'border-zinc-800',
  },
  blue: {
    sidebar: 'bg-white',
    sidebarBorder: 'border-slate-200',
    logo: 'bg-blue-600',
    addBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
    navActive: 'bg-blue-50 text-blue-700 font-medium',
    navInactive: 'text-slate-600 hover:bg-slate-100 hover:text-slate-800',
    navIcon: 'text-slate-400',
    navIconActive: 'text-blue-600',
    text: 'text-slate-900',
    subtext: 'text-slate-400',
    pipelineBox: 'bg-slate-50 border-slate-200',
    pipelineText: 'text-slate-500',
    pipelineNum: 'bg-slate-200 text-slate-500',
    dot: 'bg-emerald-400',
    bottomBorder: 'border-slate-100',
  },
};

export default function Sidebar({ tenantName, tenantTagline, tenantLogoText, theme }: SidebarProps) {
  const path = usePathname();
  const t = themes[theme] || themes.blue;

  return (
    <aside className={cn('w-60 flex flex-col h-screen fixed left-0 top-0 z-30 shadow-sm border-r', t.sidebar, t.sidebarBorder)}>
      {/* Logo */}
      <div className={cn('px-5 py-5 border-b', t.sidebarBorder)}>
        <div className="flex items-center gap-3">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shadow-sm font-bold text-white text-xs', t.logo)}>
            {tenantLogoText.slice(0, 2)}
          </div>
          <div>
            <p className={cn('text-sm font-bold leading-none tracking-tight', t.text)}>{tenantName}</p>
            <p className={cn('text-xs mt-0.5', t.subtext)}>{tenantTagline}</p>
          </div>
        </div>
      </div>

      {/* Add lead CTA */}
      <div className="px-3 pt-4 pb-2">
        <Link href="/leads/new" className={cn('flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm', t.addBtn)}>
          <Plus size={15} /> Add lead
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const active = item.href === '/' ? path === '/' : path.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors', active ? t.navActive : t.navInactive)}>
              <item.icon size={16} className={active ? t.navIconActive : t.navIcon} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Pipeline indicator */}
      <div className="px-3 mb-3">
        <div className={cn('px-4 py-3 rounded-xl border', t.pipelineBox)}>
          <p className={cn('text-xs font-semibold mb-2 flex items-center gap-1.5', t.pipelineText)}>
            <Zap size={11} /> Agent pipeline
          </p>
          {['Research', 'Score', 'Opportunities', 'Outreach', 'Call Prep'].map((step, i) => (
            <div key={step} className="flex items-center gap-1.5 py-0.5">
              <span className={cn('w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0', t.pipelineNum)}>{i + 1}</span>
              <span className={cn('text-xs', t.pipelineText)}>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div className={cn('px-3 pb-4 pt-2 border-t', t.bottomBorder)}>
        <Link href="/settings"
          className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors', path.startsWith('/settings') ? t.navActive : t.navInactive)}>
          <Settings size={16} className={path.startsWith('/settings') ? t.navIconActive : t.navIcon} />
          Settings
        </Link>
      </div>
    </aside>
  );
}
