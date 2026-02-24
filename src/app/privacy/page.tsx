import Link from 'next/link';
import { LogoFull } from '@/components/brand/Logo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | ConsentHaul',
  description: 'ConsentHaul Privacy Policy — how we collect, use, store, and protect your personal information on our FMCSA consent platform.',
};

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-[#8b919a]">
            Last updated: February 23, 2026 &middot; Operated by Flotac Ltd
          </p>
        </div>

        <div className="prose-legal space-y-8 text-[0.9rem] leading-[1.8] text-[#3a3f49]">
          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>1. Introduction</h2>
            <p>
              Flotac Ltd (&quot;Company,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the ConsentHaul platform (&quot;Service&quot;). This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our Service. This policy applies to all users, including motor carriers, designated employer representatives (DERs), commercial driver&apos;s license (CDL) holders, and website visitors.
            </p>
            <p className="mt-3">
              By using ConsentHaul, you consent to the data practices described in this policy. If you do not agree, please discontinue use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>2. Information We Collect</h2>

            <h3 className="text-sm font-bold text-[#0c0f14] uppercase tracking-wider mt-6 mb-2">2.1 Account Information (Carriers/Employers)</h3>
            <ul className="list-none space-y-2 pl-0">
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> Full name, email address, phone number</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> Company name, DOT number, MC number</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> Business address and contact information</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> Payment information (processed securely via Stripe; we do not store credit card numbers)</li>
            </ul>

            <h3 className="text-sm font-bold text-[#0c0f14] uppercase tracking-wider mt-6 mb-2">2.2 Driver Information</h3>
            <ul className="list-none space-y-2 pl-0">
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> Full legal name, email address, phone number</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> CDL number and issuing state</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> Date of birth</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> Employer/carrier affiliation</li>
            </ul>

            <h3 className="text-sm font-bold text-[#0c0f14] uppercase tracking-wider mt-6 mb-2">2.3 Signature and Consent Data</h3>
            <ul className="list-none space-y-2 pl-0">
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> Electronic signature image and stroke data</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> Date and time of signature (UTC timestamp)</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> IP address at time of signing</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> Device type, browser, and operating system</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> Geolocation data (when voluntarily provided by the device)</li>
            </ul>

            <h3 className="text-sm font-bold text-[#0c0f14] uppercase tracking-wider mt-6 mb-2">2.4 Automatically Collected Data</h3>
            <ul className="list-none space-y-2 pl-0">
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> Log data (pages visited, access times, referral URLs)</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> Cookies and similar tracking technologies for authentication and analytics</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> Device identifiers and browser fingerprinting data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>3. How We Use Your Information</h2>
            <ul className="list-none space-y-2 pl-0">
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> <strong>Service delivery:</strong> To process consent forms, authenticate users, and manage accounts</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> <strong>Compliance:</strong> To maintain records required by FMCSA regulations (49 CFR Part 40)</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> <strong>Communication:</strong> To send consent form notifications, account updates, and service announcements</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> <strong>Payment processing:</strong> To process credit purchases and manage billing</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> <strong>Security:</strong> To detect fraud, prevent abuse, and ensure platform integrity</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> <strong>Improvement:</strong> To analyze usage patterns and improve the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>4. Legal Basis for Processing</h2>
            <p>We process personal data based on the following legal grounds:</p>
            <ul className="list-none space-y-2 pl-0 mt-3">
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> <strong>Contractual necessity:</strong> Processing required to provide the Service under our Terms of Service</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> <strong>Legal obligation:</strong> Processing required to comply with FMCSA record retention rules</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> <strong>Consent:</strong> Where you have explicitly consented (e.g., optional location data)</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> <strong>Legitimate interest:</strong> Fraud prevention, security monitoring, and Service improvement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>5. Data Sharing and Disclosure</h2>
            <p>We do not sell your personal information. We may share data with:</p>
            <ul className="list-none space-y-2 pl-0 mt-3">
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> <strong>Your employer/carrier:</strong> Signed consent forms and associated metadata are shared with the carrier who requested them</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> <strong>Service providers:</strong> Supabase (database/auth), Stripe (payments), Resend (email delivery), Twilio (SMS/WhatsApp), and cloud hosting providers — all bound by data processing agreements</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> <strong>Law enforcement:</strong> When required by law, subpoena, court order, or regulatory inquiry</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> <strong>Business transfers:</strong> In the event of a merger, acquisition, or sale of assets, user data may be transferred to the successor entity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>6. Data Retention</h2>
            <p>
              Signed consent documents and associated metadata are retained for a minimum of <strong>three (3) years</strong> from the date of signing, in compliance with FMCSA requirements under 49 CFR &sect; 382.401. Account information is retained for as long as your account remains active and for a reasonable period thereafter to comply with legal obligations.
            </p>
            <p className="mt-3">
              You may request deletion of your account data by contacting us. Certain data may be retained longer where required by law or for legitimate business purposes (e.g., dispute resolution, fraud prevention).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>7. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data, including:
            </p>
            <ul className="list-none space-y-2 pl-0 mt-3">
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> Encryption at rest (AES-256) and in transit (TLS 1.2+)</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> Row-level security (RLS) ensuring multi-tenant data isolation</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> Regular security audits and access logging</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> SOC 2-compliant infrastructure providers</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> Secure authentication with PKCE flow and HTTP-only cookies</li>
            </ul>
            <p className="mt-3">
              No system is 100% secure. While we strive to protect your data, we cannot guarantee absolute security and are not responsible for unauthorized access resulting from events beyond our reasonable control.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>8. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the following rights:</p>
            <ul className="list-none space-y-2 pl-0 mt-3">
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> <strong>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> <strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> <strong>Deletion:</strong> Request deletion of your data, subject to legal retention requirements</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> <strong>Portability:</strong> Request your data in a machine-readable format</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> <strong>Objection:</strong> Object to processing based on legitimate interests</li>
              <li className="flex gap-3"><span className="text-[#C8A75E] font-bold shrink-0">—</span> <strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at privacy@consenthaul.com. We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>9. California Privacy Rights (CCPA)</h2>
            <p>
              If you are a California resident, the California Consumer Privacy Act (CCPA) grants you additional rights, including the right to know what personal information we collect, the right to delete it, and the right to opt out of the sale of personal information. <strong>We do not sell personal information.</strong>
            </p>
            <p className="mt-3">
              To make a CCPA request, contact us at privacy@consenthaul.com or use the contact information in Section 14 below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>10. Cookies</h2>
            <p>
              We use cookies and similar technologies for authentication, session management, and analytics. Essential cookies are required for the Service to function (e.g., authentication tokens). Analytics cookies help us understand how users interact with the platform. You can manage cookie preferences through your browser settings, but disabling essential cookies will prevent you from using the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>11. Third-Party Links</h2>
            <p>
              The Service may contain links to third-party websites or services not operated by us. We are not responsible for the privacy practices of these external sites. We encourage you to review the privacy policies of any third-party sites you visit.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>12. Children&apos;s Privacy</h2>
            <p>
              The Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from minors. If we become aware that we have collected data from a person under 18, we will take steps to delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>13. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Material changes will be communicated via email or by posting a notice on the platform. The &quot;Last updated&quot; date at the top of this page reflects the most recent revision. Your continued use of the Service after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-3" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>14. Contact Us</h2>
            <p>
              For questions, concerns, or requests related to this Privacy Policy:
            </p>
            <div className="mt-3 border-l-2 border-[#C8A75E] pl-4 text-sm text-[#6b6f76]">
              <p className="font-semibold text-[#0c0f14]">Flotac Ltd</p>
              <p>Privacy inquiries: privacy@consenthaul.com</p>
              <p>General inquiries: legal@consenthaul.com</p>
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
              <Link href="/terms" className="text-[0.75rem] text-[#8b919a] hover:text-[#0c0f14] transition-colors">Terms of Service</Link>
              <span className="text-[#e8e8e3]">&middot;</span>
              <Link href="/" className="text-[0.75rem] text-[#8b919a] hover:text-[#0c0f14] transition-colors">Home</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
