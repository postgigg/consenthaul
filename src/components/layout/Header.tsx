'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  Coins,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from 'lucide-react';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Organization = Database['public']['Tables']['organizations']['Row'];

interface HeaderProps {
  profile: Profile;
  organization: Organization;
  creditBalance: number;
}

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  drivers: 'Drivers',
  consents: 'Consents',
  templates: 'Templates',
  billing: 'Billing',
  'api-docs': 'API',
  settings: 'Settings',
};

export function Header({ profile, organization, creditBalance }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const segments = pathname.split('/').filter(Boolean);
  const pageTitle = pageTitles[segments[0]] ?? segments[0] ?? 'Dashboard';
  const subPage = segments.length > 1 ? segments.slice(1).join(' / ') : null;

  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#e8e8e3] bg-white px-6">
      {/* Left: page title */}
      <div className="flex items-center gap-2 pl-12 lg:pl-0">
        <h1 className="text-sm font-bold text-[#0c0f14] uppercase tracking-wider">{pageTitle}</h1>
        {subPage && (
          <>
            <span className="text-[#d4d4cf]">/</span>
            <span className="text-xs text-[#8b919a] capitalize">{subPage}</span>
          </>
        )}
      </div>

      {/* Right: credits + avatar */}
      <div className="flex items-center gap-3">
        {/* Credit balance */}
        <Link
          href="/billing"
          className="hidden sm:flex items-center gap-1.5 border border-[#e8e8e3] px-3 py-1.5 text-xs font-bold text-[#3a3f49] hover:bg-[#fafaf8] transition-colors"
        >
          <Coins className="h-3.5 w-3.5 text-[#C8A75E]" />
          <span className="tabular-nums">{creditBalance}</span>
          <span className="text-[#8b919a] font-medium">credit{creditBalance !== 1 ? 's' : ''}</span>
        </Link>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 hover:bg-[#fafaf8] transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center bg-[#0c0f14] text-[0.65rem] font-bold text-white tracking-wider">
              {initials}
            </div>
            <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-[#8b919a]" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 origin-top-right border border-[#e8e8e3] bg-white py-1 shadow-lg z-50">
              {/* User info */}
              <div className="border-b border-[#f0f0ec] px-4 py-3">
                <p className="text-sm font-bold text-[#0c0f14] truncate">
                  {profile.full_name}
                </p>
                <p className="text-xs text-[#8b919a] truncate">
                  {profile.email}
                </p>
                <p className="text-[0.65rem] text-[#b5b5ae] mt-0.5 uppercase tracking-wider">
                  {organization.name}
                </p>
              </div>

              {/* Mobile credit badge */}
              <Link
                href="/billing"
                onClick={() => setDropdownOpen(false)}
                className="flex sm:hidden items-center gap-2 px-4 py-2.5 text-sm text-[#3a3f49] hover:bg-[#fafaf8]"
              >
                <Coins className="h-4 w-4 text-[#C8A75E]" />
                {creditBalance} credit{creditBalance !== 1 ? 's' : ''}
              </Link>

              <Link
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#3a3f49] hover:bg-[#fafaf8] transition-colors"
              >
                <User className="h-4 w-4 text-[#8b919a]" />
                Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#3a3f49] hover:bg-[#fafaf8] transition-colors"
              >
                <Settings className="h-4 w-4 text-[#8b919a]" />
                Settings
              </Link>

              <div className="border-t border-[#f0f0ec] my-1" />

              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
