'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileSignature,
  Wrench,
  ScrollText,
  DollarSign,
  ArrowLeft,
  Menu,
  X,
} from 'lucide-react';
import { LogoFull } from '@/components/brand/Logo';

const adminNavItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Organizations', href: '/admin/organizations', icon: Building2 },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Consents', href: '/admin/consents', icon: FileSignature },
  { label: 'Configuration', href: '/admin/config', icon: Wrench },
  { label: 'Audit Log', href: '/admin/audit', icon: ScrollText },
  { label: 'Revenue', href: '/admin/revenue', icon: DollarSign },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo + admin badge */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-[#1e2129]">
        <LogoFull mode="dark" className="h-5 w-auto" />
        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider bg-red-600 text-white">
          Admin
        </span>
      </div>

      {/* Back to dashboard */}
      <div className="px-3 pt-4 pb-2">
        <Link
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#5c6370] hover:bg-[#1e2129] hover:text-[#d4d4cf] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {adminNavItems.map((item) => {
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
              <Icon
                className={`h-[18px] w-[18px] shrink-0 ${
                  active ? 'text-[#C8A75E]' : 'text-[#5c6370] group-hover:text-[#8b919a]'
                }`}
              />
              <span className="flex-1">{item.label}</span>
              {active && <div className="h-1.5 w-1.5 bg-[#C8A75E]" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[#1e2129] p-4">
        <p className="text-[0.65rem] text-[#5c6370] uppercase tracking-wider">
          Platform Administration
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 flex h-10 w-10 items-center justify-center bg-[#0c0f14] text-white shadow-lg lg:hidden"
        aria-label="Open admin sidebar"
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
