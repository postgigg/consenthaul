import Link from 'next/link';
import { LogoFull } from '@/components/brand/Logo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Market Research | ConsentHaul',
  description: 'Internal market research and competitive analysis for ConsentHaul.',
  robots: { index: false },
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const MARKET_STATS = [
  { value: '787K', label: 'Active Carriers' },
  { value: '3.9M', label: 'CDL Holders' },
  { value: '608K', label: 'Queries/mo' },
  { value: '$5,833', label: 'Avg Fine' },
  { value: '91.5%', label: 'Small Carriers' },
  { value: '190K+', label: 'Prohibited Drivers' },
];

const COMPETITORS = [
  {
    name: 'Foley',
    revenue: '$200M+',
    clients: '15,000+',
    focus: 'Full-stack carrier compliance (screening, drug testing, DOT audits)',
    consentApproach: 'Bundled into screening packages — not standalone',
    pricingModel: 'Enterprise contracts, per-driver pricing',
    uxQuality: 'Legacy web portal, functional but dated',
    weakness: 'Overkill for small carriers who just need consent forms',
  },
  {
    name: 'Tenstreet',
    revenue: '$100M+',
    clients: '25,000+',
    focus: 'Driver application and onboarding workflows',
    consentApproach: 'Consent embedded in broader onboarding flow',
    pricingModel: 'SaaS subscription + per-applicant fees',
    uxQuality: 'Modern but complex — steep learning curve',
    weakness: 'Locked into full platform — no unbundled consent option',
  },
  {
    name: 'J.J. Keller',
    revenue: '$700M+',
    clients: '600,000+',
    focus: 'Compliance publishing, ELD, fleet management',
    consentApproach: 'Paper forms and manual PDF downloads',
    pricingModel: 'Subscription + per-unit licensing',
    uxQuality: 'Functional but enterprise-heavy UX',
    weakness: 'Still paper-first for consent — no mobile signing',
  },
  {
    name: 'HireRight',
    revenue: '$750M+',
    clients: '40,000+',
    focus: 'Background screening across all industries',
    consentApproach: 'Generic e-consent — not FMCSA-specific',
    pricingModel: 'Per-screening fees + enterprise tiers',
    uxQuality: 'Polished but generic — not trucking-focused',
    weakness: 'No FMCSA Clearinghouse specialization',
  },
  {
    name: 'Clearinghouse Services',
    revenue: '<$5M',
    clients: '5,000+',
    focus: 'Third-party Clearinghouse query services',
    consentApproach: 'Manual consent collection via email/fax',
    pricingModel: '$10-$25 per consent/query service',
    uxQuality: 'Minimal — mostly phone/email based',
    weakness: 'No digital consent workflow — manual process',
  },
  {
    name: 'DISA',
    revenue: '$300M+',
    clients: '55,000+',
    focus: 'Drug testing, background screening, compliance',
    consentApproach: 'Consent bundled with drug testing services',
    pricingModel: 'Enterprise contracts',
    uxQuality: 'Enterprise portal — complex onboarding',
    weakness: 'No standalone consent product — bundled only',
  },
];

const FEATURES_COMPARISON = [
  { feature: 'Mobile-first driver signing', consenthaul: true, foley: false, tenstreet: true, jjkeller: false, hireright: true, disa: false },
  { feature: 'SMS/WhatsApp consent delivery', consenthaul: true, foley: false, tenstreet: false, jjkeller: false, hireright: false, disa: false },
  { feature: 'Bilingual (EN/ES)', consenthaul: true, foley: false, tenstreet: true, jjkeller: false, hireright: true, disa: false },
  { feature: 'Pay-per-consent (no subscription)', consenthaul: true, foley: false, tenstreet: false, jjkeller: false, hireright: false, disa: false },
  { feature: 'Sub-60-second signing', consenthaul: true, foley: false, tenstreet: false, jjkeller: false, hireright: false, disa: false },
  { feature: 'REST API', consenthaul: true, foley: true, tenstreet: true, jjkeller: false, hireright: true, disa: false },
  { feature: 'AI agent integration (MCP)', consenthaul: true, foley: false, tenstreet: false, jjkeller: false, hireright: false, disa: false },
  { feature: '3-year auto-retention', consenthaul: true, foley: true, tenstreet: true, jjkeller: true, hireright: true, disa: true },
  { feature: 'No minimum contract', consenthaul: true, foley: false, tenstreet: false, jjkeller: false, hireright: false, disa: false },
  { feature: 'Bulk CSV driver import', consenthaul: true, foley: true, tenstreet: true, jjkeller: false, hireright: true, disa: false },
  { feature: 'Real-time status tracking', consenthaul: true, foley: true, tenstreet: true, jjkeller: false, hireright: true, disa: false },
  { feature: 'FMCSA-specific consent forms', consenthaul: true, foley: true, tenstreet: true, jjkeller: true, hireright: false, disa: true },
];

