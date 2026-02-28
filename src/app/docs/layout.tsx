import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://consenthaul.com';

export const metadata: Metadata = {
  title: 'API Documentation | ConsentHaul',
  description:
    'Complete API reference for the ConsentHaul REST API. Manage drivers, consent requests, and webhooks programmatically.',
  alternates: { canonical: `${SITE_URL}/docs` },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
