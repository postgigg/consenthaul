'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Copy, Check, Search } from 'lucide-react';
import type { Database, ConsentType, DeliveryMethod } from '@/types/database';

type DriverRow = Database['public']['Tables']['drivers']['Row'];

interface ConsentFormProps {
  /** Callback invoked after a successful consent creation. */
  onSuccess?: (consentId: string, signingUrl: string) => void;
}

const CONSENT_TYPES: { value: ConsentType; label: string }[] = [
  { value: 'limited_query', label: 'Limited Query (Annual)' },
  { value: 'pre_employment', label: 'Pre-Employment' },
  { value: 'blanket', label: 'Blanket Consent' },
];

const DELIVERY_METHODS: { value: DeliveryMethod; label: string }[] = [
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
];

export function ConsentForm({ onSuccess }: ConsentFormProps) {
  const supabase = createClient();

  // Driver search & selection
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [driverSearch, setDriverSearch] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<DriverRow | null>(null);
  const [showDriverDropdown, setShowDriverDropdown] = useState(false);

  // Form fields
  const [consentType, setConsentType] = useState<ConsentType>('limited_query');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('sms');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [endDate, setEndDate] = useState('');
  const [durationOfEmployment, setDurationOfEmployment] = useState(false);
  const [queryFrequency, setQueryFrequency] = useState<'annual' | 'unlimited'>('annual');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signingUrl, setSigningUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch drivers for search
  const fetchDrivers = useCallback(
    async (search: string) => {
      const query = supabase
        .from('drivers')
        .select('*')
        .eq('is_active', true)
        .order('last_name', { ascending: true })
        .limit(20);

      if (search.trim()) {
        query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
        );
      }

      const { data } = await query;
      if (data) setDrivers(data);
    },
    [supabase],
  );

  useEffect(() => {
    fetchDrivers(driverSearch);
  }, [driverSearch, fetchDrivers]);

  // Auto-fill delivery address when driver or method changes
  useEffect(() => {
    if (!selectedDriver) return;
    if (deliveryMethod === 'email') {
      setDeliveryAddress(selectedDriver.email ?? '');
    } else {
      setDeliveryAddress(selectedDriver.phone ?? '');
    }
  }, [selectedDriver, deliveryMethod]);

  // Auto-fill language from driver preference
  useEffect(() => {
    if (selectedDriver?.preferred_language) {
      setLanguage(selectedDriver.preferred_language as 'en' | 'es');
    }
  }, [selectedDriver]);

  function selectDriver(driver: DriverRow) {
    setSelectedDriver(driver);
    setDriverSearch(`${driver.first_name} ${driver.last_name}`);
    setShowDriverDropdown(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDriver) {
      setError('Please select a driver.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSigningUrl(null);

    try {
      const res = await fetch('/api/consents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driver_id: selectedDriver.id,
          consent_type: consentType,
          delivery_method: deliveryMethod,
          delivery_address: deliveryAddress,
          language,
          consent_start_date: startDate,
          consent_end_date: durationOfEmployment ? null : endDate || null,
          query_frequency: queryFrequency,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to create consent request.');
        return;
      }

      if (data.signing_url) {
        setSigningUrl(data.signing_url);
      }

      onSuccess?.(data.id, data.signing_url ?? '');
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function copySigningUrl() {
    if (!signingUrl) return;
    await navigator.clipboard.writeText(signingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Consent Request</CardTitle>
        <CardDescription>
          Create and send an FMCSA Clearinghouse consent form to a driver for electronic signature.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Driver selection */}
          <div className="space-y-2">
            <label htmlFor="driver-search" className="text-sm font-medium text-[#3a3f49]">
              Driver <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b5b5ae]" />
              <Input
                id="driver-search"
                placeholder="Search by name, email, or phone..."
                value={driverSearch}
                onChange={(e) => {
                  setDriverSearch(e.target.value);
                  setShowDriverDropdown(true);
                  if (selectedDriver) setSelectedDriver(null);
                }}
                onFocus={() => setShowDriverDropdown(true)}
                className="pl-10"
                autoComplete="off"
              />
              {showDriverDropdown && drivers.length > 0 && !selectedDriver && (
                <ul
                  className="absolute z-20 mt-1 max-h-60 w-full overflow-auto border border-[#e8e8e3] bg-white shadow-lg"
                  role="listbox"
                  aria-label="Driver suggestions"
                >
                  {drivers.map((driver) => (
                    <li key={driver.id}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-[#fafaf8] transition-colors"
                        onClick={() => selectDriver(driver)}
                        role="option"
                        aria-selected={false}
                      >
                        <div>
                          <span className="font-medium text-[#0c0f14]">
                            {driver.first_name} {driver.last_name}
                          </span>
                          {driver.cdl_number && (
                            <span className="ml-2 text-[#b5b5ae]">
                              CDL: {driver.cdl_number}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[#8b919a]">
                          {driver.phone ?? driver.email ?? ''}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {selectedDriver && (
              <p className="text-xs text-green-600">
                Selected: {selectedDriver.first_name} {selectedDriver.last_name}
              </p>
            )}
          </div>

          {/* Two-column grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Consent type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#3a3f49]">Consent Type</label>
              <Select
                value={consentType}
                onValueChange={(v) => setConsentType(v as ConsentType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONSENT_TYPES.map((ct) => (
                    <SelectItem key={ct.value} value={ct.value}>
                      {ct.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Delivery method */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#3a3f49]">Delivery Method</label>
              <Select
                value={deliveryMethod}
                onValueChange={(v) => setDeliveryMethod(v as DeliveryMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DELIVERY_METHODS.map((dm) => (
                    <SelectItem key={dm.value} value={dm.value}>
                      {dm.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Delivery address */}
            <div className="space-y-2">
              <label htmlFor="delivery-address" className="text-sm font-medium text-[#3a3f49]">
                {deliveryMethod === 'email' ? 'Email Address' : 'Phone Number'}
              </label>
              <Input
                id="delivery-address"
                placeholder={deliveryMethod === 'email' ? 'driver@example.com' : '+1 (555) 000-0000'}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
              />
            </div>

            {/* Language toggle */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#3a3f49]">Language</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`flex-1 border px-4 py-2 text-sm font-medium transition-colors ${
                    language === 'en'
                      ? 'border-[#0c0f14] bg-[#fafaf8] text-[#0c0f14]'
                      : 'border-[#d4d4cf] bg-white text-[#3a3f49] hover:bg-[#fafaf8]'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('es')}
                  className={`flex-1 border px-4 py-2 text-sm font-medium transition-colors ${
                    language === 'es'
                      ? 'border-[#0c0f14] bg-[#fafaf8] text-[#0c0f14]'
                      : 'border-[#d4d4cf] bg-white text-[#3a3f49] hover:bg-[#fafaf8]'
                  }`}
                >
                  Espanol
                </button>
              </div>
            </div>

            {/* Start date */}
            <div className="space-y-2">
              <label htmlFor="start-date" className="text-sm font-medium text-[#3a3f49]">
                Start Date
              </label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* End date */}
            <div className="space-y-2">
              <label htmlFor="end-date" className="text-sm font-medium text-[#3a3f49]">
                End Date
              </label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={durationOfEmployment}
              />
              <label className="flex items-center gap-2 text-sm text-[#6b6f76]">
                <input
                  type="checkbox"
                  checked={durationOfEmployment}
                  onChange={(e) => {
                    setDurationOfEmployment(e.target.checked);
                    if (e.target.checked) setEndDate('');
                  }}
                  className="h-4 w-4 rounded border-[#d4d4cf] text-[#0c0f14] focus:ring-[#0c0f14]"
                />
                Duration of Employment
              </label>
            </div>

            {/* Query frequency */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-[#3a3f49]">Query Frequency</label>
              <Select
                value={queryFrequency}
                onValueChange={(v) => setQueryFrequency(v as 'annual' | 'unlimited')}
              >
                <SelectTrigger className="sm:max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="unlimited">Unlimited</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div
              className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Success: signing URL */}
          {signingUrl && (
            <div className="border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-sm font-medium text-green-800 mb-2">
                Consent request created successfully!
              </p>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={signingUrl}
                  className="flex-1 text-xs bg-white"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copySigningUrl}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="mt-1.5 text-xs text-green-600">
                The signing link has been sent via {deliveryMethod.toUpperCase()}.
              </p>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="submit" loading={submitting} disabled={!selectedDriver}>
              {submitting ? 'Sending...' : 'Send Consent Request'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
