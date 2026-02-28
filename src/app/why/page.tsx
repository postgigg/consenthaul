'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { LogoFull } from '@/components/brand/Logo';
import { LandingNav } from '@/components/landing/LandingNav';

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useCounter(end: number, duration: number, start: boolean, prefix = '', suffix = '') {
  const [display, setDisplay] = useState(`${prefix}0${suffix}`);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * end);
      setDisplay(`${prefix}${current.toLocaleString()}${suffix}`);
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [start, end, duration, prefix, suffix]);
  return display;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const VIOLATIONS = [
  { violation: 'No pre-employment Clearinghouse query', fine: 7736 },
  { violation: 'No annual Clearinghouse query', fine: 10278 },
  { violation: 'Using driver before result received', fine: 10654 },
  { violation: 'Carrier not registered in Clearinghouse', fine: 5072 },
];

const PAIN_VS_RELIEF = [
  { pain: 'Print/email PDFs, chase signatures for weeks', relief: 'One click — driver gets SMS/email link instantly' },
  { pain: 'Drivers confused by paper, ignore it', relief: 'Mobile-first — tap, read, sign in 90 seconds' },
  { pain: 'English-only for Spanish-speaking drivers', relief: 'Full bilingual EN/ES — UI, document, PDF' },
  { pain: 'Scan, file, organize paper for 3 years', relief: 'Tamper-proof PDF, SHA-256 hashed, auto-stored' },
  { pain: '"Did they sign?" — check the folder', relief: 'Real-time dashboard: pending → signed' },
  { pain: '$25–50/driver/month for enterprise suites', relief: 'Pay-per-consent. $2.50 down to $0.25' },
];

const COMPETITORS = [
  { name: 'Foley', pricing: 'Sales call required', api: false, whiteLabel: false, bilingual: false, payPerUse: false, weakness: 'Enterprise-only, opaque pricing' },
  { name: 'Tenstreet', pricing: 'Sales call required', api: false, whiteLabel: false, bilingual: false, payPerUse: false, weakness: 'Locked to recruiting ecosystem' },
  { name: 'J.J. Keller', pricing: '$25.50+/mo + setup', api: false, whiteLabel: false, bilingual: false, payPerUse: false, weakness: '3-year contracts, bloated suite' },
  { name: 'FleetDrive360', pricing: '$5/driver/mo', api: false, whiteLabel: false, bilingual: false, payPerUse: false, weakness: 'No API, no TMS integration' },
  { name: 'FMCSA Portal', pricing: '$1.25/query', api: false, whiteLabel: false, bilingual: false, payPerUse: true, weakness: 'Crashes during peak, no consent mgmt' },
  { name: 'ConsentHaul', pricing: '$0.25–$3.00', api: true, whiteLabel: true, bilingual: true, payPerUse: true, weakness: '' },
];

const OBJECTIONS = [
  { objection: '"We already have a process"', answer: 'Your process costs 2 weeks/year and risks $10K+ fines. This costs $125.' },
  { objection: '"Our drivers won\'t use it"', answer: 'They tap a link and sign with their thumb. In Spanish too.' },
  { objection: '"It\'s too expensive"', answer: 'No monthly fee. Pay per consent. 3 free credits to start.' },
  { objection: '"We use Foley / J.J. Keller"', answer: 'You\'re paying $25–50/driver/month for a suite you mostly don\'t need.' },
  { objection: '"We\'ll build it ourselves"', answer: '6–12 months of engineering vs. 1 sprint. Plus you own FMCSA liability.' },
  { objection: '"Is it legally compliant?"', answer: 'SHA-256 hashing, ESIGN Act, 3-year retention, full audit trail.' },
];

const PRODUCT_GAPS = [
  { title: 'Self-Serve Signup', status: 'live', desc: 'Direct carrier signup without sales engagement. Live and accepting signups now.' },
  { title: 'Batch Re-Consent', status: 'planned', desc: 'One button: re-consent all drivers expiring in the next 30 days.' },
  { title: 'Compliance Report', status: 'planned', desc: 'Downloadable audit-ready report — all drivers, statuses, gaps.' },
  { title: 'Driver Self-Service', status: 'future', desc: 'Drivers view their own consent history via token-based portal.' },
  { title: 'Query Execution', status: 'future', desc: 'Execute the FMCSA limited query directly — consent + query in one.' },
  { title: 'TMS Connectors', status: 'future', desc: 'Pre-built integrations for McLeod, TMW, Samsara.' },
];

