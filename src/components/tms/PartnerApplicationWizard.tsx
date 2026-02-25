'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import {
  TMS_PARTNER_PACKS,
  TMS_ONBOARDING_FEE_CENTS,
  AUTO_CREATE_CARRIER_FEE_CENTS,
  MIGRATION_PRICE_PER_GB_CENTS,
  type TmsPartnerPack,
} from '@/lib/stripe/credits';

// ---------------------------------------------------------------------------
// Volume estimation helpers
// ---------------------------------------------------------------------------

const CARRIER_MID: Record<string, number> = {
  '1-100': 50,
  '101-500': 300,
  '501-2000': 1250,
  '2001-10000': 6000,
  '10000+': 15000,
};

const CONSENTS_MID: Record<string, number> = {
  '1-5': 3,
  '6-15': 10,
  '16-50': 33,
  '50+': 75,
};

function estimateAnnual(carrierRange: string, consentsRange: string): number {
  const c = CARRIER_MID[carrierRange] ?? 0;
  const m = CONSENTS_MID[consentsRange] ?? 0;
  return c * m * 12;
}

function recommendPack(annual: number): string {
  if (annual <= 10_000) return 'tms_starter';
  if (annual <= 100_000) return 'tms_growth';
  if (annual <= 250_000) return 'tms_scale';
  return 'tms_enterprise';
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CompanyInfo {
  company_name: string;
  website_url: string;
  employee_count_range: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  tms_platform_name: string;
  partnership_reason: string;
}

interface VolumeInfo {
  carrier_count_range: string;
  consents_per_carrier_month: string;
  estimated_annual_consents: number;
  recommended_pack_id: string;
}

interface MigrationInfo {
  has_migration_data: boolean;
  migration_file_paths: string[];
  migration_total_bytes: number;
  migration_fee_cents: number;
  auto_create_carriers: boolean;
  auto_create_fee_cents: number;
  files: File[];
}

const TOTAL_STEPS = 7;

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d()+\-.\s]{7,20}$/;

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const DEMO_COMPANY: CompanyInfo = {
  company_name: 'FleetPulse Technologies',
  website_url: 'https://fleetpulse.io',
  employee_count_range: '51-200',
  contact_name: 'Sarah Chen',
  contact_email: 'sarah@fleetpulse.io',
  contact_phone: '(415) 555-0192',
  tms_platform_name: 'FleetPulse TMS',
  partnership_reason:
    'FleetPulse serves over 800 motor carriers across the western US. Our platform handles dispatch, load management, and compliance — but we currently lack integrated FMCSA Clearinghouse consent collection. Our carriers constantly ask for it.',
};

