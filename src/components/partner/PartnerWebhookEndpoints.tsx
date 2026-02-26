'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';

interface WebhookEndpointInfo {
  id: string;
  url: string;
  description: string | null;
  events: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PartnerWebhookEndpointsProps {
  endpoints: WebhookEndpointInfo[];
}

export function PartnerWebhookEndpoints({ endpoints }: PartnerWebhookEndpointsProps) {
  const [creating, setCreating] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    'consent.signed',
    'consent.delivered',
    'consent.failed',
    'consent.revoked',
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<WebhookEndpointInfo[]>(endpoints);
  const [toggling, setToggling] = useState<string | null>(null);

  const ALL_EVENTS = [
    'consent.created',
    'consent.sent',
    'consent.delivered',
    'consent.opened',
    'consent.signed',
    'consent.failed',
    'consent.expired',
    'consent.revoked',
  ] as const;

  async function handleCreate() {
    setError(null);
    if (!url.startsWith('https://')) {
      setError('URL must use HTTPS.');
      return;
    }
    if (selectedEvents.length === 0) {
      setError('Select at least one event type.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          events: selectedEvents,
          description: description || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Failed to create endpoint.');
        return;
      }

      const { data } = await res.json();
      setNewSecret(data.secret);
      setItems((prev) => [
        {
          id: data.id,
          url: data.url,
          description: data.description,
          events: data.events,
          is_active: data.is_active,
          created_at: data.created_at,
          updated_at: data.updated_at,
        },
        ...prev,
      ]);
      setUrl('');
      setDescription('');
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(id: string, currentActive: boolean) {
    setToggling(id);
    try {
      const res = await fetch(`/api/v1/webhooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentActive }),
      });

      if (res.ok) {
        setItems((prev) =>
          prev.map((ep) =>
            ep.id === id ? { ...ep, is_active: !currentActive } : ep,
          ),
        );
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setToggling(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this webhook endpoint? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/v1/webhooks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((ep) => ep.id !== id));
      }
    } catch {
      // Silently fail
    }
  }

  function toggleEvent(event: string) {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event],
    );
  }

  return (
    <div className="space-y-4">
      {/* Secret reveal banner */}
      {newSecret && (
        <div className="bg-amber-50 border border-amber-200 p-4">
          <p className="text-sm font-bold text-amber-800 mb-1">
            Webhook Secret — Copy this now, it won&apos;t be shown again
          </p>
          <code className="block text-xs bg-white border border-amber-200 px-3 py-2 text-amber-900 break-all select-all">
            {newSecret}
          </code>
          <button
            onClick={() => setNewSecret(null)}
            className="mt-2 text-xs text-amber-700 hover:text-amber-900 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create form */}
      {creating ? (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#3a3f49] mb-1">
                Endpoint URL (HTTPS required)
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-server.com/webhooks"
                className="w-full px-3 py-2 text-sm border border-[#d4d4cf] bg-white focus:outline-none focus:ring-2 focus:ring-[#0c0f14]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#3a3f49] mb-1">
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Production consent notifications"
                className="w-full px-3 py-2 text-sm border border-[#d4d4cf] bg-white focus:outline-none focus:ring-2 focus:ring-[#0c0f14]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#3a3f49] mb-2">
                Events
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_EVENTS.map((event) => (
                  <button
                    key={event}
                    type="button"
                    onClick={() => toggleEvent(event)}
                    className={`px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider border transition-colors ${
                      selectedEvents.includes(event)
                        ? 'bg-[#0c0f14] text-white border-[#0c0f14]'
                        : 'bg-white text-[#6b6f76] border-[#d4d4cf] hover:border-[#0c0f14]'
                    }`}
                  >
                    {event}
                  </button>
                ))}
              </div>
            </div>
            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="px-4 py-2 text-sm font-bold bg-[#0c0f14] text-white hover:bg-[#1a1e26] disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Creating...' : 'Create Endpoint'}
              </button>
              <button
                onClick={() => {
                  setCreating(false);
                  setError(null);
                }}
                className="px-4 py-2 text-sm font-medium text-[#6b6f76] hover:text-[#0c0f14] transition-colors"
              >
                Cancel
              </button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="px-4 py-2 text-sm font-bold bg-[#0c0f14] text-white hover:bg-[#1a1e26] transition-colors"
        >
          + Add Endpoint
        </button>
      )}

      {/* Endpoints table */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-[#8b919a]">
              No webhook endpoints configured. Add an endpoint to receive
              real-time consent event notifications.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((ep) => (
                  <TableRow key={ep.id}>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        <code className="text-xs text-[#3a3f49]">{ep.url}</code>
                        {ep.description && (
                          <p className="text-xs text-[#8b919a] mt-0.5 truncate">
                            {ep.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {ep.events.length <= 3 ? (
                          ep.events.map((e) => (
                            <Badge key={e} variant="outline" className="text-[0.6rem]">
                              {e.replace('consent.', '')}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline" className="text-[0.6rem]">
                            {ep.events.length} events
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-[#8b919a] whitespace-nowrap text-xs">
                      {formatDate(ep.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ep.is_active ? 'success' : 'secondary'}>
                        {ep.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleToggle(ep.id, ep.is_active)}
                          disabled={toggling === ep.id}
                          className="text-xs text-[#6b6f76] hover:text-[#0c0f14] disabled:opacity-50 transition-colors"
                        >
                          {ep.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleDelete(ep.id)}
                          className="text-xs text-red-500 hover:text-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
