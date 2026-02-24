'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError(null);

    const supabase = createClient();

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
  }

  return (
    <>
      <div className="mb-8">
        <h1
          className="text-[1.75rem] font-bold text-[#0c0f14] tracking-tight leading-tight"
          style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
        >
          Sign in
        </h1>
        <p className="mt-2 text-[#6b6f76] text-[0.9rem]">
          Enter your credentials to access your dashboard.
        </p>
      </div>

      {error && (
        <div className="mb-6 border-l-[3px] border-red-500 bg-red-50/60 px-4 py-3">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading || loading}
        className="w-full mb-6 border border-[#d4d4cf] bg-white text-[#3a3f49] font-semibold text-[0.9rem] py-3.5 hover:bg-[#fafaf8] hover:border-[#b5b5ae] active:bg-[#f0f0ec] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        {googleLoading ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            CONNECTING...
          </>
        ) : (
          <>
            <svg width="18" height="18" className="w-[18px] h-[18px]" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            CONTINUE WITH GOOGLE
          </>
        )}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-[#e8e8e3]" />
        <span className="text-xs text-[#b5b5ae] uppercase tracking-wider font-semibold">or</span>
        <div className="flex-1 h-px bg-[#e8e8e3]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-[#3a3f49] uppercase tracking-wider mb-2"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="dispatcher@acmefreight.com"
            className="w-full border border-[#d4d4cf] bg-white px-4 py-3 text-[0.9rem] text-[#0c0f14] placeholder:text-[#b5b5ae] focus:border-[#0c0f14] focus:outline-none focus:ring-1 focus:ring-[#0c0f14] transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-[#3a3f49] uppercase tracking-wider"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-[#6b6f76] hover:text-[#0c0f14] transition-colors underline underline-offset-2"
            >
              Forgot?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="Enter password"
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
              SIGNING IN...
            </>
          ) : (
            'SIGN IN'
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-[#e8e8e3]">
        <p className="text-[0.85rem] text-[#6b6f76]">
          No account yet?{' '}
          <Link
            href="/signup"
            className="text-[#0c0f14] font-semibold hover:underline underline-offset-2"
          >
            Create one
          </Link>
        </p>
      </div>
    </>
  );
}
