import Link from 'next/link';
import type { Metadata } from 'next';
import { LogoFull } from '@/components/brand/Logo';

export const metadata: Metadata = {
  title: 'Acquire ConsentHaul — FMCSA Consent Platform For Sale',
  description: 'Acquire a production-ready FMCSA Clearinghouse consent platform. Full source code, infrastructure, and compliance tooling included.',
  robots: { index: false, follow: false },
};

const INCLUDED = [
  {
    title: 'Full Source Code',
    desc: 'Complete Next.js 14 codebase with App Router, TypeScript, Tailwind CSS, and server components. Production-grade architecture ready to deploy.',
  },
  {
    title: 'Supabase Backend',
    desc: 'PostgreSQL database with Row Level Security, 27+ migration files, type-safe queries, and admin/service role separation.',
  },
  {
    title: 'Stripe Billing',
    desc: 'Credit-based payment system with Stripe Checkout, webhooks, credit packs, and usage tracking. No subscriptions to manage.',
  },
  {
    title: 'FMCSA Consent Engine',
    desc: 'Multi-type consent forms (limited query, pre-employment, blanket) with bilingual EN/ES support. Compliant with 49 CFR Part 382.',
  },
  {
    title: 'Electronic Signature',
    desc: 'Mobile-first signing flow with touch signature capture, IP/device logging, SHA-256 hashing, and tamper-evident PDF generation.',
  },
  {
    title: 'PDF Generation',
    desc: 'React-PDF templates for all consent types in English and Spanish. Branded headers, legal text, and automatic 3-year retention.',
  },
  {
    title: 'Multi-Channel Delivery',
    desc: 'Send consent requests via SMS (Twilio), WhatsApp, or email (Resend). Automatic reminders and escalation workflows.',
  },
  {
    title: 'REST API + MCP Server',
    desc: 'Documented REST API with scoped API keys. MCP (Model Context Protocol) server for AI agent integrations.',
  },
  {
    title: 'TMS Partner Portal',
    desc: 'White-label partner onboarding wizard, migration API, data import tools, and partner agreement flow.',
  },
  {
    title: 'Compliance Dashboard',
    desc: 'Real-time consent tracking, audit log, compliance analytics, batch operations, and driver timeline views.',
  },
  {
    title: 'Team Management',
    desc: 'Multi-user organizations with role-based access, team invites, ownership transfer, and session management.',
  },
  {
    title: 'Infrastructure',
    desc: 'Netlify deployment config, Supabase middleware, rate limiting, cron jobs (expiration, retries, escalation), and security hardening.',
  },
];

