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
              Per 49 CFR 382.701, you can collect one <strong>blanket consent</strong> at hire that covers the entire duration of employment.
              No need to re-collect consent annually — one signature covers all future limited queries.
            </p>
            <Link
              href="/consents/new"
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-[#0c0f14] uppercase tracking-wider hover:text-[#C8A75E] transition-colors"
            >
              Send Blanket Consent Now
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
