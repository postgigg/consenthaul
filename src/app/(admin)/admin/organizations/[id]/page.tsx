'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';

interface OrgDetail {
  organization: Record<string, unknown>;
  members: Array<Record<string, unknown>>;
  creditBalance: { balance: number; lifetime_purchased: number; lifetime_used: number };
  consents: Array<Record<string, unknown>>;
  recentTransactions: Array<Record<string, unknown>>;
}

const statusColors: Record<string, 'success' | 'warning' | 'destructive' | 'secondary' | 'gold'> = {
  signed: 'success',
  pending: 'warning',
  sent: 'gold',
  delivered: 'gold',
  expired: 'secondary',
  failed: 'destructive',
};

export default function OrgDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDesc, setCreditDesc] = useState('');
  const [addingCredits, setAddingCredits] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/organizations/${id}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAddCredits() {
    setAddingCredits(true);
    try {
      await fetch(`/api/admin/organizations/${id}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: creditAmount, description: creditDesc }),
      });
      // Refresh data
      const res = await fetch(`/api/admin/organizations/${id}`);
      setData(await res.json());
      setCreditDialogOpen(false);
      setCreditAmount('');
      setCreditDesc('');
    } catch (err) {
      console.error(err);
    } finally {
      setAddingCredits(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-[#8b919a]">
        Loading organization...
      </div>
    );
  }

  const org = data.organization;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/organizations"
        className="inline-flex items-center gap-1 text-sm text-[#8b919a] hover:text-[#3a3f49]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Organizations
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0c0f14]">{org.name as string}</h2>
          <p className="text-sm text-[#8b919a]">
            DOT: {(org.dot_number as string) || '---'} &middot; MC: {(org.mc_number as string) || '---'}
          </p>
        </div>
        <Button variant="gold" size="sm" onClick={() => setCreditDialogOpen(true)}>
          Add Credits
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="border border-[#e8e8e3] bg-white p-4">
          <p className="text-xs text-[#8b919a] uppercase tracking-wider font-semibold">Members</p>
          <p className="text-xl font-bold text-[#0c0f14] mt-1">{data.members.length}</p>
        </div>
        <div className="border border-[#e8e8e3] bg-white p-4">
          <p className="text-xs text-[#8b919a] uppercase tracking-wider font-semibold">Credits</p>
          <p className="text-xl font-bold text-[#0c0f14] mt-1">{data.creditBalance.balance}</p>
        </div>
        <div className="border border-[#e8e8e3] bg-white p-4">
          <p className="text-xs text-[#8b919a] uppercase tracking-wider font-semibold">Purchased</p>
          <p className="text-xl font-bold text-[#0c0f14] mt-1">{data.creditBalance.lifetime_purchased}</p>
        </div>
        <div className="border border-[#e8e8e3] bg-white p-4">
          <p className="text-xs text-[#8b919a] uppercase tracking-wider font-semibold">Used</p>
          <p className="text-xl font-bold text-[#0c0f14] mt-1">{data.creditBalance.lifetime_used}</p>
        </div>
      </div>

      {/* Members table */}
      <div className="border border-[#e8e8e3] bg-white">
        <div className="border-b border-[#e8e8e3] px-5 py-3">
          <h3 className="text-xs font-bold text-[#0c0f14] uppercase tracking-wider">Members</h3>
        </div>
        <div className="divide-y divide-[#f0f0ec]">
          {data.members.map((m) => (
            <div key={m.id as string} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-[#0c0f14]">{m.full_name as string}</p>
                <p className="text-xs text-[#8b919a]">{m.email as string}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={m.is_active ? 'success' : 'destructive'}>
                  {m.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="outline">{m.role as string}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent consents */}
      <div className="border border-[#e8e8e3] bg-white">
        <div className="border-b border-[#e8e8e3] px-5 py-3">
          <h3 className="text-xs font-bold text-[#0c0f14] uppercase tracking-wider">Recent Consents</h3>
        </div>
        <div className="divide-y divide-[#f0f0ec]">
          {data.consents.length === 0 ? (
            <p className="px-5 py-8 text-sm text-[#8b919a] text-center">No consents</p>
          ) : (
            data.consents.map((c) => (
              <div key={c.id as string} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-[#0c0f14]">
                    {(c.consent_type as string).replace('_', ' ')}
                  </p>
                  <p className="text-xs text-[#8b919a]">{formatDate(c.created_at as string)}</p>
                </div>
                <Badge variant={statusColors[c.status as string] ?? 'secondary'}>
                  {c.status as string}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Credit transactions */}
      <div className="border border-[#e8e8e3] bg-white">
        <div className="border-b border-[#e8e8e3] px-5 py-3">
          <h3 className="text-xs font-bold text-[#0c0f14] uppercase tracking-wider">Credit Transactions</h3>
        </div>
        <div className="divide-y divide-[#f0f0ec]">
          {data.recentTransactions.length === 0 ? (
            <p className="px-5 py-8 text-sm text-[#8b919a] text-center">No transactions</p>
          ) : (
            data.recentTransactions.map((t) => (
              <div key={t.id as string} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-[#0c0f14]">{t.description as string}</p>
                  <p className="text-xs text-[#8b919a]">{formatDate(t.created_at as string)}</p>
                </div>
                <span
                  className={`text-sm font-bold tabular-nums ${
                    (t.amount as number) > 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {(t.amount as number) > 0 ? '+' : ''}
                  {t.amount as number}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add credits dialog */}
      <Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Credits</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-[#0c0f14]">Amount</label>
              <Input
                type="number"
                placeholder="e.g. 50 or -10"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-[#8b919a] mt-1">Use negative numbers to deduct</p>
            </div>
            <div>
              <label className="text-sm font-medium text-[#0c0f14]">Description</label>
              <Input
                placeholder="Reason for adjustment"
                value={creditDesc}
                onChange={(e) => setCreditDesc(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCredits} disabled={addingCredits || !creditAmount}>
              {addingCredits ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Add Credits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
