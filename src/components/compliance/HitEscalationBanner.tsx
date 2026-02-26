'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';

export interface EscalationRecord {
  id: string;
  driver_id: string;
  escalation_deadline: string;
  escalation_status: string;
  driver: {
    first_name: string;
    last_name: string;
    cdl_number: string | null;
  } | null;
}

interface HitEscalationBannerProps {
  escalations: EscalationRecord[];
  onResolve: (queryRecordId: string, resolution: 'full_query_completed' | 'driver_removed') => Promise<void>;
}

function CountdownTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    function update() {
      const now = Date.now();
      const end = new Date(deadline).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('EXPIRED');
        setExpired(true);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      setExpired(false);
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <span className={`font-mono font-bold tabular-nums ${expired ? 'text-white' : 'text-white/90'}`}>
      {timeLeft}
    </span>
  );
}

export function HitEscalationBanner({ escalations, onResolve }: HitEscalationBannerProps) {
  const [resolving, setResolving] = useState<string | null>(null);

  if (escalations.length === 0) return null;

  async function handleResolve(id: string, resolution: 'full_query_completed' | 'driver_removed') {
    setResolving(id);
    try {
      await onResolve(id, resolution);
    } finally {
      setResolving(null);
    }
  }

  return (
    <div className="border-2 border-red-600 bg-red-600 text-white">
      <div className="px-4 py-3 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-white shrink-0" />
        <span className="text-sm font-bold uppercase tracking-wider">
          Clearinghouse Hit{escalations.length > 1 ? 's' : ''} — Immediate Action Required
        </span>
      </div>
      <div className="bg-red-50 divide-y divide-red-200">
        {escalations.map((esc) => {
          const driverName = esc.driver
            ? `${esc.driver.first_name} ${esc.driver.last_name}`
            : 'Unknown Driver';
          const isExpired = new Date(esc.escalation_deadline).getTime() < Date.now();

          return (
            <div key={esc.id} className="px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-red-900">
                  {driverName}
                  {esc.driver?.cdl_number && (
                    <span className="ml-2 font-normal text-red-700">
                      CDL: {esc.driver.cdl_number}
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-red-700">
                    {isExpired ? 'Deadline passed — ' : 'Time remaining: '}
                  </span>
                  <div className={`inline-flex items-center px-2 py-0.5 text-xs ${isExpired ? 'bg-red-800' : 'bg-red-600'}`}>
                    <CountdownTimer deadline={esc.escalation_deadline} />
                  </div>
                </div>
                <p className="text-xs text-red-600 mt-1">
                  Run a full individual query in the Clearinghouse, or remove driver from safety-sensitive duties.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100 text-xs"
                  disabled={resolving === esc.id}
                  onClick={() => handleResolve(esc.id, 'full_query_completed')}
                >
                  {resolving === esc.id ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : null}
                  Full Query Done
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100 text-xs"
                  disabled={resolving === esc.id}
                  onClick={() => handleResolve(esc.id, 'driver_removed')}
                >
                  Driver Removed
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
