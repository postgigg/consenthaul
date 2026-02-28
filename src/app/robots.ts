import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://consenthaul.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/terms',
          '/privacy',
          '/why',
          '/demo',
          '/docs',
          '/tms',
          '/tms/apply',
          '/tms/migration-api',
          '/driver-portal',
        ],
        disallow: [
          '/api/',
          '/dashboard',
          '/consents',
          '/drivers',
          '/billing',
          '/settings',
          '/templates',
          '/api-docs',
          '/mcp-docs',
          '/sign/',
          '/login',
          '/signup',
          '/forgot-password',
          '/market-research',
          '/investors',
          '/revoke/',
          '/suspended',
          '/onboarding',
          '/admin',
          '/outreach/',
          '/partner',
          '/queries',
          '/compliance',
          '/help',
          '/tms/upload/',
          '/tms/apply/success',
          '/verify-email',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
