import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Documentation | ConsentHaul',
  description:
    'Complete API reference for the ConsentHaul REST API. Manage drivers, consent requests, and webhooks programmatically.',
  alternates: { canonical: 'https://app.consenthaul.com/docs' },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
