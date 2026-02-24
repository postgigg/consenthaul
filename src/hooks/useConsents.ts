'use client';

import { useState, useCallback } from 'react';
import type { ConsentFilters, ConsentResponse, CreateConsentRequest } from '@/types/consent';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

interface UseConsentsReturn {
  consents: ConsentResponse[];
  pagination: PaginationMeta | null;
  loading: boolean;
  error: string | null;
  fetchConsents: (filters?: ConsentFilters & { page?: number; per_page?: number }) => Promise<void>;
  createConsent: (data: CreateConsentRequest) => Promise<ConsentResponse | null>;
  revokeConsent: (id: string) => Promise<boolean>;
  resendConsent: (id: string) => Promise<boolean>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useConsents(): UseConsentsReturn {
  const [consents, setConsents] = useState<ConsentResponse[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // fetchConsents
  // -------------------------------------------------------------------------

  const fetchConsents = useCallback(
    async (filters?: ConsentFilters & { page?: number; per_page?: number }) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        if (filters?.status) params.set('status', filters.status);
        if (filters?.driver_id) params.set('driver_id', filters.driver_id);
        if (filters?.created_after) params.set('created_after', filters.created_after);
        if (filters?.created_before) params.set('created_before', filters.created_before);
        if (filters?.page) params.set('page', String(filters.page));
        if (filters?.per_page) params.set('per_page', String(filters.per_page));

        const qs = params.toString();
        const url = `/api/consents${qs ? `?${qs}` : ''}`;

        const res = await fetch(url);
        const json = await res.json();

        if (!res.ok) {
          setError(json?.message ?? 'Failed to fetch consents.');
          return;
        }

        setConsents(json.data ?? []);
        setPagination(json.pagination ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch consents.');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // -------------------------------------------------------------------------
  // createConsent
  // -------------------------------------------------------------------------

  const createConsent = useCallback(
    async (data: CreateConsentRequest): Promise<ConsentResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/consents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const json = await res.json();

        if (!res.ok) {
          setError(json?.message ?? 'Failed to create consent.');
          return null;
        }

        const created = json.data as ConsentResponse;

        // Prepend to the local list so the UI updates immediately
        setConsents((prev) => [created, ...prev]);

        return created;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create consent.');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // -------------------------------------------------------------------------
  // revokeConsent
  // -------------------------------------------------------------------------

  const revokeConsent = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/consents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'revoked' }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json?.message ?? 'Failed to revoke consent.');
        return false;
      }

      // Update the local list
      setConsents((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'revoked' as const } : c)),
      );

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke consent.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // resendConsent
  // -------------------------------------------------------------------------

  const resendConsent = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/consents/${id}/resend`, {
        method: 'POST',
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json?.message ?? 'Failed to resend consent.');
        return false;
      }

      // Update the local status to 'sent'
      setConsents((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'sent' as const } : c)),
      );

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend consent.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    consents,
    pagination,
    loading,
    error,
    fetchConsents,
    createConsent,
    revokeConsent,
    resendConsent,
  };
}
