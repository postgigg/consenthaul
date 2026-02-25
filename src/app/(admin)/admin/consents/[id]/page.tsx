'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

const statusColors: Record<string, 'success' | 'warning' | 'destructive' | 'secondary' | 'gold'> = {
  signed: 'success',
  pending: 'warning',
  sent: 'gold',
  delivered: 'gold',
  opened: 'gold',
  expired: 'secondary',
  revoked: 'destructive',
  failed: 'destructive',
};

interface ConsentDetail {
  id: string;
  status: string;
  consent_type: string;
  delivery_method: string;
  delivery_address: string;
  language: string;
  created_at: string;
  signed_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  signer_ip: string | null;
  signer_user_agent: string | null;
  consent_start_date: string;
  consent_end_date: string | null;
  organization_id: string;
  driver_id: string;
  created_by: string;
  [key: string]: unknown;
}

export default function ConsentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [consent, setConsent] = useState<ConsentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch single consent via the consents API with filter
    fetch(`/api/admin/consents?search=${id}&pageSize=1`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.length > 0) {
          setConsent(json.data[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#8b919a]">
        Loading consent...
      </div>
    );
  }

  if (!consent) {
    return (
      <div className="text-center py-16">
        <p className="text-[#8b919a]">Consent not found</p>
        <Link href="/admin/consents" className="text-sm text-[#C8A75E] hover:underline mt-2 block">
          Back to Consents
        </Link>
      </div>
    );
  }

  const fields = [
    { label: 'Status', value: <Badge variant={statusColors[consent.status] ?? 'secondary'}>{consent.status}</Badge> },
    { label: 'Type', value: consent.consent_type.replace('_', ' ') },
    { label: 'Delivery Method', value: consent.delivery_method },
    { label: 'Delivery Address', value: consent.delivery_address },
    { label: 'Language', value: consent.language },
    { label: 'Created', value: formatDate(consent.created_at) },
    { label: 'Consent Start', value: formatDate(consent.consent_start_date) },
    { label: 'Consent End', value: formatDate(consent.consent_end_date) },
    { label: 'Delivered At', value: formatDate(consent.delivered_at) },
    { label: 'Opened At', value: formatDate(consent.opened_at) },
    { label: 'Signed At', value: formatDate(consent.signed_at) },
    { label: 'Signer IP', value: consent.signer_ip || '---' },
    { label: 'Organization', value: (consent as Record<string, unknown>).organization_name as string || consent.organization_id },
    { label: 'Driver', value: (consent as Record<string, unknown>).driver_name as string || consent.driver_id },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/consents"
        className="inline-flex items-center gap-1 text-sm text-[#8b919a] hover:text-[#3a3f49]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Consents
      </Link>

      <div>
        <h2 className="text-lg font-bold text-[#0c0f14]">Consent Detail</h2>
        <p className="text-xs text-[#8b919a] font-mono mt-1">{consent.id}</p>
      </div>

      <div className="border border-[#e8e8e3] bg-white">
        <div className="divide-y divide-[#f0f0ec]">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-[#8b919a]">{f.label}</span>
              <span className="text-sm font-medium text-[#0c0f14]">
                {typeof f.value === 'string' ? f.value : f.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