const PRICING_COMPARISON = [
  { label: 'FMCSA Query Fee', price: '$1.25', note: 'Per query — paid by carrier directly to FMCSA (separate from consent cost)', highlight: false },
  { label: 'Competitor Consent Fee', price: '$10–$45', note: 'Per consent collection — bundled into screening/onboarding packages', highlight: false },
  { label: 'ConsentHaul', price: '$1.50–$3.00', note: 'Per consent collection — 3x–30x cheaper than competitors', highlight: true },
];

const STRENGTHS = [
  {
    title: 'Purpose-built for one thing',
    desc: 'ConsentHaul does FMCSA Clearinghouse consent and nothing else. No bloat, no upsells, no feature creep.',
    why: 'Competitors bundle consent into larger platforms. Small carriers don\'t want to buy a $500/mo suite just to send a consent form.',
  },
  {
    title: 'Mobile-first driver UX',
    desc: 'Designed for truck drivers at rest stops with poor signal. Fast load, large targets, works on any phone.',
    why: 'Drivers won\'t download an app or navigate a portal. A single SMS link that loads instantly removes all friction.',
  },
  {
    title: 'No subscription required',
    desc: 'Pay-per-consent credit packs. Buy 10 or buy 1,000. Credits never expire. No monthly fees.',
    why: 'Small carriers with 5-20 drivers can\'t justify a $200/mo subscription for a task they do a few times a year.',
  },
  {
    title: 'Sub-60-second signing',
    desc: 'Driver taps link, reviews consent, signs with finger, done. Average completion: 47 seconds.',
    why: 'Every second of friction costs completions. Paper forms take days. Email-based forms take hours. We take seconds.',
  },
  {
    title: 'SMS + WhatsApp delivery',
    desc: 'Send consent links via SMS, WhatsApp, or email. Meet drivers where they already are.',
    why: 'CDL drivers check WhatsApp more than email. SMS open rates are 98% vs. 20% for email.',
  },
  {
    title: 'Bilingual EN/ES',
    desc: 'Full bilingual support. Driver can toggle between English and Spanish on the signing page.',
    why: 'Hispanic drivers are the fastest-growing demographic in trucking. Spanish support isn\'t optional — it\'s a market requirement.',
  },
  {
    title: 'API + MCP for AI agents',
    desc: 'REST API and Model Context Protocol server. TMS integrations and AI agents can manage consents programmatically.',
    why: 'Carriers using AI dispatching or modern TMS platforms want consent to be automated, not manual.',
  },
  {
    title: 'Price disruption',
    desc: 'At $1.50–$3.00 per consent, ConsentHaul is 3x–30x cheaper than competitors charging $10–$45 for the same consent collection step.',
    why: 'Carriers already pay FMCSA $1.25 per query. Paying a vendor another $25+ just to collect the consent signature is indefensible.',
  },
];

const WEAKNESSES = [
  {
    gap: 'No brand recognition',
    impact: 'High' as const,
    mitigation: 'Aggressive content marketing, FMCSA-focused SEO, industry association partnerships, and conference presence.',
  },
  {
    gap: 'No drug testing integration',
    impact: 'Medium' as const,
    mitigation: 'Partner with existing drug testing providers (Quest, DISA) rather than building in-house. API-first approach enables integration.',
  },
  {
    gap: 'Limited compliance scope',
    impact: 'Medium' as const,
    mitigation: 'Intentional — staying focused is the strategy. Expand only to adjacent consent types (pre-employment, annual queries).',
  },
  {
    gap: 'No Clearinghouse query execution',
    impact: 'Medium' as const,
    mitigation: 'Phase 2 roadmap item. Consent-first lets us build the driver relationship before adding query execution.',
  },
  {
    gap: 'Solo founder risk',
    impact: 'High' as const,
    mitigation: 'Hire first engineer by month 6. Automated infrastructure reduces bus factor. Document everything.',
  },
  {
    gap: 'No enterprise sales motion',
    impact: 'Low' as const,
    mitigation: 'Product-led growth for small/mid carriers first. Enterprise comes after PMF is proven with self-serve.',
  },
];

