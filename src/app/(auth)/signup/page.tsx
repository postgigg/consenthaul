'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { validatePassword } from '@/lib/validators';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  /** Password requirement rules for the real-time indicator */
  const passwordRequirements = [
    { label: 'At least 10 characters', test: (pw: string) => pw.length >= 10 },
    { label: 'One uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
    { label: 'One lowercase letter', test: (pw: string) => /[a-z]/.test(pw) },
    { label: 'One number', test: (pw: string) => /[0-9]/.test(pw) },
    { label: 'One special character', test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy.');
      setLoading(false);
      return;
    }

    const pwValidation = validatePassword(password);
    if (!pwValidation.valid) {
      setError(pwValidation.errors[0]);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company_name: companyName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="text-center">
        {/* Yellow confirmation bar */}
        <div className="w-16 h-1 bg-[#C8A75E] mx-auto mb-8" />

        <h2
          className="text-2xl font-bold text-[#0c0f14] tracking-tight"
          style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
        >
          Check your inbox
        </h2>
        <p className="mt-4 text-[#6b6f76] text-[0.9rem] leading-relaxed max-w-xs mx-auto">
          We sent a confirmation link to{' '}
          <span className="text-[#0c0f14] font-medium">{email}</span>.
          Click it to activate your account.
        </p>

        <Link
          href="/login"
          className="inline-block mt-8 bg-[#0c0f14] text-white font-semibold text-sm px-8 py-3 hover:bg-[#1a1e27] transition-colors"
        >
          BACK TO SIGN IN
        </Link>
      </div>
    );
  }

  async function handleGoogleSignup() {
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
          Create account
        </h1>
        <p className="mt-2 text-[#6b6f76] text-[0.9rem]">
          Get your fleet compliant in minutes. 3 free credits on signup.
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
        onClick={handleGoogleSignup}
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
            SIGN UP WITH GOOGLE
          </>
        )}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-[#e8e8e3]" />
        <span className="text-xs text-[#b5b5ae] uppercase tracking-wider font-semibold">or</span>
        <div className="flex-1 h-px bg-[#e8e8e3]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="full_name" className="block text-xs font-semibold text-[#3a3f49] uppercase tracking-wider mb-2">
              Your name
            </label>
            <input
              id="full_name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Jane Smith"
              className="w-full border border-[#d4d4cf] bg-white px-4 py-3 text-[0.9rem] text-[#0c0f14] placeholder:text-[#b5b5ae] focus:border-[#0c0f14] focus:outline-none focus:ring-1 focus:ring-[#0c0f14] transition-colors"
            />
          </div>
          <div>
            <label htmlFor="company_name" className="block text-xs font-semibold text-[#3a3f49] uppercase tracking-wider mb-2">
              Company
            </label>
            <input
              id="company_name"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              placeholder="Acme Freight"
              className="w-full border border-[#d4d4cf] bg-white px-4 py-3 text-[0.9rem] text-[#0c0f14] placeholder:text-[#b5b5ae] focus:border-[#0c0f14] focus:outline-none focus:ring-1 focus:ring-[#0c0f14] transition-colors"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-[#3a3f49] uppercase tracking-wider mb-2">
            Work email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="jane@acmefreight.com"
            className="w-full border border-[#d4d4cf] bg-white px-4 py-3 text-[0.9rem] text-[#0c0f14] placeholder:text-[#b5b5ae] focus:border-[#0c0f14] focus:outline-none focus:ring-1 focus:ring-[#0c0f14] transition-colors"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-[#3a3f49] uppercase tracking-wider mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (e.target.value.length > 0) {
                const { errors } = validatePassword(e.target.value);
                setPasswordErrors(errors);
              } else {
                setPasswordErrors([]);
              }
            }}
            required
            minLength={10}
            placeholder="Min. 10 characters"
            className="w-full border border-[#d4d4cf] bg-white px-4 py-3 text-[0.9rem] text-[#0c0f14] placeholder:text-[#b5b5ae] focus:border-[#0c0f14] focus:outline-none focus:ring-1 focus:ring-[#0c0f14] transition-colors"
          />

          {/* Password requirements indicator */}
          {password.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {passwordRequirements.map((req) => {
                const met = req.test(password);
                return (
                  <div key={req.label} className="flex items-center gap-2">
                    <div
                      className={`w-3.5 h-3.5 flex items-center justify-center shrink-0 transition-colors ${
                        met ? 'text-emerald-600' : 'text-[#b5b5ae]'
                      }`}
                    >
                      {met ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path
                            d="M2.5 7.5L5.5 10.5L11.5 3.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-[0.75rem] transition-colors ${
                        met ? 'text-emerald-700 font-medium' : 'text-[#8b919a]'
                      }`}
                    >
                      {req.label}
                    </span>
                  </div>
                );
              })}
              {/* Show "too common" warning separately if applicable */}
              {passwordErrors.includes('This password is too common') && (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0 text-red-500">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M4 4L10 10M10 4L4 10"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <span className="text-[0.75rem] text-red-600 font-medium">
                    This password is too common
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Terms of Service agreement */}
        <label className="flex items-start gap-3 cursor-pointer mt-2">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 border-[#d4d4cf] text-[#0c0f14] focus:ring-[#0c0f14] accent-[#0c0f14]"
          />
          <span className="text-[0.8rem] leading-relaxed text-[#6b6f76]">
            I agree to the{' '}
            <Link href="/terms" target="_blank" className="text-[#0c0f14] font-semibold underline underline-offset-2 hover:text-[#C8A75E]">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" target="_blank" className="text-[#0c0f14] font-semibold underline underline-offset-2 hover:text-[#C8A75E]">
              Privacy Policy
            </Link>
          </span>
        </label>

        <button
          type="submit"
          disabled={loading || !agreedToTerms}
          className="w-full bg-[#0c0f14] text-white font-semibold text-[0.9rem] py-3.5 hover:bg-[#1a1e27] active:bg-[#000] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              CREATING...
            </>
          ) : (
            'CREATE ACCOUNT'
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-[#e8e8e3]">
        <p className="text-[0.85rem] text-[#6b6f76]">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-[#0c0f14] font-semibold hover:underline underline-offset-2"
          >
            Sign in
          </Link>
        </p>
      </div>
    </>
  );
}
