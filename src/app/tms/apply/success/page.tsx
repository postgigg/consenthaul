import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingNav } from '@/components/landing/LandingNav';

export const metadata: Metadata = {
  title: 'Application Submitted | ConsentHaul TMS Partner',
  description: 'Your TMS partner application has been received. Our team will begin onboarding within 24 hours.',
};

const TIMELINE = [
  {
    label: 'Within 24 Hours',
    title: 'Kickoff Call',
    desc: 'Our partnerships team will call you to schedule a Zoom kickstart session and confirm integration requirements.',
  },
  {
    label: 'Day 2–3',
    title: 'Sandbox Access',
    desc: 'You\'ll receive sandbox API keys, documentation access, and a dedicated Slack channel for your integration team.',
  },
  {
    label: 'Week 1–2',
    title: 'Integration Build',
    desc: 'Your 40 hours of integration specialist support begins. We\'ll work alongside your engineering team to build the integration.',
  },
  {
    label: 'Week 2–3',
    title: 'Custom Development',
    desc: '15 hours of custom development for carrier-specific workflows, white-label UI, or specialized reporting.',
  },
  {
    label: 'Week 3–4',
    title: 'Testing & Launch',
    desc: 'End-to-end testing with real carrier accounts, load testing, and production deployment with live API keys.',
  },
];

export default function TMSApplySuccessPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <LandingNav />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <div className="text-center mb-8">
          {/* Green checkmark */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
            <svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-[#0c0f14]">
            Application Received
          </h1>
          <p className="mt-2 text-sm text-[#8b919a] max-w-md mx-auto">
            Your payment has been processed and your partner application is confirmed. Welcome to the ConsentHaul partner program.
          </p>
        </div>

        {/* What's included */}
        <div className="border border-[#e8e8e3] bg-white mb-6">
          <div className="border-b border-[#e8e8e3] px-6 py-4">
            <h2 className="text-sm font-bold text-[#0c0f14] uppercase tracking-wider">
              What&apos;s Included
            </h2>
          </div>
          <div className="divide-y divide-[#e8e8e3]">
            <div className="flex justify-between px-6 py-3">
              <span className="text-sm text-[#8b919a]">Integration Specialist</span>
              <span className="text-sm font-medium text-[#0c0f14]">40 hours</span>
            </div>
            <div className="flex justify-between px-6 py-3">
              <span className="text-sm text-[#8b919a]">Custom Development</span>
              <span className="text-sm font-medium text-[#0c0f14]">15 hours</span>
            </div>
            <div className="flex justify-between px-6 py-3">
              <span className="text-sm text-[#8b919a]">Dedicated Slack Channel</span>
              <span className="text-sm font-medium text-[#0c0f14]">Included</span>
            </div>
            <div className="flex justify-between px-6 py-3">
              <span className="text-sm text-[#8b919a]">Sandbox + Production API Keys</span>
              <span className="text-sm font-medium text-[#0c0f14]">Included</span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="border border-[#e8e8e3] bg-white">
          <div className="border-b border-[#e8e8e3] px-6 py-4">
            <h2 className="text-sm font-bold text-[#0c0f14] uppercase tracking-wider">
              What Happens Next
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {TIMELINE.map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C8A75E]/10 text-xs font-bold text-[#C8A75E]">
                      {i + 1}
                    </div>
                    {i < TIMELINE.length - 1 && (
                      <div className="mt-1 w-px flex-1 bg-[#e8e8e3]" />
                    )}
                  </div>
                  <div className="pb-6">
                    <p className="text-[10px] font-bold text-[#C8A75E] uppercase tracking-wider">
                      {item.label}
                    </p>
                    <p className="text-sm font-medium text-[#0c0f14] mt-0.5">{item.title}</p>
                    <p className="text-xs text-[#8b919a] mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-[#8b919a] mb-4">
            Questions? Email{' '}
            <a href="mailto:partnerships@consenthaul.com" className="text-[#C8A75E] hover:underline">
              partnerships@consenthaul.com
            </a>
          </p>
          <Link
            href="/tms"
            className="text-sm font-medium text-[#C8A75E] hover:underline"
          >
            Back to TMS Partner Page
          </Link>
        </div>
      </main>
    </div>
  );
}