const TARGET_MARKETS = [
  {
    rank: 1,
    segment: 'Small carriers (1-20 trucks)',
    size: '~720,000 carriers',
    painPoints: [
      'No dedicated compliance staff',
      'Can\'t justify subscription software',
      'Still using paper or email for consent',
      'Often non-English-speaking owners/drivers',
    ],
    acquisitionStrategy: 'SEO + Google Ads targeting "FMCSA consent form" and "Clearinghouse limited query". Self-serve onboarding.',
    avgDealSize: '$50–$150/yr',
    priority: 'PRIMARY' as const,
  },
  {
    rank: 2,
    segment: 'Owner-operators with authority',
    size: '~350,000 operators',
    painPoints: [
      'Must query their own Clearinghouse record',
      'No admin support — doing everything themselves',
      'Price-sensitive on every compliance cost',
    ],
    acquisitionStrategy: 'Facebook/Reddit trucking communities. YouTube tutorials. Word-of-mouth from drivers already signing through ConsentHaul.',
    avgDealSize: '$15–$50/yr',
    priority: 'PRIMARY' as const,
  },
  {
    rank: 3,
    segment: 'Mid-size fleets (21-100 trucks)',
    size: '~45,000 carriers',
    painPoints: [
      'Outgrowing paper processes',
      'Safety managers wearing multiple hats',
      'Need bulk operations but not enterprise pricing',
    ],
    acquisitionStrategy: 'LinkedIn outreach to safety managers. Industry newsletter sponsorships. Referral program from small carrier base.',
    avgDealSize: '$500–$2,000/yr',
    priority: 'SECONDARY' as const,
  },
  {
    rank: 4,
    segment: 'Staffing agencies / driver leasing',
    size: '~2,500 agencies',
    painPoints: [
      'High driver turnover = constant consent churn',
      'Need fast onboarding flow',
      'Volume pricing is critical',
    ],
    acquisitionStrategy: 'API integration partnerships. Direct sales to top 100 staffing agencies. Conference booths at TCA and MATS.',
    avgDealSize: '$2,000–$10,000/yr',
    priority: 'SECONDARY' as const,
  },
  {
    rank: 5,
    segment: 'TMS / compliance software vendors',
    size: '~150 vendors',
    painPoints: [
      'Customers asking for Clearinghouse integration',
      'Don\'t want to build consent workflow from scratch',
      'Need white-label or embedded solution',
    ],
    acquisitionStrategy: 'API/MCP partnerships. Revenue-share model. White-label offering for embedded consent.',
    avgDealSize: '$5,000–$50,000/yr',
    priority: 'CHANNEL' as const,
  },
];

const REGULATORY_EVENTS = [
  {
    date: 'Jan 2020',
    event: 'FMCSA Clearinghouse goes live',
    impact: 'All carriers required to query driver drug & alcohol records. Limited query consent becomes mandatory for every pre-employment and annual check.',
  },
  {
    date: 'Nov 2024',
    event: 'Clearinghouse II announced',
    impact: 'FMCSA proposes expanded reporting requirements and real-time query mandates. Consent volume expected to increase 3-5x per carrier.',
  },
  {
    date: '2023–2025',
    event: 'DOT embraces electronic signatures',
    impact: 'FMCSA formally acknowledges ESIGN Act and UETA for consent forms. Digital consent collection is explicitly compliant — removing legal uncertainty.',
  },
  {
    date: '2024–2025',
    event: 'Penalty enforcement ramps up',
    impact: 'FMCSA average fine for Clearinghouse violations reaches $5,833. Carriers who skip queries face license suspensions and audit flags.',
  },
  {
    date: 'Ongoing',
    event: 'Prohibited driver list grows past 190K',
    impact: 'More prohibited drivers means more queries needed. Every query needs consent. The compliance surface area keeps expanding.',
  },
];

const ACQUISITION_DATA = {
  multiples: [
    { label: 'SaaS Revenue Multiple', value: '6.1x', note: 'Median for vertical SaaS' },
    { label: 'EBITDA Multiple', value: '4.7x', note: 'For compliance software' },
    { label: 'Strategic Premium', value: '8–10x', note: 'For niche regulatory tools' },
    { label: 'Gross Margin Target', value: '44%', note: 'At scale with volume pricing' },
  ],
  acquirers: [
    { name: 'Tenstreet', rationale: 'Add standalone consent to complement their onboarding platform. Fills a product gap.', likelihood: 'High' },
    { name: 'Foley', rationale: 'Acquire modern consent UX to modernize their compliance stack. Defensive play.', likelihood: 'High' },
    { name: 'Volaris Group', rationale: 'Constellation Software subsidiary that acquires vertical SaaS in niche markets.', likelihood: 'Medium' },
    { name: 'Roper Technologies', rationale: 'Portfolio of niche compliance and infrastructure software. ConsentHaul fits their thesis.', likelihood: 'Medium' },
    { name: 'J.J. Keller', rationale: 'Digitize their paper-first consent process. Buy vs. build is faster.', likelihood: 'Medium' },
  ],
  attractiveness: [
    { factor: 'Regulatory moat', detail: 'FMCSA mandate creates non-discretionary demand. Carriers must comply or face fines.' },
    { factor: 'High switching cost', detail: 'Once integrated into onboarding workflows, consent tools become sticky infrastructure.' },
    { factor: 'Net revenue retention', detail: 'Carriers grow fleets over time, increasing consent volume without sales effort.' },
    { factor: 'Low CAC potential', detail: 'Inbound SEO + product-led growth = sub-$50 CAC for small carriers.' },
    { factor: 'API-first architecture', detail: 'Easy to embed into acquirer\'s existing platform. Clean integration surface.' },
    { factor: 'Clean data asset', detail: 'Database of carrier-driver relationships has strategic value for compliance platforms.' },
  ],
};

