'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Copy,
  Check,
  Upload,
  Link2,
  Code2,
  Loader2,
  RefreshCw,
  Info,
} from 'lucide-react';

interface MigrationTransfer {
  id: string;
  token: string;
  label: string;
  uploaded_files: unknown[];
  total_bytes: number;
  carrier_count: number | null;
  driver_count: number | null;
  parsed_at: string | null;
  expires_at: string;
  created_at: string;
}

interface MigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTransfer: MigrationTransfer | null;
  isPartner: boolean;
  onTransferCreated: () => void;
}

export function MigrationDialog({
  open,
  onOpenChange,
  activeTransfer,
  isPartner,
  onTransferCreated,
}: MigrationDialogProps) {
  // If there's an active transfer, show the dashboard. Otherwise show purchase flow.
  if (activeTransfer) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Migration Dashboard</DialogTitle>
            <DialogDescription>
              Your migration is active. Use any of the options below to upload your data.
            </DialogDescription>
          </DialogHeader>
          <MigrationDashboard
            transfer={activeTransfer}
            onTokenRefreshed={onTransferCreated}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Migrate Your Fleet</DialogTitle>
          <DialogDescription>
            Bulk import your carrier and driver data. Upload CSVs or use the Migration API.
          </DialogDescription>
        </DialogHeader>
        <MigrationPurchase
          isPartner={isPartner}
          onTransferCreated={onTransferCreated}
        />
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Purchase flow (State A)
// ---------------------------------------------------------------------------

function MigrationPurchase({
  isPartner,
  onTransferCreated,
}: {
  isPartner: boolean;
  onTransferCreated: () => void;
}) {
  const [estimatedGb, setEstimatedGb] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pricePerGb = isPartner ? 17 : 35;
  const totalDollars = estimatedGb * pricePerGb;

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/billing/migration-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimated_gb: estimatedGb }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.message ?? 'Failed to create checkout session.');
        return;
      }

      // Redirect to Stripe Checkout
      const checkoutUrl = json.data?.checkout_url;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        setError('No checkout URL returned.');
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  // Trigger refresh after successful payment (called from parent via query param detection)
  void onTransferCreated;

  return (
    <div className="space-y-5">
      {/* Pricing callout */}
      <div className="border border-[#C8A75E]/30 bg-[#C8A75E]/5 px-4 py-3">
        <p className="text-sm font-medium text-[#0c0f14]">
          ${pricePerGb}/GB{' '}
          <span className="text-xs text-[#8b919a] font-normal">(1 GB minimum)</span>
        </p>
        {isPartner && (
          <p className="text-xs text-[#8b919a] mt-0.5">Partner pricing applied</p>
        )}
      </div>

      {/* GB input */}
      <div className="space-y-2">
        <label htmlFor="estimated_gb" className="text-sm font-medium text-[#0c0f14]">
          Estimated data size (GB)
        </label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEstimatedGb(Math.max(1, estimatedGb - 1))}
            disabled={estimatedGb <= 1}
          >
            &minus;
          </Button>
          <Input
            id="estimated_gb"
            type="number"
            min={1}
            value={estimatedGb}
            onChange={(e) => setEstimatedGb(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 text-center"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEstimatedGb(estimatedGb + 1)}
          >
            +
          </Button>
        </div>
      </div>

      {/* Total */}
      <div className="border border-[#e8e8e3] bg-[#fafaf8] px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-[#6b6f76]">Total</span>
        <span className="text-lg font-bold text-[#0c0f14]">${totalDollars.toLocaleString()}</span>
      </div>

      {/* Error */}
      {error && (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {/* CTA */}
      <Button onClick={handleCheckout} disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirecting to checkout...
          </>
        ) : (
          'Pay & Start Migration'
        )}
      </Button>

      {/* Info box */}
      <div className="flex items-start gap-2 text-xs text-[#8b919a]">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <p>Under 50 drivers? Use the free CSV import instead.</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Migration Dashboard (State B)
// ---------------------------------------------------------------------------

function MigrationDashboard({
  transfer,
  onTokenRefreshed,
}: {
  transfer: MigrationTransfer;
  onTokenRefreshed: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const isExpired = new Date(transfer.expires_at) < new Date();
  const expiresDate = new Date(transfer.expires_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const uploadUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/tms/upload/${transfer.token}`;

  async function handleRefreshToken() {
    setRefreshing(true);
    try {
      const res = await fetch('/api/tms/upload-migration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: transfer.id }),
      });
      if (res.ok) {
        onTokenRefreshed();
      }
    } catch {
      // silently fail — user can try again
    } finally {
      setRefreshing(false);
    }
  }

  const totalMB = (transfer.total_bytes / (1024 * 1024)).toFixed(2);

  return (
    <div className="space-y-5">
      {/* Token display */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-[#6b6f76] uppercase tracking-wider">
          Transfer Token
        </label>
        <div className="flex items-center gap-2">
          <code className="flex-1 border border-[#e8e8e3] bg-[#fafaf8] px-3 py-2 text-sm font-mono text-[#0c0f14] truncate">
            {transfer.token}
          </code>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(transfer.token, 'token')}
          >
            {copied === 'token' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-[#8b919a]">
          {isExpired ? (
            <span className="text-red-600">Expired</span>
          ) : (
            <>Expires {expiresDate}</>
          )}
        </p>
      </div>

      {/* Upload stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Files" value={String(Array.isArray(transfer.uploaded_files) ? transfer.uploaded_files.length : 0)} />
        <StatCard label="Size" value={`${totalMB} MB`} />
        <StatCard label="Carriers" value={transfer.carrier_count != null ? String(transfer.carrier_count) : '—'} />
        <StatCard label="Drivers" value={transfer.driver_count != null ? String(transfer.driver_count) : '—'} />
      </div>

      {/* Option cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-[#0c0f14]">Upload Options</h3>

        {/* Dashboard upload */}
        <div className="border border-[#e8e8e3] px-4 py-3 flex items-start gap-3">
          <Upload className="h-5 w-5 text-[#6b6f76] mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#0c0f14]">Upload via Dashboard</p>
            <p className="text-xs text-[#8b919a] mt-0.5">
              Drag & drop CSV files directly in the upload portal
            </p>
            <a
              href={`/tms/upload/${transfer.token}`}
              className="inline-block mt-2 text-xs font-medium text-[#0c0f14] hover:text-[#C8A75E] transition-colors"
            >
              Open Upload Portal &rarr;
            </a>
          </div>
        </div>

        {/* Secure link */}
        <div className="border border-[#e8e8e3] px-4 py-3 flex items-start gap-3">
          <Link2 className="h-5 w-5 text-[#6b6f76] mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#0c0f14]">Secure Upload Link</p>
            <p className="text-xs text-[#8b919a] mt-0.5">
              Share this link with anyone who needs to upload data
            </p>
            <div className="flex items-center gap-2 mt-2">
              <code className="flex-1 text-xs font-mono text-[#6b6f76] truncate">
                {uploadUrl}
              </code>
              <button
                type="button"
                onClick={() => copyToClipboard(uploadUrl, 'url')}
                className="text-xs text-[#0c0f14] hover:text-[#C8A75E] transition-colors shrink-0"
              >
                {copied === 'url' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* API */}
        <div className="border border-[#e8e8e3] px-4 py-3 flex items-start gap-3">
          <Code2 className="h-5 w-5 text-[#6b6f76] mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#0c0f14]">Migration API</p>
            <p className="text-xs text-[#8b919a] mt-0.5">
              Programmatically push data via the ingest endpoint
            </p>
            <pre className="mt-2 text-[0.65rem] bg-[#fafaf8] border border-[#e8e8e3] p-2 overflow-x-auto font-mono text-[#3a3f49]">
{`curl -X POST /api/tms/migration/ingest \\
  -H "X-Transfer-Token: ${transfer.token}" \\
  -H "Content-Type: application/json" \\
  -d '{"type":"drivers","records":[...]}'`}
            </pre>
          </div>
        </div>
      </div>

      {/* Refresh token button */}
      {isExpired && (
        <Button
          variant="outline"
          onClick={handleRefreshToken}
          disabled={refreshing}
          className="w-full"
        >
          {refreshing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating new token...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Request New Token
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small stat card
// ---------------------------------------------------------------------------

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#e8e8e3] bg-[#fafaf8] px-3 py-2 text-center">
      <p className="text-lg font-bold text-[#0c0f14]">{value}</p>
      <p className="text-[0.65rem] text-[#8b919a] uppercase tracking-wider">{label}</p>
    </div>
  );
}
