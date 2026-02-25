'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const COOKIE_CONSENT_KEY = 'consenthaul_cookie_consent';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#e8e8e3] bg-white px-4 py-4 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#3a3f49]">
          We use cookies for authentication, session management, and analytics.
          See our{' '}
          <Link
            href="/privacy#cookies"
            className="font-medium text-[#0c0f14] underline underline-offset-2 hover:text-[#C8A75E] transition-colors"
          >
            Privacy Policy
          </Link>{' '}
          for details.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={decline}
            className="border border-[#d4d4cf] bg-white px-4 py-2 text-sm font-medium text-[#3a3f49] transition-colors hover:bg-[#fafaf8]"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={accept}
            className="bg-[#0c0f14] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a1e27]"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