// ---------------------------------------------------------------------------
// Small Components
// ---------------------------------------------------------------------------

function SectionEyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-8 h-0.5 ${dark ? 'bg-[#C8A75E]' : 'bg-[#C8A75E]'}`} />
      <span className={`text-xs font-bold uppercase tracking-[0.2em] ${dark ? 'text-[#5c6370]' : 'text-[#8b919a]'}`}>
        {children}
      </span>
      {dark && <div className="flex-1 h-px bg-[#1e2129]" />}
    </div>
  );
}

function RevealSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView(0.15);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(32px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function CheckIcon({ active }: { active: boolean }) {
  return active ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <rect width="24" height="24" rx="4" fill="#C8A75E" opacity="0.15" />
      <path d="M7 12.5l3 3 7-7" stroke="#C8A75E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <rect width="24" height="24" rx="4" fill="#0c0f14" opacity="0.06" />
      <path d="M8 8l8 8M16 8l-8 8" stroke="#0c0f14" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
    </svg>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    live: 'bg-[#28c840]/15 text-[#28c840]',
    'coming-soon': 'bg-[#C8A75E]/15 text-[#C8A75E]',
    planned: 'bg-[#3b82f6]/10 text-[#3b82f6]',
    future: 'bg-[#0c0f14]/5 text-[#8b919a]',
  };
  const labels: Record<string, string> = {
    live: 'Live',
    'coming-soon': 'Coming Soon',
    planned: 'Planned',
    future: 'Future',
  };
  return (
    <span className={`text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 ${colors[status] || ''}`}>
      {labels[status] || status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Animated Bar Chart for Violation Fines
// ---------------------------------------------------------------------------

function ViolationChart() {
  const { ref, inView } = useInView(0.3);
  const maxFine = Math.max(...VIOLATIONS.map(v => v.fine));
  return (
    <div ref={ref} className="space-y-5">
      {VIOLATIONS.map((v, i) => {
        const pct = (v.fine / maxFine) * 100;
        return (
          <div key={i}>
            <div className="flex items-baseline justify-between mb-1.5">
              <p className="text-sm text-[#8b919a] leading-snug max-w-[70%]">{v.violation}</p>
              <p className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
                ${v.fine.toLocaleString()}
              </p>
            </div>
            <div className="h-2 bg-[#1e2129] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: inView ? `${pct}%` : '0%',
                  transitionDelay: `${i * 150 + 200}ms`,
                  background: `linear-gradient(90deg, #C8A75E, ${v.fine > 10000 ? '#ef4444' : '#d4b56a'})`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ROI Calculator Animation
// ---------------------------------------------------------------------------

function ROIBlock() {
  const { ref, inView } = useInView(0.3);
  const fineValue = useCounter(10278, 1500, inView, '$', '');
  const costValue = useCounter(125, 1500, inView, '$', '');
  const roiValue = useCounter(82, 1500, inView, '', ':1');

  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-[#1e2129]">
      <div className="p-8 sm:p-10 border-b sm:border-b-0 sm:border-r border-[#1e2129]">
        <p className="text-xs font-bold text-[#ef4444]/70 uppercase tracking-wider mb-3">Avg violation fine</p>
        <p
          className="text-[2.5rem] font-bold text-[#ef4444] tracking-tight leading-none"
          style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
        >
          {fineValue}
        </p>
        <p className="text-sm text-[#5c6370] mt-2">per missing annual query</p>
      </div>
      <div className="p-8 sm:p-10 border-b sm:border-b-0 sm:border-r border-[#1e2129]">
        <p className="text-xs font-bold text-[#C8A75E]/70 uppercase tracking-wider mb-3">50 consents cost</p>
        <p
          className="text-[2.5rem] font-bold text-[#C8A75E] tracking-tight leading-none"
          style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
        >
          {costValue}
        </p>
        <p className="text-sm text-[#5c6370] mt-2">with ConsentHaul</p>
      </div>
      <div className="p-8 sm:p-10">
        <p className="text-xs font-bold text-[#28c840]/70 uppercase tracking-wider mb-3">Return on investment</p>
        <p
          className="text-[2.5rem] font-bold text-[#28c840] tracking-tight leading-none"
          style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
        >
          {roiValue}
        </p>
        <p className="text-sm text-[#5c6370] mt-2">on one avoided violation</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Animated Horizontal Scroll Ticker
// ---------------------------------------------------------------------------

function MarqueeTicker() {
  const items = [
    'One text. One tap. Consent signed.',
    'PDF filed. Audit-proof.',
    '$2.50/consent vs. $10,278 fines.',
    'Drivers sign in 90 seconds.',
    'Bilingual EN/ES.',
    'No monthly fees.',
    'API-first.',
    'SHA-256 hashed.',
    '3-year retention.',
    'Ship in 1 sprint.',
  ];
  return (
    <div className="overflow-hidden bg-[#C8A75E] py-3 relative">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...items, ...items, ...items].map((item, i) => (
          <span key={i} className="mx-6 text-sm font-bold text-[#0c0f14] tracking-wide uppercase">
            {item}
            <span className="mx-6 text-[#0c0f14]/30">{'///'}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WhyConsentHaulPage() {
  const heroStats = useInView(0.2);
  const violationCount = useCounter(7274, 2000, heroStats.inView, '', '');
  const auditPct = useCounter(35, 1500, heroStats.inView, '', '%');

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <LandingNav />

      {/* ================================================================= */}
      {/* HERO — The Real Problem */}
      {/* ================================================================= */}
      <section className="relative overflow-hidden bg-[#0c0f14]">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Gold gradient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#C8A75E]/[0.04] blur-[120px] rounded-full pointer-events-none" />

        <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-24 lg:pt-36 lg:pb-32">
          <RevealSection>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-0.5 bg-[#C8A75E]" />
              <span className="text-xs font-bold text-[#C8A75E] uppercase tracking-[0.25em]">
                Strategic Market Analysis
              </span>
            </div>

            <h1
              className="text-[clamp(2.5rem,5vw,4.5rem)] font-bold text-white leading-[1.02] tracking-tight max-w-4xl"
              style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
            >
              Why ConsentHaul Is the
              <br />
              <span className="relative inline-block">
                <span className="relative z-10 text-[#C8A75E]">No-Brainer</span>
                <span className="absolute bottom-1 left-0 right-0 h-3 bg-[#C8A75E]/20 -z-0" />
              </span>
              {' '}Choice for
              <br />
              FMCSA Consent.
            </h1>

            <p className="mt-8 text-lg text-[#8b919a] leading-relaxed max-w-2xl">
              Viewed through the eyes of the actual customer, grounded in real industry pain points,
              real competitor gaps, and real regulatory pressure. The value proposition is so clear
              that saying &quot;no&quot; feels dumb.
            </p>
          </RevealSection>

          {/* Hero Stats */}
          <div ref={heroStats.ref} className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-0 border border-[#1e2129]">
            {[
              { value: violationCount, label: 'Clearinghouse violations in 2025', sub: '14.5% of all audit findings' },
              { value: '$7,155', label: 'Average settlement', sub: 'Per FMCSA enforcement action', static: true },
              { value: auditPct, label: 'of fleets can\'t pass audit', sub: '87% blame documentation', },
              { value: '$125K', label: 'Highest single penalty', sub: 'For Clearinghouse non-compliance', static: true },
            ].map((stat, i) => (
              <div
                key={i}
                className={`p-5 sm:p-6 lg:p-8 ${i < 3 ? 'border-r border-[#1e2129]' : ''} ${i < 2 ? 'border-b lg:border-b-0 border-[#1e2129]' : ''}`}
                style={{
                  opacity: heroStats.inView ? 1 : 0,
                  transform: heroStats.inView ? 'translateY(0)' : 'translateY(16px)',
                  transition: `all 0.5s ease-out ${i * 100 + 300}ms`,
                }}
              >
                <p
                  className="text-2xl sm:text-3xl font-bold text-[#C8A75E] tracking-tight leading-none"
                  style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
                >
                  {stat.static ? stat.value : stat.value}
                </p>
                <p className="text-xs text-[#8b919a] uppercase tracking-wider mt-2 font-semibold leading-snug">
                  {stat.label}
                </p>
                <p className="text-[0.65rem] text-[#5c6370] mt-1">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* MARQUEE TICKER */}
      {/* ================================================================= */}
      <MarqueeTicker />

      {/* ================================================================= */}
      {/* THE CUSTOMER — Who Is This For? */}
      {/* ================================================================= */}
      <section className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
        <RevealSection>
          <SectionEyebrow>The customer</SectionEyebrow>
          <h2
            className="text-3xl lg:text-4xl font-bold text-[#0c0f14] tracking-tight mb-6 max-w-2xl"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            Two Customers. One Shared Pain.
          </h2>
        </RevealSection>

        <div className="grid md:grid-cols-2 gap-0 border border-[#e8e8e3] mt-12">
          <RevealSection delay={100} className="p-8 lg:p-10 bg-white border-b md:border-b-0 md:border-r border-[#e8e8e3]">
            <span className="text-[#C8A75E] text-sm font-bold tracking-widest">PRIMARY</span>
            <h3
              className="text-xl font-bold text-[#0c0f14] tracking-tight mt-4"
              style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
            >
              The Safety / Compliance Manager
            </h3>
            <p className="text-[#6b6f76] text-sm leading-relaxed mt-3">
              20–500 truck carrier. Juggling DQ files, ELDs, drug testing, FMCSA audits, and driver
              onboarding. Clearinghouse compliance is one of 15 things on their plate.
              They&apos;re not a developer. They barely have time to eat lunch.
            </p>
            <div className="mt-6 p-4 bg-[#f8f8f6] border border-[#e8e8e3]">
              <p className="text-xs font-bold text-[#8b919a] uppercase tracking-wider mb-2">Their annual nightmare</p>
              <p className="text-sm text-[#6b6f76] leading-relaxed">
                Every year: print PDF forms → chase OTR drivers → collect signed paper → scan → file →
                log into FMCSA portal → enter each driver manually → pay $1.25/query → retain for 3 years.
                For 200 drivers, it&apos;s a multi-week project crammed into December/January.
              </p>
            </div>
          </RevealSection>

          <RevealSection delay={250} className="p-8 lg:p-10 bg-white">
            <span className="text-[#C8A75E] text-sm font-bold tracking-widest">SECONDARY</span>
            <h3
              className="text-xl font-bold text-[#0c0f14] tracking-tight mt-4"
              style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
            >
              The TMS Product Manager
            </h3>
            <p className="text-[#6b6f76] text-sm leading-relaxed mt-3">
              Needs to add Clearinghouse compliance to their platform before carrier customers churn
              to a competitor that has it. They have engineers, a sprint cycle, and zero desire to spend
              6–12 months building consent infrastructure from scratch.
            </p>
            <div className="mt-6 p-4 bg-[#f8f8f6] border border-[#e8e8e3]">
              <p className="text-xs font-bold text-[#8b919a] uppercase tracking-wider mb-2">The competitive threat</p>
              <p className="text-sm text-[#6b6f76] leading-relaxed">
                If a competing TMS ships native Clearinghouse consent first, their carriers have a reason
                to switch. This is a table-stakes feature missing from every major TMS platform.
              </p>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ================================================================= */}
      {/* VIOLATION DATA — The Cost of Getting It Wrong */}
      {/* ================================================================= */}
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
          <RevealSection>
            <SectionEyebrow dark>The consequence</SectionEyebrow>
            <h2
              className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-4 max-w-2xl"
              style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
            >
              The Cost of Getting It Wrong Is Not Theoretical.
            </h2>
            <p className="text-[#8b919a] text-base mb-12 max-w-xl">
              From 50,000+ real FMCSA violations analyzed in 2025. The FMCSA is increasing audit
              frequency targeting smaller and midsize carriers — the exact segment with the fewest resources.
            </p>
          </RevealSection>

          <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-start">
            <RevealSection delay={200}>
              <ViolationChart />
            </RevealSection>

            <RevealSection delay={400}>
              <ROIBlock />
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* PAIN vs RELIEF — What ConsentHaul Replaces */}
      {/* ================================================================= */}
      <section className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
        <RevealSection>
          <SectionEyebrow>What we replace</SectionEyebrow>
          <h2
            className="text-3xl lg:text-4xl font-bold text-[#0c0f14] tracking-tight mb-16 max-w-2xl"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            From Weeks of Chaos to 10 Minutes of Calm.
          </h2>
        </RevealSection>

        <div className="border border-[#e8e8e3]">
          {/* Header */}
          <div className="grid grid-cols-2 bg-[#f8f8f6] border-b border-[#e8e8e3]">
            <div className="p-4 sm:p-5 border-r border-[#e8e8e3]">
              <span className="text-xs font-bold text-[#ef4444]/60 uppercase tracking-wider">Today (Pain)</span>
            </div>
            <div className="p-4 sm:p-5">
              <span className="text-xs font-bold text-[#28c840]/60 uppercase tracking-wider">ConsentHaul (Relief)</span>
            </div>
          </div>

          {PAIN_VS_RELIEF.map((row, i) => (
            <RevealSection
              key={i}
              delay={i * 80}
              className={`grid grid-cols-2 ${i < PAIN_VS_RELIEF.length - 1 ? 'border-b border-[#e8e8e3]' : ''}`}
            >
              <div className="p-5 sm:p-6 border-r border-[#e8e8e3] bg-white">
                <div className="flex items-start gap-3">
                  <svg width="16" height="16" className="shrink-0 mt-0.5 text-[#ef4444]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                  <p className="text-sm text-[#6b6f76] leading-relaxed">{row.pain}</p>
                </div>
              </div>
              <div className="p-5 sm:p-6 bg-white">
                <div className="flex items-start gap-3">
                  <svg width="16" height="16" className="shrink-0 mt-0.5 text-[#C8A75E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-[#0c0f14] font-medium leading-relaxed">{row.relief}</p>
                </div>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* ================================================================= */}
      {/* COMPETITIVE LANDSCAPE — Feature Matrix */}
      {/* ================================================================= */}
      <section className="bg-white border-t border-[#e8e8e3]">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <RevealSection>
            <SectionEyebrow>Competitive landscape</SectionEyebrow>
            <h2
              className="text-3xl lg:text-4xl font-bold text-[#0c0f14] tracking-tight mb-4 max-w-2xl"
              style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
            >
              The Competition Falls Short. Here&apos;s the Proof.
            </h2>
            <p className="text-[#6b6f76] text-base mb-12 max-w-xl">
              ConsentHaul is the only product that is API-first, consent-focused, developer-friendly,
              and available at TMS-scale pricing.
            </p>
          </RevealSection>

          <RevealSection delay={200}>
            <div className="border border-[#e8e8e3] overflow-x-auto">
              {/* Header */}
              <div className="grid grid-cols-[1.5fr_1fr_auto_auto_auto_auto] min-w-[700px] bg-[#f8f8f6] border-b border-[#e8e8e3]">
                <div className="p-4 border-r border-[#e8e8e3]">
                  <span className="text-[0.65rem] font-bold text-[#8b919a] uppercase tracking-wider">Competitor</span>
                </div>
                <div className="p-4 border-r border-[#e8e8e3]">
                  <span className="text-[0.65rem] font-bold text-[#8b919a] uppercase tracking-wider">Pricing</span>
                </div>
                <div className="p-4 border-r border-[#e8e8e3] text-center w-20">
                  <span className="text-[0.65rem] font-bold text-[#8b919a] uppercase tracking-wider">API</span>
                </div>
                <div className="p-4 border-r border-[#e8e8e3] text-center w-20">
                  <span className="text-[0.65rem] font-bold text-[#8b919a] uppercase tracking-wider">White Label</span>
                </div>
                <div className="p-4 border-r border-[#e8e8e3] text-center w-20">
                  <span className="text-[0.65rem] font-bold text-[#8b919a] uppercase tracking-wider">EN/ES</span>
                </div>
                <div className="p-4 text-center w-20">
                  <span className="text-[0.65rem] font-bold text-[#8b919a] uppercase tracking-wider">Pay/Use</span>
                </div>
              </div>

              {/* Rows */}
              {COMPETITORS.map((c, i) => {
                const isUs = c.name === 'ConsentHaul';
                return (
                  <div
                    key={c.name}
                    className={`grid grid-cols-[1.5fr_1fr_auto_auto_auto_auto] min-w-[700px] ${
                      i < COMPETITORS.length - 1 ? 'border-b border-[#e8e8e3]' : ''
                    } ${isUs ? 'bg-[#0c0f14]' : ''}`}
                  >
                    <div className={`p-4 border-r ${isUs ? 'border-[#1e2129]' : 'border-[#e8e8e3]'}`}>
                      <span className={`text-sm font-bold tracking-tight ${isUs ? 'text-[#C8A75E]' : 'text-[#0c0f14]'}`}>
                        {c.name}
                      </span>
                      {c.weakness && (
                        <p className={`text-[0.65rem] mt-0.5 ${isUs ? 'text-[#5c6370]' : 'text-[#8b919a]'}`}>{c.weakness}</p>
                      )}
                    </div>
                    <div className={`p-4 border-r ${isUs ? 'border-[#1e2129]' : 'border-[#e8e8e3]'}`}>
                      <span className={`text-sm ${isUs ? 'text-[#C8A75E] font-bold' : 'text-[#6b6f76]'}`}>{c.pricing}</span>
                    </div>
                    {[c.api, c.whiteLabel, c.bilingual, c.payPerUse].map((val, j) => (
                      <div key={j} className={`p-4 flex justify-center items-center w-20 ${j < 3 ? `border-r ${isUs ? 'border-[#1e2129]' : 'border-[#e8e8e3]'}` : ''}`}>
                        <CheckIcon active={val} />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </RevealSection>

          {/* What none of them offer */}
          <RevealSection delay={400} className="mt-12">
            <div className="p-6 sm:p-8 border border-[#C8A75E]/20 bg-[#C8A75E]/[0.03]">
              <p className="text-xs font-bold text-[#C8A75E] uppercase tracking-[0.2em] mb-4">
                What none of them offer
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  'Consent-focused API for TMS embedding',
                  'White-label signing experience',
                  'Pay-per-use pricing (no commitment)',
                  'Bilingual driver-facing UX',
                  'MCP server for AI agent integration',
                  'Sub-$1/consent pricing at scale',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <svg width="14" height="14" className="shrink-0 mt-0.5 text-[#C8A75E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-[#0c0f14] font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ================================================================= */}
      {/* THE PITCH — By Segment */}
      {/* ================================================================= */}
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
          <RevealSection>
            <SectionEyebrow dark>The pitch</SectionEyebrow>
            <h2
              className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-16 max-w-2xl"
              style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
            >
              The &quot;No-Brainer&quot; Arguments.
            </h2>
          </RevealSection>

          <div className="grid lg:grid-cols-2 gap-0 border border-[#1e2129]">
            {/* Carrier pitch */}
            <RevealSection delay={100} className="p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-[#1e2129]">
              <span className="text-[#C8A75E] text-sm font-bold tracking-widest">FOR CARRIERS (20–200 TRUCKS)</span>
              <h3
                className="text-xl font-bold text-white tracking-tight mt-4 mb-6"
                style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
              >
                &quot;You&apos;re spending 2 weeks every January chasing paper signatures. ConsentHaul turns that into 10 minutes.&quot;
              </h3>
              <div className="space-y-3">
                {[
                  'No monthly fee. Buy credits when you need them.',
                  'Driver signs on their phone in 90 seconds. No paper.',
                  'Bilingual EN/ES. Drivers understand what they sign.',
                  'Audit-proof. SHA-256 hash, timestamp, IP, full event log.',
                  '3 free credits to try. Zero risk.',
                ].map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <svg width="14" height="14" className="shrink-0 mt-0.5 text-[#C8A75E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-[#8b919a] leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            </RevealSection>

            {/* TMS pitch */}
            <RevealSection delay={250} className="p-8 lg:p-10">
              <span className="text-[#C8A75E] text-sm font-bold tracking-widest">FOR TMS PARTNERS</span>
              <h3
                className="text-xl font-bold text-white tracking-tight mt-4 mb-6"
                style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
              >
                &quot;Your carriers are asking for Clearinghouse compliance. Ship it next sprint with our API.&quot;
              </h3>
              <div className="space-y-3">
                {[
                  'One API call creates consent, delivers it, returns status.',
                  'White-label — your carriers see YOUR brand.',
                  'Webhooks for every event. Pipe consent.signed to your DQ module.',
                  '$0.50–$0.75/consent at scale. Markup or bundle it.',
                  'Sandbox + unlimited test credits from day one.',
                ].map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <svg width="14" height="14" className="shrink-0 mt-0.5 text-[#C8A75E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-[#8b919a] leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            </RevealSection>
          </div>

          {/* Messaging quotes */}
          <div className="grid md:grid-cols-3 gap-0 border border-[#1e2129] mt-8">
            {[
              '"One text. One tap. Consent signed. PDF filed. Audit-proof."',
              '"FMCSA fines average $10,278. ConsentHaul costs $2.50/consent. Do the math."',
              '"Your competitors don\'t have native Clearinghouse consent. You will."',
            ].map((quote, i) => (
              <RevealSection
                key={i}
                delay={i * 120 + 400}
                className={`p-6 lg:p-8 ${i < 2 ? 'border-b md:border-b-0 md:border-r border-[#1e2129]' : ''}`}
              >
                <p className="text-base text-white/80 font-medium leading-relaxed italic">{quote}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* OBJECTION HANDLING */}
      {/* ================================================================= */}
      <section className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
        <RevealSection>
          <SectionEyebrow>Objection handling</SectionEyebrow>
          <h2
            className="text-3xl lg:text-4xl font-bold text-[#0c0f14] tracking-tight mb-16 max-w-xl"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            Every Objection. Answered.
          </h2>
        </RevealSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border border-[#e8e8e3]">
          {OBJECTIONS.map((obj, i) => (
            <RevealSection
              key={i}
              delay={i * 80}
              className={`p-6 lg:p-8 bg-white ${
                i < OBJECTIONS.length - 1 ? 'border-b lg:border-b border-[#e8e8e3]' : ''
              } ${
                (i + 1) % 3 !== 0 ? 'lg:border-r border-[#e8e8e3]' : ''
              } ${
                (i + 1) % 2 !== 0 ? 'md:border-r border-[#e8e8e3]' : ''
              }`}
            >
              <p className="text-sm font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
                {obj.objection}
              </p>
              <p className="text-sm text-[#C8A75E] font-medium leading-relaxed">
                {obj.answer}
              </p>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* ================================================================= */}
      {/* PRODUCT ROADMAP — What Would Make It Even Better */}
      {/* ================================================================= */}
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
          <RevealSection>
            <SectionEyebrow dark>Product gaps</SectionEyebrow>
            <h2
              className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-4 max-w-2xl"
              style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
            >
              What Would Make ConsentHaul Even More of a No-Brainer.
            </h2>
            <p className="text-[#8b919a] text-base mb-12 max-w-xl">
              Features that, if filled, would eliminate every remaining objection.
            </p>
          </RevealSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border border-[#1e2129]">
            {PRODUCT_GAPS.map((gap, i) => (
              <RevealSection
                key={i}
                delay={i * 100}
                className={`p-6 lg:p-8 ${
                  i < PRODUCT_GAPS.length - 1 ? 'border-b lg:border-b border-[#1e2129]' : ''
                } ${
                  (i + 1) % 3 !== 0 ? 'lg:border-r border-[#1e2129]' : ''
                } ${
                  (i + 1) % 2 !== 0 ? 'md:border-r border-[#1e2129]' : ''
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <h3
                    className="text-base font-bold text-white tracking-tight"
                    style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
                  >
                    {gap.title}
                  </h3>
                  <StatusBadge status={gap.status} />
                </div>
                <p className="text-sm text-[#8b919a] leading-relaxed">
                  {gap.desc}
                </p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* CTA */}
      {/* ================================================================= */}
      <section className="bg-[#0c0f14] relative overflow-hidden border-t border-[#1e2129]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#C8A75E]/[0.03] blur-[100px] rounded-full pointer-events-none" />

        <div className="relative mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <RevealSection>
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-12 h-0.5 bg-[#C8A75E] mx-auto mb-8" />
              <h2
                className="text-3xl lg:text-[2.75rem] font-bold text-white tracking-tight leading-[1.1]"
                style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
              >
                Cheaper Than Every Competitor.
                <br />
                Faster Than Every Alternative.
                <br />
                <span className="text-[#C8A75E]">The Only Product Purpose-Built for This.</span>
              </h2>
              <p className="mt-6 text-[#8b919a] text-base leading-relaxed max-w-lg mx-auto">
                The only reason a carrier wouldn&apos;t use ConsentHaul is if they don&apos;t know it exists yet.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/tms"
                  className="inline-flex items-center gap-2 bg-[#C8A75E] text-[#0c0f14] font-bold text-sm uppercase tracking-wider px-10 py-4 transition-all hover:bg-[#d4b56a] active:bg-[#b89648]"
                >
                  TMS Partners
                  <svg width="16" height="16" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-2 border border-[#1e2129] text-white font-bold text-sm uppercase tracking-wider px-10 py-4 transition-all hover:border-[#3a3f49] hover:bg-[#1e2129]"
                >
                  View Demo
                  <svg width="16" height="16" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                {[
                  'No monthly fees',
                  '3 free credits',
                  'Credits never expire',
                  'Audit-proof PDFs',
                ].map((item) => (
                  <span key={item} className="flex items-center gap-2 text-xs text-[#5c6370]">
                    <svg width="14" height="14" className="w-3.5 h-3.5 text-[#C8A75E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ================================================================= */}
      {/* FOOTER */}
      {/* ================================================================= */}
      <footer className="bg-[#0c0f14] text-white">
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <LogoFull mode="dark" className="h-5 w-auto" />
              <p className="mt-4 text-sm text-[#5c6370] leading-relaxed max-w-xs">
                Digital FMCSA consent collection for motor carriers. Text a link. Driver signs. PDF filed.
              </p>
            </div>
            <div>
              <p className="text-[0.65rem] font-bold text-[#5c6370] uppercase tracking-[0.15em] mb-4">Product</p>
              <ul className="space-y-2.5">
                <li><Link href="/signup" className="text-sm text-[#8b919a] hover:text-[#C8A75E] transition-colors">Get Started</Link></li>
                <li><Link href="/login" className="text-sm text-[#8b919a] hover:text-[#C8A75E] transition-colors">Sign In</Link></li>
                <li><Link href="/docs" className="text-sm text-[#8b919a] hover:text-[#C8A75E] transition-colors">API Documentation</Link></li>
                <li><Link href="/tms" className="text-sm text-[#8b919a] hover:text-[#C8A75E] transition-colors">TMS Partners</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-[0.65rem] font-bold text-[#5c6370] uppercase tracking-[0.15em] mb-4">Company</p>
              <ul className="space-y-2.5">
                <li><span className="text-sm text-[#8b919a]">Workbird LLC</span></li>
                <li><Link href="mailto:support@consenthaul.com" className="text-sm text-[#8b919a] hover:text-[#C8A75E] transition-colors">support@consenthaul.com</Link></li>
                <li><Link href="mailto:partnerships@consenthaul.com" className="text-sm text-[#8b919a] hover:text-[#C8A75E] transition-colors">partnerships@consenthaul.com</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-[0.65rem] font-bold text-[#5c6370] uppercase tracking-[0.15em] mb-4">Legal</p>
              <ul className="space-y-2.5">
                <li><Link href="/terms" className="text-sm text-[#8b919a] hover:text-[#C8A75E] transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-sm text-[#8b919a] hover:text-[#C8A75E] transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-[#1e2129]">
            <div className="space-y-3 mb-8">
              <p className="text-[0.7rem] leading-relaxed text-[#8b919a]">
                ConsentHaul is not affiliated with, endorsed by, or sponsored by the Federal Motor Carrier Safety Administration (FMCSA) or the U.S. Department of Transportation. &quot;FMCSA Clearinghouse&quot; is a registered trademark of the U.S. Department of Transportation.
              </p>
              <p className="text-[0.7rem] leading-relaxed text-[#8b919a]">
                ConsentHaul provides a digital platform for collecting electronic consent signatures as permitted under 49 CFR Part 382. Consent retention complies with &sect; 382.703(a) (3-year minimum). It is the responsibility of the employer/carrier to ensure compliance with all applicable federal and state regulations. Electronic signatures comply with the ESIGN Act and UETA. Signed documents are retained for the FMCSA-required minimum of three (3) years.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <p className="text-[0.7rem] text-[#5c6370]">
                &copy; {new Date().getFullYear()} ConsentHaul &middot; Operated by Workbird LLC
              </p>
              <div className="flex items-center gap-4">
                <Link href="/terms" className="text-[0.7rem] text-[#5c6370] hover:text-[#8b919a] transition-colors">Terms</Link>
                <Link href="/privacy" className="text-[0.7rem] text-[#5c6370] hover:text-[#8b919a] transition-colors">Privacy</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
