import Link from 'next/link';
import { LogoFull } from '@/components/brand/Logo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | ConsentHaul',
  description: 'ConsentHaul Terms of Service — governing the use of our FMCSA Clearinghouse electronic consent platform.',
};

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-[#8b919a]">
            Last updated: February 23, 2026 &middot; Operated by Flotac Ltd
          </p>
        </div>

        <div className="prose-legal space-y-8 text-[0.9rem] leading-[1.8] text-[#3a3f49]">
          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>1. Acceptance of Terms</h2>
            <p>
              By accessing or using the ConsentHaul platform (&quot;Service&quot;), operated by Flotac Ltd (&quot;Company,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree, do not use the Service. These Terms apply to all users, including carriers, employers, designated employer representatives (DERs), and any other individuals who access or use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>2. Description of Service</h2>
            <p>
              ConsentHaul is a digital platform that facilitates the collection and management of electronic consent signatures required for FMCSA Drug &amp; Alcohol Clearinghouse queries under 49 CFR Part 40. The Service enables motor carriers and their authorized representatives to send, collect, store, and manage consent forms from commercial driver&apos;s license (CDL) holders electronically.
            </p>
            <p className="mt-3">
              ConsentHaul is <strong>not affiliated with, endorsed by, or sponsored by the Federal Motor Carrier Safety Administration (FMCSA)</strong> or the U.S. Department of Transportation. We are an independent third-party platform that assists carriers in complying with Clearinghouse consent requirements.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>3. Account Registration and Eligibility</h2>
            <p>
              To use the Service, you must create an account and provide accurate, current, and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must be at least 18 years of age and have the legal authority to bind your organization to these Terms.
            </p>
            <p className="mt-3">
              You agree to immediately notify ConsentHaul of any unauthorized use of your account or any other breach of security. We reserve the right to suspend or terminate accounts that violate these Terms or that we reasonably believe are being used fraudulently.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>4. Credit-Based Pricing</h2>
            <p>
              The Service operates on a prepaid credit system. Each consent form sent to a driver consumes one (1) credit. Credits are purchased in packs at the prices listed on the platform at the time of purchase. Credits are non-refundable once purchased, except as required by applicable law. Credits do not expire.
            </p>
            <p className="mt-3">
              New accounts receive three (3) complimentary credits upon registration. We reserve the right to modify pricing, credit pack sizes, and promotional offers at any time. Changes to pricing will not affect credits already purchased.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>5. Electronic Signatures and Legal Compliance</h2>
            <p>
              Electronic signatures collected through ConsentHaul are intended to comply with the Electronic Signatures in Global and National Commerce Act (ESIGN Act, 15 U.S.C. &sect; 7001 et seq.) and the Uniform Electronic Transactions Act (UETA). The Service captures signature data, timestamp, IP address, device information, and geolocation (when available) to establish the authenticity and integrity of each signed consent.
            </p>
            <p className="mt-3">
              <strong>It is the sole responsibility of the employer/carrier</strong> to ensure that consent forms are used in compliance with all applicable federal and state regulations, including but not limited to 49 CFR Part 40, 49 CFR Part 382, and FMCSA Clearinghouse requirements. ConsentHaul does not provide legal advice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>6. Data Retention and Storage</h2>
            <p>
              Signed consent documents and associated metadata are retained for a minimum of three (3) years from the date of signing, in accordance with FMCSA record retention requirements (49 CFR &sect; 382.401). After the retention period, records may be securely deleted unless a longer retention period is required by law or requested by the account holder.
            </p>
            <p className="mt-3">
              All data is stored using industry-standard encryption at rest and in transit. We utilize secure cloud infrastructure with SOC 2-compliant hosting providers. For details on how we handle personal information, see our <Link href="/privacy" className="text-[#0c0f14] font-semibold underline underline-offset-2 hover:text-[#C8A75E] transition-colors">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>7. User Responsibilities</h2>
            <div className="mt-3 space-y-2">
              <p>As a user of ConsentHaul, you agree to:</p>
              <ul className="list-none space-y-2 pl-0">
                <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> Use the Service only for lawful purposes related to FMCSA Clearinghouse consent collection</li>
                <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> Provide accurate information about your organization, DOT number, and driver data</li>
                <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> Obtain consent forms only from drivers who are subject to your organization&apos;s authority</li>
                <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> Not misrepresent your identity or authority to act on behalf of an organization</li>
                <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> Not attempt to reverse-engineer, decompile, or disassemble any portion of the Service</li>
                <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> Not use automated systems to access the Service without prior written authorization</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>8. Intellectual Property</h2>
            <p>
              The Service, including its design, code, logos, trademarks, and content, is the property of Flotac Ltd and is protected by applicable intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to use the Service in accordance with these Terms. &quot;FMCSA Clearinghouse&quot; is a registered trademark of the U.S. Department of Transportation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>9. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR COMPLETELY SECURE.
            </p>
            <p className="mt-3">
              ConsentHaul does not guarantee that use of the Service will satisfy all regulatory requirements applicable to your organization. You are solely responsible for determining whether electronic consent collection is appropriate for your specific regulatory circumstances.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>10. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, FLOTAC LTD AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUE, WHETHER INCURRED DIRECTLY OR INDIRECTLY, ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>11. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Flotac Ltd and its affiliates from and against any claims, damages, losses, liabilities, and expenses (including reasonable attorneys&apos; fees) arising out of or relating to your use of the Service, your violation of these Terms, or your violation of any applicable law or regulation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>12. Termination</h2>
            <p>
              We may suspend or terminate your access to the Service at any time, with or without cause, and with or without notice. Upon termination, your right to use the Service will immediately cease. Provisions of these Terms that by their nature should survive termination shall survive, including but not limited to intellectual property, disclaimer, indemnification, and limitation of liability.
            </p>
            <p className="mt-3">
              You may terminate your account at any time by contacting us. Unused credits are non-refundable upon account termination unless required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>13. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. Material changes will be communicated via email to the address associated with your account or by posting a notice on the platform. Your continued use of the Service after changes take effect constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>14. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Flotac Ltd is incorporated, without regard to conflict of law principles. Any disputes arising under these Terms shall be resolved through binding arbitration, unless prohibited by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>15. Contact</h2>
            <p>
              For questions about these Terms, contact us at:
            </p>
            <div className="mt-3 border-l-2 border-[#C8A75E] pl-4 text-sm text-[#6b6f76]">
              <p className="font-semibold text-[#0c0f14]">Flotac Ltd</p>
              <p>Email: legal@consenthaul.com</p>
              <p>Web: consenthaul.com</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-[#e8e8e3]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-[0.75rem] text-[#b5b5ae]">
              &copy; {new Date().getFullYear()} ConsentHaul &middot; Operated by Flotac Ltd
            </p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="text-[0.75rem] text-[#8b919a] hover:text-[#0c0f14] transition-colors">Privacy Policy</Link>
              <span className="text-[#e8e8e3]">&middot;</span>
              <Link href="/" className="text-[0.75rem] text-[#8b919a] hover:text-[#0c0f14] transition-colors">Home</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
