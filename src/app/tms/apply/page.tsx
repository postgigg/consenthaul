import type { Metadata } from 'next';
import { LandingNav } from '@/components/landing/LandingNav';
import { PartnerApplicationWizard } from '@/components/tms/PartnerApplicationWizard';

export const metadata: Metadata = {
  title: 'Apply for TMS Partner Account | ConsentHaul',
  description:
    'Apply to become a ConsentHaul TMS partner. Embed FMCSA consent collection into your platform with volume pricing starting at $0.29/consent.',
};

export default function TMSApplyPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <LandingNav />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <div className="text-center mb-8">
          <p className="text-xs font-bold text-[#C8A75E] uppercase tracking-[0.2em] mb-2">
            TMS Partner Program
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0c0f14]">
            Partner Application
          </h1>
          <p className="mt-2 text-sm text-[#8b919a] max-w-md mx-auto">
            Complete the application below. After payment, our team will begin onboarding within 24 hours.
          </p>
        </div>
        <PartnerApplicationWizard />
      </main>
    </div>
  );
}
