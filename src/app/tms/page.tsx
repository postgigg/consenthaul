import Link from 'next/link';
import type { Metadata } from 'next';
import { LogoFull } from '@/components/brand/Logo';
import { LandingNav } from '@/components/landing/LandingNav';
import { ComingSoonBanner } from '@/components/landing/ComingSoonBanner';
import { TerminalTyping } from '@/components/landing/TerminalTyping';

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'TMS Partner Integration — Embed FMCSA Consent into Your Platform | ConsentHaul',
  description:
    'Integrate FMCSA Clearinghouse consent collection into your TMS with 4 API calls. Your carriers send a link, drivers sign in 60 seconds, signed PDF filed automatically. Credit packs starting at $0.15/consent.',
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const API_STEPS = [
  {
    num: '01',
    endpoint: 'POST /api/v1/drivers',
    desc: 'Create the driver record',
  },
  {
    num: '02',
    endpoint: 'POST /api/v1/consents',
    desc: 'Send consent request (SMS/email/WhatsApp)',
  },
  {
    num: '03',
    endpoint: 'GET /api/v1/consents',
    desc: 'Check status (pending → signed)',
  },
  {
    num: '04',
    endpoint: 'GET /api/v1/consents/{id}',
    desc: 'Download signed PDF',
  },
];

const PAIN_POINTS = [
  {
    title: 'Paper Forms Get Lost',
    desc: 'Drivers are on the road. Consent forms get faxed, lost, or never returned. Carriers scramble before DOT audits.',
  },
  {
    title: '$5,833 Per Violation',
    desc: 'FMCSA civil penalties for operating a driver without a valid Clearinghouse query or consent. A 10-truck fleet audit = $58,330.',
  },
  {
    title: 'Your Competitors Are Solving This',
    desc: 'TMS platforms that offer integrated compliance win carriers. The ones that don\u2019t lose them to platforms that do.',
  },
];

const BUILD_VS_BUY = [
  { label: 'Development cost', build: '$150K\u2013$300K', buy: 'Free onboarding' },
  { label: 'Time to ship', build: '6\u201312 months', buy: '1 sprint' },
  { label: 'FMCSA compliance liability', build: 'You own it', buy: 'We own it' },
  { label: 'ESIGN Act / UETA compliance', build: 'Your lawyers', buy: 'Our lawyers' },
  { label: '3-year document retention', build: 'Your infrastructure', buy: 'Included' },
  { label: 'Bilingual EN/ES support', build: 'Build it', buy: 'Included' },
  { label: 'SMS/WhatsApp/Email delivery', build: 'Twilio integration', buy: 'Included' },
  { label: 'Ongoing maintenance', build: 'Your engineers', buy: 'Our problem' },
  { label: 'Per-consent cost', build: '$3\u2013$8 (fully loaded)', buy: '$1.00 starting, $0.15 at scale' },
];

const PRICING_TIERS = [
  { name: 'Starter', credits: '10,000', price: '$7,500', fullPrice: '$10,000', per: '$1.00', optional: true },
  { name: 'Growth', credits: '100,000', price: '$56,250', fullPrice: '$75,000', per: '$0.75', optional: true },
  { name: 'Scale', credits: '250,000', price: '$93,750', fullPrice: '$125,000', per: '$0.50', popular: true, optional: true },
  { name: 'Enterprise', credits: '500,000', price: '$108,750', fullPrice: '$145,000', per: '$0.29', optional: true },
  { name: 'Mega', credits: '1,000,000', price: '$112,500', fullPrice: '$150,000', per: '$0.15', optional: true },
];

const REVENUE_MODELS = [
  {
    title: 'Bundle',
    desc: 'Include 50 consents/month in your top-tier plan. Increase plan price by $75. Cost to you: $37.50\u2013$75. Pure margin.',
  },
  {
    title: 'Pass-Through',
    desc: 'Charge carriers $2.50\u2013$3.00/consent. Your cost: $0.29\u2013$1.00. They still save vs. paper and competitors.',
  },
  {
    title: 'Freemium Upsell',
    desc: 'Give 5 free consents/month to all carriers. Power users upgrade. You earn on the upgrade.',
  },
];

