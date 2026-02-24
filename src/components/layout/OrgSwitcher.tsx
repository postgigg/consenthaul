'use client';

import { Building2, Hash } from 'lucide-react';
import type { Database } from '@/types/database';

type Organization = Database['public']['Tables']['organizations']['Row'];

interface OrgSwitcherProps {
  organization: Organization;
}

export function OrgSwitcher({ organization }: OrgSwitcherProps) {
  return (
    <div className="border border-[#1e2129] px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#1e2129]">
          <Building2 className="h-4 w-4 text-[#C8A75E]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[#d4d4cf]">
            {organization.name}
          </p>
          {organization.dot_number && (
            <p className="flex items-center gap-1 text-[0.65rem] text-[#5c6370] uppercase tracking-wider">
              <Hash className="h-2.5 w-2.5" />
              DOT {organization.dot_number}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
