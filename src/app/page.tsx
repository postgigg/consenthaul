import Link from 'next/link';
import { LogoFull } from '@/components/brand/Logo';
import { DashboardPreview } from '@/components/landing/DashboardPreview';
import { LandingNav } from '@/components/landing/LandingNav';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const STEPS = [
  {
    num: '01',
    title: 'Create consent',
    desc: 'Enter driver info, pick consent type, hit send. One credit per consent.',
  },
  {
    num: '02',
    title: 'Driver signs on phone',
    desc: 'Driver gets an SMS or WhatsApp link. Opens it, reads, signs. 60 seconds.',
  },
  {
    num: '03',
    title: 'PDF filed automatically',
    desc: 'Signed consent PDF is generated, stored, and retained for 3 years. Done.',
  },
];

const CREDIT_PACKS = [
  { credits: 10, price: '$15', per: '$1.50' },
  { credits: 50, price: '$50', per: '$1.00', popular: true },
  { credits: 200, price: '$150', per: '$0.75' },
  { credits: 1000, price: '$500', per: '$0.50' },
];

const FAQS = [
  {
    q: 'What is ConsentHaul?',
    a: 'ConsentHaul is a digital platform for collecting FMCSA Clearinghouse limited query consent from CDL drivers. Instead of mailing paper forms, you send a link via SMS, WhatsApp, or email. The driver signs on their phone. You get a compliant signed PDF back automatically.',
  },
  {
    q: 'Is ConsentHaul FMCSA compliant?',
    a: 'Yes. ConsentHaul generates consent forms that comply with 49 CFR Part 40 and FMCSA Clearinghouse regulations. Electronic signatures are valid under the ESIGN Act and UETA. All signed documents are automatically retained for the FMCSA-required minimum of 3 years.',
  },
  {
    q: 'How much does it cost?',
    a: 'ConsentHaul uses a pay-per-consent model — no monthly fees, no subscriptions. Credit packs start at $1.50 per consent (10-pack) and go as low as $0.50 per consent (1,000-pack). Credits never expire. Every new account gets 3 free credits.',
  },
  {
    q: 'How does the driver signing process work?',
    a: 'Drivers receive a secure link on their phone via SMS, WhatsApp, or email. They tap the link, review the consent document (available in English and Spanish), check the acknowledgment box, draw their signature with their finger, and submit. Average time: 60 seconds. No app download required.',
  },
  {
    q: 'Do you support Spanish-speaking drivers?',
    a: 'Yes. ConsentHaul is fully bilingual. Drivers can toggle between English and Spanish on the signing page. Consent documents, notifications, and signed PDFs are all available in both languages.',
  },
  {
    q: 'Can I import my existing driver list?',
    a: 'Yes. You can bulk-import drivers via CSV upload. Just upload a spreadsheet with driver names, CDL numbers, phone numbers, and emails — ConsentHaul handles the rest.',
  },
  {
    q: 'How long are signed consents stored?',
    a: 'All signed consent PDFs are automatically retained for 3 years from the date of signing, meeting the FMCSA minimum retention requirement. You can download signed PDFs at any time from your dashboard.',
  },
  {
    q: 'Do you have an API?',
    a: 'Yes. ConsentHaul offers a REST API so you can integrate consent creation directly into your TMS, dispatch system, or onboarding workflow. API keys are managed from your dashboard settings.',
  },
];

