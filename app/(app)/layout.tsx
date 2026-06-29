import Sidebar from '@/components/Sidebar';
import { getTenant } from '@/config/tenant';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const tenant = getTenant();

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar
        tenantName={tenant.name}
        tenantTagline={tenant.tagline}
        tenantLogoText={tenant.logoText}
        tenantColors={tenant.colors}
      />
      <main className="ml-60 flex-1 min-h-screen">
        {/* Top bar */}
        <div className="h-14 bg-white border-b border-slate-200 flex items-center px-8 sticky top-0 z-20">
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: tenant.colors.primary }} />
            Agents ready
          </div>
        </div>
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