const FEATURES = [
  {
    title: 'REST API + MCP Server',
    desc: '4 REST endpoints + 14 MCP tools for AI-native integrations. Build traditional or let AI agents handle consent workflows.',
  },
  {
    title: 'SMS, WhatsApp, Email Delivery',
    desc: 'Consent links delivered however drivers prefer. Bilingual EN/ES out of the box. No Twilio integration needed.',
  },
  {
    title: 'FMCSA-Compliant PDFs',
    desc: 'Signed PDFs with signature, timestamp, IP, device metadata. 49 CFR Part 40 compliant. Audit-ready on day one.',
  },
  {
    title: '3-Year Retention',
    desc: 'Automatic document storage meeting FMCSA retention requirements. Download anytime via API or dashboard.',
  },
  {
    title: 'Real-Time Status Tracking',
    desc: 'Webhook-ready status flow: pending \u2192 sent \u2192 delivered \u2192 opened \u2192 signed. Full visibility for your carriers.',
  },
  {
    title: 'Dedicated Partner Support',
    desc: 'Priority support, integration assistance, custom SLAs for enterprise partners. We\u2019re invested in your success.',
  },
];

const FAQS = [
  {
    q: 'How long does integration take?',
    a: 'Most TMS teams ship a working integration in 1\u20132 sprints. The API has 4 endpoints. The MCP server has 14 tools. We provide sandbox keys and integration support from day one.',
  },
  {
    q: 'Do we need a separate account per carrier?',
    a: 'No. You get a single partner account with API access. Credits are pooled. You manage allocation internally however you want.',
  },
  {
    q: 'What happens if a consent fails to deliver?',
    a: 'The API returns delivery status. You can resend or switch delivery method. We handle retries on SMS/email automatically.',
  },
  {
    q: 'Is there a sandbox/test environment?',
    a: 'Yes. We provide sandbox API keys with unlimited test credits. Build and test your entire integration without spending a dime.',
  },
  {
    q: 'Who handles FMCSA compliance updates?',
    a: 'We do. When FMCSA regulations change, we update the consent documents and PDF templates. You don\u2019t touch anything.',
  },
  {
    q: 'Can we white-label the signing experience?',
    a: 'Enterprise partners can customize the signing page with their branding. Contact us for details.',
  },
  {
    q: 'What\u2019s the uptime SLA?',
    a: '99.9% uptime SLA for enterprise partners. Standard monitoring and alerting included for all partner tiers.',
  },
  {
    q: 'How do we get started?',
    a: 'Email partnerships@consenthaul.com or apply online. Onboarding is free \u2014 we\u2019ll set up your partner account, sandbox keys, and schedule an integration kickoff call. Credit packs are optional during signup and come with a 25% discount.',
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TMSPartnerPage() {
  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* ================================================================= */}
      {/* COMING SOON BANNER */}
      {/* ================================================================= */}
      <ComingSoonBanner />

      {/* ================================================================= */}
      {/* NAV */}
      {/* ================================================================= */}
      <LandingNav />

      {/* ================================================================= */}
      {/* 1. HERO */}
      {/* ================================================================= */}
      <section className="relative overflow-hidden overflow-x-clip">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(12,15,20,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(12,15,20,.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-16 sm:pt-24 sm:pb-20 lg:pt-32 lg:pb-28">
          <div className="grid lg:grid-cols-[1fr_auto] gap-12 sm:gap-16 lg:gap-16 items-center">
            {/* Left column — copy */}
            <div>
              {/* Eyebrow */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-0.5 bg-[#C8A75E]" />
                <span className="text-xs font-bold text-[#8b919a] uppercase tracking-[0.2em]">
                  Built for TMS Partners
                </span>
              </div>

              <h1
                className="text-[clamp(2.25rem,4vw,3.75rem)] font-bold text-[#0c0f14] leading-[1.05] tracking-tight"
                style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
              >
                Your Carriers Are Drowning
                <br />
                in FMCSA Paperwork.{' '}
                <span className="relative inline-block">
                  <span className="relative z-10">Fix It with 4 API Calls.</span>
                  <span className="absolute bottom-1 left-0 right-0 h-3 bg-[#C8A75E]/30 -z-0" />
                </span>
              </h1>

              <p className="mt-6 text-[#6b6f76] text-lg leading-relaxed max-w-xl">
                Embed compliant FMCSA Clearinghouse consent collection directly into your TMS.
                Your carriers send a link, drivers sign in 60 seconds, signed PDF filed automatically.
                You ship it in a sprint.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href="/tms/apply"
                  className="bg-[#C8A75E] text-[#0c0f14] font-bold text-sm uppercase tracking-wider px-8 py-4 inline-flex items-center gap-2 transition-all hover:bg-[#d4b56a] active:bg-[#b89648]"
                >
                  Apply Now
                  <svg width="16" height="16" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="mailto:partnerships@consenthaul.com"
                  className="bg-[#0c0f14] text-white font-bold text-sm uppercase tracking-wider px-8 py-4 inline-flex items-center gap-2 transition-all hover:bg-[#1a1e27] active:bg-[#2a2e37]"
                >
                  Talk to Partnerships
                  <svg width="16" height="16" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {/* Stats strip */}
              <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 border border-[#e8e8e3]">
                {[
                  { value: '$0.29', label: 'per consent at scale' },
                  { value: '4', label: 'API calls to integrate' },
                  { value: '60s', label: 'driver signs on phone' },
                  { value: '3yr', label: 'automatic DOT retention' },
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

            {/* Right column — code snippet with typing animation */}
            <div className="hidden lg:block">
              <TerminalTyping />
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 2. THE PROBLEM */}
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
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold text-[#5c6370] uppercase tracking-[0.2em]">The problem your carriers face</span>
            <div className="flex-1 h-px bg-[#1e2129]" />
          </div>

          <h2
            className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-4 max-w-2xl"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            Every Carrier on Your Platform Deals with This. Most Solve It with Paper and Prayer.
          </h2>

          <p className="text-[#8b919a] text-base mb-12 max-w-xl">
            Your carriers didn&apos;t choose your TMS to deal with more paperwork. They chose it to deal with less.
          </p>

          <div className="grid md:grid-cols-3 gap-0 border border-[#1e2129]">
            {PAIN_POINTS.map((point, i) => (
              <div
                key={point.title}
                className={`p-8 lg:p-10 ${i < PAIN_POINTS.length - 1 ? 'border-b md:border-b-0 md:border-r border-[#1e2129]' : ''}`}
              >
                <h3
                  className="text-xl font-bold text-white tracking-tight"
                  style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
                >
                  {point.title}
                </h3>
                <p className="text-[#8b919a] text-sm leading-relaxed mt-3">
                  {point.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 3. THE SOLUTION — 4 API CALLS */}
      {/* ================================================================= */}
      <section className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-0.5 bg-[#C8A75E]" />
          <span className="text-xs font-bold text-[#8b919a] uppercase tracking-[0.2em]">Integration</span>
        </div>

        <h2
          className="text-3xl lg:text-4xl font-bold text-[#0c0f14] tracking-tight mb-16 max-w-lg"
          style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
        >
          4 API Calls. That&apos;s the Entire Integration.
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-[#e8e8e3]">
          {API_STEPS.map((step, i) => (
            <div
              key={step.num}
              className={`p-8 bg-white ${i < API_STEPS.length - 1 ? 'border-b lg:border-b-0 lg:border-r border-[#e8e8e3]' : ''} ${i < 2 ? 'sm:border-r border-[#e8e8e3]' : ''}`}
            >
              <span className="text-[#C8A75E] text-sm font-bold tracking-widest">{step.num}</span>
              <p
                className="text-sm font-mono font-bold text-[#0c0f14] tracking-tight mt-4 break-all"
                style={{ fontSize: '0.8rem' }}
              >
                {step.endpoint}
              </p>
              <p className="text-sm text-[#6b6f76] leading-relaxed mt-2">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Code snippet */}
        <div className="mt-8 bg-[#0c0f14] p-6 sm:p-8 border border-[#1e2129]">
          <pre className="text-[0.75rem] sm:text-sm leading-relaxed font-mono overflow-x-auto text-[#8b919a]">
            <code>
              <span className="text-[#5c6370]"># Complete integration example</span>{'\n'}
              <span className="text-[#C8A75E]">curl</span>{' -X POST https://api.consenthaul.com/api/v1/consents \\'}{'\n'}
              {'  -H '}<span className="text-[#98c379]">&quot;Authorization: Bearer $API_KEY&quot;</span>{' \\'}{'\n'}
              {'  -H '}<span className="text-[#98c379]">&quot;Content-Type: application/json&quot;</span>{' \\'}{'\n'}
              {'  -d '}<span className="text-[#98c379]">{`'{"driver_id":"drv_abc123","method":"sms","language":"en"}'`}</span>{'\n'}
              {'\n'}
              <span className="text-[#5c6370]">{`# Response: {"id":"cst_xyz","status":"pending","signing_url":"..."}`}</span>
            </code>
          </pre>
        </div>

        {/* MCP callout */}
        <div className="mt-6 p-6 bg-white border border-[#e8e8e3] flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="shrink-0 w-10 h-10 bg-[#C8A75E]/10 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8A75E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-[#0c0f14]">Or use our MCP server</p>
            <p className="text-sm text-[#6b6f76] mt-1">Let AI agents handle consent workflows with natural language. 14 tools, zero UI work.</p>
          </div>
          <Link
            href="/demo"
            className="shrink-0 text-sm font-semibold text-[#C8A75E] hover:text-[#b89648] transition-colors"
          >
            View docs &rarr;
          </Link>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 4. BUILD VS BUY */}
      {/* ================================================================= */}
      <section className="bg-white border-t border-[#e8e8e3]">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-0.5 bg-[#C8A75E]" />
            <span className="text-xs font-bold text-[#8b919a] uppercase tracking-[0.2em]">Build vs. buy</span>
          </div>

          <h2
            className="text-3xl lg:text-4xl font-bold text-[#0c0f14] tracking-tight mb-16 max-w-lg"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            You Could Build This. Here&apos;s Why You Shouldn&apos;t.
          </h2>

          {/* Comparison table */}
          <div className="border border-[#e8e8e3] overflow-x-auto">
            {/* Header */}
            <div className="grid grid-cols-[1fr_1fr_1fr] min-w-[500px]">
              <div className="p-4 sm:p-6 bg-[#f8f8f6] border-b border-r border-[#e8e8e3]">
                <span className="text-xs font-bold text-[#8b919a] uppercase tracking-wider">&nbsp;</span>
              </div>
              <div className="p-4 sm:p-6 bg-[#f8f8f6] border-b border-r border-[#e8e8e3]">
                <span className="text-xs font-bold text-[#8b919a] uppercase tracking-wider">Build In-House</span>
              </div>
              <div className="p-4 sm:p-6 bg-[#0c0f14] border-b border-[#1e2129]">
                <span className="text-xs font-bold text-[#C8A75E] uppercase tracking-wider">Use ConsentHaul</span>
              </div>
            </div>

            {/* Rows */}
            {BUILD_VS_BUY.map((row, i) => (
              <div key={row.label} className={`grid grid-cols-[1fr_1fr_1fr] min-w-[500px] ${i < BUILD_VS_BUY.length - 1 ? 'border-b border-[#e8e8e3]' : ''}`}>
                <div className="p-4 sm:p-6 border-r border-[#e8e8e3]">
                  <span className="text-sm font-semibold text-[#0c0f14]">{row.label}</span>
                </div>
                <div className="p-4 sm:p-6 border-r border-[#e8e8e3]">
                  <span className="text-sm text-[#6b6f76]">{row.build}</span>
                </div>
                <div className="p-4 sm:p-6 bg-[#0c0f14]">
                  <span className="text-sm text-[#C8A75E] font-semibold">{row.buy}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-[#6b6f76] text-base leading-relaxed max-w-2xl">
            Every dollar you spend building consent forms is a dollar you&apos;re not spending on features your carriers actually chose you for.
          </p>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 5. VOLUME PRICING */}
      {/* ================================================================= */}
      <section className="border-t border-[#e8e8e3]">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-0.5 bg-[#C8A75E]" />
            <span className="text-xs font-bold text-[#8b919a] uppercase tracking-[0.2em]">Partner pricing</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <h2
              className="text-3xl lg:text-4xl font-bold text-[#0c0f14] tracking-tight"
              style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
            >
              Pricing That Gets Better
              <br />
              the More You Buy.
            </h2>
            <p className="text-sm text-[#6b6f76] max-w-xs">
              Direct customers pay $1.50&ndash;$3.00/consent. As a TMS partner, you buy credit packs starting at 10K. The more you buy, the less you pay.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-0 border border-[#d4d4cf]">
            {PRICING_TIERS.map((tier, i) => (
              <div
                key={tier.name}
                className={`relative p-6 lg:p-8 ${
                  i < PRICING_TIERS.length - 1 ? 'border-b sm:border-b lg:border-b-0 sm:border-r lg:border-r border-[#d4d4cf]' : ''
                } ${
                  tier.popular ? 'bg-[#0c0f14] text-white' : 'bg-white'
                }`}
              >
                {tier.popular && (
                  <div className="absolute top-0 right-0 bg-[#C8A75E] text-[#0c0f14] text-[0.6rem] font-bold uppercase tracking-widest px-3 py-1">
                    Popular
                  </div>
                )}
                <p className={`text-xs font-bold uppercase tracking-wider ${tier.popular ? 'text-[#C8A75E]' : 'text-[#8b919a]'}`}>
                  {tier.name}
                </p>
                <p className={`text-[2.5rem] font-bold tracking-tight leading-none mt-3 ${
                  tier.popular ? 'text-white' : 'text-[#0c0f14]'
                }`}>
                  {tier.credits}
                </p>
                <p className={`text-sm mt-1 ${tier.popular ? 'text-[#8b919a]' : 'text-[#6b6f76]'}`}>
                  credits
                </p>
                <div className="mt-6 pt-4 border-t border-dashed border-[#d4d4cf]/30">
                  <p className={`text-xl font-bold ${tier.popular ? 'text-white' : 'text-[#0c0f14]'}`}>
                    {tier.price}
                    <span className={`text-sm line-through ml-2 font-normal ${tier.popular ? 'text-[#5c6370]' : 'text-[#b5b5ae]'}`}>
                      {tier.fullPrice}
                    </span>
                  </p>
                  <p className={`text-xs font-medium mt-1 ${tier.popular ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    25% off at signup
                  </p>
                  <p className={`text-sm mt-0.5 ${tier.popular ? 'text-[#8b919a]' : 'text-[#6b6f76]'}`}>
                    {tier.per} per consent
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Partner onboarding fee */}
          <div className="mt-8 p-6 sm:p-8 bg-[#0c0f14] border border-[#1e2129]">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
              <div className="flex-1">
                <p className="text-xs font-bold text-[#C8A75E] uppercase tracking-[0.2em] mb-2">One-Time Partner Onboarding</p>
                <p
                  className="text-[2rem] font-bold text-white tracking-tight"
                  style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
                >
                  Free
                </p>
                <p className="text-sm text-[#8b919a] mt-2 leading-relaxed">
                  Get started with sandbox keys, integration support, and a dedicated partner channel at no cost. Credit packs are optional &mdash; purchase during signup for 25% off.
                </p>
              </div>
              <div className="grid sm:grid-cols-3 gap-0 border border-[#1e2129] flex-1">
                <div className="p-5 border-b sm:border-b-0 sm:border-r border-[#1e2129]">
                  <p className="text-2xl font-bold text-[#C8A75E] tracking-tight" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>Sandbox</p>
                  <p className="text-sm text-[#8b919a] mt-1">API keys &amp; documentation</p>
                  <p className="text-xs text-[#5c6370] mt-2">Unlimited test credits, full API access from day one</p>
                </div>
                <div className="p-5 border-b sm:border-b-0 sm:border-r border-[#1e2129]">
                  <p className="text-2xl font-bold text-[#C8A75E] tracking-tight" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>Support</p>
                  <p className="text-sm text-[#8b919a] mt-1">Dedicated partner channel</p>
                  <p className="text-xs text-[#5c6370] mt-2">Integration assistance, architecture review, onboarding calls</p>
                </div>
                <div className="p-5">
                  <p className="text-2xl font-bold text-[#C8A75E] tracking-tight" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>Migration</p>
                  <p className="text-sm text-[#8b919a] mt-1">$17/GB &mdash; optional</p>
                  <p className="text-xs text-[#5c6370] mt-2">Bring existing carrier/driver data. Skip it entirely if starting fresh</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row sm:items-start gap-6">
            <p className="text-sm text-[#6b6f76] leading-relaxed flex-1">
              Credits never expire. No monthly minimums. No per-seat fees. Credit packs are optional &mdash; 25% off when purchased during signup.
            </p>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 6. REVENUE OPPORTUNITY */}
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
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold text-[#5c6370] uppercase tracking-[0.2em]">Your new revenue stream</span>
            <div className="flex-1 h-px bg-[#1e2129]" />
          </div>

          <h2
            className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-4"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            Don&apos;t Just Offer It. Monetize It.
          </h2>

          <p className="text-[#8b919a] text-base mb-12 max-w-2xl">
            Bundle consent into your subscription or charge per-consent. At $0.29&ndash;$1.00/consent cost, even a $2.50 pass-through gives you massive margin on a feature your carriers need anyway.
          </p>

          <div className="grid md:grid-cols-3 gap-0 border border-[#1e2129]">
            {REVENUE_MODELS.map((model, i) => (
              <div
                key={model.title}
                className={`p-8 lg:p-10 ${i < REVENUE_MODELS.length - 1 ? 'border-b md:border-b-0 md:border-r border-[#1e2129]' : ''}`}
              >
                <h3
                  className="text-xl font-bold text-white tracking-tight"
                  style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
                >
                  {model.title}
                </h3>
                <p className="text-[#8b919a] text-sm leading-relaxed mt-3">
                  {model.desc}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-[#5c6370] text-sm">
            The carriers are already paying someone to solve this. Make sure it&apos;s you.
          </p>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 7. FEATURES GRID */}
      {/* ================================================================= */}
      <section className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-0.5 bg-[#C8A75E]" />
          <span className="text-xs font-bold text-[#8b919a] uppercase tracking-[0.2em]">What&apos;s included</span>
        </div>

        <h2
          className="text-3xl lg:text-4xl font-bold text-[#0c0f14] tracking-tight mb-16 max-w-lg"
          style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
        >
          Everything Your Carriers Need.
          <br />
          Nothing You Need to Build.
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-0 border border-[#e8e8e3]">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className={`p-8 bg-white ${
                i < FEATURES.length - 1 ? 'border-b lg:border-b border-[#e8e8e3]' : ''
              } ${
                (i + 1) % 3 !== 0 ? 'lg:border-r border-[#e8e8e3]' : ''
              } ${
                (i + 1) % 2 !== 0 ? 'sm:border-r border-[#e8e8e3]' : ''
              }`}
            >
              <h3
                className="text-base font-bold text-[#0c0f14] tracking-tight"
                style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
              >
                {feature.title}
              </h3>
              <p className="text-sm text-[#6b6f76] leading-relaxed mt-2">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================= */}
      {/* 8. REGULATORY PRESSURE — WHY NOW */}
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
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold text-[#5c6370] uppercase tracking-[0.2em]">Why now</span>
            <div className="flex-1 h-px bg-[#1e2129]" />
          </div>

          <h2
            className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-8 max-w-2xl"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            FMCSA Isn&apos;t Going Away. The Mandate Is Getting Stricter.
          </h2>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-4">
              {[
                'Every motor carrier must query the Clearinghouse before hiring AND annually for every CDL driver',
                'Consent must be obtained for EACH limited query — no blanket consent allowed',
                'FMCSA increased enforcement budget in 2025',
                '$5,833/violation, compounding per driver',
              ].map((fact) => (
                <div key={fact} className="flex items-start gap-3">
                  <svg width="16" height="16" className="w-4 h-4 shrink-0 mt-0.5 text-[#C8A75E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-[#8b919a] leading-relaxed">{fact}</p>
                </div>
              ))}
            </div>

            {/* Stat callout */}
            <div className="p-8 border border-[#1e2129] flex flex-col justify-center">
              <p
                className="text-[2.5rem] font-bold text-[#C8A75E] tracking-tight leading-none"
                style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
              >
                787K
              </p>
              <p className="text-sm text-[#8b919a] mt-2">active carriers</p>
              <p
                className="text-[2.5rem] font-bold text-white tracking-tight leading-none mt-6"
                style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
              >
                5&ndash;12M
              </p>
              <p className="text-sm text-[#8b919a] mt-2">consent events per year</p>
              <p className="text-xs text-[#5c6370] mt-6 leading-relaxed">
                This market is mandatory and growing.
              </p>
            </div>
          </div>

          <p className="text-[#5c6370] text-sm max-w-2xl">
            Your carriers will solve this with you or without you. The only question is whether they need another vendor login to do it.
          </p>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 9. FAQ */}
      {/* ================================================================= */}
      <section className="border-t border-[#e8e8e3]">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-0.5 bg-[#C8A75E]" />
            <span className="text-xs font-bold text-[#8b919a] uppercase tracking-[0.2em]">FAQ</span>
          </div>

          <h2
            className="text-3xl lg:text-4xl font-bold text-[#0c0f14] tracking-tight mb-16"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            TMS Partner Integration FAQ
          </h2>

          <div className="grid lg:grid-cols-2 gap-0 border border-[#e8e8e3]">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className={`p-8 bg-white border-b border-[#e8e8e3] last:border-b-0 ${
                  i % 2 === 0 ? 'lg:border-r border-[#e8e8e3]' : ''
                }`}
              >
                <h3
                  className="text-[0.95rem] font-bold text-[#0c0f14] tracking-tight"
                  style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
                >
                  {faq.q}
                </h3>
                <p className="text-sm text-[#6b6f76] leading-relaxed mt-3">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 10. CTA */}
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
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-12 h-0.5 bg-[#C8A75E] mx-auto mb-8" />
            <h2
              className="text-3xl lg:text-[2.75rem] font-bold text-white tracking-tight leading-[1.1]"
              style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
            >
              Your Carriers Need This.
              <br />
              <span className="text-[#C8A75E]">You Can Ship It This Quarter.</span>
            </h2>
            <p className="mt-6 text-[#8b919a] text-base leading-relaxed max-w-lg mx-auto">
              Talk to our partnerships team. We&apos;ll have you integrated before your next sprint review.
            </p>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/tms/apply"
                className="inline-flex items-center gap-2 bg-[#C8A75E] text-[#0c0f14] font-bold text-sm uppercase tracking-wider px-10 py-4 transition-all hover:bg-[#d4b56a] active:bg-[#b89648]"
              >
                Apply Now
                <svg width="16" height="16" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="mailto:partnerships@consenthaul.com"
                className="inline-flex items-center gap-2 border border-[#1e2129] text-white font-bold text-sm uppercase tracking-wider px-10 py-4 transition-all hover:border-[#3a3f49] hover:bg-[#1e2129]"
              >
                Email Partnerships
                <svg width="16" height="16" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Trust signals */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {[
                'No monthly minimums',
                'Credits never expire',
                'Sandbox included',
                'Priority support',
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
        </div>
      </section>

      {/* ================================================================= */}
      {/* FOOTER */}
      {/* ================================================================= */}
      <footer className="bg-[#0c0f14] text-white">
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-8">
          {/* Top section — logo + nav columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
            {/* Brand column */}
            <div className="sm:col-span-2 lg:col-span-1">
              <LogoFull mode="dark" className="h-5 w-auto" />
              <p className="mt-4 text-sm text-[#5c6370] leading-relaxed max-w-xs">
                Digital FMCSA consent collection for motor carriers. Text a link. Driver signs. PDF filed.
              </p>
            </div>

            {/* Product */}
            <div>
              <p className="text-[0.65rem] font-bold text-[#5c6370] uppercase tracking-[0.15em] mb-4">Product</p>
              <ul className="space-y-2.5">
                <li><span className="text-sm text-[#8b919a]/50 cursor-not-allowed">Get Started</span></li>
                <li><span className="text-sm text-[#8b919a]/50 cursor-not-allowed">Sign In</span></li>
                <li><span className="text-sm text-[#3a3f49]">API Documentation</span></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="text-[0.65rem] font-bold text-[#5c6370] uppercase tracking-[0.15em] mb-4">Company</p>
              <ul className="space-y-2.5">
                <li><span className="text-sm text-[#8b919a]">Workbird LLC</span></li>
                <li><Link href="mailto:support@consenthaul.com" className="text-sm text-[#8b919a] hover:text-[#C8A75E] transition-colors">support@consenthaul.com</Link></li>
                <li><Link href="mailto:partnerships@consenthaul.com" className="text-sm text-[#8b919a] hover:text-[#C8A75E] transition-colors">partnerships@consenthaul.com</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="text-[0.65rem] font-bold text-[#5c6370] uppercase tracking-[0.15em] mb-4">Legal</p>
              <ul className="space-y-2.5">
                <li><Link href="/terms" className="text-sm text-[#8b919a] hover:text-[#C8A75E] transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-sm text-[#8b919a] hover:text-[#C8A75E] transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="mt-12 pt-8 border-t border-[#1e2129]">
            {/* Legal disclaimers */}
            <div className="space-y-3 mb-8">
              <p className="text-[0.7rem] leading-relaxed text-[#8b919a]">
                ConsentHaul is not affiliated with, endorsed by, or sponsored by the Federal Motor Carrier Safety Administration (FMCSA) or the U.S. Department of Transportation. &quot;FMCSA Clearinghouse&quot; is a registered trademark of the U.S. Department of Transportation.
              </p>
              <p className="text-[0.7rem] leading-relaxed text-[#8b919a]">
                ConsentHaul provides a digital platform for collecting electronic consent signatures as permitted under 49 CFR Part 40. It is the responsibility of the employer/carrier to ensure compliance with all applicable federal and state regulations. Electronic signatures comply with the ESIGN Act and UETA. Signed documents are retained for the FMCSA-required minimum of three (3) years.
              </p>
            </div>

            {/* Copyright bar */}
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
