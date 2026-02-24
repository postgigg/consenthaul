'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ConsentStatus } from '@/types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RealtimeConsentUpdate {
  consent_id: string;
  status: ConsentStatus;
  signed_at: string | null;
  updated_at: string;
}

interface UseRealtimeConsentsOptions {
  /** Called whenever a consent row changes. */
  onUpdate?: (update: RealtimeConsentUpdate) => void;
}

interface UseRealtimeConsentsReturn {
  /** The most recent consent update received via realtime. */
  latestUpdate: RealtimeConsentUpdate | null;
}

interface UseRealtimeCreditsReturn {
  /** The current realtime credit balance (null until the first update). */
  balance: number | null;
}

// ---------------------------------------------------------------------------
// useRealtimeConsents
// ---------------------------------------------------------------------------

export function useRealtimeConsents(
  orgId: string | null | undefined,
  options?: UseRealtimeConsentsOptions,
): UseRealtimeConsentsReturn {
  const [latestUpdate, setLatestUpdate] = useState<RealtimeConsentUpdate | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Stabilize the callback reference to avoid re-subscribing on every render
  const onUpdateRef = useRef(options?.onUpdate);
  useEffect(() => {
    onUpdateRef.current = options?.onUpdate;
  }, [options?.onUpdate]);

  useEffect(() => {
    if (!orgId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`consents:org:${orgId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'consents',
          filter: `organization_id=eq.${orgId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const update: RealtimeConsentUpdate = {
            consent_id: row.id as string,
            status: row.status as ConsentStatus,
            signed_at: (row.signed_at as string) ?? null,
            updated_at: row.updated_at as string,
          };

          setLatestUpdate(update);
          onUpdateRef.current?.(update);
        },
      )
      .subscribe();

    channelRef.current = channel;

    // Cleanup: unsubscribe on unmount or when orgId changes
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [orgId]);

  return { latestUpdate };
}

// ---------------------------------------------------------------------------
// useRealtimeCredits
// ---------------------------------------------------------------------------

export function useRealtimeCredits(
  orgId: string | null | undefined,
): UseRealtimeCreditsReturn {
  const [balance, setBalance] = useState<number | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!orgId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`credits:org:${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'credit_balances',
          filter: `organization_id=eq.${orgId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (typeof row.balance === 'number') {
            setBalance(row.balance);
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [orgId]);

  return { balance };
}
