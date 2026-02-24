import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://consenthaul.com';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0c0f14',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ConsentHaul — FMCSA Clearinghouse Consent Made Simple',
    template: '%s | ConsentHaul',
  },
  description:
    'Digital FMCSA Clearinghouse limited query consent platform for trucking carriers. Send consent links via SMS, WhatsApp, or email. Drivers sign on their phone. Get compliant signed PDFs back instantly. 3-year auto-retention included.',
  keywords: [
    'FMCSA Clearinghouse consent',
    'FMCSA limited query consent',
    'Clearinghouse consent form',
    'CDL driver consent',
    'trucking compliance software',
    'FMCSA drug and alcohol consent',
    'electronic consent signature',
    'DOT compliance',
    'fleet compliance management',
    'driver consent management',
    'Clearinghouse query authorization',
    'FMCSA electronic consent',
    'trucking carrier compliance',
    'CDL drug test consent',
    'driver e-signature platform',
    'FMCSA 49 CFR Part 40',
    'limited query authorization',
    'fleet safety compliance',
    'mobile driver consent',
    'digital consent form trucking',
  ],
  authors: [{ name: 'Flotac Ltd' }],
  creator: 'Flotac Ltd',
  publisher: 'Flotac Ltd',
  applicationName: 'ConsentHaul',
  category: 'Transportation Compliance Software',
  classification: 'Business Software',
  referrer: 'origin-when-cross-origin',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'ConsentHaul',
    title: 'ConsentHaul — FMCSA Clearinghouse Consent Made Simple',
    description:
      'Stop chasing drivers for consent forms. Send a link, driver signs on their phone, you get a compliant PDF back. FMCSA Clearinghouse limited query consent without the paperwork.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ConsentHaul — FMCSA Clearinghouse Consent Platform',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ConsentHaul — FMCSA Clearinghouse Consent Made Simple',
    description:
      'Digital FMCSA consent platform for trucking carriers. Send links, collect signatures, get signed PDFs. As low as $0.50 per consent.',
    images: ['/og-image.png'],
    creator: '@consenthaul',
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'en-US': SITE_URL,
      'es-US': `${SITE_URL}/es`,
    },
  },
  other: {
    'msapplication-TileColor': '#0c0f14',
    'apple-mobile-web-app-title': 'ConsentHaul',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'format-detection': 'telephone=no',
  },
};

// JSON-LD structured data for search engines
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'ConsentHaul',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description:
        'Digital FMCSA Clearinghouse limited query consent platform. Send consent links to CDL drivers via SMS, WhatsApp, or email. Collect electronic signatures on mobile devices. Automatically generate and retain compliant signed PDFs for 3 years.',
      url: SITE_URL,
      author: {
        '@type': 'Organization',
        name: 'Flotac Ltd',
        url: SITE_URL,
      },
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'USD',
        lowPrice: '0.50',
        highPrice: '1.50',
        offerCount: 4,
        offers: [
          {
            '@type': 'Offer',
            name: 'Starter — 10 Credits',
            price: '15.00',
            priceCurrency: 'USD',
            description: '10 consent credits at $1.50 per consent',
          },
          {
            '@type': 'Offer',
            name: 'Fleet — 50 Credits',
            price: '50.00',
            priceCurrency: 'USD',
            description: '50 consent credits at $1.00 per consent. Save 33%.',
          },
          {
            '@type': 'Offer',
            name: 'Carrier — 200 Credits',
            price: '150.00',
            priceCurrency: 'USD',
            description: '200 consent credits at $0.75 per consent. Save 50%.',
          },
          {
            '@type': 'Offer',
            name: 'Enterprise — 1,000 Credits',
            price: '500.00',
            priceCurrency: 'USD',
            description: '1,000 consent credits at $0.50 per consent. Save 67%.',
          },
        ],
      },
      featureList: [
        'FMCSA Clearinghouse limited query consent',
        'SMS consent delivery',
        'WhatsApp consent delivery',
        'Email consent delivery',
        'Mobile-first electronic signature',
        'Bilingual English/Spanish support',
        'Automatic PDF generation',
        '3-year compliant document retention',
        'Real-time consent status tracking',
        'Bulk CSV driver import',
        'REST API for TMS integration',
        'Stripe-powered secure payments',
      ],
    },
    {
      '@type': 'Organization',
      name: 'ConsentHaul',
      legalName: 'Flotac Ltd',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      description:
        'ConsentHaul is operated by Flotac Ltd. We provide digital FMCSA Clearinghouse consent management for trucking carriers and fleet operators.',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        availableLanguage: ['English', 'Spanish'],
      },
      sameAs: [],
    },
    {
      '@type': 'WebSite',
      name: 'ConsentHaul',
      url: SITE_URL,
      description:
        'FMCSA Clearinghouse consent platform for trucking carriers. Digital consent forms, electronic signatures, and compliant PDF retention.',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is ConsentHaul?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'ConsentHaul is a digital platform for collecting FMCSA Clearinghouse limited query consent from CDL drivers. Carriers send consent links via SMS, WhatsApp, or email. Drivers sign on their phone. A compliant signed PDF is generated and stored automatically for 3 years.',
          },
        },
        {
          '@type': 'Question',
          name: 'How much does ConsentHaul cost?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'ConsentHaul uses a pay-per-consent model with no subscriptions. Credit packs range from $1.50 per consent (10-pack for $15) down to $0.50 per consent (1,000-pack for $500). Credits never expire. New accounts receive 3 free credits on signup.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is ConsentHaul FMCSA compliant?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'ConsentHaul generates consent forms compliant with 49 CFR Part 40 and FMCSA Clearinghouse regulations. Electronic signatures comply with the ESIGN Act and UETA. Signed documents are automatically retained for the FMCSA-required minimum of 3 years.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does the driver signing process work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Drivers receive a secure link via SMS, WhatsApp, or email. They open it on their phone, review the consent in English or Spanish, acknowledge it, draw their signature, and submit. Average signing time is 60 seconds. No app download required.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does ConsentHaul support Spanish-speaking drivers?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. ConsentHaul is fully bilingual (English/Spanish). Drivers can toggle between languages on the signing page. Consent documents, notifications, and signed PDFs are all available in both languages.',
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased h-full`}
      >
        {children}
      </body>
    </html>
  );
}