const DEMO_VOLUME: VolumeInfo = {
  carrier_count_range: '501-2000',
  consents_per_carrier_month: '6-15',
  estimated_annual_consents: 0,
  recommended_pack_id: '',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PartnerApplicationWizard() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Company Info
  const [company, setCompany] = useState<CompanyInfo>({
    company_name: '',
    website_url: '',
    employee_count_range: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    tms_platform_name: '',
    partnership_reason: '',
  });

  // Step 2: Volume
  const [volume, setVolume] = useState<VolumeInfo>({
    carrier_count_range: '',
    consents_per_carrier_month: '',
    estimated_annual_consents: 0,
    recommended_pack_id: '',
  });

  // Fill demo data helper
  function fillDemoData() {
    setCompany(DEMO_COMPANY);
    setVolume(DEMO_VOLUME);
    setPartnerAgreementAccepted(true);
    setDataProcessingAccepted(true);
    setLegalSignatoryName('Sarah Chen');
    setSelectedPack(TMS_PARTNER_PACKS[2]); // Scale pack
  }

  // Step 3: Migration
  const [migration, setMigration] = useState<MigrationInfo>({
    has_migration_data: false,
    migration_file_paths: [],
    migration_total_bytes: 0,
    migration_fee_cents: 0,
    auto_create_carriers: false,
    auto_create_fee_cents: 0,
    files: [],
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Step 4: Pack selection
  const [selectedPack, setSelectedPack] = useState<TmsPartnerPack | null>(null);

  // Step 5: Legal
  const [partnerAgreementAccepted, setPartnerAgreementAccepted] = useState(false);
  const [dataProcessingAccepted, setDataProcessingAccepted] = useState(false);
  const [legalSignatoryName, setLegalSignatoryName] = useState('');

  // Computed
  const annualEstimate = estimateAnnual(volume.carrier_count_range, volume.consents_per_carrier_month);
  const recommendedPackId = recommendPack(annualEstimate);

  // ---------------------------------------------------------------------------
  // Validation per step
  // ---------------------------------------------------------------------------

  function isStep1Valid(): boolean {
    const urlOk = !company.website_url || /^https?:\/\/.+\..+/.test(normalizeUrl(company.website_url));
    return (
      company.company_name.trim().length > 0 &&
      company.employee_count_range.length > 0 &&
      company.contact_name.trim().length > 0 &&
      EMAIL_RE.test(company.contact_email) &&
      PHONE_RE.test(company.contact_phone) &&
      company.tms_platform_name.trim().length > 0 &&
      company.partnership_reason.length >= 50 &&
      urlOk
    );
  }

  function isStep2Valid(): boolean {
    return volume.carrier_count_range.length > 0 && volume.consents_per_carrier_month.length > 0;
  }

  function isStep5Valid(): boolean {
    return partnerAgreementAccepted && dataProcessingAccepted && legalSignatoryName.length >= 2;
  }

  // ---------------------------------------------------------------------------
  // File upload handlers
  // ---------------------------------------------------------------------------

  const handleFiles = useCallback(async (newFiles: File[]) => {
    const csvFiles = newFiles.filter((f) => f.name.endsWith('.csv'));
    if (csvFiles.length === 0) return;

    const allFiles = [...migration.files, ...csvFiles].slice(0, 10);

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      allFiles.forEach((f) => formData.append('files', f));

      const res = await fetch('/api/tms/upload-migration', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const result = await res.json();

      setMigration((prev) => ({
        ...prev,
        has_migration_data: true,
        migration_file_paths: result.storage_paths,
        migration_total_bytes: result.total_bytes,
        migration_fee_cents: result.migration_fee_cents,
        files: allFiles,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [migration.files]);

  function removeFile(index: number) {
    const newFiles = migration.files.filter((_, i) => i !== index);
    if (newFiles.length === 0) {
      setMigration({
        has_migration_data: false,
        migration_file_paths: [],
        migration_total_bytes: 0,
        migration_fee_cents: 0,
        auto_create_carriers: migration.auto_create_carriers,
        auto_create_fee_cents: migration.auto_create_fee_cents,
        files: [],
      });
    } else {
      // Re-upload remaining files
      handleFiles([]);
      setMigration((prev) => ({ ...prev, files: newFiles }));
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  async function handleSubmit() {
    if (!selectedPack) return;

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        ...company,
        website_url: company.website_url ? normalizeUrl(company.website_url) : undefined,
        carrier_count_range: volume.carrier_count_range,
        consents_per_carrier_month: volume.consents_per_carrier_month,
        estimated_annual_consents: annualEstimate,
        recommended_pack_id: recommendedPackId,
        has_migration_data: migration.has_migration_data,
        migration_file_paths: migration.migration_file_paths,
        migration_total_bytes: migration.migration_total_bytes,
        migration_fee_cents: migration.migration_fee_cents,
        auto_create_carriers: migration.auto_create_carriers,
        auto_create_fee_cents: migration.auto_create_carriers ? AUTO_CREATE_CARRIER_FEE_CENTS : 0,
        selected_pack_id: selectedPack.id,
        selected_pack_credits: selectedPack.credits,
        selected_pack_price_cents: selectedPack.price_cents,
        partner_agreement_accepted: partnerAgreementAccepted as true,
        data_processing_accepted: dataProcessingAccepted as true,
        legal_signatory_name: legalSignatoryName,
      };

      const res = await fetch('/api/tms/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Application submission failed');
      }

      const { checkout_url } = await res.json();
      if (checkout_url) {
        window.location.href = checkout_url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Shared input classes
  // ---------------------------------------------------------------------------

  const inputCls =
    'w-full border border-[#e8e8e3] px-3 py-2 text-sm text-[#0c0f14] placeholder:text-[#b5b5ae] focus:border-[#C8A75E] focus:outline-none focus:ring-1 focus:ring-[#C8A75E]';
  const labelCls = 'block text-xs font-medium text-[#8b919a] uppercase tracking-wider mb-1.5';
  const selectCls = `${inputCls} bg-white`;

  // Total calculation
  const totalCents = selectedPack
    ? TMS_ONBOARDING_FEE_CENTS +
      selectedPack.price_cents +
      (migration.has_migration_data ? migration.migration_fee_cents : 0) +
      (migration.auto_create_carriers ? AUTO_CREATE_CARRIER_FEE_CENTS : 0)
    : 0;

  return (
    <div className="border border-[#e8e8e3] bg-white">
      {/* Header */}
      <div className="border-b border-[#e8e8e3] px-6 py-4">
        <h2 className="text-sm font-bold text-[#0c0f14] uppercase tracking-wider">
          TMS Partner Application
        </h2>
        <p className="mt-1 text-sm text-[#8b919a]">
          Complete all steps to apply for a ConsentHaul partner account.
        </p>
      </div>

      {/* Progress bar */}
      <div className="border-b border-[#e8e8e3] px-6 py-3">
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 transition-colors ${
                s <= step ? 'bg-[#C8A75E]' : 'bg-[#e8e8e3]'
              }`}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-[#8b919a]">
          Step {step} of {TOTAL_STEPS}
        </p>
      </div>

      <div className="p-6">
        {/* ----------------------------------------------------------------- */}
        {/* Step 1: Company Info */}
        {/* ----------------------------------------------------------------- */}
        {step === 1 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-[#3a3f49]">Company Information</p>
              <button
                type="button"
                onClick={fillDemoData}
                className="text-xs font-medium text-[#C8A75E] hover:text-[#b8974e] underline underline-offset-2 transition-colors"
              >
                Fill with demo data
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Company Name *</label>
                  <input
                    type="text"
                    value={company.company_name}
                    onChange={(e) => setCompany({ ...company, company_name: e.target.value })}
                    placeholder="Acme TMS Inc."
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Website</label>
                  <input
                    type="url"
                    value={company.website_url}
                    onChange={(e) => setCompany({ ...company, website_url: e.target.value })}
                    onBlur={() => {
                      if (company.website_url.trim()) {
                        setCompany({ ...company, website_url: normalizeUrl(company.website_url) });
                      }
                    }}
                    placeholder="yourcompany.com"
                    className={inputCls}
                  />
                  {company.website_url && !/^https?:\/\/.+\..+/.test(normalizeUrl(company.website_url)) && (
                    <p className="mt-1 text-xs text-red-500">Enter a valid URL (e.g. yourcompany.com)</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Employee Count *</label>
                  <select
                    value={company.employee_count_range}
                    onChange={(e) => setCompany({ ...company, employee_count_range: e.target.value })}
                    className={selectCls}
                  >
                    <option value="">Select range...</option>
                    <option value="1-10">1–10</option>
                    <option value="11-50">11–50</option>
                    <option value="51-200">51–200</option>
                    <option value="201-1000">201–1,000</option>
                    <option value="1000+">1,000+</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>TMS Platform Name *</label>
                  <input
                    type="text"
                    value={company.tms_platform_name}
                    onChange={(e) => setCompany({ ...company, tms_platform_name: e.target.value })}
                    placeholder="Your TMS product name"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Contact Name *</label>
                  <input
                    type="text"
                    value={company.contact_name}
                    onChange={(e) => setCompany({ ...company, contact_name: e.target.value })}
                    placeholder="Jane Doe"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Contact Email *</label>
                  <input
                    type="email"
                    value={company.contact_email}
                    onChange={(e) => setCompany({ ...company, contact_email: e.target.value })}
                    placeholder="jane@company.com"
                    className={inputCls}
                  />
                  {company.contact_email && !EMAIL_RE.test(company.contact_email) && (
                    <p className="mt-1 text-xs text-red-500">Enter a valid email address</p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Contact Phone *</label>
                  <input
                    type="tel"
                    value={company.contact_phone}
                    onChange={(e) => setCompany({ ...company, contact_phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className={inputCls}
                  />
                  {company.contact_phone && !PHONE_RE.test(company.contact_phone) && (
                    <p className="mt-1 text-xs text-red-500">Enter a valid phone number</p>
                  )}
                </div>
              </div>

              <div>
                <label className={labelCls}>Why would you be a great partner? * (min 50 chars)</label>
                <textarea
                  value={company.partnership_reason}
                  onChange={(e) => setCompany({ ...company, partnership_reason: e.target.value })}
                  placeholder="Tell us about your TMS platform, your carrier base, and why you want to integrate FMCSA consent collection..."
                  rows={4}
                  className={inputCls}
                />
                {company.partnership_reason.length > 0 && company.partnership_reason.length < 50 && (
                  <p className="mt-1 text-xs text-red-500">
                    {50 - company.partnership_reason.length} more characters needed
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!isStep1Valid()} variant="gold">
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Step 2: Volume Estimates */}
        {/* ----------------------------------------------------------------- */}
        {step === 2 && (
          <div>
            <p className="mb-4 text-sm font-medium text-[#3a3f49]">Volume Estimates</p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>How many carriers use your TMS? *</label>
                  <select
                    value={volume.carrier_count_range}
                    onChange={(e) => {
                      const val = e.target.value;
                      setVolume((prev) => ({ ...prev, carrier_count_range: val }));
                    }}
                    className={selectCls}
                  >
                    <option value="">Select range...</option>
                    <option value="1-100">1–100</option>
                    <option value="101-500">101–500</option>
                    <option value="501-2000">501–2,000</option>
                    <option value="2001-10000">2,001–10,000</option>
                    <option value="10000+">10,000+</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Consents per carrier per month? *</label>
                  <select
                    value={volume.consents_per_carrier_month}
                    onChange={(e) => {
                      const val = e.target.value;
                      setVolume((prev) => ({ ...prev, consents_per_carrier_month: val }));
                    }}
                    className={selectCls}
                  >
                    <option value="">Select range...</option>
                    <option value="1-5">1–5</option>
                    <option value="6-15">6–15</option>
                    <option value="16-50">16–50</option>
                    <option value="50+">50+</option>
                  </select>
                </div>
              </div>

              {annualEstimate > 0 && (
                <div className="border border-[#e8e8e3] bg-[#fafaf8] p-4">
                  <p className="text-xs font-medium text-[#8b919a] uppercase tracking-wider mb-1">
                    Estimated Annual Consents
                  </p>
                  <p className="text-2xl font-bold text-[#0c0f14]">
                    {annualEstimate.toLocaleString()}
                  </p>
                  <p className="text-xs text-[#8b919a] mt-1">
                    Based on midpoint estimates. We&apos;ll recommend the{' '}
                    <span className="text-[#C8A75E] font-medium">
                      {TMS_PARTNER_PACKS.find((p) => p.id === recommendedPackId)?.name}
                    </span>{' '}
                    pack for you.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)} disabled={!isStep2Valid()} variant="gold">
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Step 3: Data Migration */}
        {/* ----------------------------------------------------------------- */}
        {step === 3 && (
          <div>
            <p className="mb-4 text-sm font-medium text-[#3a3f49]">Data Migration (Optional)</p>
            <p className="mb-4 text-sm text-[#8b919a]">
              Upload CSV files with your existing carrier/driver data. We&apos;ll migrate everything into ConsentHaul during onboarding.
              Migration is billed at <span className="font-medium text-[#0c0f14]">{formatCents(MIGRATION_PRICE_PER_GB_CENTS)}/GB</span> (minimum {formatCents(MIGRATION_PRICE_PER_GB_CENTS)}).
            </p>

            <div className="space-y-4">
              {/* File drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-[#C8A75E] bg-[#fafaf8]'
                    : 'border-[#d4d4cf] hover:border-[#C8A75E]'
                }`}
              >
                <Upload className="h-8 w-8 text-[#8b919a] mx-auto mb-2" />
                <p className="text-sm text-[#3a3f49]">
                  {uploading ? 'Uploading...' : 'Drag & drop CSV files here, or click to browse'}
                </p>
                <p className="text-xs text-[#8b919a] mt-1">
                  Max 10 files, 100MB total. CSV format only.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) handleFiles(Array.from(e.target.files));
                  }}
                />
              </div>

              {/* File list */}
              {migration.files.length > 0 && (
                <div className="border border-[#e8e8e3] divide-y divide-[#e8e8e3]">
                  {migration.files.map((file, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2">
                      <div>
                        <p className="text-sm text-[#0c0f14]">{file.name}</p>
                        <p className="text-xs text-[#8b919a]">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                        className="text-[#8b919a] hover:text-red-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <div className="px-4 py-2 bg-[#fafaf8]">
                    <p className="text-xs text-[#8b919a]">
                      Total size: {migration.migration_total_bytes < 1024 * 1024
                        ? `${(migration.migration_total_bytes / 1024).toFixed(1)} KB`
                        : `${(migration.migration_total_bytes / (1024 * 1024)).toFixed(2)} MB`
                      }
                      {' '}({Math.max(1, Math.ceil(migration.migration_total_bytes / (1024 * 1024 * 1024)))} GB billed at {formatCents(MIGRATION_PRICE_PER_GB_CENTS)}/GB)
                    </p>
                    {migration.migration_fee_cents > 0 && (
                      <p className="text-xs font-medium text-[#C8A75E] mt-0.5">
                        Migration fee: {formatCents(migration.migration_fee_cents)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Auto-create carriers toggle */}
              <label className="flex items-start gap-3 p-4 border border-[#e8e8e3] cursor-pointer hover:border-[#d4d4cf] transition-colors">
                <input
                  type="checkbox"
                  checked={migration.auto_create_carriers}
                  onChange={(e) =>
                    setMigration((prev) => ({
                      ...prev,
                      auto_create_carriers: e.target.checked,
                      auto_create_fee_cents: e.target.checked ? AUTO_CREATE_CARRIER_FEE_CENTS : 0,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 accent-[#C8A75E]"
                />
                <div>
                  <p className="text-sm font-medium text-[#0c0f14]">
                    Auto-create carrier sub-organizations (+{formatCents(AUTO_CREATE_CARRIER_FEE_CENTS)})
                  </p>
                  <p className="text-xs text-[#8b919a] mt-0.5">
                    Each carrier in your CSV gets its own ConsentHaul org ID and API tokens. Recommended for multi-tenant deployments.
                  </p>
                </div>
              </label>
            </div>

            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(4)} variant="gold">
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Step 4: Credit Pack Selection */}
        {/* ----------------------------------------------------------------- */}
        {step === 4 && (
          <div>
            <p className="mb-4 text-sm font-medium text-[#3a3f49]">Select Your Credit Pack</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TMS_PARTNER_PACKS.map((pack) => {
                const isRecommended = pack.id === recommendedPackId;
                const isSelected = selectedPack?.id === pack.id;
                return (
                  <button
                    key={pack.id}
                    onClick={() => setSelectedPack(pack)}
                    className={`relative flex flex-col p-5 border text-left transition-colors ${
                      isSelected
                        ? 'border-[#C8A75E] bg-[#C8A75E]/5'
                        : 'border-[#e8e8e3] hover:border-[#d4d4cf]'
                    }`}
                  >
                    {isRecommended && (
                      <span className="absolute -top-2.5 right-3 bg-[#C8A75E] text-[#0c0f14] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                        Recommended
                      </span>
                    )}
                    <p className="text-lg font-bold text-[#0c0f14]">{pack.name}</p>
                    <p className="text-2xl font-bold text-[#0c0f14] mt-1">
                      {formatCents(pack.price_cents)}
                    </p>
                    <p className="text-sm text-[#C8A75E] font-medium mt-1">
                      {pack.credits.toLocaleString()} consents — {pack.per_consent}/each
                    </p>
                    <p className="text-xs text-[#8b919a] mt-2">{pack.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
              <Button onClick={() => setStep(5)} disabled={!selectedPack} variant="gold">
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Step 5: Legal */}
        {/* ----------------------------------------------------------------- */}
        {step === 5 && (
          <div>
            <p className="mb-4 text-sm font-medium text-[#3a3f49]">Legal Agreements</p>

            <div className="space-y-4">
              {/* Partner Agreement */}
              <div className="border border-[#e8e8e3] p-4">
                <p className="text-xs font-bold text-[#8b919a] uppercase tracking-wider mb-2">
                  ConsentHaul Partner Agreement
                </p>
                <div className="h-40 overflow-y-auto border border-[#e8e8e3] bg-[#fafaf8] p-3 text-xs text-[#3a3f49] leading-relaxed mb-3">
                  <p className="font-bold mb-2">CONSENTHAUL TMS PARTNER AGREEMENT</p>
                  <p className="mb-2">This Partner Agreement (&quot;Agreement&quot;) is entered into between ConsentHaul, Inc. (&quot;ConsentHaul&quot;) and the Partner identified in the application form.</p>
                  <p className="mb-2"><strong>1. Partner Rights.</strong> Partner receives a non-exclusive license to integrate ConsentHaul&apos;s FMCSA consent collection services into their TMS platform via API. Partner may resell consent services to their carrier customers.</p>
                  <p className="mb-2"><strong>2. Onboarding.</strong> ConsentHaul provides 40 hours of integration specialist support and 15 hours of custom development as part of the onboarding fee. Additional hours billed at $250/hr.</p>
                  <p className="mb-2"><strong>3. Credits.</strong> Partner purchases consent credits in bulk at negotiated rates. Credits do not expire. Credits are non-refundable after 30 days.</p>
                  <p className="mb-2"><strong>4. Data Handling.</strong> All driver consent data is processed in accordance with FMCSA Clearinghouse regulations, the ESIGN Act, and UETA. ConsentHaul maintains SOC 2 Type II compliance.</p>
                  <p className="mb-2"><strong>5. Sub-Organizations.</strong> If Partner elects auto-creation of carrier sub-organizations, each carrier receives its own organization ID, API keys, and isolated data scope.</p>
                  <p className="mb-2"><strong>6. Term.</strong> This Agreement is effective upon payment and continues for 12 months, auto-renewing annually unless either party provides 60 days written notice of non-renewal.</p>
                  <p className="mb-2"><strong>7. Limitation of Liability.</strong> Neither party&apos;s aggregate liability shall exceed the fees paid by Partner in the 12 months preceding the claim.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={partnerAgreementAccepted}
                    onChange={(e) => setPartnerAgreementAccepted(e.target.checked)}
                    className="h-4 w-4 accent-[#C8A75E]"
                  />
                  <span className="text-sm text-[#0c0f14]">
                    I accept the ConsentHaul Partner Agreement
                  </span>
                </label>
              </div>

              {/* DPA */}
              <div className="border border-[#e8e8e3] p-4">
                <p className="text-xs font-bold text-[#8b919a] uppercase tracking-wider mb-2">
                  Data Processing Agreement
                </p>
                <div className="h-32 overflow-y-auto border border-[#e8e8e3] bg-[#fafaf8] p-3 text-xs text-[#3a3f49] leading-relaxed mb-3">
                  <p className="font-bold mb-2">DATA PROCESSING AGREEMENT (DPA)</p>
                  <p className="mb-2">This DPA supplements the Partner Agreement and governs the processing of personal data.</p>
                  <p className="mb-2"><strong>Scope.</strong> ConsentHaul processes driver personal information (name, CDL number, contact details, consent records) on behalf of Partner&apos;s carrier customers.</p>
                  <p className="mb-2"><strong>Purpose.</strong> Data is processed solely for FMCSA Clearinghouse consent collection, document generation, and compliance record-keeping.</p>
                  <p className="mb-2"><strong>Retention.</strong> Signed consent documents are retained for a minimum of 3 years per FMCSA requirements. Data is deleted upon request after the retention period.</p>
                  <p className="mb-2"><strong>Security.</strong> ConsentHaul implements encryption at rest and in transit, access controls, audit logging, and regular security assessments.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dataProcessingAccepted}
                    onChange={(e) => setDataProcessingAccepted(e.target.checked)}
                    className="h-4 w-4 accent-[#C8A75E]"
                  />
                  <span className="text-sm text-[#0c0f14]">
                    I accept the Data Processing Agreement
                  </span>
                </label>
              </div>

              {/* Typed signature */}
              <div>
                <label className={labelCls}>Legal Signatory Name *</label>
                <input
                  type="text"
                  value={legalSignatoryName}
                  onChange={(e) => setLegalSignatoryName(e.target.value)}
                  placeholder="Type your full legal name as electronic signature"
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-[#8b919a]">
                  By typing your name, you acknowledge this constitutes a legally binding electronic signature under the ESIGN Act.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep(4)}>Back</Button>
              <Button onClick={() => setStep(6)} disabled={!isStep5Valid()} variant="gold">
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Step 6: Review & Pay */}
        {/* ----------------------------------------------------------------- */}
        {step === 6 && selectedPack && (
          <div>
            <p className="mb-4 text-sm font-medium text-[#3a3f49]">Review & Proceed to Payment</p>

            <div className="border border-[#e8e8e3] divide-y divide-[#e8e8e3] mb-4">
              {/* Company */}
              <div className="px-4 py-3">
                <p className="text-xs font-medium text-[#8b919a] uppercase tracking-wider mb-1">Company</p>
                <p className="text-sm font-medium text-[#0c0f14]">{company.company_name}</p>
                <p className="text-xs text-[#8b919a]">{company.tms_platform_name} — {company.contact_email}</p>
              </div>

              {/* Volume */}
              <div className="px-4 py-3">
                <p className="text-xs font-medium text-[#8b919a] uppercase tracking-wider mb-1">Volume Estimate</p>
                <p className="text-sm text-[#0c0f14]">
                  ~{annualEstimate.toLocaleString()} consents/year
                </p>
              </div>

              {/* Line items */}
              <div className="flex justify-between px-4 py-3">
                <span className="text-sm text-[#8b919a]">Partner Onboarding Fee</span>
                <span className="text-sm font-medium text-[#0c0f14]">
                  {formatCents(TMS_ONBOARDING_FEE_CENTS)}
                </span>
              </div>

              <div className="flex justify-between px-4 py-3">
                <div>
                  <span className="text-sm text-[#8b919a]">{selectedPack.name} Credit Pack</span>
                  <p className="text-xs text-[#8b919a]">
                    {selectedPack.credits.toLocaleString()} consents at {selectedPack.per_consent}/each
                  </p>
                </div>
                <span className="text-sm font-medium text-[#0c0f14]">
                  {formatCents(selectedPack.price_cents)}
                </span>
              </div>

              {migration.has_migration_data && migration.migration_fee_cents > 0 && (
                <div className="flex justify-between px-4 py-3">
                  <div>
                    <span className="text-sm text-[#8b919a]">Data Migration</span>
                    <p className="text-xs text-[#8b919a]">{migration.files.length} file(s)</p>
                  </div>
                  <span className="text-sm font-medium text-[#0c0f14]">
                    {formatCents(migration.migration_fee_cents)}
                  </span>
                </div>
              )}

              {migration.auto_create_carriers && (
                <div className="flex justify-between px-4 py-3">
                  <span className="text-sm text-[#8b919a]">Auto-Create Carrier Sub-Orgs</span>
                  <span className="text-sm font-medium text-[#0c0f14]">
                    {formatCents(AUTO_CREATE_CARRIER_FEE_CENTS)}
                  </span>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between px-4 py-3 bg-[#fafaf8]">
                <span className="text-sm font-bold text-[#0c0f14]">Total</span>
                <span className="text-lg font-bold text-[#C8A75E]">
                  {formatCents(totalCents)}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#8b919a] mb-4">
              Signed by <span className="font-medium text-[#0c0f14]">{legalSignatoryName}</span> — Partner Agreement & DPA accepted.
            </p>

            {error && (
              <div className="mb-4 border-l-[3px] border-red-500 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(5)} disabled={submitting}>
                Back
              </Button>
              <Button onClick={handleSubmit} loading={submitting} variant="gold">
                {submitting ? 'Redirecting to Stripe...' : 'Proceed to Payment'}
              </Button>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Step 7 is on the success page (/tms/apply/success) */}
        {/* ----------------------------------------------------------------- */}

        {/* Global error for non-step-6 errors */}
        {error && step !== 6 && (
          <div className="mt-4 border-l-[3px] border-red-500 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
