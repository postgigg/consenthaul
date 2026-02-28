import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://consenthaul.com';

export const metadata: Metadata = {
  title: 'Driver Portal — View Your FMCSA Consent History',
  description: 'CDL drivers can securely view FMCSA Clearinghouse consent history and download signed consent PDFs.',
  alternates: { canonical: `${SITE_URL}/driver-portal` },
};

export default function DriverPortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
