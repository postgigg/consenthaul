import Link from 'next/link';
import { LogoFull } from '@/components/brand/Logo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Investor Overview — Financial Projections & Market Analysis',
  description:
    'ConsentHaul financial projections, unit economics, target market sizing, and go-to-market strategy for the FMCSA digital consent platform.',
  robots: { index: false, follow: false },
};

/* ─── Tiny helpers ─── */
const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2
    className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3"
    style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
  >
    {children}
  </h2>
);
const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-sm font-bold text-[#0c0f14] uppercase tracking-wider mt-6 mb-2">
    {children}
  </h3>
);
const Dash = () => (
  <span className="text-[#C8A75E] font-bold shrink-0">&mdash;</span>
);

const TH = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <th className={`text-left text-[0.7rem] font-bold uppercase tracking-wider text-[#8b919a] py-2 px-3 ${className}`}>
    {children}
  </th>
);
const TD = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <td className={`py-2.5 px-3 ${className}`}>{children}</td>
);

/* ─── Stat card ─── */
function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="border border-[#e8e8e3] rounded-lg p-6">
      <p className="text-2xl font-bold text-[#0c0f14] tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-[#8b919a]">{label}</p>
    </div>
  );
}

/* ─── Responsive table wrapper ─── */
function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto -mx-6 px-6">
      <table className="w-full text-sm text-[#3a3f49]">{children}</table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function InvestorsPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Nav */}
      <nav className="border-b border-[#e8e8e3] bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <LogoFull className="h-6 w-auto" />
          </Link>
          <Link
            href="/login"
            className="text-xs font-semibold text-[#6b6f76] hover:text-[#0c0f14] transition-colors uppercase tracking-wider"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <div className="w-10 h-0.5 bg-[#C8A75E] mb-6" />
          <h1
            className="text-3xl font-bold text-[#0c0f14] tracking-tight"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            Investor Overview
          </h1>
          <p className="mt-3 text-sm text-[#8b919a]">
            Financial Projections &amp; Market Analysis &middot; Confidential
          </p>
        </div>

        <div className="prose-legal space-y-12 text-[0.9rem] leading-[1.8] text-[#3a3f49]">

          {/* ────────────────────── 1. Unit Economics ────────────────────── */}
          <section>
            <H2>1. Unit Economics</H2>
            <p>
              ConsentHaul operates on a prepaid credit model with near-zero variable cost per consent.
              Every consent event is a digital workflow (SMS/email &rarr; e-sign &rarr; PDF) with infrastructure
              costs well under one cent.
            </p>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <StatCard value="$0.008" label="Cost per consent" />
              <StatCard value="$1.50–$3.00" label="Revenue per consent" />
              <StatCard value="96–99%" label="Gross margin" />
              <StatCard value="20/mo" label="Breakeven consents" />
            </div>

            <H3>Credit Pack Pricing</H3>
            <TableWrap>
              <thead>
                <tr className="border-b border-[#e8e8e3]">
                  <TH>Pack</TH>
                  <TH>Credits</TH>
                  <TH>Price</TH>
                  <TH>Per Unit</TH>
                  <TH>Savings</TH>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0ec]">
                <tr className="hover:bg-[#f5f5f2]"><TD>Starter</TD><TD>10</TD><TD>$30</TD><TD>$3.00</TD><TD>&mdash;</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD>Fleet</TD><TD>50</TD><TD>$100</TD><TD>$2.00</TD><TD>33%</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD>Carrier</TD><TD>150</TD><TD>$225</TD><TD>$1.50</TD><TD>50%</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD>Enterprise</TD><TD>500</TD><TD>$625</TD><TD>$1.25</TD><TD>58%</TD></tr>
              </tbody>
            </TableWrap>

            <H3>Infrastructure Cost Breakdown</H3>
            <TableWrap>
              <thead>
                <tr className="border-b border-[#e8e8e3]">
                  <TH>Service</TH>
                  <TH>Cost</TH>
                  <TH>Notes</TH>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0ec]">
                <tr className="hover:bg-[#f5f5f2]"><TD>Supabase (DB + Auth)</TD><TD>$25/mo</TD><TD>Pro plan, RLS, auth</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD>File storage</TD><TD>$0.021/GB</TD><TD>Supabase Storage / S3</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD>SMS (Twilio)</TD><TD>$0.0079/msg</TD><TD>US outbound</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD>Email (Resend)</TD><TD>$0.00/msg</TD><TD>Free tier up to 3K/mo</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD>WhatsApp (Twilio)</TD><TD>$0.005/msg</TD><TD>Template messages</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD>PDF generation</TD><TD>~$0.001</TD><TD>Server-side render</TD></tr>
              </tbody>
            </TableWrap>

            <H3>Revenue vs. Cost by Tier</H3>
            <TableWrap>
              <thead>
                <tr className="border-b border-[#e8e8e3]">
                  <TH>Pack</TH>
                  <TH>Revenue / Unit</TH>
                  <TH>COGS / Unit</TH>
                  <TH>Margin</TH>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0ec]">
                <tr className="hover:bg-[#f5f5f2]"><TD>Starter</TD><TD>$3.00</TD><TD>$0.008</TD><TD className="font-semibold text-[#0c0f14]">99.7%</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD>Fleet</TD><TD>$2.00</TD><TD>$0.008</TD><TD className="font-semibold text-[#0c0f14]">99.6%</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD>Carrier</TD><TD>$1.50</TD><TD>$0.008</TD><TD className="font-semibold text-[#0c0f14]">99.5%</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD>Enterprise</TD><TD>$1.25</TD><TD>$0.008</TD><TD className="font-semibold text-[#0c0f14]">99.4%</TD></tr>
              </tbody>
            </TableWrap>
          </section>

          {/* ────────────────────── 2. Market Sizing ────────────────────── */}
          <section>
            <H2>2. Market Sizing (TAM / SAM / SOM)</H2>
            <p>
              FMCSA&apos;s Drug &amp; Alcohol Clearinghouse requires every motor carrier to have valid written or
              electronic consent on file before running a limited query on a CDL holder. Under 49 CFR 382.701(b),
              consent can cover the full duration of employment. The addressable market
              is defined by active carrier count and annual query volume.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              <StatCard value="787K" label="Active USDOT carriers" />
              <StatCard value="267K" label="Target segment (2–50 trucks)" />
              <StatCard value="5–12M" label="Consent events per year" />
            </div>

            <H3>Fleet Size Distribution</H3>
            <TableWrap>
              <thead>
                <tr className="border-b border-[#e8e8e3]">
                  <TH>Fleet Size</TH>
                  <TH>% of Carriers</TH>
                  <TH>Est. Count</TH>
                  <TH>Fit</TH>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0ec]">
                <tr className="hover:bg-[#f5f5f2]"><TD>1 truck</TD><TD>52%</TD><TD>~409K</TD><TD className="text-[#8b919a]">Low — owner-operators</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD className="font-semibold text-[#0c0f14]">2–10 trucks</TD><TD>26%</TD><TD>~205K</TD><TD className="text-[#C8A75E] font-semibold">Primary ICP</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD className="font-semibold text-[#0c0f14]">11–50 trucks</TD><TD>8%</TD><TD>~63K</TD><TD className="text-[#C8A75E] font-semibold">Primary ICP</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD>51–100 trucks</TD><TD>3%</TD><TD>~24K</TD><TD className="text-[#8b919a]">Secondary</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD>100+ trucks</TD><TD>2%</TD><TD>~16K</TD><TD className="text-[#8b919a]">Enterprise / custom</TD></tr>
              </tbody>
            </TableWrap>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="border border-[#e8e8e3] rounded-lg p-5 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-[#8b919a] mb-1">TAM</p>
                <p className="text-xl font-bold text-[#0c0f14]">$2.8B</p>
                <p className="text-xs text-[#8b919a] mt-1">All carrier compliance spend</p>
              </div>
              <div className="border border-[#e8e8e3] rounded-lg p-5 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-[#8b919a] mb-1">SAM</p>
                <p className="text-xl font-bold text-[#0c0f14]">$96M</p>
                <p className="text-xs text-[#8b919a] mt-1">267K carriers &times; $30/mo</p>
              </div>
              <div className="border border-[#e8e8e3] rounded-lg p-5 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-[#8b919a] mb-1">SOM</p>
                <p className="text-xl font-bold text-[#0c0f14]">$2.4M</p>
                <p className="text-xs text-[#8b919a] mt-1">3% penetration, Year 3</p>
              </div>
            </div>
          </section>

          {/* ────────────────────── 3. Five-Year Projections ────────────────────── */}
          <section>
            <H2>3. Five-Year Financial Projections</H2>
            <p>
              Three scenario models based on penetration rate into the 267K-carrier target segment,
              with ARPU driven by credit pack mix and average fleet size.
            </p>

            {/* Conservative */}
            <H3>Conservative — 1% Penetration, $15/mo ARPU</H3>
            <TableWrap>
              <thead>
                <tr className="border-b border-[#e8e8e3]">
                  <TH>Year</TH>
                  <TH>Customers</TH>
                  <TH>MRR</TH>
                  <TH>ARR</TH>
                  <TH>Cumulative Rev.</TH>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0ec]">
                <tr className="hover:bg-[#f5f5f2]"><TD>1</TD><TD>400</TD><TD>$6K</TD><TD>$72K</TD><TD>$72K</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD>2</TD><TD>1,200</TD><TD>$18K</TD><TD>$216K</TD><TD>$288K</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD>3</TD><TD>2,670</TD><TD>$40K</TD><TD>$480K</TD><TD>$768K</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD>4</TD><TD>3,500</TD><TD>$53K</TD><TD>$630K</TD><TD>$1.4M</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD>5</TD><TD>4,500</TD><TD>$68K</TD><TD>$810K</TD><TD>$2.2M</TD></tr>
              </tbody>
            </TableWrap>

            {/* Moderate */}
            <H3>Moderate — 3% Penetration, $25/mo ARPU</H3>
            <TableWrap>
              <thead>
                <tr className="border-b border-[#e8e8e3]">
                  <TH>Year</TH>
                  <TH>Customers</TH>
                  <TH>MRR</TH>
                  <TH>ARR</TH>
                  <TH>Cumulative Rev.</TH>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0ec]">
                <tr className="hover:bg-[#f5f5f2]"><TD>1</TD><TD>800</TD><TD>$20K</TD><TD>$240K</TD><TD>$240K</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD>2</TD><TD>3,200</TD><TD>$80K</TD><TD>$960K</TD><TD>$1.2M</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD>3</TD><TD>8,000</TD><TD>$200K</TD><TD>$2.4M</TD><TD>$3.6M</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD>4</TD><TD>12,000</TD><TD>$300K</TD><TD>$3.6M</TD><TD>$7.2M</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD>5</TD><TD>16,000</TD><TD>$400K</TD><TD>$4.8M</TD><TD>$12M</TD></tr>
              </tbody>
            </TableWrap>

            {/* Aggressive */}
            <H3>Aggressive — 5% Penetration, $35/mo ARPU</H3>
            <TableWrap>
              <thead>
                <tr className="border-b border-[#e8e8e3]">
                  <TH>Year</TH>
                  <TH>Customers</TH>
                  <TH>MRR</TH>
                  <TH>ARR</TH>
                  <TH>Cumulative Rev.</TH>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0ec]">
                <tr className="hover:bg-[#f5f5f2]"><TD>1</TD><TD>1,500</TD><TD>$53K</TD><TD>$630K</TD><TD>$630K</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD>2</TD><TD>5,500</TD><TD>$193K</TD><TD>$2.3M</TD><TD>$2.9M</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD>3</TD><TD>13,350</TD><TD>$467K</TD><TD>$5.6M</TD><TD>$8.5M</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD>4</TD><TD>18,000</TD><TD>$630K</TD><TD>$7.6M</TD><TD>$16.1M</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD>5</TD><TD>22,000</TD><TD>$770K</TD><TD>$9.2M</TD><TD>$25.3M</TD></tr>
              </tbody>
            </TableWrap>

            <div className="mt-6 border-l-2 border-[#C8A75E] pl-4 text-sm text-[#6b6f76]">
              <p className="font-semibold text-[#0c0f14] mb-1">Key Assumptions</p>
              <ul className="list-none space-y-1 pl-0">
                <li className="flex gap-3"><Dash /> Target market: 267K carriers with 2–50 trucks</li>
                <li className="flex gap-3"><Dash /> ARPU based on credit pack mix (weighted avg)</li>
                <li className="flex gap-3"><Dash /> Churn: 3–5% monthly in Year 1, declining to 2% by Year 3</li>
                <li className="flex gap-3"><Dash /> No enterprise / API revenue included</li>
                <li className="flex gap-3"><Dash /> No price increases modeled</li>
              </ul>
            </div>
          </section>

          {/* ────────────────────── 4. Ideal Customer Profile ────────────────────── */}
          <section>
            <H2>4. Ideal Customer Profile</H2>

            <div className="border border-[#C8A75E] rounded-lg p-6 mt-4 bg-[#fdfcf9]">
              <p className="text-xs font-bold uppercase tracking-wider text-[#C8A75E] mb-2">Primary ICP</p>
              <p className="text-lg font-bold text-[#0c0f14]">Motor Carriers with 2–50 Trucks</p>
              <p className="text-sm text-[#6b6f76] mt-1">267,000 companies &middot; Most underserved by existing tools</p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#8b919a] mb-1">Decision Makers</p>
                  <ul className="list-none space-y-1 pl-0 text-sm">
                    <li className="flex gap-3"><Dash /> Owner-operator (fleet owner)</li>
                    <li className="flex gap-3"><Dash /> Safety Director / Manager</li>
                    <li className="flex gap-3"><Dash /> Compliance Officer</li>
                    <li className="flex gap-3"><Dash /> HR / Office Manager</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#8b919a] mb-1">Pain Points</p>
                  <ul className="list-none space-y-1 pl-0 text-sm">
                    <li className="flex gap-3"><Dash /> Paper consent forms lost or incomplete</li>
                    <li className="flex gap-3"><Dash /> No audit trail for DOT inspections</li>
                    <li className="flex gap-3"><Dash /> $5,833/violation FMCSA penalty risk</li>
                    <li className="flex gap-3"><Dash /> Drivers in the field, hard to get signatures</li>
                  </ul>
                </div>
              </div>
            </div>

            <H3>Secondary Segments</H3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="border border-[#e8e8e3] rounded-lg p-5">
                <p className="font-semibold text-[#0c0f14]">C/TPAs (Consortium / Third-Party Administrators)</p>
                <p className="text-sm text-[#6b6f76] mt-1">~10,000 companies managing compliance for multiple carriers. High volume, bulk pricing.</p>
              </div>
              <div className="border border-[#e8e8e3] rounded-lg p-5">
                <p className="font-semibold text-[#0c0f14]">Staffing &amp; Temp Agencies</p>
                <p className="text-sm text-[#6b6f76] mt-1">CDL staffing agencies running pre-employment queries on temporary drivers.</p>
              </div>
            </div>

            <H3>Why NOT These Segments</H3>
            <ul className="list-none space-y-2 pl-0 mt-2">
              <li className="flex gap-3"><Dash /> <strong>Owner-operators (1 truck):</strong> Low willingness to pay; often handle Clearinghouse directly. Not worth CAC.</li>
              <li className="flex gap-3"><Dash /> <strong>100+ truck fleets:</strong> Already use enterprise TMS/compliance suites (Lytx, Samsara, J.J. Keller). Long sales cycle, heavy feature demands.</li>
            </ul>
          </section>

          {/* ────────────────────── 5. Competitive Landscape ────────────────────── */}
          <section>
            <H2>5. Competitive Landscape</H2>
            <p>
              No direct competitor offers a standalone, self-serve digital consent platform purpose-built
              for FMCSA Clearinghouse queries at the small-fleet price point.
            </p>

            <TableWrap>
              <thead>
                <tr className="border-b border-[#e8e8e3]">
                  <TH>Competitor</TH>
                  <TH>What They Do</TH>
                  <TH>Pricing</TH>
                  <TH>Gap We Exploit</TH>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0ec]">
                <tr className="hover:bg-[#f5f5f2]">
                  <TD className="font-semibold text-[#0c0f14]">Foley</TD>
                  <TD>Full compliance suite + background checks</TD>
                  <TD>$100+/mo + per-query</TD>
                  <TD>Overkill for small carriers; consent is a minor feature</TD>
                </tr>
                <tr className="hover:bg-[#f5f5f2]">
                  <TD className="font-semibold text-[#0c0f14]">J.J. Keller</TD>
                  <TD>Compliance management platform</TD>
                  <TD>$200+/mo</TD>
                  <TD>Enterprise pricing, long contracts, not self-serve</TD>
                </tr>
                <tr className="hover:bg-[#f5f5f2]">
                  <TD className="font-semibold text-[#0c0f14]">Tenstreet</TD>
                  <TD>Driver application &amp; onboarding</TD>
                  <TD>$150+/mo</TD>
                  <TD>Bundled with recruiting; consent is bolt-on</TD>
                </tr>
                <tr className="hover:bg-[#f5f5f2]">
                  <TD className="font-semibold text-[#0c0f14]">ClearinghouseTPA</TD>
                  <TD>C/TPA consortium management</TD>
                  <TD>$5–$25/query</TD>
                  <TD>Per-query pricing; no self-serve consent workflow</TD>
                </tr>
                <tr className="hover:bg-[#f5f5f2]">
                  <TD className="font-semibold text-[#0c0f14]">Generic e-sign (DocuSign etc.)</TD>
                  <TD>General electronic signatures</TD>
                  <TD>$10–$40/mo</TD>
                  <TD>Not FMCSA-specific; no audit trail, no DOT metadata</TD>
                </tr>
              </tbody>
            </TableWrap>

            <div className="border border-red-200 rounded-lg p-5 mt-6 bg-red-50/30">
              <p className="text-xs font-bold uppercase tracking-wider text-red-400 mb-1">Penalty Risk</p>
              <p className="text-2xl font-bold text-[#0c0f14]">$5,833</p>
              <p className="text-sm text-[#6b6f76] mt-1">
                Per violation FMCSA civil penalty for operating a CMV driver without a valid
                Clearinghouse query or consent. A single audit finding on a 10-truck fleet
                could result in $58,330 in fines.
              </p>
            </div>
          </section>

          {/* ────────────────────── 6. OSINT Prospect Acquisition ────────────────────── */}
          <section>
            <H2>6. OSINT Prospect Acquisition</H2>
            <p>
              The trucking industry is uniquely transparent — FMCSA publishes granular carrier data
              that enables hyper-targeted prospecting at zero cost. Supplemented with paid enrichment
              and LinkedIn outreach, this creates a repeatable acquisition engine.
            </p>

            <H3>Free Data Sources</H3>
            <TableWrap>
              <thead>
                <tr className="border-b border-[#e8e8e3]">
                  <TH>Source</TH>
                  <TH>Data Available</TH>
                  <TH>Format</TH>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0ec]">
                <tr className="hover:bg-[#f5f5f2]">
                  <TD className="font-semibold text-[#0c0f14]">FMCSA Census File</TD>
                  <TD>All active carriers: DOT#, fleet size, address, operation type</TD>
                  <TD>CSV download (monthly)</TD>
                </tr>
                <tr className="hover:bg-[#f5f5f2]">
                  <TD className="font-semibold text-[#0c0f14]">SAFER Web</TD>
                  <TD>Company snapshot, safety rating, inspection history</TD>
                  <TD>Web lookup by DOT#</TD>
                </tr>
                <tr className="hover:bg-[#f5f5f2]">
                  <TD className="font-semibold text-[#0c0f14]">QCMobile API</TD>
                  <TD>Real-time carrier data, inspections, crashes</TD>
                  <TD>REST API (free key)</TD>
                </tr>
              </tbody>
            </TableWrap>

            <H3>Paid Enrichment Sources</H3>
            <TableWrap>
              <thead>
                <tr className="border-b border-[#e8e8e3]">
                  <TH>Source</TH>
                  <TH>What It Adds</TH>
                  <TH>Cost</TH>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0ec]">
                <tr className="hover:bg-[#f5f5f2]">
                  <TD className="font-semibold text-[#0c0f14]">Carrier Details</TD>
                  <TD>Email, phone, owner name, insurance info</TD>
                  <TD>$0.01–$0.05/record</TD>
                </tr>
                <tr className="hover:bg-[#f5f5f2]">
                  <TD className="font-semibold text-[#0c0f14]">CarrierOK</TD>
                  <TD>Contact info, authority status, fleet details</TD>
                  <TD>$99–$299/mo</TD>
                </tr>
                <tr className="hover:bg-[#f5f5f2]">
                  <TD className="font-semibold text-[#0c0f14]">US Trucking Companies DB</TD>
                  <TD>Comprehensive carrier database with contacts</TD>
                  <TD>$500–$2,000 one-time</TD>
                </tr>
              </tbody>
            </TableWrap>

            <H3>LinkedIn Strategy</H3>
            <ul className="list-none space-y-2 pl-0 mt-2">
              <li className="flex gap-3"><Dash /> <strong>Target titles:</strong> Safety Director, Compliance Manager, Fleet Manager, Owner/President</li>
              <li className="flex gap-3"><Dash /> <strong>Boolean search:</strong> &quot;safety director&quot; OR &quot;compliance manager&quot; AND &quot;trucking&quot; OR &quot;transportation&quot; OR &quot;freight&quot;</li>
              <li className="flex gap-3"><Dash /> <strong>Sales Navigator:</strong> Filter by company size (2–50), industry (Truck Transportation), title seniority</li>
              <li className="flex gap-3"><Dash /> <strong>Connection cadence:</strong> 20–25 requests/day with personalized note referencing DOT# or fleet size</li>
            </ul>

            <H3>Conference Targets</H3>
            <TableWrap>
              <thead>
                <tr className="border-b border-[#e8e8e3]">
                  <TH>Event</TH>
                  <TH>Date</TH>
                  <TH>Audience</TH>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0ec]">
                <tr className="hover:bg-[#f5f5f2]"><TD className="font-semibold text-[#0c0f14]">Mid-America Trucking Show (MATS)</TD><TD>Mar 26–28</TD><TD>80K+ attendees, owner-ops &amp; small fleets</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD className="font-semibold text-[#0c0f14]">ATA Safety, Security &amp; Human Resources</TD><TD>Apr 1–3</TD><TD>Safety directors &amp; compliance officers</TD></tr>
                <tr className="hover:bg-[#f5f5f2]"><TD className="font-semibold text-[#0c0f14]">TCA Truckload Carriers Convention</TD><TD>Annual</TD><TD>Truckload carrier executives</TD></tr>
              </tbody>
            </TableWrap>

            <H3>Association Partnerships</H3>
            <ul className="list-none space-y-2 pl-0 mt-2">
              <li className="flex gap-3"><Dash /> <strong>OOIDA</strong> (150K members) — Owner-Operator Independent Drivers Association; vendor partnership / newsletter sponsorship</li>
              <li className="flex gap-3"><Dash /> <strong>NASTC</strong> — National Association of Small Trucking Companies; endorsed vendor program</li>
              <li className="flex gap-3"><Dash /> <strong>State trucking associations</strong> — 50 state-level orgs with annual conferences and member directories</li>
            </ul>

            <H3>Prospect List Build (Step by Step)</H3>
            <div className="mt-2 space-y-2">
              <div className="flex gap-3 items-start">
                <span className="shrink-0 w-6 h-6 rounded-full bg-[#0c0f14] text-white text-xs font-bold flex items-center justify-center">1</span>
                <p><strong>Download</strong> FMCSA Census File — filter to CARRIER_OPERATION = &quot;A&quot; (active), TOTAL_POWER_UNITS between 2 and 50</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="shrink-0 w-6 h-6 rounded-full bg-[#0c0f14] text-white text-xs font-bold flex items-center justify-center">2</span>
                <p><strong>Enrich</strong> with Carrier Details or CarrierOK to add email + phone + owner name</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="shrink-0 w-6 h-6 rounded-full bg-[#0c0f14] text-white text-xs font-bold flex items-center justify-center">3</span>
                <p><strong>Segment</strong> by fleet size (2–10, 11–25, 26–50), geography, and operation type (general freight, hazmat, etc.)</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="shrink-0 w-6 h-6 rounded-full bg-[#0c0f14] text-white text-xs font-bold flex items-center justify-center">4</span>
                <p><strong>Outreach</strong> via cold email sequence (3-touch), LinkedIn connect + DM, and retargeting ads</p>
              </div>
            </div>
          </section>

          {/* ────────────────────── 7. Go-to-Market Channels ────────────────────── */}
          <section>
            <H2>7. Go-to-Market Channels</H2>
            <p>
              Multi-channel approach weighted toward low-CAC, high-intent channels first,
              scaling into paid acquisition as unit economics prove out.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="border border-[#e8e8e3] rounded-lg p-5">
                <p className="font-semibold text-[#0c0f14]">Cold Email</p>
                <p className="text-sm text-[#6b6f76] mt-1">FMCSA data &rarr; enriched list &rarr; 3-touch sequence. Penalty-angle subject lines.</p>
                <p className="text-xs font-semibold text-[#C8A75E] mt-2">Est. CAC: $15–$30</p>
              </div>
              <div className="border border-[#e8e8e3] rounded-lg p-5">
                <p className="font-semibold text-[#0c0f14]">Google Ads</p>
                <p className="text-sm text-[#6b6f76] mt-1">High-intent keywords: &quot;FMCSA consent form,&quot; &quot;Clearinghouse limited query,&quot; &quot;DOT drug test consent.&quot;</p>
                <p className="text-xs font-semibold text-[#C8A75E] mt-2">Est. CAC: $40–$80</p>
              </div>
              <div className="border border-[#e8e8e3] rounded-lg p-5">
                <p className="font-semibold text-[#0c0f14]">Conferences &amp; Trade Shows</p>
                <p className="text-sm text-[#6b6f76] mt-1">MATS, ATA Safety, TCA — booth or hallway prospecting with live demo on tablet.</p>
                <p className="text-xs font-semibold text-[#C8A75E] mt-2">Est. CAC: $50–$100</p>
              </div>
              <div className="border border-[#e8e8e3] rounded-lg p-5">
                <p className="font-semibold text-[#0c0f14]">Association Partnerships</p>
                <p className="text-sm text-[#6b6f76] mt-1">OOIDA, NASTC, state associations — endorsed vendor, newsletter sponsor, member discount.</p>
                <p className="text-xs font-semibold text-[#C8A75E] mt-2">Est. CAC: $20–$40</p>
              </div>
              <div className="border border-[#e8e8e3] rounded-lg p-5 sm:col-span-2">
                <p className="font-semibold text-[#0c0f14]">Content Marketing &amp; SEO</p>
                <p className="text-sm text-[#6b6f76] mt-1">
                  Blog content targeting &quot;how to run a Clearinghouse query,&quot; &quot;FMCSA consent form template,&quot;
                  and compliance guides. Organic traffic converts at 2–4% to free trial.
                </p>
                <p className="text-xs font-semibold text-[#C8A75E] mt-2">Est. CAC: $5–$15 (long-term)</p>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-[#e8e8e3]">
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
      </div>
    </div>
  );
}
