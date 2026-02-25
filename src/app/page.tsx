import Link from 'next/link';
import type { Metadata } from 'next';
import { LogoFull } from '@/components/brand/Logo';
import { PhoneSigningDemo } from '@/components/landing/PhoneSigningDemo';
import { LandingNav } from '@/components/landing/LandingNav';
import { ComingSoonBanner } from '@/components/landing/ComingSoonBanner';

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'FMCSA Consent Form Online — Digital Clearinghouse Limited Query Consent | ConsentHaul',
  description:
    'Collect FMCSA Clearinghouse limited query consent forms from CDL drivers online. Send a digital DOT consent form via SMS or email — drivers sign electronically in 60 seconds. Compliant FMCSA consent PDFs generated and retained for 3 years per 49 CFR Part 40.',
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const STEPS = [
  {
    num: '01',
    title: 'Add your driver',
    desc: 'Enter their name, CDL number, and phone or email. Or bulk-import your roster from a CSV.',
  },
  {
    num: '02',
    title: 'Send the consent link',
    desc: 'Pick SMS, WhatsApp, or email. One tap sends a secure FMCSA consent form link directly to the driver\'s phone. One credit per consent.',
  },
  {
    num: '03',
    title: 'Driver signs, PDF filed',
    desc: 'Driver taps the link, reviews, signs with their finger. Compliant FMCSA consent PDF generated instantly — stored for 3 years per 49 CFR Part 40.',
  },
];

const CREDIT_PACKS = [
  { credits: 10, price: '$30', per: '$3.00' },
  { credits: 50, price: '$125', per: '$2.50', popular: true },
  { credits: 200, price: '$400', per: '$2.00' },
  { credits: 1000, price: '$1,500', per: '$1.50' },
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
    a: 'ConsentHaul uses a pay-per-consent model — no monthly fees, no subscriptions. Credit packs start at $3.00 per consent (10-pack) and go as low as $1.50 per consent (1,000-pack). Credits never expire. Every new account gets 3 free credits.',
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
    a: 'Yes. ConsentHaul offers a REST API and an MCP (Model Context Protocol) server for AI agents. Integrate consent creation directly into your TMS, dispatch system, or onboarding workflow — or let AI agents like Claude manage drivers, send consents, and check billing through natural language. API keys are managed from your dashboard settings.',
  },
  {
    q: 'What is an FMCSA Clearinghouse limited query consent?',
    a: 'An FMCSA Clearinghouse limited query consent is a written or electronic authorization from a CDL driver allowing a motor carrier to check whether the driver has any drug or alcohol violations in the FMCSA Drug & Alcohol Clearinghouse. Carriers must obtain this consent before running a limited query, which is required for pre-employment screening and at least annually for current employees under 49 CFR Part 382.',
  },
  {
    q: 'How do I get FMCSA Clearinghouse consent from my drivers?',
    a: 'With ConsentHaul, you enter the driver\'s name, CDL number, and phone number or email, then send a digital FMCSA consent form with one click. The driver receives a secure link, opens it on their phone, reviews the consent document, and signs electronically. The signed FMCSA consent PDF is generated and stored automatically — no paper, printing, or scanning required.',
  },
  {
    q: 'Is an electronic FMCSA consent signature legally valid?',
    a: 'Yes. Electronic signatures on FMCSA consent forms are legally valid under the ESIGN Act and UETA. ConsentHaul captures signature image data, timestamps, IP addresses, and device information to establish authenticity and meet regulatory requirements.',
  },
  {
    q: 'What is the difference between a limited query and a full query?',
    a: 'A limited query tells a motor carrier whether a CDL driver has any drug or alcohol violations in the FMCSA Clearinghouse without revealing details — it requires the driver\'s written or electronic consent. A full query reveals the actual violation details and requires the driver to grant electronic consent directly in the Clearinghouse portal. ConsentHaul handles consent collection for limited queries, the most common type used for pre-employment and annual checks.',
  },
  {
    q: 'Can ConsentHaul be used for DOT pre-employment drug testing consent?',
    a: 'Yes. ConsentHaul is commonly used by motor carriers to collect FMCSA Clearinghouse limited query consent as part of the DOT pre-employment screening process. Before hiring a new CDL driver, carriers are required to run a Clearinghouse query — ConsentHaul makes it easy to collect the required driver consent digitally.',
  },
  {
    q: 'Do trucking companies need consent for every Clearinghouse query?',
    a: 'Yes. Motor carriers must obtain a driver\'s written or electronic consent before each limited query to the FMCSA Drug & Alcohol Clearinghouse. Consent cannot be blanket or indefinite — it must be collected for each specific query. ConsentHaul simplifies this by letting carriers send and collect individual FMCSA consent forms digitally in seconds.',
  },
];

