'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  Users,
  FileSignature,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Code2,
  Bot,
  LifeBuoy,
  Shield,
} from 'lucide-react';
import { LogoFull } from '@/components/brand/Logo';
import { OrgSwitcher } from '@/components/layout/OrgSwitcher';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Organization = Database['public']['Tables']['organizations']['Row'];

interface SidebarProps {
  profile: Profile;
  organization: Organization;
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Drivers', href: '/drivers', icon: Users },
  { label: 'Consents', href: '/consents', icon: FileSignature },
  { label: 'Templates', href: '/templates', icon: FileText },
  { label: 'Billing', href: '/billing', icon: CreditCard },
  { label: 'API', href: '/api-docs', icon: Code2 },
  { label: 'MCP', href: '/mcp-docs', icon: Bot },
  { label: 'Help', href: '/help', icon: LifeBuoy },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ profile, organization }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  function isActive(href: string) {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  }

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-[#1e2129]">
        <LogoFull mode="dark" className="h-5 w-auto" />
      </div>

      {/* Org switcher */}
      <div className="px-4 pt-4 pb-2">
        <OrgSwitcher organization={organization} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#C8A75E]/15 text-[#C8A75E]'
                  : 'text-[#6b6f76] hover:bg-[#1e2129] hover:text-[#d4d4cf]'
              }`}
            >
              <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-[#C8A75E]' : 'text-[#5c6370] group-hover:text-[#8b919a]'}`} />
              <span className="flex-1">{item.label}</span>
              {active && (
                <div className="h-1.5 w-1.5 bg-[#C8A75E]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Admin link (only for platform admins) */}
      {profile.is_platform_admin && (
        <div className="px-3 pb-2">
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Shield className="h-[18px] w-[18px] shrink-0" />
            <span className="flex-1">Admin Panel</span>
            <span className="inline-flex items-center px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider bg-red-600 text-white">
              Admin
            </span>
          </Link>
        </div>
      )}

      {/* User info + logout */}
      <div className="border-t border-[#1e2129] p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center bg-[#1e2129] text-xs font-bold text-[#C8A75E] uppercase tracking-wider">
            {profile.full_name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#d4d4cf]">
              {profile.full_name}
            </p>
            <p className="truncate text-xs text-[#5c6370]">
              {profile.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-[#5c6370] hover:bg-[#1e2129] hover:text-[#d4d4cf] transition-colors disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          {signingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 flex h-10 w-10 items-center justify-center bg-[#0c0f14] text-white shadow-lg lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0c0f14]/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-[#0c0f14] transition-transform duration-200 ease-in-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center text-[#5c6370] hover:text-white"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 bg-[#0c0f14] lg:block">
        {sidebarContent}
      </aside>
    </>
  );
}