const FEATURES = [
  {
    title: 'SMS + WhatsApp + Email',
    desc: 'Send consent links however your drivers prefer. Bilingual EN/ES out of the box.',
  },
  {
    title: '3-year auto-retention',
    desc: 'Signed PDFs are stored and retained for the FMCSA-required 3 years. No filing cabinets.',
  },
  {
    title: 'Mobile-first signing',
    desc: 'Built for truck drivers at rest stops with bad signal. Fast, clear, dead simple.',
  },
  {
    title: 'Bulk driver import',
    desc: 'CSV upload your entire fleet. Create consent requests for hundreds of drivers in minutes.',
  },
  {
    title: 'API access',
    desc: 'Integrate consent creation into your TMS or dispatch system with our REST API.',
  },
  {
    title: 'Real-time status',
    desc: 'Watch consents move from sent to viewed to signed. Know exactly where every driver stands.',
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* ================================================================= */}
      {/* NAV */}
      {/* ================================================================= */}
      <LandingNav />

      {/* ================================================================= */}
      {/* HERO */}
      {/* ================================================================= */}
      <section className="relative overflow-hidden">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(12,15,20,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(12,15,20,.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-20 lg:pt-32 lg:pb-28">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-0.5 bg-[#C8A75E]" />
              <span className="text-xs font-bold text-[#8b919a] uppercase tracking-[0.2em]">
                FMCSA Clearinghouse Compliance
              </span>
            </div>

            <h1
              className="text-[clamp(2.5rem,5vw,4.5rem)] font-bold text-[#0c0f14] leading-[1.05] tracking-tight"
              style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
            >
              Stop chasing drivers
              <br />
              for{' '}
              <span className="relative inline-block">
                <span className="relative z-10">consent forms</span>
                <span className="absolute bottom-1 left-0 right-0 h-3 bg-[#C8A75E]/30 -z-0" />
              </span>
            </h1>

            <p className="mt-6 text-[#6b6f76] text-lg leading-relaxed max-w-xl">
              Send a link. Driver signs on their phone. You get a compliant PDF back.
              FMCSA Clearinghouse limited query consent — without the paperwork.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="bg-[#0c0f14] text-white font-bold text-sm uppercase tracking-wider px-8 py-4 hover:bg-[#1a1e27] active:bg-[#000] transition-colors inline-flex items-center gap-2"
              >
                START FREE
                <svg width="16" height="16" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <span className="text-sm text-[#8b919a]">3 free credits on signup</span>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 border border-[#e8e8e3]">
            {[
              { value: '$0.50', label: 'per consent' },
              { value: '60s', label: 'avg sign time' },
              { value: '3yr', label: 'auto-retention' },
              { value: 'EN/ES', label: 'bilingual' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`p-6 ${i < 3 ? 'border-r border-[#e8e8e3]' : ''} ${i < 2 ? 'border-b sm:border-b-0 border-[#e8e8e3]' : ''} bg-white`}
              >
                <p
                  className="text-2xl font-bold text-[#0c0f14] tracking-tight"
                  style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
                >
                  {stat.value}
                </p>
                <p className="text-xs text-[#8b919a] uppercase tracking-wider mt-1 font-semibold">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Dashboard preview */}
          <div className="mt-16 lg:mt-20 max-w-[960px] mx-auto px-2 sm:px-0">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* HOW IT WORKS */}
      {/* ================================================================= */}
      <section id="how-it-works" className="bg-[#0c0f14] relative overflow-hidden">
        {/* Subtle grid */}
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
            <span className="text-xs font-bold text-[#5c6370] uppercase tracking-[0.2em]">How it works</span>
            <div className="flex-1 h-px bg-[#1e2129]" />
          </div>

          <div className="grid md:grid-cols-3 gap-0 border border-[#1e2129]">
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className={`p-8 lg:p-10 ${i < STEPS.length - 1 ? 'border-b md:border-b-0 md:border-r border-[#1e2129]' : ''}`}
              >
                <span className="text-[#C8A75E] text-sm font-bold tracking-widest">{step.num}</span>
                <h3
                  className="text-xl font-bold text-white tracking-tight mt-4"
                  style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
                >
                  {step.title}
                </h3>
                <p className="text-[#8b919a] text-sm leading-relaxed mt-3">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* FEATURES */}
      {/* ================================================================= */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-0.5 bg-[#C8A75E]" />
          <span className="text-xs font-bold text-[#8b919a] uppercase tracking-[0.2em]">Features</span>
        </div>

        <h2
          className="text-3xl lg:text-4xl font-bold text-[#0c0f14] tracking-tight mb-16 max-w-lg"
          style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
        >
          Everything you need.
          <br />
          Nothing you don&apos;t.
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
      {/* PRICING */}
      {/* ================================================================= */}
      <section id="pricing" className="bg-white border-t border-[#e8e8e3]">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-0.5 bg-[#C8A75E]" />
            <span className="text-xs font-bold text-[#8b919a] uppercase tracking-[0.2em]">Pricing</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <h2
              className="text-3xl lg:text-4xl font-bold text-[#0c0f14] tracking-tight"
              style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
            >
              Pay per consent.
              <br />
              No subscriptions.
            </h2>
            <p className="text-sm text-[#6b6f76] max-w-xs">
              Buy credit packs. Use them whenever. Credits never expire.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-[#d4d4cf]">
            {CREDIT_PACKS.map((pack, i) => (
              <div
                key={pack.credits}
                className={`relative p-6 lg:p-8 ${
                  i < CREDIT_PACKS.length - 1 ? 'border-b sm:border-b lg:border-b-0 sm:border-r lg:border-r border-[#d4d4cf]' : ''
                } ${
                  pack.popular ? 'bg-[#0c0f14] text-white' : 'bg-white'
                }`}
              >
                {pack.popular && (
                  <div className="absolute top-0 right-0 bg-[#C8A75E] text-[#0c0f14] text-[0.6rem] font-bold uppercase tracking-widest px-3 py-1">
                    Popular
                  </div>
                )}
                <p className={`text-[2.5rem] font-bold tracking-tight leading-none ${
                  pack.popular ? 'text-white' : 'text-[#0c0f14]'
                }`}>
                  {pack.credits.toLocaleString()}
                </p>
                <p className={`text-sm mt-1 ${pack.popular ? 'text-[#8b919a]' : 'text-[#6b6f76]'}`}>
                  credits
                </p>
                <div className="mt-6 pt-4 border-t border-dashed border-[#d4d4cf]/30">
                  <p className={`text-xl font-bold ${pack.popular ? 'text-white' : 'text-[#0c0f14]'}`}>
                    {pack.price}
                  </p>
                  <p className={`text-sm mt-0.5 ${pack.popular ? 'text-[#8b919a]' : 'text-[#6b6f76]'}`}>
                    {pack.per} per consent
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[#0c0f14] text-white font-bold text-sm uppercase tracking-wider px-10 py-4 hover:bg-[#1a1e27] transition-colors"
            >
              GET 3 FREE CREDITS
              <svg width="16" height="16" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* FAQ */}
      {/* ================================================================= */}
      <section id="faq" className="border-t border-[#e8e8e3]">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-0.5 bg-[#C8A75E]" />
            <span className="text-xs font-bold text-[#8b919a] uppercase tracking-[0.2em]">FAQ</span>
          </div>

          <h2
            className="text-3xl lg:text-4xl font-bold text-[#0c0f14] tracking-tight mb-16"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            Common questions
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
      {/* CTA */}
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
              Your drivers are already
              <br />
              on their phones.
              <br />
              <span className="text-[#C8A75E]">Meet them there.</span>
            </h2>
            <p className="mt-6 text-[#8b919a] text-base leading-relaxed max-w-lg mx-auto">
              No more printing, mailing, scanning, or chasing drivers for paper consent forms.
              Set up your account in 2 minutes and send your first consent today.
            </p>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-[#C8A75E] text-[#0c0f14] font-bold text-sm uppercase tracking-wider px-10 py-4 hover:bg-[#d4b33e] active:bg-[#c0a038] transition-colors"
              >
                START FREE — 3 CREDITS INCLUDED
                <svg width="16" height="16" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Trust signals */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {[
                'No credit card required',
                'Setup in 2 minutes',
                'Credits never expire',
                'Cancel anytime',
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
                Digital FMCSA Clearinghouse consent management for trucking carriers and fleet operators.
              </p>
            </div>

            {/* Product */}
            <div>
              <p className="text-[0.65rem] font-bold text-[#5c6370] uppercase tracking-[0.15em] mb-4">Product</p>
              <ul className="space-y-2.5">
                <li><Link href="/signup" className="text-sm text-[#8b919a] hover:text-[#C8A75E] transition-colors">Get Started</Link></li>
                <li><Link href="/login" className="text-sm text-[#8b919a] hover:text-[#C8A75E] transition-colors">Sign In</Link></li>
                <li><span className="text-sm text-[#3a3f49]">API Documentation</span></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="text-[0.65rem] font-bold text-[#5c6370] uppercase tracking-[0.15em] mb-4">Company</p>
              <ul className="space-y-2.5">
                <li><span className="text-sm text-[#8b919a]">Flotac Ltd</span></li>
                <li><Link href="mailto:support@consenthaul.com" className="text-sm text-[#8b919a] hover:text-[#C8A75E] transition-colors">support@consenthaul.com</Link></li>
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
                &copy; {new Date().getFullYear()} ConsentHaul &middot; Operated by Flotac Ltd
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
