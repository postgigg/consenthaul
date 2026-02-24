'use client';

import Link from 'next/link';
import { ConsentForm } from '@/components/consent/ConsentForm';
import { ArrowLeft } from 'lucide-react';

export default function NewConsentPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Link
          href="/consents"
          className="inline-flex items-center gap-1 text-sm text-[#8b919a] hover:text-[#3a3f49] transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Consents
        </Link>
        <h1 className="text-2xl font-bold text-[#0c0f14]">New Consent Request</h1>
        <p className="mt-1 text-sm text-[#8b919a]">
          Create and send an FMCSA Clearinghouse consent form to a driver for
          electronic signature. One credit will be deducted from your balance.
        </p>
      </div>

      {/* Instructions */}
      <div className="border border-[#e8e8e3] bg-[#fafaf8] px-4 py-3">
        <h2 className="text-sm font-medium text-[#0c0f14]">How it works</h2>
        <ol className="mt-2 space-y-1 text-xs text-[#3a3f49] list-decimal list-inside">
          <li>Select a driver from your roster</li>
          <li>Choose the consent type and delivery method</li>
          <li>
            The driver receives a secure signing link via SMS, WhatsApp, or Email
          </li>
          <li>
            Once signed, a tamper-proof PDF is generated and stored for compliance
          </li>
        </ol>
      </div>

      {/* Consent form */}
      <div className="max-w-2xl">
        <ConsentForm
          onSuccess={() => {
            // Stay on the page so user can see the signing URL;
            // optionally navigate after a delay
          }}
        />
      </div>
    </div>
  );
}