export default function BuyPage() {
  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* NAV */}
      <nav className="border-b border-[#e8e8e3] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <LogoFull mode="light" className="h-5 w-auto" />
          <Link
            href="mailto:acquire@consenthaul.com"
            className="bg-[#0c0f14] text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 hover:bg-[#1a1e27] transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(12,15,20,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(12,15,20,.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-0.5 bg-[#C8A75E]" />
            <span className="text-xs font-bold text-[#8b919a] uppercase tracking-[0.2em]">
              Acquisition Opportunity
            </span>
          </div>

          <h1
            className="text-[clamp(2.25rem,4vw,3.75rem)] font-bold text-[#0c0f14] leading-[1.05] tracking-tight max-w-3xl"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            Own a Production-Ready
            <br />
            FMCSA Consent Platform.{' '}
            <span className="relative inline-block">
              <span className="relative z-10">$2,500.</span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-[#C8A75E]/30 -z-0" />
            </span>
          </h1>

          <p className="mt-6 text-[#6b6f76] text-lg leading-relaxed max-w-2xl">
            ConsentHaul is a fully built, deployment-ready SaaS platform for
            collecting FMCSA Clearinghouse consent from CDL drivers digitally.
            Complete source code, database, billing, compliance engine, and
            multi-channel delivery — ready to launch or white-label.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="mailto:acquire@consenthaul.com?subject=ConsentHaul%20Acquisition%20Inquiry"
              className="bg-[#0c0f14] text-white font-bold text-sm uppercase tracking-wider px-8 py-4 inline-flex items-center gap-2 hover:bg-[#1a1e27] transition-colors"
            >
              Inquire Now
              <svg width="16" height="16" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <span className="text-sm text-[#8b919a]">
              acquire@consenthaul.com
            </span>
          </div>

          {/* Price strip */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 border border-[#e8e8e3]">
            {[
              { value: '$2,500', label: 'Full platform price' },
              { value: '27+', label: 'Database migrations' },
              { value: '75+', label: 'Source files included' },
              { value: 'EN/ES', label: 'Bilingual out of box' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`p-4 sm:p-5 ${i < 3 ? 'border-r border-[#e8e8e3]' : ''} ${i < 2 ? 'border-b sm:border-b-0 border-[#e8e8e3]' : ''} bg-white`}
              >
                <p
                  className="text-xl sm:text-2xl font-bold text-[#0c0f14] tracking-tight"
                  style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
                >
                  {stat.value}
                </p>
                <p className="text-[0.65rem] text-[#8b919a] uppercase tracking-wider mt-1 font-semibold">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT'S INCLUDED */}
      <section className="bg-[#0c0f14] relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold text-[#5c6370] uppercase tracking-[0.2em]">What&apos;s Included</span>
            <div className="flex-1 h-px bg-[#1e2129]" />
          </div>
          <p className="text-lg text-[#8b919a] mb-12">Everything you need to launch day one</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-0 border border-[#1e2129]">
            {INCLUDED.map((item, i) => (
              <div
                key={item.title}
                className={`p-8 ${
                  i < INCLUDED.length - 1 ? 'border-b border-[#1e2129]' : ''
                } ${
                  (i + 1) % 3 !== 0 ? 'lg:border-r border-[#1e2129]' : ''
                } ${
                  (i + 1) % 2 !== 0 ? 'sm:border-r border-[#1e2129]' : ''
                }`}
              >
                <h3
                  className="text-base font-bold text-white tracking-tight"
                  style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
                >
                  {item.title}
                </h3>
                <p className="text-sm text-[#8b919a] leading-relaxed mt-2">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-0.5 bg-[#C8A75E]" />
          <span className="text-xs font-bold text-[#8b919a] uppercase tracking-[0.2em]">Pricing</span>
        </div>

        <h2
          className="text-3xl lg:text-4xl font-bold text-[#0c0f14] tracking-tight mb-16 max-w-lg"
          style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
        >
          Simple, Transparent Pricing.
          <br />
          No Hidden Fees.
        </h2>

        <div className="grid lg:grid-cols-2 gap-0 border border-[#e8e8e3]">
          {/* Platform */}
          <div className="p-8 lg:p-10 bg-[#0c0f14] text-white lg:border-r border-[#e8e8e3]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-[#C8A75E]" />
              <span className="text-xs font-bold text-[#5c6370] uppercase tracking-[0.2em]">Platform Acquisition</span>
            </div>

            <p
              className="text-[3.5rem] font-bold tracking-tight leading-none text-white"
              style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
            >
              $2,500
            </p>
            <p className="text-[#8b919a] text-sm mt-2">One-time payment. Full ownership.</p>

            <div className="mt-8 pt-6 border-t border-[#1e2129] space-y-3">
              {[
                'Complete source code (Next.js 14 + TypeScript)',
                'Supabase database schema + 27 migrations',
                'Stripe billing integration',
                'FMCSA consent engine (3 consent types)',
                'PDF generation (EN/ES templates)',
                'SMS, WhatsApp, email delivery',
                'REST API + MCP server',
                'TMS partner portal',
                'Compliance dashboard + audit log',
                'Netlify deployment config',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <svg width="14" height="14" className="w-3.5 h-3.5 text-[#C8A75E] mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-[#8b919a]">{item}</span>
                </div>
              ))}
            </div>

            <Link
              href="mailto:acquire@consenthaul.com?subject=ConsentHaul%20Acquisition%20—%20Platform"
              className="mt-8 w-full bg-[#C8A75E] text-[#0c0f14] font-bold text-sm uppercase tracking-wider px-8 py-4 flex items-center justify-center gap-2 hover:bg-[#d4b56a] transition-colors"
            >
              Acquire Platform
              <svg width="16" height="16" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Additional Work */}
          <div className="p-8 lg:p-10 bg-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-[#C8A75E]" />
              <span className="text-xs font-bold text-[#8b919a] uppercase tracking-[0.2em]">Additional Development</span>
            </div>

            <p
              className="text-[3.5rem] font-bold tracking-tight leading-none text-[#0c0f14]"
              style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
            >
              $125
              <span className="text-lg font-bold text-[#8b919a]">/hr</span>
            </p>
            <p className="text-[#6b6f76] text-sm mt-2">20-hour minimum per project scope</p>

            <div className="mt-8 pt-6 border-t border-[#e8e8e3] space-y-3">
              {[
                'Custom feature development',
                'White-label branding + theming',
                'TMS / ELD system integrations',
                'Custom consent form types',
                'Additional language support',
                'Advanced reporting + analytics',
                'SSO / enterprise auth',
                'Custom API endpoints',
                'Data migration assistance',
                'Ongoing maintenance retainers',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <svg width="14" height="14" className="w-3.5 h-3.5 text-[#C8A75E] mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-[#6b6f76]">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 border border-[#e8e8e3] bg-[#f8f8f6]">
              <p className="text-xs text-[#6b6f76] leading-relaxed">
                <span className="font-bold text-[#0c0f14]">Minimum engagement:</span>{' '}
                20 hours ($2,500) per project scope. Scoped before work begins. No surprise invoices.
              </p>
            </div>

            <Link
              href="mailto:acquire@consenthaul.com?subject=ConsentHaul%20—%20Custom%20Development%20Inquiry"
              className="mt-6 w-full border-2 border-[#0c0f14] text-[#0c0f14] font-bold text-sm uppercase tracking-wider px-8 py-4 flex items-center justify-center gap-2 hover:bg-[#0c0f14] hover:text-white transition-colors"
            >
              Discuss Scope
              <svg width="16" height="16" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0c0f14] relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-12 h-0.5 bg-[#C8A75E] mx-auto mb-8" />
            <h2
              className="text-3xl lg:text-[2.75rem] font-bold text-white tracking-tight leading-[1.1]"
              style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
            >
              Skip the Build.
              <br />
              Launch a Compliance Platform
              <br />
              <span className="text-[#C8A75E]">This Week.</span>
            </h2>
            <p className="mt-6 text-[#8b919a] text-base leading-relaxed max-w-lg mx-auto">
              Months of development, regulatory research, and compliance engineering — already done.
              Acquire ConsentHaul and start serving carriers immediately.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="mailto:acquire@consenthaul.com?subject=ConsentHaul%20Acquisition%20Inquiry"
                className="bg-[#C8A75E] text-[#0c0f14] font-bold text-sm uppercase tracking-wider px-10 py-4 inline-flex items-center gap-2 hover:bg-[#d4b56a] transition-colors"
              >
                Get in Touch
                <svg width="16" height="16" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0c0f14] border-t border-[#1e2129] text-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-[0.7rem] text-[#5c6370]">
              &copy; {new Date().getFullYear()} Workbird LLC
            </p>
            <p className="text-[0.7rem] text-[#5c6370]">
              acquire@consenthaul.com
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
