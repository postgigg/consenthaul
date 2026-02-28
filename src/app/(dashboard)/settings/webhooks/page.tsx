'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';
import {
  Plus,
  Webhook,
  Loader2,
  Trash2,
  Pencil,
  Check,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

const WEBHOOK_EVENTS = [
  { value: 'consent.created', label: 'Consent Created' },
  { value: 'consent.signed', label: 'Consent Signed' },
  { value: 'consent.expired', label: 'Consent Expired' },
  { value: 'consent.revoked', label: 'Consent Revoked' },
  { value: 'consent.failed', label: 'Consent Failed' },
  { value: 'driver.created', label: 'Driver Created' },
  { value: 'driver.updated', label: 'Driver Updated' },
  { value: 'query.completed', label: 'Query Completed' },
  { value: 'query.violation_found', label: 'Violation Found' },
] as const;

interface WebhookEndpoint {
  id: string;
  organization_id: string;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface WebhookDelivery {
  id: string;
  webhook_endpoint_id: string;
  event_type: string;
  status_code: number | null;
  success: boolean;
  created_at: string;
  response_body: string | null;
}

export default function WebhooksSettingsPage() {
  const supabase = createClient();
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState('');

  // Create / edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [endpointUrl, setEndpointUrl] = useState('');
  const [endpointDescription, setEndpointDescription] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  // Secret visibility
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());

  // Copied state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Delivery history
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyEndpointId, setHistoryEndpointId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);
  const [deliveryPage, setDeliveryPage] = useState(1);
  const [deliveryTotalPages, setDeliveryTotalPages] = useState(1);

  // Feedback
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  function showFeedback(type: 'error' | 'success', message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  }

  const fetchEndpoints = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      if (!profile) return;

      setOrgId(profile.organization_id);

      const { data } = await supabase
        .from('webhook_endpoints')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      setEndpoints((data ?? []) as WebhookEndpoint[]);
    } catch {
      showFeedback('error', 'Failed to load webhook endpoints.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchEndpoints();
  }, [fetchEndpoints]);

  function toggleEvent(event: string) {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event],
    );
  }

  function openCreateDialog() {
    setEditingId(null);
    setEndpointUrl('');
    setEndpointDescription('');
    setSelectedEvents([]);
    setDialogError(null);
    setDialogOpen(true);
  }

  function openEditDialog(endpoint: WebhookEndpoint) {
    setEditingId(endpoint.id);
    setEndpointUrl(endpoint.url);
    setEndpointDescription(endpoint.description ?? '');
    setSelectedEvents([...endpoint.events]);
    setDialogError(null);
    setDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!endpointUrl.trim()) {
      setDialogError('Endpoint URL is required.');
      return;
    }

    try {
      new URL(endpointUrl.trim());
    } catch {
      setDialogError('Please enter a valid URL.');
      return;
    }

    if (selectedEvents.length === 0) {
      setDialogError('Select at least one event.');
      return;
    }

    setSaving(true);
    setDialogError(null);

    try {
      if (editingId) {
        const { error } = await supabase
          .from('webhook_endpoints')
          .update({
            url: endpointUrl.trim(),
            description: endpointDescription.trim() || null,
            events: selectedEvents,
          })
          .eq('id', editingId);

        if (error) {
          setDialogError(error.message);
          return;
        }

        showFeedback('success', 'Webhook endpoint updated.');
      } else {
        // Generate a secret for the new endpoint
        const secret = `whsec_${crypto.randomUUID().replace(/-/g, '')}`;

        const { error } = await supabase
          .from('webhook_endpoints')
          .insert({
            organization_id: orgId,
            url: endpointUrl.trim(),
            description: endpointDescription.trim() || null,
            events: selectedEvents,
            secret,
            is_active: true,
          });

        if (error) {
          setDialogError(error.message);
          return;
        }

        showFeedback('success', 'Webhook endpoint created.');
      }

      setDialogOpen(false);
      fetchEndpoints();
    } catch {
      setDialogError('An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(endpoint: WebhookEndpoint) {
    try {
      await supabase
        .from('webhook_endpoints')
        .update({ is_active: !endpoint.is_active })
        .eq('id', endpoint.id);

      fetchEndpoints();
    } catch {
      showFeedback('error', 'Failed to update endpoint status.');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this webhook endpoint? This cannot be undone.')) {
      return;
    }

    try {
      await supabase.from('webhook_endpoints').delete().eq('id', id);
      showFeedback('success', 'Webhook endpoint deleted.');
      fetchEndpoints();
    } catch {
      showFeedback('error', 'Failed to delete endpoint.');
    }
  }

  function toggleSecretVisibility(id: string) {
    setVisibleSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function copySecret(secret: string, id: string) {
    await navigator.clipboard.writeText(secret);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function openDeliveryHistory(endpointId: string) {
    setHistoryEndpointId(endpointId);
    setDeliveryPage(1);
    setHistoryOpen(true);
    await fetchDeliveries(endpointId, 1);
  }

  async function fetchDeliveries(endpointId: string, page: number) {
    setDeliveriesLoading(true);
    try {
      const perPage = 10;
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      const { data, count } = await supabase
        .from('webhook_deliveries')
        .select('*', { count: 'exact' })
        .eq('webhook_endpoint_id', endpointId)
        .order('created_at', { ascending: false })
        .range(from, to);

      setDeliveries((data ?? []) as WebhookDelivery[]);
      setDeliveryTotalPages(Math.ceil((count ?? 0) / perPage) || 1);
    } catch {
      setDeliveries([]);
    } finally {
      setDeliveriesLoading(false);
    }
  }

  useEffect(() => {
    if (historyEndpointId && historyOpen) {
      fetchDeliveries(historyEndpointId, deliveryPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryPage]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0c0f14]">Webhooks</h1>
          <p className="mt-1 text-sm text-[#8b919a]">
            Manage webhook endpoints to receive real-time event notifications.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          Add Endpoint
        </Button>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`px-4 py-3 text-sm border ${
            feedback.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-green-200 bg-green-50 text-green-700'
          }`}
          role="alert"
        >
          {feedback.message}
        </div>
      )}

      {/* Info banner */}
      <div className="border border-[#e8e8e3] bg-[#fafaf8] px-4 py-3">
        <p className="text-sm text-[#0c0f14]">
          Webhooks send HTTP POST requests to your server when events occur in ConsentHaul.
          Each delivery includes a signature header (<code className="font-mono text-xs bg-[#f0f0ec] px-1 py-0.5">X-Webhook-Signature</code>)
          for verification.
        </p>
      </div>

      {/* Endpoints table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#0c0f14]" />
            </div>
          ) : endpoints.length === 0 ? (
            <div className="py-16 text-center">
              <Webhook className="mx-auto h-10 w-10 text-[#d4d4cf] mb-3" />
              <p className="text-sm text-[#8b919a] mb-4">
                No webhook endpoints configured yet.
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4" />
                Add Your First Endpoint
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead className="hidden sm:table-cell">Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Secret</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoints.map((endpoint) => (
                  <TableRow key={endpoint.id}>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="font-medium text-[#0c0f14] truncate text-sm">
                          {endpoint.url}
                        </p>
                        {endpoint.description && (
                          <p className="text-xs text-[#8b919a] truncate mt-0.5">
                            {endpoint.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {endpoint.events.slice(0, 2).map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                        {endpoint.events.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{endpoint.events.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={endpoint.is_active ? 'success' : 'secondary'}>
                        {endpoint.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-[#8b919a]">
                          {visibleSecrets.has(endpoint.id)
                            ? endpoint.secret
                            : `${endpoint.secret?.slice(0, 10)}${'*'.repeat(16)}`}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSecretVisibility(endpoint.id)}
                          aria-label={visibleSecrets.has(endpoint.id) ? 'Hide secret' : 'Show secret'}
                        >
                          {visibleSecrets.has(endpoint.id) ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copySecret(endpoint.secret, endpoint.id)}
                          aria-label="Copy secret"
                        >
                          {copiedId === endpoint.id ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-[#8b919a] text-sm">
                      {formatDate(endpoint.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeliveryHistory(endpoint.id)}
                          aria-label="View delivery history"
                        >
                          <Clock className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(endpoint)}
                          aria-label="Edit endpoint"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(endpoint)}
                          aria-label={endpoint.is_active ? 'Disable' : 'Enable'}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(endpoint.id)}
                          aria-label="Delete endpoint"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) setDialogOpen(false);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Webhook Endpoint' : 'Add Webhook Endpoint'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update the URL or subscribed events for this endpoint.'
                : 'Configure a new webhook endpoint to receive event notifications.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            {/* URL */}
            <div className="space-y-1.5">
              <label htmlFor="webhook-url" className="text-sm font-medium text-[#3a3f49]">
                Endpoint URL <span className="text-red-500">*</span>
              </label>
              <Input
                id="webhook-url"
                type="url"
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                placeholder="https://example.com/webhooks/consenthaul"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="webhook-desc" className="text-sm font-medium text-[#3a3f49]">
                Description
              </label>
              <Input
                id="webhook-desc"
                value={endpointDescription}
                onChange={(e) => setEndpointDescription(e.target.value)}
                placeholder="e.g., Production TMS integration"
              />
            </div>

            {/* Events */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#3a3f49]">
                Events <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-[#8b919a]">
                Select which events should trigger a delivery to this endpoint.
              </p>
              <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                {WEBHOOK_EVENTS.map((event) => (
                  <label
                    key={event.value}
                    className="flex items-center gap-2 text-sm text-[#3a3f49] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event.value)}
                      onChange={() => toggleEvent(event.value)}
                      className="h-4 w-4 rounded border-[#d4d4cf] text-[#0c0f14] focus:ring-[#0c0f14]"
                    />
                    {event.label}
                    <span className="text-xs text-[#b5b5ae] font-mono">
                      ({event.value})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {dialogError && (
              <div
                className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {dialogError}
              </div>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Webhook className="h-4 w-4" />
                    {editingId ? 'Update Endpoint' : 'Create Endpoint'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delivery history dialog */}
      <Dialog
        open={historyOpen}
        onOpenChange={(open) => {
          if (!open) setHistoryOpen(false);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Delivery History</DialogTitle>
            <DialogDescription>
              Recent webhook deliveries for this endpoint.
            </DialogDescription>
          </DialogHeader>

          {deliveriesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-[#0c0f14]" />
            </div>
          ) : deliveries.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#8b919a]">
              No deliveries recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {deliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="flex items-center justify-between border border-[#e8e8e3] px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    {delivery.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-[#0c0f14]">
                        {delivery.event_type}
                      </p>
                      <p className="text-xs text-[#8b919a]">
                        {formatDate(delivery.created_at, {
                          hour: 'numeric',
                          minute: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={delivery.success ? 'success' : 'destructive'}
                  >
                    {delivery.status_code ?? 'ERR'}
                  </Badge>
                </div>
              ))}

              {/* Pagination */}
              {deliveryTotalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-[#8b919a]">
                    Page {deliveryPage} of {deliveryTotalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeliveryPage((p) => Math.max(1, p - 1))}
                      disabled={deliveryPage === 1}
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeliveryPage((p) => Math.min(deliveryTotalPages, p + 1))}
                      disabled={deliveryPage === deliveryTotalPages}
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
