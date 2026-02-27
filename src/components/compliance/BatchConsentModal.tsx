'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Phone,
  Mail,
  X,
  Send,
  ChevronDown,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface BatchDriver {
  driver_id: string;
  first_name: string;
  last_name: string;
  cdl_number: string | null;
  phone: string | null;
  email: string | null;
}

type DriverSendStatus = 'pending' | 'sending' | 'sent' | 'failed';

interface DriverState {
  status: DriverSendStatus;
  error?: string;
}

type ConsentType = 'blanket' | 'limited_query' | 'pre_employment';
type DeliveryOverride = 'auto' | 'sms' | 'email';

interface BatchConsentModalProps {
  open: boolean;
  onClose: () => void;
  drivers: BatchDriver[];
  onComplete: () => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function resolveDelivery(
  driver: BatchDriver,
  override: DeliveryOverride,
): 'sms' | 'email' | null {
  if (override === 'sms') return driver.phone ? 'sms' : null;
  if (override === 'email') return driver.email ? 'email' : null;
  // auto
  if (driver.phone) return 'sms';
  if (driver.email) return 'email';
  return null;
}

const CONSENT_LABELS: Record<ConsentType, string> = {
  blanket: 'Blanket (Recommended)',
  limited_query: 'Limited Query',
  pre_employment: 'Pre-Employment',
};

const DELIVERY_LABELS: Record<DeliveryOverride, string> = {
  auto: 'Auto (SMS if phone, else Email)',
  sms: 'SMS Only',
  email: 'Email Only',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function BatchConsentModal({
  open,
  onClose,
  drivers,
  onComplete,
}: BatchConsentModalProps) {
  const [phase, setPhase] = useState<'review' | 'sending' | 'done'>('review');
  const [consentType, setConsentType] = useState<ConsentType>('blanket');
  const [deliveryOverride, setDeliveryOverride] = useState<DeliveryOverride>('auto');
  const [driverStates, setDriverStates] = useState<Record<string, DriverState>>({});
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const abortRef = useRef(false);

  // Compute sendable drivers
  const sendableDrivers = drivers.filter(
    (d) => resolveDelivery(d, deliveryOverride) !== null,
  );
  const unsendableDrivers = drivers.filter(
    (d) => resolveDelivery(d, deliveryOverride) === null,
  );

  const sentCount = Object.values(driverStates).filter((s) => s.status === 'sent').length;
  const failedCount = Object.values(driverStates).filter((s) => s.status === 'failed').length;
  const processedCount = sentCount + failedCount;

  const handleClose = useCallback(() => {
    if (phase === 'sending') {
      abortRef.current = true;
      return;
    }
    // Reset state
    setPhase('review');
    setDriverStates({});
    setCurrentIndex(-1);
    setCreditsUsed(0);
    setConfirming(false);
    abortRef.current = false;
    if (phase === 'done') {
      onComplete();
    }
    onClose();
  }, [phase, onClose, onComplete]);

  const handleSend = useCallback(async () => {
    setConfirming(true);

    // Brief delay so user sees the loading state on the button
    await new Promise((r) => setTimeout(r, 150));

    setPhase('sending');
    setConfirming(false);
    setCreditsUsed(0);
    abortRef.current = false;

    // Initialize all sendable drivers as pending
    const initial: Record<string, DriverState> = {};
    for (const d of sendableDrivers) {
      initial[d.driver_id] = { status: 'pending' };
    }
    setDriverStates(initial);

    for (let i = 0; i < sendableDrivers.length; i++) {
      if (abortRef.current) break;

      const driver = sendableDrivers[i];
      const delivery = resolveDelivery(driver, deliveryOverride)!;

      setCurrentIndex(i);
      setDriverStates((prev) => ({
        ...prev,
        [driver.driver_id]: { status: 'sending' },
      }));

      try {
        const res = await fetch('/api/consents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            driver_id: driver.driver_id,
            consent_type: consentType,
            delivery_method: delivery,
          }),
        });

        if (res.status === 201) {
          setDriverStates((prev) => ({
            ...prev,
            [driver.driver_id]: { status: 'sent' },
          }));
          setCreditsUsed((prev) => prev + 1);
        } else if (res.status === 402) {
          setDriverStates((prev) => ({
            ...prev,
            [driver.driver_id]: { status: 'failed', error: 'Insufficient credits' },
          }));
          // Stop batch — no credits left
          break;
        } else if (res.status === 502) {
          // 502 = consent created & credit deducted, but delivery failed
          const body = await res.json().catch(() => ({}));
          setDriverStates((prev) => ({
            ...prev,
            [driver.driver_id]: {
              status: 'failed',
              error: body.message ?? 'Delivery failed',
            },
          }));
          setCreditsUsed((prev) => prev + 1);
        } else {
          // Other errors — no credit deducted
          const body = await res.json().catch(() => ({}));
          setDriverStates((prev) => ({
            ...prev,
            [driver.driver_id]: {
              status: 'failed',
              error: body.message ?? `Error ${res.status}`,
            },
          }));
        }
      } catch {
        // Network error — request never reached server, no credit deducted
        setDriverStates((prev) => ({
          ...prev,
          [driver.driver_id]: { status: 'failed', error: 'Network error' },
        }));
      }
    }

    setPhase('done');
  }, [sendableDrivers, deliveryOverride, consentType]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[#0c0f14]/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col bg-white border border-[#e8e8e3] shadow-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e8e3]">
          <div>
            <h2 className="text-base font-bold text-[#0c0f14]">
              {phase === 'review'
                ? `Send Consents to ${sendableDrivers.length} Driver${sendableDrivers.length !== 1 ? 's' : ''}`
                : phase === 'sending'
                  ? `Sending ${processedCount + 1} of ${sendableDrivers.length}...`
                  : `Batch Complete`}
            </h2>
            {phase === 'done' && (
              <p className="text-sm text-[#8b919a] mt-0.5">
                {sentCount} sent{failedCount > 0 ? `, ${failedCount} failed` : ''}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-[#8b919a] hover:text-[#0c0f14] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Controls (phase: review) */}
        {phase === 'review' && (
          <div className="px-6 py-3 border-b border-[#e8e8e3] bg-[#fafaf8] flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">
                Consent Type
              </label>
              <div className="relative">
                <select
                  value={consentType}
                  onChange={(e) => setConsentType(e.target.value as ConsentType)}
                  className="appearance-none bg-white border border-[#d4d4cf] text-sm text-[#0c0f14] pl-3 pr-8 py-1.5 focus:outline-none focus:border-[#0c0f14]"
                >
                  {Object.entries(CONSENT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8b919a] pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">
                Delivery
              </label>
              <div className="relative">
                <select
                  value={deliveryOverride}
                  onChange={(e) => setDeliveryOverride(e.target.value as DeliveryOverride)}
                  className="appearance-none bg-white border border-[#d4d4cf] text-sm text-[#0c0f14] pl-3 pr-8 py-1.5 focus:outline-none focus:border-[#0c0f14]"
                >
                  {Object.entries(DELIVERY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8b919a] pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* Progress bar (phase: sending/done) */}
        {(phase === 'sending' || phase === 'done') && (
          <div className="px-6 pt-3">
            <div className="w-full h-1.5 bg-[#f0f0ec] overflow-hidden">
              <div
                className="h-full bg-[#C8A75E] transition-all duration-300"
                style={{
                  width: `${sendableDrivers.length > 0 ? (processedCount / sendableDrivers.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Driver list */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          {unsendableDrivers.length > 0 && phase === 'review' && (
            <div className="flex items-start gap-2 mb-3 px-3 py-2 bg-amber-50 border border-amber-200 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                {unsendableDrivers.length} driver{unsendableDrivers.length !== 1 ? 's' : ''} missing contact info — will be skipped.
              </span>
            </div>
          )}

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e8e8e3]">
                <th className="pb-2 text-left text-[0.65rem] font-bold text-[#8b919a] uppercase tracking-wider">
                  Driver
                </th>
                <th className="pb-2 text-left text-[0.65rem] font-bold text-[#8b919a] uppercase tracking-wider">
                  CDL #
                </th>
                <th className="pb-2 text-left text-[0.65rem] font-bold text-[#8b919a] uppercase tracking-wider">
                  Contact
                </th>
                <th className="pb-2 text-left text-[0.65rem] font-bold text-[#8b919a] uppercase tracking-wider">
                  Delivery
                </th>
                <th className="pb-2 text-right text-[0.65rem] font-bold text-[#8b919a] uppercase tracking-wider w-20">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0ec]">
              {drivers.map((driver, idx) => {
                const delivery = resolveDelivery(driver, deliveryOverride);
                const state = driverStates[driver.driver_id];
                const isCurrent =
                  phase === 'sending' &&
                  sendableDrivers[currentIndex]?.driver_id === driver.driver_id;

                return (
                  <tr
                    key={driver.driver_id}
                    className={`${
                      isCurrent
                        ? 'bg-[#C8A75E]/10'
                        : !delivery
                          ? 'opacity-50'
                          : ''
                    }`}
                  >
                    <td className="py-2 font-medium text-[#0c0f14]">
                      {driver.first_name} {driver.last_name}
                    </td>
                    <td className="py-2 text-[#6b6f76] font-mono text-xs">
                      {driver.cdl_number ?? '—'}
                    </td>
                    <td className="py-2">
                      <div className="flex flex-col gap-0.5">
                        {driver.phone && (
                          <span className="inline-flex items-center gap-1 text-xs text-[#6b6f76]">
                            <Phone className="h-3 w-3" />
                            {driver.phone}
                          </span>
                        )}
                        {driver.email && (
                          <span className="inline-flex items-center gap-1 text-xs text-[#6b6f76]">
                            <Mail className="h-3 w-3" />
                            {driver.email}
                          </span>
                        )}
                        {!driver.phone && !driver.email && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                            <AlertTriangle className="h-3 w-3" />
                            No contact info
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2">
                      {delivery ? (
                        <span className="inline-flex items-center gap-1 text-xs">
                          {delivery === 'sms' ? (
                            <Phone className="h-3 w-3 text-[#8b919a]" />
                          ) : (
                            <Mail className="h-3 w-3 text-[#8b919a]" />
                          )}
                          {delivery.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-xs text-[#b5b5ae]">—</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {!state && delivery && (
                        <span className="text-xs text-[#b5b5ae]">Ready</span>
                      )}
                      {!state && !delivery && (
                        <span className="text-xs text-amber-500">Skip</span>
                      )}
                      {state?.status === 'pending' && (
                        <span className="text-xs text-[#b5b5ae]">Waiting</span>
                      )}
                      {state?.status === 'sending' && (
                        <Loader2 className="h-4 w-4 animate-spin text-[#C8A75E] ml-auto" />
                      )}
                      {state?.status === 'sent' && (
                        <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                      )}
                      {state?.status === 'failed' && (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-[0.6rem] text-red-600 max-w-[80px] truncate">
                            {state.error}
                          </span>
                          <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e8e8e3] bg-[#fafaf8]">
          {phase === 'review' && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#6b6f76]">
                <strong className="text-[#0c0f14]">{sendableDrivers.length}</strong> driver{sendableDrivers.length !== 1 ? 's' : ''} will receive consent requests.
                {' '}This will use <strong className="text-[#0c0f14]">{sendableDrivers.length}</strong> credit{sendableDrivers.length !== 1 ? 's' : ''}.
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={sendableDrivers.length === 0 || confirming}
                  loading={confirming}
                >
                  <Send className="h-3.5 w-3.5" />
                  {confirming ? 'Preparing...' : 'Confirm & Send'}
                </Button>
              </div>
            </div>
          )}

          {phase === 'sending' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-[#C8A75E]" />
                <p className="text-sm text-[#6b6f76]">
                  Sending consent requests...
                  {creditsUsed > 0 && (
                    <span className="ml-2 text-[#0c0f14] font-medium">{creditsUsed} credit{creditsUsed !== 1 ? 's' : ''} used</span>
                  )}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  abortRef.current = true;
                }}
              >
                Stop
              </Button>
            </div>
          )}

          {phase === 'done' && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#6b6f76]">
                <strong className="text-green-700">{sentCount} sent</strong>
                {failedCount > 0 && (
                  <>, <strong className="text-red-600">{failedCount} failed</strong></>
                )}
                {creditsUsed > 0 && (
                  <span className="ml-2 text-[#8b919a]">({creditsUsed} credit{creditsUsed !== 1 ? 's' : ''} used)</span>
                )}
              </p>
              <Button size="sm" onClick={handleClose}>
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
