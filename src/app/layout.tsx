import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { CookieBanner } from '@/components/CookieBanner';
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
    default: 'ConsentHaul — Digital FMCSA Clearinghouse Consent Form | Online Limited Query Authorization',
    template: '%s | ConsentHaul',
  },
  description:
    'Collect FMCSA consent forms online from CDL drivers in 60 seconds. ConsentHaul is a digital Clearinghouse limited query consent platform for motor carriers. Send a DOT consent form via SMS or email, drivers sign electronically on their phone, and you receive a compliant FMCSA consent PDF — stored for 3 years per 49 CFR Part 40. Bilingual English/Spanish support included.',
  keywords: [
    'FMCSA consent form',
    'digital DOT consent',
    'FMCSA Clearinghouse consent form online',
    'electronic FMCSA consent signature',
    'CDL driver consent form',
    'FMCSA limited query authorization form',
    'Clearinghouse consent for carriers',
    'how to get FMCSA Clearinghouse consent',
    'DOT drug test consent form',
    'FMCSA consent management software',
    'bilingual FMCSA consent form',
    'FMCSA consent form SMS',
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
    'FMCSA Clearinghouse limited query consent form',
    'online FMCSA consent collection',
    'DOT Clearinghouse consent platform',
    'electronic DOT consent form',
    'FMCSA consent PDF generator',
    'digital FMCSA consent for trucking companies',
    'FMCSA consent automation',
    'CDL Clearinghouse limited query',
    'FMCSA pre-employment consent form',
    'DOT drug testing consent management',
    'carrier Clearinghouse consent compliance',
    'FMCSA electronic signature platform',
    'mobile FMCSA consent signing',
    'FMCSA consent form WhatsApp',
    'bulk CDL driver consent collection',
    'FMCSA consent record retention',
  ],
  authors: [{ name: 'Workbird LLC' }],
  creator: 'Workbird LLC',
  publisher: 'Workbird LLC',
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
    title: 'ConsentHaul — FMCSA Consent Form | Clearinghouse Limited Query Authorization Online',
    description:
      'Collect FMCSA Clearinghouse limited query consent forms from CDL drivers digitally. Send DOT consent links via SMS or email — drivers sign electronically on their phone. Compliant FMCSA consent PDFs generated and retained for 3 years. As low as $1.50 per consent.',
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
    title: 'ConsentHaul — FMCSA Consent Form Online | Digital DOT Consent',
    description:
      'Digital FMCSA Clearinghouse consent form platform for trucking carriers. Send DOT consent links to CDL drivers, collect electronic signatures, get compliant FMCSA consent PDFs. As low as $1.50 per consent.',
    images: ['/og-image.png'],
    creator: '@consenthaul',
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'en-US': SITE_URL,
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
        'Digital FMCSA Clearinghouse limited query consent form platform for motor carriers. Send DOT consent links to CDL drivers via SMS, WhatsApp, or email. Collect electronic FMCSA consent signatures on mobile devices. Automatically generate and retain compliant signed consent PDFs for 3 years per 49 CFR Part 40.',
      url: SITE_URL,
      author: {
        '@type': 'Organization',
        name: 'Workbird LLC',
        url: SITE_URL,
      },
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'USD',
        lowPrice: '1.50',
        highPrice: '3.00',
        offerCount: 4,
        offers: [
          {
            '@type': 'Offer',
            name: 'Starter — 10 Credits',
            price: '30.00',
            priceCurrency: 'USD',
            description: '10 FMCSA consent credits at $3.00 per consent form',
          },
          {
            '@type': 'Offer',
            name: 'Fleet — 50 Credits',
            price: '125.00',
            priceCurrency: 'USD',
            description: '50 FMCSA consent credits at $2.50 per consent form. Save 17%.',
          },
          {
            '@type': 'Offer',
            name: 'Carrier — 200 Credits',
            price: '400.00',
            priceCurrency: 'USD',
            description: '200 FMCSA consent credits at $2.00 per consent form. Save 33%.',
          },
          {
            '@type': 'Offer',
            name: 'Enterprise — 1,000 Credits',
            price: '1500.00',
            priceCurrency: 'USD',
            description: '1,000 FMCSA consent credits at $1.50 per consent form. Save 50%.',
          },
        ],
      },
      featureList: [
        'FMCSA Clearinghouse limited query consent',
        'Digital FMCSA consent form generation',
        'DOT drug testing consent management',
        'CDL driver consent form online',
        'Electronic FMCSA consent signature collection',
        'SMS consent delivery for CDL drivers',
        'WhatsApp consent delivery',
        'Email consent delivery',
        'Mobile-first electronic DOT consent signing',
        'Bilingual English/Spanish FMCSA consent forms',
        'Automatic FMCSA consent PDF generation',
        '3-year compliant DOT consent document retention',
        'Real-time FMCSA consent status tracking',
        'Bulk CSV CDL driver import',
        'REST API for TMS integration',
        'MCP server for AI agent consent management',
        'FMCSA pre-employment consent collection',
        'Carrier Clearinghouse consent compliance tools',
        'FMCSA consent form WhatsApp delivery',
        '49 CFR Part 40 compliant consent forms',
        'Online limited query authorization forms',
        'FMCSA consent automation for fleets',
        'Stripe-powered secure payments',
        'Digital DOT Clearinghouse consent platform',
      ],
    },
    {
      '@type': 'Organization',
      name: 'ConsentHaul',
      legalName: 'Workbird LLC',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      description:
        'ConsentHaul is operated by Workbird LLC. We provide a digital FMCSA consent form platform for motor carriers and fleet operators to collect DOT Clearinghouse limited query authorization from CDL drivers electronically, in compliance with 49 CFR Part 40. Our DOT consent management system supports SMS, WhatsApp, and email delivery.',
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
        'FMCSA Clearinghouse consent form platform for trucking carriers. Digital DOT consent forms, electronic FMCSA consent signatures, and compliant consent PDF retention for motor carriers.',
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
            text: 'ConsentHaul uses a pay-per-consent model with no subscriptions. Credit packs range from $3.00 per consent (10-pack for $30) down to $1.50 per consent (1,000-pack for $1,500). Credits never expire. New accounts receive 3 free credits on signup.',
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
        {
          '@type': 'Question',
          name: 'Can I import my existing driver list?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. You can bulk-import drivers via CSV upload. Just upload a spreadsheet with driver names, CDL numbers, phone numbers, and emails — ConsentHaul handles the rest.',
          },
        },
        {
          '@type': 'Question',
          name: 'How long are signed consents stored?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'All signed consent PDFs are automatically retained for 3 years from the date of signing, meeting the FMCSA minimum retention requirement. You can download signed PDFs at any time from your dashboard.',
          },
        },
        {
          '@type': 'Question',
          name: 'Do you have an API?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. ConsentHaul offers a REST API and an MCP (Model Context Protocol) server for AI agents. Integrate consent creation directly into your TMS, dispatch system, or onboarding workflow — or let AI agents like Claude manage drivers, send consents, and check billing through natural language.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is an FMCSA Clearinghouse limited query consent?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'An FMCSA Clearinghouse limited query consent is a written or electronic authorization from a CDL driver that allows a motor carrier to check whether the driver has any drug or alcohol violations recorded in the FMCSA Drug & Alcohol Clearinghouse. Carriers must have valid consent on file before running a limited query. Under 49 CFR 382.701(b), a driver may give consent that is effective for more than one year — including the full duration of employment — so a single blanket consent at hire can cover all future annual limited queries.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do I get FMCSA Clearinghouse consent from my drivers?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'With ConsentHaul, you enter the driver\'s name, CDL number, and phone number or email, then send a digital FMCSA consent form with one click. The driver receives a secure link via SMS, WhatsApp, or email, opens it on their phone, reviews the consent document, and signs electronically. The signed FMCSA consent PDF is generated and stored automatically — no paper, printing, or scanning required.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is an electronic FMCSA consent signature legally valid?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Electronic signatures on FMCSA consent forms are legally valid under the Electronic Signatures in Global and National Commerce Act (ESIGN Act) and the Uniform Electronic Transactions Act (UETA). ConsentHaul captures signature image data, timestamps, IP addresses, and device information to establish authenticity and meet regulatory requirements.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the difference between a limited query and a full query in the FMCSA Clearinghouse?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A limited query tells a motor carrier whether a CDL driver has any drug or alcohol violations in the FMCSA Clearinghouse without revealing details. It requires the driver\'s written or electronic consent. A full query reveals the actual violation details and requires the driver to grant electronic consent directly in the Clearinghouse portal. ConsentHaul handles the consent collection for limited queries — the most common type used for pre-employment and annual checks.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can ConsentHaul be used for DOT pre-employment drug testing consent?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. ConsentHaul is commonly used by motor carriers to collect FMCSA Clearinghouse limited query consent as part of the DOT pre-employment screening process. Before hiring a new CDL driver, carriers are required to run a Clearinghouse query — and ConsentHaul makes it easy to collect the required driver consent digitally before initiating the query.',
          },
        },
        {
          '@type': 'Question',
          name: 'Do trucking companies need consent for every FMCSA Clearinghouse query?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'It depends on the query type. For annual limited queries (49 CFR 382.701(b)), a driver\'s general consent may be effective for more than one year, including the full duration of employment. Employers can collect this consent once at hire and run annual limited queries without re-collecting each year. For pre-employment full queries (382.701(a)) and violation follow-up full queries (382.701(b)(3)), the driver must provide separate electronic consent through the FMCSA Clearinghouse portal each time (382.703(b)). ConsentHaul collects the general written consent for limited queries — the most common type used for annual compliance.',
          },
        },
      ],
    },
    {
      '@type': 'HowTo',
      name: 'How to Collect FMCSA Clearinghouse Consent Online',
      description:
        'Use ConsentHaul to collect digital FMCSA Clearinghouse limited query consent from CDL drivers in three simple steps. No paper forms, no printing, no scanning.',
      step: [
        {
          '@type': 'HowToStep',
          name: 'Create an FMCSA consent request',
          text: 'Enter the CDL driver\'s name, phone number or email, and select the consent duration (single-year or duration of employment). ConsentHaul generates a compliant FMCSA limited query consent form per 49 CFR 382.703(a) and sends a secure consent link to the driver via SMS, WhatsApp, or email.',
        },
        {
          '@type': 'HowToStep',
          name: 'Driver signs the FMCSA consent form electronically',
          text: 'The CDL driver receives a DOT consent link on their phone, opens it in their browser (no app required), reviews the FMCSA consent document in English or Spanish, acknowledges the terms, and draws their electronic signature. Average signing time is 60 seconds.',
        },
        {
          '@type': 'HowToStep',
          name: 'Compliant FMCSA consent PDF is filed automatically',
          text: 'Once signed, ConsentHaul generates a compliant FMCSA consent PDF with the driver\'s electronic signature, timestamp, IP address, and device data. The signed DOT consent form is stored securely and retained for 3 years per 49 CFR Part 40 requirements.',
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: SITE_URL,
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
        <CookieBanner />
      </body>
    </html>
  );
}
