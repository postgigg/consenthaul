'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, X, ArrowRight } from 'lucide-react';

const DISMISS_KEY = 'consenthaul_blanket_education_dismissed';

export function BlanketConsentCard() {
  const [dismissed, setDismissed] = useState(true); // Start hidden to avoid flash

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === 'true');
  }, []);

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <Card className="border-[#C8A75E]/30 bg-[#fdfcf8]">
      <CardContent className="p-5 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 text-[#b5b5ae] hover:text-[#6b6f76] transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center bg-[#C8A75E]/10 shrink-0">
            <Lightbulb className="h-5 w-5 text-[#C8A75E]" />
          </div>
          <div className="flex-1 pr-6">
            <p className="text-sm font-bold text-[#0c0f14] mb-1">Did You Know?</p>
            <p className="text-xs text-[#3a3f49] leading-relaxed">
              Per 49 CFR 382.701(b), a driver&apos;s general consent for <strong>limited queries</strong> may
              be effective for more than one year — including the duration of employment. Collect once
              at hire, run annual limited queries without re-collecting consent each year.
            </p>
            <p className="text-xs text-[#8b919a] leading-relaxed mt-1.5">
              This does not cover full queries. Pre-employment full queries (382.701(a)) and
              violation follow-up full queries (382.701(b)(3)) require the driver&apos;s separate
              electronic consent submitted through the FMCSA Clearinghouse portal (382.703(b)).
            </p>
            <Link
              href="/consents/new"
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-[#0c0f14] uppercase tracking-wider hover:text-[#C8A75E] transition-colors"
            >
              Send Limited Query Consent
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
