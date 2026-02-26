'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogoFull, LogoIcon } from '@/components/brand/Logo';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
  { label: 'TMS Partners', href: '/tms' },
  { label: 'Docs', href: '/docs' },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  function getNavHref(href: string) {
    // Anchor links should navigate to landing page sections when not on landing page
    if (href.startsWith('#') && !isLandingPage) {
      return `/${href}`;
    }
    return href;
  }

  function handleNavClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    setMobileOpen(false);
    if (!href.startsWith('#')) return; // allow normal navigation for page links
    if (!isLandingPage) return; // let the browser navigate to /#section
    e.preventDefault();
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white border-b border-[#e8e8e3] shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
            : 'bg-white border-b border-[#e8e8e3]'
        }`}
      >
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <LogoFull mode="light" className="hidden sm:block" />
            <LogoIcon className="sm:hidden text-[#0c0f14] w-7 h-7" />
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={getNavHref(link.href)}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-[0.8rem] font-semibold text-[#6b6f76] hover:text-[#0c0f14] transition-colors tracking-wide"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-block text-sm font-semibold text-[#3a3f49] hover:text-[#0c0f14] transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="bg-[#0c0f14] text-white text-[0.8rem] font-semibold px-5 py-2 hover:bg-[#1a1e27] transition-colors"
            >
              Get started
            </Link>

            {/* Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-[5px] ml-1"
              aria-label="Toggle menu"
            >
              <span className={`block w-5 h-[1.5px] bg-[#0c0f14] transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-[3.25px]' : ''}`} />
              <span className={`block w-5 h-[1.5px] bg-[#0c0f14] transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-[1.5px] bg-[#0c0f14] transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-[3.25px]' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#0c0f14]/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          {/* Panel */}
          <div className="absolute top-16 left-0 right-0 bg-white border-b border-[#e8e8e3] shadow-lg">
            <div className="px-6 py-4 space-y-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={getNavHref(link.href)}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="block py-3 text-sm font-semibold text-[#3a3f49] hover:text-[#0c0f14] border-b border-[#f0f0ec] last:border-0 transition-colors"
                >
                  {link.label}
                </a>
              ))}

              <div className="pt-3 flex flex-col gap-2">
                <Link
                  href="/login"
                  className="block py-3 text-sm font-semibold text-[#6b6f76] text-center border border-[#e8e8e3] hover:text-[#0c0f14] hover:border-[#0c0f14] transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="block py-3 text-sm font-bold text-white text-center bg-[#0c0f14] hover:bg-[#1a1e27] transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Get started free
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer to offset fixed nav */}
      <div className="h-16" />
    </>
  );
}
