'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ConsentTable } from '@/components/consent/ConsentTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function ConsentsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0c0f14]">Consents</h1>
          <p className="mt-1 text-sm text-[#8b919a]">
            Track and manage all FMCSA Clearinghouse consent requests.
          </p>
        </div>
        <Button asChild>
          <Link href="/consents/new">
            <Plus className="h-4 w-4" />
            New Consent
          </Link>
        </Button>
      </div>

      {/* Consent table */}
      <ConsentTable onView={(consentId) => router.push(`/consents/${consentId}`)} />
    </div>
  );
}
