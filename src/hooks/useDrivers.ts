'use client';

import { useState, useCallback } from 'react';
import type {
  CreateDriverRequest,
  UpdateDriverRequest,
  DriverFilters,
  CSVImportResult,
} from '@/types/driver';
import type { Database } from '@/types/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DriverRow = Database['public']['Tables']['drivers']['Row'];

interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

interface UseDriversReturn {
  drivers: DriverRow[];
  pagination: PaginationMeta | null;
  loading: boolean;
  error: string | null;
  fetchDrivers: (filters?: DriverFilters & { page?: number; per_page?: number }) => Promise<void>;
  createDriver: (data: CreateDriverRequest) => Promise<DriverRow | null>;
  updateDriver: (id: string, data: UpdateDriverRequest) => Promise<DriverRow | null>;
  deleteDriver: (id: string) => Promise<boolean>;
  importDrivers: (file: File) => Promise<CSVImportResult | null>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDrivers(): UseDriversReturn {
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // fetchDrivers
  // -------------------------------------------------------------------------

  const fetchDrivers = useCallback(
    async (filters?: DriverFilters & { page?: number; per_page?: number }) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        if (filters?.search) params.set('search', filters.search);
        if (filters?.is_active !== undefined) {
          params.set('is_active', String(filters.is_active));
        }
        if (filters?.page) params.set('page', String(filters.page));
        if (filters?.per_page) params.set('per_page', String(filters.per_page));

        const qs = params.toString();
        const url = `/api/drivers${qs ? `?${qs}` : ''}`;

        const res = await fetch(url);
        const json = await res.json();

        if (!res.ok) {
          setError(json?.message ?? 'Failed to fetch drivers.');
          return;
        }

        setDrivers(json.data ?? []);
        setPagination(json.pagination ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch drivers.');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // -------------------------------------------------------------------------
  // createDriver
  // -------------------------------------------------------------------------

  const createDriver = useCallback(
    async (data: CreateDriverRequest): Promise<DriverRow | null> => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/drivers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const json = await res.json();

        if (!res.ok) {
          setError(json?.message ?? 'Failed to create driver.');
          return null;
        }

        const created = json.data as DriverRow;

        // Prepend to local list
        setDrivers((prev) => [created, ...prev]);

        return created;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create driver.');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // -------------------------------------------------------------------------
  // updateDriver
  // -------------------------------------------------------------------------

  const updateDriver = useCallback(
    async (id: string, data: UpdateDriverRequest): Promise<DriverRow | null> => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/drivers/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const json = await res.json();

        if (!res.ok) {
          setError(json?.message ?? 'Failed to update driver.');
          return null;
        }

        const updated = json.data as DriverRow;

        // Update local list
        setDrivers((prev) => prev.map((d) => (d.id === id ? updated : d)));

        return updated;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update driver.');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // -------------------------------------------------------------------------
  // deleteDriver (soft-delete)
  // -------------------------------------------------------------------------

  const deleteDriver = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/drivers/${id}`, {
        method: 'DELETE',
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json?.message ?? 'Failed to deactivate driver.');
        return false;
      }

      // Update local list — mark as inactive
      setDrivers((prev) =>
        prev.map((d) => (d.id === id ? { ...d, is_active: false } : d)),
      );

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate driver.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // importDrivers (CSV upload)
  // -------------------------------------------------------------------------

  const importDrivers = useCallback(
    async (file: File): Promise<CSVImportResult | null> => {
      setLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/drivers/import', {
          method: 'POST',
          body: formData,
        });

        const json = await res.json();

        if (!res.ok) {
          setError(json?.message ?? 'Failed to import drivers.');
          return null;
        }

        return json.data as CSVImportResult;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to import drivers.');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    drivers,
    pagination,
    loading,
    error,
    fetchDrivers,
    createDriver,
    updateDriver,
    deleteDriver,
    importDrivers,
  };
}
