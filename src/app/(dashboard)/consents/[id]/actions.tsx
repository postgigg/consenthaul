'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileDown, XCircle } from 'lucide-react';
import type { Database } from '@/types/database';

type ConsentRow = Database['public']['Tables']['consents']['Row'];

interface ConsentDetailActionsProps {
  consent: ConsentRow;
}

export function ConsentDetailActions({ consent }: ConsentDetailActionsProps) {
  const router = useRouter();
  const [resending, setResending] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const isPending = ['pending', 'sent', 'delivered', 'opened'].includes(consent.status);
  const isSigned = consent.status === 'signed';

  async function handleResend() {
    setResending(true);
    try {
      const res = await fetch(`/api/consents/${consent.id}/resend`, {
        method: 'POST',
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // Silently fail
    } finally {
      setResending(false);
    }
  }

  async function handleRevoke() {
    if (
      !confirm(
        'Are you sure you want to revoke this consent request? This action cannot be undone.',
      )
    ) {
      return;
    }

    setRevoking(true);
    try {
      const res = await fetch(`/api/consents/${consent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'revoked' }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // Silently fail
    } finally {
      setRevoking(false);
    }
  }

  async function handleDownloadPDF() {
    try {
      const res = await fetch(`/api/consents/${consent.id}/pdf`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank', 'noopener');
      }
    } catch {
      // Silently fail
    }
  }

  return (
    <div className="flex items-center gap-2">
      {isPending && (
        <>
          <Button
            variant="outline"
            onClick={handleResend}
            disabled={resending}
          >
            <RefreshCw className={`h-4 w-4 ${resending ? 'animate-spin' : ''}`} />
            {resending ? 'Resending...' : 'Resend'}
          </Button>
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleRevoke}
            disabled={revoking}
          >
            <XCircle className="h-4 w-4" />
            {revoking ? 'Revoking...' : 'Revoke'}
          </Button>
        </>
      )}
      {isSigned && (
        <Button variant="outline" onClick={handleDownloadPDF}>
          <FileDown className="h-4 w-4" />
          Download PDF
        </Button>
      )}
    </div>
  );
}
