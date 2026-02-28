import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://consenthaul.com';

export const metadata: Metadata = {
  title: 'Why ConsentHaul — FMCSA Compliance Pain Points & Solutions',
  description: 'See why motor carriers choose ConsentHaul for FMCSA Clearinghouse consent. Compare the cost of paper forms vs. digital consent collection.',
  alternates: { canonical: `${SITE_URL}/why` },
};

export default function WhyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
