'use client';

import { useState, useEffect } from 'react';

export function ComingSoonBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Small delay so it animates in after page load
    const t = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  if (dismissed) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[100] bg-[#0c0f14]/60 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setDismissed(true)}
      />

      {/* Modal */}
      <div
        className={`fixed inset-0 z-[101] flex items-center justify-center px-6 transition-all duration-300 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="bg-white max-w-md w-full p-8 sm:p-10 shadow-2xl relative">
          {/* Close button */}
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-[#8b919a] hover:text-[#0c0f14] transition-colors"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Gold accent line */}
          <div className="w-10 h-0.5 bg-[#C8A75E] mb-6" />

          <p className="text-[0.65rem] font-bold text-[#C8A75E] uppercase tracking-[0.2em] mb-3">
            Coming Soon
          </p>

          <h2
            className="text-2xl sm:text-3xl font-bold text-[#0c0f14] tracking-tight leading-tight"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            We&apos;re building
            <br />
            something great.
          </h2>

          <p className="mt-4 text-sm text-[#6b6f76] leading-relaxed">
            ConsentHaul is almost ready. Digital FMCSA Clearinghouse consent
            management — no paperwork, no chasing drivers. Sign up will be
            available soon.
          </p>

          <button
            onClick={() => setDismissed(true)}
            className="mt-8 w-full bg-[#0c0f14] text-white text-sm font-bold uppercase tracking-wider py-3.5 hover:bg-[#1a1e27] transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </>
  );
}