const GTM_CHANNELS = [
  { channel: 'SEO / Content', priority: 'P0' as const, cost: 'Low', timeline: 'Month 1–3', notes: 'Target "FMCSA consent form", "Clearinghouse limited query consent", "digital DOT consent". Long-tail regulatory keywords.' },
  { channel: 'Google Ads', priority: 'P0' as const, cost: 'Medium', timeline: 'Month 1', notes: 'Exact-match on high-intent queries. $2–5 CPC. Cap at $500/mo initially.' },
  { channel: 'Trucking communities', priority: 'P1' as const, cost: 'Low', timeline: 'Month 1–2', notes: 'Reddit r/Truckers, Facebook groups, TheTruckersReport. Genuine participation, not spam.' },
  { channel: 'Industry partnerships', priority: 'P1' as const, cost: 'Low', timeline: 'Month 3–6', notes: 'Partner with truck insurance brokers, small fleet associations, OOIDA.' },
  { channel: 'Conference presence', priority: 'P2' as const, cost: 'High', timeline: 'Month 6+', notes: 'MATS (March), TCA (March), ATA MC&E (October). Booth + speaking slots.' },
  { channel: 'Direct outreach', priority: 'P1' as const, cost: 'Low', timeline: 'Month 2–4', notes: 'LinkedIn outreach to safety managers at 50-200 truck fleets. Personalized demos.' },
  { channel: 'API/MCP partnerships', priority: 'P2' as const, cost: 'Low', timeline: 'Month 4–8', notes: 'Integrate with TMS vendors (Samsara, KeepTruckin, Trimble) as embedded consent provider.' },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MarketResearchPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Nav */}
      <nav className="border-b border-[#e8e8e3] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <LogoFull className="h-5 w-auto" />
          </Link>
          <span className="text-xs font-semibold text-[#8b919a] uppercase tracking-wider">
            Internal Document
          </span>
        </div>
      </nav>

      {/* ================================================================= */}
      {/* 1. HERO / EXECUTIVE SUMMARY */}
      {/* ================================================================= */}
      <section className="relative overflow-hidden bg-[#fafaf8]">
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(12,15,20,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(12,15,20,.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-16 lg:pt-24 lg:pb-20">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-0.5 bg-[#C8A75E]" />
            <span className="text-xs font-bold text-[#8b919a] uppercase tracking-[0.2em]">
              Market Research
            </span>
          </div>

          <h1
            className="text-[clamp(2rem,4vw,3.5rem)] font-bold text-[#0c0f14] leading-[1.1] tracking-tight max-w-3xl"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            The Compliance Gap{' '}
            <span className="relative inline-block">
              <span className="relative z-10">Nobody Is Solving</span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-[#C8A75E]/30 -z-0" />
            </span>
          </h1>

          <p className="mt-6 text-[#6b6f76] text-lg leading-relaxed max-w-2xl">
            787,000 carriers need FMCSA Clearinghouse consent from 3.9 million CDL holders.
            Every competitor bundles it into expensive platforms. Nobody sells it standalone
            with a mobile-first, pay-per-use model. That&apos;s the gap.
          </p>

          {/* Stats strip */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border border-[#e8e8e3]">
            {MARKET_STATS.map((stat, i) => (
              <div
                key={stat.label}
                className={`p-4 sm:p-5 bg-white ${
                  i < MARKET_STATS.length - 1 ? 'border-r border-[#e8e8e3]' : ''
                } ${i < 4 ? 'border-b sm:border-b lg:border-b-0 border-[#e8e8e3]' : ''}`}
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

      {/* ================================================================= */}
      {/* 2. COMPETITIVE LANDSCAPE */}
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
          <div className="flex items-center gap-3 mb-12">
            <span className="text-xs font-bold text-[#5c6370] uppercase tracking-[0.2em]">Competitive Landscape</span>
            <div className="flex-1 h-px bg-[#1e2129]" />
          </div>

          {/* 2A: Competitor grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border border-[#1e2129]">
            {COMPETITORS.map((comp, i) => (
              <div
                key={comp.name}
                className={`p-8 ${
                  i < COMPETITORS.length - 1 ? 'border-b lg:border-b border-[#1e2129]' : ''
                } ${(i + 1) % 3 !== 0 ? 'lg:border-r border-[#1e2129]' : ''} ${
                  (i + 1) % 2 !== 0 ? 'md:border-r border-[#1e2129]' : ''
                }`}
              >
                <span className="text-[#C8A75E] text-sm font-bold tracking-widest">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3
                  className="text-xl font-bold text-white tracking-tight mt-3"
                  style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
                >
                  {comp.name}
                </h3>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#5c6370]">
                  <span>Rev: {comp.revenue}</span>
                  <span>Clients: {comp.clients}</span>
                </div>
                <p className="text-sm text-[#8b919a] leading-relaxed mt-3">
                  {comp.focus}
                </p>
                <div className="mt-4 border-l-2 border-[#C8A75E] pl-3">
                  <p className="text-xs text-[#C8A75E] font-semibold uppercase tracking-wider mb-1">Weakness</p>
                  <p className="text-sm text-[#8b919a] leading-relaxed">{comp.weakness}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 2B: Feature comparison matrix */}
          <div className="mt-16">
            <h3
              className="text-xl font-bold text-white tracking-tight mb-6"
              style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
            >
              Feature Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-[#1e2129]">
                <thead>
                  <tr className="border-b border-[#1e2129]">
                    <th className="text-left p-3 text-[#5c6370] font-semibold uppercase tracking-wider text-xs">Feature</th>
                    <th className="p-3 text-center bg-[#C8A75E]/10 text-[#C8A75E] font-bold uppercase tracking-wider text-xs">ConsentHaul</th>
                    <th className="p-3 text-center text-[#5c6370] font-semibold uppercase tracking-wider text-xs">Foley</th>
                    <th className="p-3 text-center text-[#5c6370] font-semibold uppercase tracking-wider text-xs">Tenstreet</th>
                    <th className="p-3 text-center text-[#5c6370] font-semibold uppercase tracking-wider text-xs hidden sm:table-cell">J.J. Keller</th>
                    <th className="p-3 text-center text-[#5c6370] font-semibold uppercase tracking-wider text-xs hidden md:table-cell">HireRight</th>
                    <th className="p-3 text-center text-[#5c6370] font-semibold uppercase tracking-wider text-xs hidden lg:table-cell">DISA</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURES_COMPARISON.map((row, i) => (
                    <tr key={row.feature} className={i < FEATURES_COMPARISON.length - 1 ? 'border-b border-[#1e2129]' : ''}>
                      <td className="p-3 text-[#8b919a]">{row.feature}</td>
                      <td className="p-3 text-center bg-[#C8A75E]/5">{row.consenthaul ? <span className="text-green-400">&#10003;</span> : <span className="text-[#3a3f49]">&#10005;</span>}</td>
                      <td className="p-3 text-center">{row.foley ? <span className="text-green-400">&#10003;</span> : <span className="text-[#3a3f49]">&#10005;</span>}</td>
                      <td className="p-3 text-center">{row.tenstreet ? <span className="text-green-400">&#10003;</span> : <span className="text-[#3a3f49]">&#10005;</span>}</td>
                      <td className="p-3 text-center hidden sm:table-cell">{row.jjkeller ? <span className="text-green-400">&#10003;</span> : <span className="text-[#3a3f49]">&#10005;</span>}</td>
                      <td className="p-3 text-center hidden md:table-cell">{row.hireright ? <span className="text-green-400">&#10003;</span> : <span className="text-[#3a3f49]">&#10005;</span>}</td>
                      <td className="p-3 text-center hidden lg:table-cell">{row.disa ? <span className="text-green-400">&#10003;</span> : <span className="text-[#3a3f49]">&#10005;</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2C: Pricing comparison strip */}
          <div className="mt-16">
            <h3
              className="text-xl font-bold text-white tracking-tight mb-6"
              style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
            >
              Pricing Advantage
            </h3>
            <div className="grid md:grid-cols-3 gap-0 border border-[#1e2129]">
              {PRICING_COMPARISON.map((item, i) => (
                <div
                  key={item.label}
                  className={`p-8 ${i < PRICING_COMPARISON.length - 1 ? 'border-b md:border-b-0 md:border-r border-[#1e2129]' : ''} ${
                    item.highlight ? 'bg-[#C8A75E]/10' : ''
                  }`}
                >
                  <p className="text-xs text-[#5c6370] font-bold uppercase tracking-wider">{item.label}</p>
                  <p
                    className={`text-3xl font-bold tracking-tight mt-2 ${item.highlight ? 'text-[#C8A75E]' : 'text-white'}`}
                    style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
                  >
                    {item.price}
                  </p>
                  <p className="text-sm text-[#8b919a] leading-relaxed mt-2">{item.note}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 border-l-2 border-[#C8A75E] pl-4">
              <p className="text-sm text-[#8b919a]">
                ConsentHaul&apos;s consent collection cost is <span className="text-[#C8A75E] font-semibold">7x–30x cheaper</span> than competitors. Carriers still pay FMCSA $1.25/query separately — our fee is only for collecting the driver&apos;s signature.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 3. WHAT MAKES US STAND OUT */}
      {/* ================================================================= */}
      <section className="bg-[#fafaf8]">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-0.5 bg-[#C8A75E]" />
            <span className="text-xs font-bold text-[#8b919a] uppercase tracking-[0.2em]">Differentiation</span>
          </div>

          <h2
            className="text-3xl lg:text-4xl font-bold text-[#0c0f14] tracking-tight mb-16 max-w-lg"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            What makes us
            <br />
            stand out.
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-[#e8e8e3]">
            {STRENGTHS.map((s, i) => (
              <div
                key={s.title}
                className={`p-8 bg-white ${
                  i < STRENGTHS.length - 1 ? 'border-b border-[#e8e8e3]' : ''
                } ${(i + 1) % 4 !== 0 ? 'lg:border-r border-[#e8e8e3]' : ''} ${
                  (i + 1) % 2 !== 0 ? 'sm:border-r border-[#e8e8e3]' : ''
                }`}
              >
                <span className="text-[#C8A75E] text-sm font-bold tracking-widest">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3
                  className="text-base font-bold text-[#0c0f14] tracking-tight mt-3"
                  style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
                >
                  {s.title}
                </h3>
                <p className="text-sm text-[#6b6f76] leading-relaxed mt-2">
                  {s.desc}
                </p>
                <div className="mt-4 border-l-2 border-[#C8A75E] pl-3">
                  <p className="text-xs text-[#C8A75E] font-semibold uppercase tracking-wider mb-1">Why it matters</p>
                  <p className="text-xs text-[#6b6f76] leading-relaxed">{s.why}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 4. GAPS / WEAKNESSES */}
      {/* ================================================================= */}
      <section className="bg-white border-t border-[#e8e8e3]">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-0.5 bg-[#C8A75E]" />
            <span className="text-xs font-bold text-[#8b919a] uppercase tracking-[0.2em]">Honest Assessment</span>
          </div>

          <h2
            className="text-3xl lg:text-4xl font-bold text-[#0c0f14] tracking-tight mb-16 max-w-lg"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            What doesn&apos;t
            <br />
            stand out.
          </h2>

          {/* Desktop table */}
          <div className="hidden sm:block border border-[#e8e8e3]">
            <div className="grid grid-cols-[1fr_120px_1fr] border-b border-[#e8e8e3] bg-[#fafaf8]">
              <div className="p-4 text-xs font-bold text-[#8b919a] uppercase tracking-wider">Gap</div>
              <div className="p-4 text-xs font-bold text-[#8b919a] uppercase tracking-wider text-center border-x border-[#e8e8e3]">Impact</div>
              <div className="p-4 text-xs font-bold text-[#8b919a] uppercase tracking-wider">Mitigation</div>
            </div>
            {WEAKNESSES.map((w, i) => (
              <div
                key={w.gap}
                className={`grid grid-cols-[1fr_120px_1fr] ${i < WEAKNESSES.length - 1 ? 'border-b border-[#e8e8e3]' : ''}`}
              >
                <div className="p-4 text-sm text-[#0c0f14] font-semibold">{w.gap}</div>
                <div className="p-4 text-center border-x border-[#e8e8e3] flex items-center justify-center">
                  <span className={`inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 ${
                    w.impact === 'High' ? 'bg-[#0c0f14] text-white' :
                    w.impact === 'Medium' ? 'bg-[#e8e8e3] text-[#3a3f49]' :
                    'bg-[#f5f5f3] text-[#8b919a]'
                  }`}>
                    {w.impact}
                  </span>
                </div>
                <div className="p-4 text-sm text-[#6b6f76] leading-relaxed">{w.mitigation}</div>
              </div>
            ))}
          </div>

          {/* Mobile stacked cards */}
          <div className="sm:hidden space-y-4">
            {WEAKNESSES.map((w) => (
              <div key={w.gap} className="border border-[#e8e8e3] p-5 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-[#0c0f14]">{w.gap}</h3>
                  <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 ${
                    w.impact === 'High' ? 'bg-[#0c0f14] text-white' :
                    w.impact === 'Medium' ? 'bg-[#e8e8e3] text-[#3a3f49]' :
                    'bg-[#f5f5f3] text-[#8b919a]'
                  }`}>
                    {w.impact}
                  </span>
                </div>
                <p className="text-sm text-[#6b6f76] leading-relaxed">{w.mitigation}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 5. NICHE TARGET MARKETS */}
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
          <div className="flex items-center gap-3 mb-12">
            <span className="text-xs font-bold text-[#5c6370] uppercase tracking-[0.2em]">Target Markets</span>
            <div className="flex-1 h-px bg-[#1e2129]" />
          </div>

          <div className="space-y-0 border border-[#1e2129]">
            {TARGET_MARKETS.map((market, i) => (
              <div
                key={market.segment}
                className={`p-8 lg:p-10 ${i < TARGET_MARKETS.length - 1 ? 'border-b border-[#1e2129]' : ''} ${
                  market.priority === 'PRIMARY' ? 'border-l-2 border-l-[#C8A75E]' : ''
                }`}
              >
                <div className="grid lg:grid-cols-[80px_1fr] gap-6">
                  {/* Rank number */}
                  <div>
                    <span
                      className="text-4xl font-bold text-[#C8A75E] tracking-tight"
                      style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
                    >
                      {String(market.rank).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Content */}
                  <div>
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3
                        className="text-lg font-bold text-white tracking-tight"
                        style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
                      >
                        {market.segment}
                      </h3>
                      <span className={`text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 ${
                        market.priority === 'PRIMARY' ? 'bg-[#C8A75E] text-[#0c0f14]' :
                        market.priority === 'SECONDARY' ? 'border border-[#C8A75E] text-[#C8A75E]' :
                        'border border-[#3a3f49] text-[#5c6370]'
                      }`}>
                        {market.priority}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mt-4">
                      <div>
                        <p className="text-xs text-[#5c6370] font-bold uppercase tracking-wider mb-2">Market Size</p>
                        <p className="text-sm text-[#8b919a]">{market.size}</p>

                        <p className="text-xs text-[#5c6370] font-bold uppercase tracking-wider mb-2 mt-4">Avg Deal Size</p>
                        <p className="text-sm text-[#8b919a]">{market.avgDealSize}</p>

                        <p className="text-xs text-[#5c6370] font-bold uppercase tracking-wider mb-2 mt-4">Pain Points</p>
                        <ul className="space-y-1">
                          {market.painPoints.map((p) => (
                            <li key={p} className="flex gap-2 text-sm text-[#8b919a]">
                              <span className="text-[#C8A75E] shrink-0">—</span>
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="text-xs text-[#5c6370] font-bold uppercase tracking-wider mb-2">Acquisition Strategy</p>
                        <p className="text-sm text-[#8b919a] leading-relaxed">{market.acquisitionStrategy}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 6. REGULATORY TAILWINDS */}
      {/* ================================================================= */}
      <section className="bg-[#fafaf8]">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-0.5 bg-[#C8A75E]" />
            <span className="text-xs font-bold text-[#8b919a] uppercase tracking-[0.2em]">Regulatory Tailwinds</span>
          </div>

          <h2
            className="text-3xl lg:text-4xl font-bold text-[#0c0f14] tracking-tight mb-16 max-w-lg"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            The market is moving
            <br />
            in our direction.
          </h2>

          {/* Timeline */}
          <div className="relative pl-8 border-l-2 border-[#C8A75E]">
            {REGULATORY_EVENTS.map((evt, i) => (
              <div key={evt.date} className={`relative ${i < REGULATORY_EVENTS.length - 1 ? 'pb-12' : ''}`}>
                {/* Gold dot */}
                <div className="absolute -left-[calc(2rem+5px)] w-2.5 h-2.5 bg-[#C8A75E] top-1" />

                <div className="grid sm:grid-cols-[140px_1fr] gap-4">
                  <p className="text-sm font-bold text-[#C8A75E] tracking-wide">{evt.date}</p>
                  <div>
                    <h3
                      className="text-base font-bold text-[#0c0f14] tracking-tight"
                      style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
                    >
                      {evt.event}
                    </h3>
                    <p className="text-sm text-[#6b6f76] leading-relaxed mt-2">{evt.impact}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 7. ACQUISITION POSITIONING */}
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
          <div className="flex items-center gap-3 mb-12">
            <span className="text-xs font-bold text-[#5c6370] uppercase tracking-[0.2em]">Acquisition Positioning</span>
            <div className="flex-1 h-px bg-[#1e2129]" />
          </div>

          {/* 7A: Valuation multiples strip */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-[#1e2129]">
            {ACQUISITION_DATA.multiples.map((m, i) => (
              <div
                key={m.label}
                className={`p-8 ${i < ACQUISITION_DATA.multiples.length - 1 ? 'border-b sm:border-b lg:border-b-0 border-[#1e2129]' : ''} ${
                  (i + 1) % 4 !== 0 ? 'lg:border-r border-[#1e2129]' : ''
                } ${(i + 1) % 2 !== 0 ? 'sm:border-r border-[#1e2129]' : ''}`}
              >
                <p className="text-xs text-[#5c6370] font-bold uppercase tracking-wider">{m.label}</p>
                <p
                  className="text-3xl font-bold text-[#C8A75E] tracking-tight mt-2"
                  style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
                >
                  {m.value}
                </p>
                <p className="text-sm text-[#8b919a] mt-1">{m.note}</p>
              </div>
            ))}
          </div>

          {/* 7B: Strategic acquirers */}
          <div className="mt-16">
            <h3
              className="text-xl font-bold text-white tracking-tight mb-6"
              style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
            >
              Strategic Acquirers
            </h3>
            <div className="border border-[#1e2129]">
              <div className="grid grid-cols-[1fr_2fr_100px] border-b border-[#1e2129] bg-[#0c0f14]">
                <div className="p-4 text-xs font-bold text-[#5c6370] uppercase tracking-wider">Acquirer</div>
                <div className="p-4 text-xs font-bold text-[#5c6370] uppercase tracking-wider border-x border-[#1e2129]">Rationale</div>
                <div className="p-4 text-xs font-bold text-[#5c6370] uppercase tracking-wider text-center">Likelihood</div>
              </div>
              {ACQUISITION_DATA.acquirers.map((a, i) => (
                <div
                  key={a.name}
                  className={`grid grid-cols-[1fr_2fr_100px] ${i < ACQUISITION_DATA.acquirers.length - 1 ? 'border-b border-[#1e2129]' : ''}`}
                >
                  <div className="p-4 text-sm text-white font-semibold">{a.name}</div>
                  <div className="p-4 text-sm text-[#8b919a] leading-relaxed border-x border-[#1e2129]">{a.rationale}</div>
                  <div className="p-4 text-center flex items-center justify-center">
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      a.likelihood === 'High' ? 'text-[#C8A75E]' : 'text-[#5c6370]'
                    }`}>
                      {a.likelihood}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 7C: Attractiveness factors */}
          <div className="mt-16">
            <h3
              className="text-xl font-bold text-white tracking-tight mb-6"
              style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
            >
              What Makes Us Attractive
            </h3>
            <div className="grid md:grid-cols-2 gap-0 border border-[#1e2129]">
              {ACQUISITION_DATA.attractiveness.map((a, i) => (
                <div
                  key={a.factor}
                  className={`p-6 ${
                    i < ACQUISITION_DATA.attractiveness.length - 1 ? 'border-b border-[#1e2129]' : ''
                  } ${(i + 1) % 2 !== 0 ? 'md:border-r border-[#1e2129]' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-[#C8A75E] font-bold shrink-0 mt-0.5">—</span>
                    <div>
                      <p className="text-sm text-white font-semibold">{a.factor}</p>
                      <p className="text-sm text-[#8b919a] leading-relaxed mt-1">{a.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 8. GO-TO-MARKET STRATEGY */}
      {/* ================================================================= */}
      <section className="bg-white border-t border-[#e8e8e3]">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-0.5 bg-[#C8A75E]" />
            <span className="text-xs font-bold text-[#8b919a] uppercase tracking-[0.2em]">Go-to-Market</span>
          </div>

          <h2
            className="text-3xl lg:text-4xl font-bold text-[#0c0f14] tracking-tight mb-16 max-w-lg"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            How we get there.
          </h2>

          {/* Desktop table */}
          <div className="hidden sm:block border border-[#e8e8e3]">
            <div className="grid grid-cols-[1.5fr_80px_80px_100px_2fr] border-b border-[#e8e8e3] bg-[#fafaf8]">
              <div className="p-4 text-xs font-bold text-[#8b919a] uppercase tracking-wider">Channel</div>
              <div className="p-4 text-xs font-bold text-[#8b919a] uppercase tracking-wider text-center border-x border-[#e8e8e3]">Priority</div>
              <div className="p-4 text-xs font-bold text-[#8b919a] uppercase tracking-wider text-center border-r border-[#e8e8e3]">Cost</div>
              <div className="p-4 text-xs font-bold text-[#8b919a] uppercase tracking-wider text-center border-r border-[#e8e8e3]">Timeline</div>
              <div className="p-4 text-xs font-bold text-[#8b919a] uppercase tracking-wider">Notes</div>
            </div>
            {GTM_CHANNELS.map((ch, i) => (
              <div
                key={ch.channel}
                className={`grid grid-cols-[1.5fr_80px_80px_100px_2fr] ${i < GTM_CHANNELS.length - 1 ? 'border-b border-[#e8e8e3]' : ''}`}
              >
                <div className="p-4 text-sm text-[#0c0f14] font-semibold">{ch.channel}</div>
                <div className="p-4 text-center border-x border-[#e8e8e3] flex items-center justify-center">
                  <span className={`text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 ${
                    ch.priority === 'P0' ? 'bg-[#C8A75E] text-[#0c0f14]' :
                    ch.priority === 'P1' ? 'border border-[#C8A75E] text-[#C8A75E]' :
                    'bg-[#e8e8e3] text-[#6b6f76]'
                  }`}>
                    {ch.priority}
                  </span>
                </div>
                <div className="p-4 text-sm text-[#6b6f76] text-center border-r border-[#e8e8e3]">{ch.cost}</div>
                <div className="p-4 text-sm text-[#6b6f76] text-center border-r border-[#e8e8e3]">{ch.timeline}</div>
                <div className="p-4 text-sm text-[#6b6f76] leading-relaxed">{ch.notes}</div>
              </div>
            ))}
          </div>

          {/* Mobile stacked cards */}
          <div className="sm:hidden space-y-4">
            {GTM_CHANNELS.map((ch) => (
              <div key={ch.channel} className="border border-[#e8e8e3] p-5 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-[#0c0f14]">{ch.channel}</h3>
                  <span className={`text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 ${
                    ch.priority === 'P0' ? 'bg-[#C8A75E] text-[#0c0f14]' :
                    ch.priority === 'P1' ? 'border border-[#C8A75E] text-[#C8A75E]' :
                    'bg-[#e8e8e3] text-[#6b6f76]'
                  }`}>
                    {ch.priority}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-[#8b919a] mb-3">
                  <span>Cost: {ch.cost}</span>
                  <span>{ch.timeline}</span>
                </div>
                <p className="text-sm text-[#6b6f76] leading-relaxed">{ch.notes}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 9. FOOTER */}
      {/* ================================================================= */}
      <footer className="border-t border-[#e8e8e3] bg-[#fafaf8]">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-[0.75rem] text-[#b5b5ae]">
              &copy; {new Date().getFullYear()} ConsentHaul &middot; Operated by Workbird LLC
            </p>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="text-[0.75rem] text-[#8b919a] hover:text-[#0c0f14] transition-colors">Terms</Link>
              <span className="text-[#e8e8e3]">&middot;</span>
              <Link href="/privacy" className="text-[0.75rem] text-[#8b919a] hover:text-[#0c0f14] transition-colors">Privacy</Link>
              <span className="text-[#e8e8e3]">&middot;</span>
              <Link href="/" className="text-[0.75rem] text-[#8b919a] hover:text-[#0c0f14] transition-colors">Home</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
