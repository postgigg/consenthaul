'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function VerifyEmailPage() {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    setResending(true);
    setError(null);
    setResent(false);

    const supabase = createClient();

    // Get the current user's email to resend verification
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      setError('Unable to determine your email address. Please try signing up again.');
      setResending(false);
      return;
    }

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
    });

    if (resendError) {
      setError(resendError.message);
      setResending(false);
      return;
    }

    setResent(true);
    setResending(false);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <div className="text-center">
      {/* Gold accent bar */}
      <div className="w-16 h-1 bg-[#C8A75E] mx-auto mb-8" />

      {/* Mail icon */}
      <div className="w-16 h-16 mx-auto mb-6 bg-[#0c0f14] flex items-center justify-center">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#C8A75E"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M22 4L12 13L2 4" />
        </svg>
      </div>

      <h2
        className="text-2xl font-bold text-[#0c0f14] tracking-tight"
        style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
      >
        Verify your email
      </h2>
      <p className="mt-4 text-[#6b6f76] text-[0.9rem] leading-relaxed max-w-sm mx-auto">
        We sent a verification link to your email address. Please check your inbox
        and click the link to activate your account.
      </p>
      <p className="mt-2 text-[#8b919a] text-[0.8rem]">
        Check your spam folder if you don&apos;t see it.
      </p>

      {error && (
        <div className="mt-6 border-l-[3px] border-red-500 bg-red-50/60 px-4 py-3 text-left">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {resent && !error && (
        <div className="mt-6 border-l-[3px] border-emerald-500 bg-emerald-50/60 px-4 py-3 text-left">
          <p className="text-sm text-emerald-700 font-medium">
            Verification email resent. Please check your inbox.
          </p>
        </div>
      )}

      <div className="mt-8 space-y-3">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="w-full bg-[#0c0f14] text-white font-semibold text-[0.9rem] py-3.5 hover:bg-[#1a1e27] active:bg-[#000] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {resending ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              SENDING...
            </>
          ) : (
            'RESEND VERIFICATION EMAIL'
          )}
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full border border-[#d4d4cf] bg-white text-[#3a3f49] font-semibold text-[0.9rem] py-3.5 hover:bg-[#fafaf8] hover:border-[#b5b5ae] active:bg-[#f0f0ec] transition-colors"
        >
          SIGN OUT
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-[#e8e8e3]">
        <p className="text-[0.85rem] text-[#6b6f76]">
          Wrong email?{' '}
          <Link
            href="/signup"
            className="text-[#0c0f14] font-semibold hover:underline underline-offset-2"
          >
            Sign up again
          </Link>
        </p>
      </div>
    </div>
  );
}
