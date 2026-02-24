'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
      }
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-1 bg-[#C8A75E] mx-auto mb-8" />

        <h2
          className="text-2xl font-bold text-[#0c0f14] tracking-tight"
          style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
        >
          Check your email
        </h2>
        <p className="mt-4 text-[#6b6f76] text-[0.9rem] leading-relaxed max-w-xs mx-auto">
          If an account exists for{' '}
          <span className="text-[#0c0f14] font-medium">{email}</span>,
          we sent a password reset link.
        </p>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 mt-8 text-[#0c0f14] font-semibold text-sm hover:underline underline-offset-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-[#6b6f76] hover:text-[#0c0f14] transition-colors mb-6"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </Link>

        <h1
          className="text-[1.75rem] font-bold text-[#0c0f14] tracking-tight leading-tight"
          style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
        >
          Reset password
        </h1>
        <p className="mt-2 text-[#6b6f76] text-[0.9rem]">
          We&apos;ll send you a link to get back in.
        </p>
      </div>

      {error && (
        <div className="mb-6 border-l-[3px] border-red-500 bg-red-50/60 px-4 py-3">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-[#3a3f49] uppercase tracking-wider mb-2"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@company.com"
            className="w-full border border-[#d4d4cf] bg-white px-4 py-3 text-[0.9rem] text-[#0c0f14] placeholder:text-[#b5b5ae] focus:border-[#0c0f14] focus:outline-none focus:ring-1 focus:ring-[#0c0f14] transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0c0f14] text-white font-semibold text-[0.9rem] py-3.5 hover:bg-[#1a1e27] active:bg-[#000] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              SENDING...
            </>
          ) : (
            'SEND RESET LINK'
          )}
        </button>
      </form>
    </>
  );
}