const FEATURES = [
  {
    title: 'Reach Drivers However They Prefer',
    desc: 'SMS, WhatsApp, or email — send FMCSA consent links however your drivers actually respond. Bilingual EN/ES out of the box.',
  },
  {
    title: 'Compliance on Autopilot',
    desc: 'Every signed consent PDF is stored for 3 years per 49 CFR Part 40. No filing cabinets, no scanning, no manual tracking.',
  },
  {
    title: 'Built for the Truck Stop',
    desc: 'Mobile-first signing designed for CDL drivers on the road. Loads fast on bad signal. Dead simple. No app to download.',
  },
  {
    title: 'Import Your Whole Fleet',
    desc: 'CSV upload your driver roster. Send consent requests to hundreds of drivers in minutes, not days.',
  },
  {
    title: 'Plug Into Your TMS',
    desc: 'REST API and MCP (Model Context Protocol) server let your TMS or AI agents create drivers, send consents, check billing, and pull signed PDFs — no manual work.',
  },
  {
    title: 'Know Where Every Consent Stands',
    desc: 'Real-time status tracking from sent → viewed → signed. Dashboard shows exactly which drivers still need to sign.',
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LandingPage() {
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
      {/* HERO */}
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
                  Built for Motor Carriers
                </span>
              </div>

              <h1
                className="text-[clamp(2.25rem,4vw,3.75rem)] font-bold text-[#0c0f14] leading-[1.05] tracking-tight"
                style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
              >
                Stop Chasing Drivers
                <br />
                for Paper. Get FMCSA Consent{' '}
                <span className="relative inline-block">
                  <span className="relative z-10">in 60 Seconds.</span>
                  <span className="absolute bottom-1 left-0 right-0 h-3 bg-[#C8A75E]/30 -z-0" />
                </span>
              </h1>

              <p className="mt-6 text-[#6b6f76] text-lg leading-relaxed max-w-xl">
                Text your driver a link. They sign on their phone in 60 seconds.
                You get a compliant FMCSA consent PDF — filed and retained automatically.
                No app downloads. No paper. No chasing.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <span
                  className="bg-[#0c0f14]/50 text-white/70 font-bold text-sm uppercase tracking-wider px-8 py-4 inline-flex items-center gap-2 cursor-not-allowed"
                >
                  COMING SOON
                  <svg width="16" height="16" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
                <Link
                  href="/demo"
                  className="bg-[#C8A75E] text-[#0c0f14] font-bold text-sm uppercase tracking-wider px-8 py-4 inline-flex items-center gap-2 transition-all hover:bg-[#d4b56a] active:bg-[#b89648]"
                >
                  View Demo
                  <svg width="16" height="16" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <span className="text-sm text-[#8b919a]">3 free credits on signup</span>
              </div>

              {/* Stats strip */}
              <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 border border-[#e8e8e3]">
                {[
                  { value: '$1.50', label: 'per consent — as low as' },
                  { value: '60s', label: 'driver signs on phone' },
                  { value: '3yr', label: 'automatic DOT retention' },
                  { value: 'EN/ES', label: 'English + Spanish' },
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

            {/* Right column — animated phone demo */}
            <div className="flex justify-center lg:justify-end scale-[0.85] origin-center lg:origin-right">
              <PhoneSigningDemo />
            </div>
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
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold text-[#5c6370] uppercase tracking-[0.2em]">How it works</span>
            <div className="flex-1 h-px bg-[#1e2129]" />
          </div>
          <p className="text-lg text-[#8b919a] mb-12">Up and running in 2 minutes</p>

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
          FMCSA Consent Features
          <br />
          for Trucking Carriers
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
              Pay Only for What You Use.
              <br />
              No Monthly Fees. Credits Never Expire.
            </h2>
            <p className="text-sm text-[#6b6f76] max-w-xs">
              Buy consent credits in bulk. Use them whenever a driver needs to sign. No subscriptions, no per-seat fees, no expiration. Start with 3 free credits.
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
            <span
              className="inline-flex items-center gap-2 bg-[#0c0f14]/50 text-white/70 font-bold text-sm uppercase tracking-wider px-10 py-4 cursor-not-allowed"
            >
              COMING SOON
              <svg width="16" height="16" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
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
            FMCSA Clearinghouse Consent FAQ
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
              Your Drivers&apos; Phones Are
              <br />
              Already in Their Pockets. Use Them.
              <br />
              <span className="text-[#C8A75E]">Start Collecting Consent in 2 Minutes.</span>
            </h2>
            <p className="mt-6 text-[#8b919a] text-base leading-relaxed max-w-lg mx-auto">
              No more printing, mailing, scanning, or chasing. Text a link. Driver signs. PDF filed. That&apos;s it.
            </p>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <span
                className="inline-flex items-center gap-2 bg-[#C8A75E]/50 text-[#0c0f14]/50 font-bold text-sm uppercase tracking-wider px-10 py-4 cursor-not-allowed"
              >
                COMING SOON
                <svg width="16" height="16" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
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
                <li><Link href="/tms" className="text-sm text-[#8b919a] hover:text-[#C8A75E] transition-colors">TMS Partners</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="text-[0.65rem] font-bold text-[#5c6370] uppercase tracking-[0.15em] mb-4">Company</p>
              <ul className="space-y-2.5">
                <li><span className="text-sm text-[#8b919a]">Workbird LLC</span></li>
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
