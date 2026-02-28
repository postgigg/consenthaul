'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SuspendedPage() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-[#e8e8e3] p-10 text-center">
        <div className="w-16 h-1 bg-red-500 mx-auto mb-8" />

        <h1
          className="text-2xl font-bold text-[#0c0f14] tracking-tight"
          style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
        >
          Account Suspended
        </h1>

        <p className="mt-4 text-[#6b6f76] text-[0.9rem] leading-relaxed">
          Your organization&apos;s account has been suspended. Please contact
          support at{' '}
          <a
            href="mailto:support@consenthaul.com"
            className="text-[#0c0f14] font-semibold underline underline-offset-2"
          >
            support@consenthaul.com
          </a>{' '}
          for assistance.
        </p>

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-8 bg-[#0c0f14] text-white font-semibold text-sm px-8 py-3 hover:bg-[#1a1e27] transition-colors"
        >
          SIGN OUT
        </button>
      </div>
    </div>
  );
}
