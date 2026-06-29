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

const bottom = [
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  tenantName: string;
  tenantTagline: string;
  tenantLogoText: string;
  tenantColors: {
    primary: string;
    primaryLight: string;
    primaryLightText: string;
    sidebar: string;
    sidebarBorder: string;
  };
}

export default function Sidebar({ tenantName, tenantTagline, tenantLogoText, tenantColors }: SidebarProps) {
  const path = usePathname();

  const isDark = tenantColors.sidebar === '#0f0f0f' || tenantColors.sidebar.startsWith('#0') || tenantColors.sidebar.startsWith('#1');

  return (
    <aside className="w-60 flex flex-col h-screen fixed left-0 top-0 z-30 shadow-sm"
      style={{ backgroundColor: tenantColors.sidebar, borderRight: `1px solid ${tenantColors.sidebarBorder}` }}>

      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: `1px solid ${tenantColors.sidebarBorder}` }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm font-bold text-white text-xs"
            style={{ backgroundColor: tenantColors.primary }}>
            {tenantLogoText.slice(0, 2)}
          </div>
          <div>
            <p className={cn("text-sm font-bold leading-none tracking-tight", isDark ? "text-white" : "text-slate-900")}>{tenantName}</p>
            <p className={cn("text-xs mt-0.5", isDark ? "text-slate-400" : "text-slate-400")}>{tenantTagline}</p>
          </div>
        </div>
      </div>

      {/* Add lead CTA */}
      <div className="px-3 pt-4 pb-2">
        <Link href="/leads/new"
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm text-white"
          style={{ backgroundColor: tenantColors.primary }}>
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
              className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors group',
                active
                  ? isDark ? 'text-white font-medium' : 'font-medium'
                  : isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
              )}
              style={active ? { backgroundColor: `${tenantColors.primary}22`, color: tenantColors.primary } : {}}>
              <item.icon size={16} style={active ? { color: tenantColors.primary } : {}}
                className={!active ? (isDark ? 'text-slate-500' : 'text-slate-400') : ''} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Pipeline indicator */}
      <div className="px-3 mb-3">
        <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', border: `1px solid ${tenantColors.sidebarBorder}` }}>
          <p className={cn("text-xs font-semibold mb-2 flex items-center gap-1.5", isDark ? "text-slate-400" : "text-slate-500")}>
            <Zap size={11} /> Agent pipeline
          </p>
          {['Research', 'Score', 'Opportunities', 'Outreach', 'Call Prep'].map((step, i) => (
            <div key={step} className="flex items-center gap-1.5 py-0.5">
              <span className={cn("w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0",
                isDark ? "bg-slate-700 text-slate-400" : "bg-slate-200 text-slate-500")}>{i + 1}</span>
              <span className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-500")}>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="px-3 pb-4 pt-2" style={{ borderTop: `1px solid ${tenantColors.sidebarBorder}` }}>
        {bottom.map((item) => {
          const active = path.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                active
                  ? isDark ? 'text-white font-medium' : 'font-medium'
                  : isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'
              )}
              style={active ? { color: tenantColors.primary } : {}}>
              <Settings size={16} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
