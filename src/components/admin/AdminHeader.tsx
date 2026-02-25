'use client';

import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

const pageTitles: Record<string, string> = {
  admin: 'Dashboard',
  organizations: 'Organizations',
  users: 'Users',
  consents: 'Consents',
  config: 'Configuration',
  audit: 'Audit Log',
  revenue: 'Revenue',
};

export function AdminHeader() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  // segments[0] = 'admin', segments[1] = page, segments[2+] = sub
  const pageKey = segments[1] ?? 'admin';
  const pageTitle = pageTitles[pageKey] ?? pageKey;
  const subPage = segments.length > 2 ? segments.slice(2).join(' / ') : null;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#e8e8e3] bg-white px-6">
      <div className="flex items-center gap-3 pl-12 lg:pl-0">
        <h1 className="text-sm font-bold text-[#0c0f14] uppercase tracking-wider">
          {pageTitle}
        </h1>
        {subPage && (
          <>
            <span className="text-[#d4d4cf]">/</span>
            <span className="text-xs text-[#8b919a] capitalize">{subPage}</span>
          </>
        )}
      </div>
      <Badge variant="destructive" className="text-[0.6rem]">
        Platform Admin
      </Badge>
    </header>
  );
}
