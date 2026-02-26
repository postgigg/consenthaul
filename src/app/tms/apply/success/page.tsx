import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingNav } from '@/components/landing/LandingNav';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata: Metadata = {
  title: 'Application Submitted | ConsentHaul TMS Partner',
  description: 'Your TMS partner application has been received. Our team will begin onboarding within 24 hours.',
};

const TIMELINE = [
  {
    label: 'Immediate',
    title: 'Account Provisioned',
    desc: 'Your partner account, sandbox API key, and live API key are ready. Log in to your dashboard to get started.',
  },
  {
    label: 'Within 24 Hours',
    title: 'Welcome Email',
    desc: 'You\'ll receive a welcome email with your API key prefixes, login link, and documentation links.',
  },
  {
    label: 'At Your Pace',
    title: 'Build Your Integration',
    desc: 'Use our API docs and sandbox key to integrate consent collection into your TMS platform. Professional services available at $250/hr if needed.',
  },
  {
    label: 'When Ready',
    title: 'Go Live',
    desc: 'Switch to your live API key and start collecting consents for your carrier customers.',
  },
];

interface PageProps {
  searchParams: Promise<{ session_id?: string; app_id?: string }>;
}

export default async function TMSApplySuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // Try to find the migration token and magic link for this application
  let migrationToken: string | null = null;
  let migrationExpiresAt: string | null = null;
  let magicLink: string | null = null;
  let applicationId: string | null = params.app_id ?? null;

  if (params.session_id || params.app_id) {
    const supabase = createAdminClient();

    // If we have a Stripe session ID, look up the application from it
    if (params.session_id && !applicationId) {
      const { data: appData } = await supabase
        .from('partner_applications')
        .select('id, magic_link')
        .eq('stripe_checkout_session_id', params.session_id)
        .single();

      if (appData) {
        const row = appData as { id: string; magic_link: string | null };
        applicationId = row.id;
        magicLink = row.magic_link;
      }
    }

    // Fetch magic link if we have an app_id but didn't get it above
    if (applicationId && !magicLink) {
      const { data: appData } = await supabase
        .from('partner_applications')
        .select('magic_link')
        .eq('id', applicationId)
        .single();

      if (appData) {
        magicLink = (appData as { magic_link: string | null }).magic_link;
      }
    }

    // Fetch migration transfer token
    if (applicationId) {
      const { data: migData } = await supabase
        .from('migration_transfers')
        .select('token, expires_at')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (migData) {
        const row = migData as { token: string; expires_at: string };
        migrationToken = row.token;
        migrationExpiresAt = row.expires_at;
      }
    }
  }

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

        {/* Migration Transfer Token */}
        {migrationToken && (
          <div className="border border-[#C8A75E]/30 bg-[#C8A75E]/5 mb-6">
            <div className="border-b border-[#C8A75E]/20 px-6 py-4">
              <h2 className="text-sm font-bold text-[#0c0f14] uppercase tracking-wider">
                Migration Transfer Token
              </h2>
              <p className="text-xs text-[#8b919a] mt-0.5">
                Use this token to upload your carrier/driver data via CSV or API.
              </p>
            </div>
            <div className="px-6 py-4">
              <div className="bg-white border border-[#e8e8e3] px-4 py-3">
                <code className="text-sm font-mono text-[#0c0f14] break-all select-all">
                  {migrationToken}
                </code>
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-[#8b919a]">
                  Expires {migrationExpiresAt
                    ? new Date(migrationExpiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                    : 'in 7 days'}
                </p>
                <Link
                  href="/tms/migration-api"
                  target="_blank"
                  className="text-xs font-medium text-[#C8A75E] hover:underline"
                >
                  Migration API Docs &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* What's included */}
        <div className="border border-[#e8e8e3] bg-white mb-6">
          <div className="border-b border-[#e8e8e3] px-6 py-4">
            <h2 className="text-sm font-bold text-[#0c0f14] uppercase tracking-wider">
              What&apos;s Included
            </h2>
          </div>
          <div className="divide-y divide-[#e8e8e3]">
            <div className="flex justify-between px-6 py-3">
              <span className="text-sm text-[#8b919a]">Partner Account</span>
              <span className="text-sm font-medium text-emerald-600">Active</span>
            </div>
            <div className="flex justify-between px-6 py-3">
              <span className="text-sm text-[#8b919a]">Sandbox + Production API Keys</span>
              <span className="text-sm font-medium text-[#0c0f14]">Included</span>
            </div>
            <div className="flex justify-between px-6 py-3">
              <span className="text-sm text-[#8b919a]">API Documentation Access</span>
              <span className="text-sm font-medium text-[#0c0f14]">Included</span>
            </div>
            <div className="flex justify-between px-6 py-3">
              <span className="text-sm text-[#8b919a]">Partner Dashboard</span>
              <span className="text-sm font-medium text-[#0c0f14]">Included</span>
            </div>
            {migrationToken && (
              <div className="flex justify-between px-6 py-3">
                <span className="text-sm text-[#8b919a]">Data Migration Access</span>
                <span className="text-sm font-medium text-emerald-600">Active</span>
              </div>
            )}
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

        <div className="mt-6 text-center space-y-3">
          {magicLink ? (
            <a
              href={magicLink}
              className="inline-flex items-center justify-center h-10 px-6 text-sm font-medium text-white bg-[#C8A75E] hover:bg-[#b8963e] transition-colors"
            >
              Log In to Partner Dashboard &rarr;
            </a>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center h-10 px-6 text-sm font-medium text-white bg-[#C8A75E] hover:bg-[#b8963e] transition-colors"
            >
              Log In to Partner Dashboard &rarr;
            </Link>
          )}
          <p className="text-xs text-[#8b919a]">
            {magicLink
              ? 'Click above to log in instantly. A login link was also sent to your email.'
              : 'Check your email for a login link to access your dashboard.'}
          </p>
          <p className="text-xs text-[#8b919a]">
            Questions? Email{' '}
            <a href="mailto:partnerships@consenthaul.com" className="text-[#C8A75E] hover:underline">
              partnerships@consenthaul.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
