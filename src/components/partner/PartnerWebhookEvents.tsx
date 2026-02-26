'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import type { WebhookEventStatus } from '@/types/database';

interface WebhookEventInfo {
  id: string;
  endpoint_id: string;
  event_type: string;
  consent_id: string | null;
  status: WebhookEventStatus;
  attempts: number;
  max_attempts: number;
  response_status: number | null;
  error_message: string | null;
  created_at: string;
}

interface PartnerWebhookEventsProps {
  endpointId: string;
}

const STATUS_BADGE_MAP: Record<WebhookEventStatus, BadgeProps['variant']> = {
  pending: 'warning',
  delivering: 'warning',
  delivered: 'success',
  failed: 'destructive',
  exhausted: 'destructive',
};

export function PartnerWebhookEvents({ endpointId }: PartnerWebhookEventsProps) {
  const [events, setEvents] = useState<WebhookEventInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<Record<string, unknown> | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/v1/webhooks/${endpointId}/events?page=${page}&per_page=15`,
      );
      if (res.ok) {
        const data = await res.json();
        setEvents(data.data);
        setTotalPages(data.pagination.total_pages);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [endpointId, page]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  function toggleExpand(event: WebhookEventInfo) {
    if (expandedId === event.id) {
      setExpandedId(null);
      setExpandedDetails(null);
    } else {
      setExpandedId(event.id);
      setExpandedDetails({
        response_status: event.response_status,
        error_message: event.error_message,
        attempts: event.attempts,
        max_attempts: event.max_attempts,
      });
    }
  }

  if (loading && events.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-[#8b919a]">Loading delivery log...</p>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-[#8b919a]">
            No delivery events yet for this endpoint.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>HTTP</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <>
                  <TableRow
                    key={event.id}
                    className="cursor-pointer hover:bg-[#f8f8f6]"
                    onClick={() => toggleExpand(event)}
                  >
                    <TableCell>
                      <code className="text-xs text-[#3a3f49]">
                        {event.event_type}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_MAP[event.status]}>
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-[#8b919a]">
                      {event.attempts}/{event.max_attempts}
                    </TableCell>
                    <TableCell className="text-xs text-[#8b919a]">
                      {event.response_status ?? '—'}
                    </TableCell>
                    <TableCell className="text-xs text-[#8b919a] whitespace-nowrap">
                      {formatDate(event.created_at, {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </TableCell>
                  </TableRow>
                  {expandedId === event.id && expandedDetails && (
                    <TableRow key={`${event.id}-details`}>
                      <TableCell colSpan={5} className="bg-[#f8f8f6]">
                        <div className="text-xs space-y-1 p-2">
                          <p>
                            <span className="font-bold text-[#3a3f49]">Event ID:</span>{' '}
                            <code className="text-[#6b6f76]">{event.id}</code>
                          </p>
                          {event.consent_id && (
                            <p>
                              <span className="font-bold text-[#3a3f49]">Consent ID:</span>{' '}
                              <code className="text-[#6b6f76]">{event.consent_id}</code>
                            </p>
                          )}
                          {event.error_message && (
                            <p>
                              <span className="font-bold text-[#3a3f49]">Error:</span>{' '}
                              <span className="text-red-600">{event.error_message}</span>
                            </p>
                          )}
                          {event.response_status && (
                            <p>
                              <span className="font-bold text-[#3a3f49]">HTTP Status:</span>{' '}
                              {event.response_status}
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 border border-[#d4d4cf] text-[#6b6f76] hover:text-[#0c0f14] disabled:opacity-30 transition-colors"
          >
            Previous
          </button>
          <span className="text-[#8b919a]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 border border-[#d4d4cf] text-[#6b6f76] hover:text-[#0c0f14] disabled:opacity-30 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
