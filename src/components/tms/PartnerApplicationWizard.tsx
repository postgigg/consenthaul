'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Link2, Code2 } from 'lucide-react';
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
  if (annual <= 100_000) return 'tms_starter';
  if (annual <= 500_000) return 'tms_scale';
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

interface UploadedFileInfo {
  path: string;
  name: string;
  size_bytes: number;
  uploaded_at: string;
}

interface ParseResult {
  carrier_count: number;
  driver_count: number;
  carrier_sample: string[];
  driver_sample: string[];
}

interface MigrationInfo {
  has_migration_data: boolean;
  migration_file_paths: string[];
  migration_total_bytes: number;
  migration_fee_cents: number;
  migration_estimated_gb: number;
  auto_create_carriers: boolean;
  auto_create_fee_cents: number;
  transfer_token: string | null;
  carrier_count: number | null;
  driver_count: number | null;
  uploaded_files: UploadedFileInfo[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CARRIERS_TEMPLATE = `company_name,dot_number,mc_number,phone,email,contact_name
"ABC Trucking","1234567","MC-987654","(555) 111-2222","dispatch@abctrucking.com","Mike Johnson"`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DRIVERS_TEMPLATE = `carrier_company_name,first_name,last_name,phone,email,cdl_number,cdl_state,resend_date
"ABC Trucking","John","Smith","(555) 333-4444","john.smith@email.com","D1234567","CA","2026-06-15"`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function downloadTemplate(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
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
    migration_estimated_gb: 0,
    auto_create_carriers: false,
    auto_create_fee_cents: 0,
    transfer_token: null,
    carrier_count: null,
    driver_count: null,
    uploaded_files: [],
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [uploading, setUploading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [parsing, setParsing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [generatingLink, setGeneratingLink] = useState(false);
  const [shareableUrl, setShareableUrl] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [copied, setCopied] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activeMethod, setActiveMethod] = useState<'upload' | 'link' | 'api' | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [dragOver, setDragOver] = useState(false);

  // Step 4: Pack selection
  const [selectedPack, setSelectedPack] = useState<TmsPartnerPack | null>(null);

  // Step 5: Legal
  const [partnerAgreementAccepted, setPartnerAgreementAccepted] = useState(false);
  const [dataProcessingAccepted, setDataProcessingAccepted] = useState(false);
  const [legalSignatoryName, setLegalSignatoryName] = useState('');

  // Step 6: Review policies
  const [refundPolicyAccepted, setRefundPolicyAccepted] = useState(false);
  const [cancellationPolicyAccepted, setCancellationPolicyAccepted] = useState(false);

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
  // Transfer token management
  // ---------------------------------------------------------------------------

  const transferTokenRef = useRef<string | null>(null);

  const ensureTransferToken = useCallback(async (): Promise<string> => {
    if (transferTokenRef.current) return transferTokenRef.current;

    const res = await fetch('/api/tms/upload-migration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    if (!res.ok) throw new Error('Failed to create transfer session');

    const { token } = await res.json();
    transferTokenRef.current = token;
    setMigration((prev) => ({ ...prev, transfer_token: token }));
    return token;
  }, []);

  // ---------------------------------------------------------------------------
  // File upload handlers (presigned URL flow)
  // ---------------------------------------------------------------------------

  const uploadSingleFile = useCallback(async (file: File, transferToken: string) => {
    // 1. Get presigned URL
    const presignRes = await fetch('/api/tms/migration/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: transferToken,
        filename: file.name,
        content_type: file.type || 'text/csv',
        size_bytes: file.size,
      }),
    });

    if (!presignRes.ok) {
      const data = await presignRes.json();
      throw new Error(data.error || 'Failed to get upload URL');
    }

    const { signed_url, path } = await presignRes.json();

    // 2. PUT directly to storage (bypasses server body limit)
    const uploadRes = await fetch(signed_url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'text/csv' },
      body: file,
    });

    if (!uploadRes.ok) throw new Error(`Upload failed for ${file.name}`);

    // 3. Confirm
    const confirmRes = await fetch('/api/tms/migration/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: transferToken,
        path,
        filename: file.name,
        size_bytes: file.size,
      }),
    });

    if (!confirmRes.ok) {
      const data = await confirmRes.json();
      throw new Error(data.error || 'Failed to confirm upload');
    }

    return { path, confirmData: await confirmRes.json() };
  }, []);

  const handleFiles = useCallback(async (newFiles: File[]) => {
    const csvFiles = newFiles.filter((f) => f.name.endsWith('.csv'));
    if (csvFiles.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const transferToken = await ensureTransferToken();

      for (const file of csvFiles) {
        const { path, confirmData } = await uploadSingleFile(file, transferToken);

        setMigration((prev) => ({
          ...prev,
          has_migration_data: true,
          migration_total_bytes: confirmData.total_bytes,
          migration_fee_cents: confirmData.migration_fee_cents,
          uploaded_files: [...prev.uploaded_files, {
            path,
            name: file.name,
            size_bytes: file.size,
            uploaded_at: new Date().toISOString(),
          }],
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [uploadSingleFile, ensureTransferToken]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }

  // ---------------------------------------------------------------------------
  // Shareable link generation
  // ---------------------------------------------------------------------------

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function handleGenerateLink() {
    setGeneratingLink(true);
    setError('');
    try {
      const transferToken = await ensureTransferToken();
      const url = `${window.location.origin}/tms/upload/${transferToken}`;
      setShareableUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate link');
    } finally {
      setGeneratingLink(false);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleCopyLink() {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ---------------------------------------------------------------------------
  // Parse uploaded files
  // ---------------------------------------------------------------------------

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function handleParse() {
    if (!migration.transfer_token) return;
    setParsing(true);
    setError('');
    try {
      const res = await fetch('/api/tms/migration/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: migration.transfer_token }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Parse failed');
      }
      const result: ParseResult = await res.json();
      setParseResult(result);
      setMigration((prev) => ({
        ...prev,
        carrier_count: result.carrier_count,
        driver_count: result.driver_count,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parse failed');
    } finally {
      setParsing(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  async function handleSubmit() {
    setSubmitting(true);
    setError('');

    try {
      const payload: Record<string, unknown> = {
        ...company,
        website_url: company.website_url ? normalizeUrl(company.website_url) : undefined,
        carrier_count_range: volume.carrier_count_range,
        consents_per_carrier_month: volume.consents_per_carrier_month,
        estimated_annual_consents: annualEstimate,
        recommended_pack_id: recommendedPackId,
        has_migration_data: migration.has_migration_data,
        migration_file_paths: migration.uploaded_files.map((f) => f.path),
        migration_total_bytes: migration.migration_total_bytes,
        migration_fee_cents: migration.migration_fee_cents,
        transfer_token: migration.transfer_token,
        auto_create_carriers: migration.auto_create_carriers,
        auto_create_fee_cents: migration.auto_create_carriers ? AUTO_CREATE_CARRIER_FEE_CENTS : 0,
        partner_agreement_accepted: partnerAgreementAccepted as true,
        data_processing_accepted: dataProcessingAccepted as true,
        legal_signatory_name: legalSignatoryName,
      };

      if (selectedPack) {
        payload.selected_pack_id = selectedPack.id;
        payload.selected_pack_credits = selectedPack.credits;
        payload.selected_pack_price_cents = discountedPackCents;
      }

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

  // Total calculation (25% discount on pack when purchased during signup)
  const discountedPackCents = selectedPack
    ? Math.round(selectedPack.price_cents * (1 - selectedPack.signup_discount))
    : 0;
  const totalCents =
    TMS_ONBOARDING_FEE_CENTS +
    discountedPackCents +
    (migration.has_migration_data ? migration.migration_fee_cents : 0) +
    (migration.auto_create_carriers ? AUTO_CREATE_CARRIER_FEE_CENTS : 0);

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
              Migrate your existing carrier and driver data into ConsentHaul. After your account is created, you&apos;ll receive a secure transfer token to upload data via CSV or API.
              Migration is billed at <span className="font-medium text-[#0c0f14]">{formatCents(MIGRATION_PRICE_PER_GB_CENTS)}/GB</span> (minimum {formatCents(MIGRATION_PRICE_PER_GB_CENTS)}).
            </p>

            <div className="space-y-4">
              {/* Opt-in toggle */}
              <label className="flex items-start gap-3 p-4 border border-[#e8e8e3] cursor-pointer hover:border-[#d4d4cf] transition-colors">
                <input
                  type="checkbox"
                  checked={migration.has_migration_data}
                  onChange={(e) =>
                    setMigration((prev) => ({
                      ...prev,
                      has_migration_data: e.target.checked,
                      migration_estimated_gb: e.target.checked ? prev.migration_estimated_gb : 0,
                      migration_fee_cents: e.target.checked ? prev.migration_fee_cents : 0,
                      migration_total_bytes: e.target.checked ? prev.migration_total_bytes : 0,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 accent-[#C8A75E]"
                />
                <div>
                  <p className="text-sm font-medium text-[#0c0f14]">
                    I have existing data to migrate
                  </p>
                  <p className="text-xs text-[#8b919a] mt-0.5">
                    Carrier lists, driver records, or historical consent data you want imported into ConsentHaul.
                  </p>
                </div>
              </label>

              {/* GB estimate — only if opted in */}
              {migration.has_migration_data && (
                <div className="border border-[#e8e8e3] p-4">
                  <label className={labelCls}>Estimated Data Size (GB)</label>
                  <p className="text-xs text-[#8b919a] mb-2">
                    How much carrier/driver data do you need to migrate? Enter your estimated total in GB.
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={migration.migration_estimated_gb || ''}
                      placeholder="e.g. 5"
                      onChange={(e) => {
                        const gb = Math.max(0, parseInt(e.target.value) || 0);
                        const feeCents = gb > 0 ? gb * MIGRATION_PRICE_PER_GB_CENTS : 0;
                        setMigration((prev) => ({
                          ...prev,
                          migration_estimated_gb: gb,
                          migration_fee_cents: feeCents,
                          migration_total_bytes: gb * 1024 * 1024 * 1024,
                        }));
                      }}
                      className={inputCls + ' max-w-[120px]'}
                    />
                    <span className="text-sm text-[#8b919a]">GB</span>
                    {migration.migration_estimated_gb > 0 && (
                      <span className="text-sm font-medium text-[#C8A75E]">
                        = {formatCents(migration.migration_estimated_gb * MIGRATION_PRICE_PER_GB_CENTS)} migration fee
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Migration methods preview */}
              {migration.has_migration_data && (
                <div className="border border-[#e8e8e3] p-4">
                  <p className="text-xs font-medium text-[#8b919a] uppercase tracking-wider mb-3">
                    After account creation, you can migrate data via:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex flex-col items-center p-3 border border-[#e8e8e3] text-center">
                      <Upload className="h-5 w-5 text-[#C8A75E] mb-1.5" />
                      <p className="text-xs font-medium text-[#0c0f14]">CSV Upload</p>
                      <p className="text-[0.65rem] text-[#8b919a] mt-0.5">Drag & drop files</p>
                    </div>
                    <div className="flex flex-col items-center p-3 border border-[#e8e8e3] text-center">
                      <Link2 className="h-5 w-5 text-[#C8A75E] mb-1.5" />
                      <p className="text-xs font-medium text-[#0c0f14]">Shareable Link</p>
                      <p className="text-[0.65rem] text-[#8b919a] mt-0.5">Send to your data team</p>
                    </div>
                    <a
                      href="/tms/migration-api"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center p-3 border border-[#e8e8e3] text-center hover:border-[#C8A75E] transition-colors"
                    >
                      <Code2 className="h-5 w-5 text-[#C8A75E] mb-1.5" />
                      <p className="text-xs font-medium text-[#0c0f14]">Migration API</p>
                      <p className="text-[0.65rem] text-[#C8A75E] mt-0.5">Learn more &rarr;</p>
                    </a>
                  </div>
                  <p className="text-xs text-[#8b919a] mt-3">
                    A secure transfer token will be generated automatically after your account is created.
                  </p>
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
                    Each carrier gets its own ConsentHaul org ID and API tokens. Recommended for multi-tenant deployments.
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
            <p className="mb-2 text-sm font-medium text-[#3a3f49]">Select Your Credit Pack</p>
            <p className="mb-4 text-xs text-emerald-600 font-medium">
              Save up to 35% on credit packs when you purchase during signup. You can also buy credits later at full price.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TMS_PARTNER_PACKS.map((pack) => {
                const isRecommended = pack.id === recommendedPackId;
                const isSelected = selectedPack?.id === pack.id;
                const discountedCents = Math.round(pack.price_cents * (1 - pack.signup_discount));
                const discountPct = Math.round(pack.signup_discount * 100);
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
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-[#0c0f14]">{pack.name}</p>
                      <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {discountPct}% Off
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-[#0c0f14] mt-1">
                      {formatCents(discountedCents)}
                      <span className="text-sm text-[#8b919a] line-through ml-2">{formatCents(pack.price_cents)}</span>
                    </p>
                    <p className="text-sm text-[#C8A75E] font-medium mt-1">
                      {pack.credits.toLocaleString()} consents — ${(discountedCents / pack.credits / 100).toFixed(2)}/each
                      <span className="text-xs text-[#8b919a] line-through ml-1">{pack.per_consent}</span>
                    </p>
                    <p className="text-xs text-[#8b919a] mt-2">{pack.description}</p>
                  </button>
                );
              })}
            </div>

            {/* Skip option */}
            <button
              type="button"
              onClick={() => { setSelectedPack(null); setStep(5); }}
              className="mt-4 w-full text-center py-3 border border-dashed border-[#d4d4cf] text-sm text-[#8b919a] hover:border-[#C8A75E] hover:text-[#C8A75E] transition-colors"
            >
              Skip — I&apos;ll buy credits later at full price
            </button>

            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
              <Button onClick={() => setStep(5)} variant="gold">
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
                  ConsentHaul TMS Partner Agreement
                </p>
                <div className="h-64 overflow-y-auto border border-[#e8e8e3] bg-[#fafaf8] p-3 text-xs text-[#3a3f49] leading-relaxed mb-3">
                  <p className="font-bold mb-2">WORKBIRD LLC d/b/a CONSENTHAUL — TMS PARTNER AGREEMENT</p>
                  <p className="mb-1 text-[0.65rem] text-[#8b919a]">Effective upon electronic acceptance. Last updated February 2026.</p>

                  <p className="mb-2">This TMS Partner Agreement (&quot;Agreement&quot;) is a legally binding contract between Workbird LLC, doing business as ConsentHaul (&quot;ConsentHaul,&quot; &quot;we,&quot; &quot;us&quot;), and the entity identified in the partner application form (&quot;Partner,&quot; &quot;you&quot;). By accepting this Agreement, you represent that you have the authority to bind your organization.</p>

                  <p className="mb-2"><strong>1. LICENSE GRANT.</strong> Subject to payment of all applicable fees and compliance with this Agreement, ConsentHaul grants Partner a limited, non-exclusive, non-transferable, revocable license to: (a) access and use ConsentHaul&apos;s API solely to integrate FMCSA Clearinghouse consent collection into Partner&apos;s TMS platform; and (b) resell consent collection services to Partner&apos;s carrier customers using consumed credits. This license does not include any right to sublicense, reverse engineer, modify, create derivative works of, or otherwise exploit ConsentHaul&apos;s software, APIs, documentation, or intellectual property.</p>

                  <p className="mb-2"><strong>2. INTELLECTUAL PROPERTY.</strong> ConsentHaul retains all right, title, and interest in and to the ConsentHaul platform, APIs, documentation, consent templates, PDF generation engine, delivery infrastructure, and all related intellectual property. Nothing in this Agreement transfers any ownership rights to Partner. Partner shall not: (a) use ConsentHaul&apos;s name, logo, or trademarks without prior written consent; (b) represent itself as ConsentHaul or imply any affiliation beyond the partner relationship; (c) attempt to access, copy, or extract the source code underlying ConsentHaul&apos;s services; or (d) build a competing consent collection product using knowledge gained through this partnership.</p>

                  <p className="mb-2"><strong>3. FEES &amp; PAYMENT.</strong> (a) <em>Credit Packs.</em> Partner purchases consent credits at the rates specified during checkout. Credits are consumed upon each successful consent transaction. Credits purchased are non-refundable after thirty (30) calendar days from the date of purchase. Unused credits do not expire. (b) <em>Onboarding &amp; Service Fees.</em> All onboarding fees, data migration fees, auto-create fees, and add-on service fees are non-refundable once services have been initiated. (c) <em>Pricing Changes.</em> ConsentHaul reserves the right to modify credit pricing for future purchases with thirty (30) days&apos; written notice. Previously purchased credits are not affected by price changes. (d) <em>Taxes.</em> All fees are exclusive of taxes. Partner is responsible for all applicable sales, use, VAT, and withholding taxes. (e) <em>Signup Discounts.</em> Any discount applied during the initial partner application (including but not limited to signup discounts on credit packs) is a one-time promotional offer. Future credit purchases are at the then-current published rates.</p>

                  <p className="mb-2"><strong>4. SERVICE LEVELS &amp; SUPPORT.</strong> (a) ConsentHaul will use commercially reasonable efforts to maintain 99.9% API uptime, measured monthly, excluding scheduled maintenance. (b) ConsentHaul provides integration support on a reasonable-efforts basis. Support does not include building, debugging, or maintaining Partner&apos;s integration code. (c) ConsentHaul may modify, update, or deprecate API endpoints with thirty (30) days&apos; notice. Partner is responsible for updating its integration accordingly.</p>

                  <p className="mb-2"><strong>5. PROFESSIONAL SERVICES.</strong> (a) <em>Scope.</em> Any work requested by Partner beyond the standard integration support described in Section 4 — including but not limited to custom development, bespoke integrations, data transformations, dedicated engineering support, consulting, architecture reviews, training, or any other professional services — shall be governed by this Section. (b) <em>Rate.</em> Professional services are billed at Two Hundred Fifty Dollars ($250.00) per hour, billed in fifteen (15) minute increments. (c) <em>Minimum Engagement.</em> Each professional services engagement requires a minimum commitment of forty (40) hours (&quot;Minimum Engagement&quot;). The Minimum Engagement fee of Ten Thousand Dollars ($10,000.00) is due upon execution of a Statement of Work and is non-refundable once work has commenced. (d) <em>Statement of Work.</em> All professional services engagements require a signed Statement of Work (&quot;SOW&quot;) specifying scope, deliverables, timeline, and estimated hours. ConsentHaul is not obligated to perform any work without an executed SOW. (e) <em>Change Orders.</em> Any changes to the scope of an active SOW require a written change order signed by both parties. Additional hours beyond the original SOW estimate are billed at the same rate. (f) <em>Payment Terms.</em> Professional services invoices are due Net 15 from invoice date. Late payments accrue interest at 1.5% per month or the maximum rate permitted by law, whichever is lower. (g) <em>Intellectual Property.</em> All work product created during a professional services engagement is owned by ConsentHaul and licensed to Partner under the terms of Section 1. Custom integrations built for Partner are licensed for Partner&apos;s use only and may not be resold, redistributed, or sublicensed. (h) <em>No Obligation.</em> ConsentHaul reserves the right to decline any professional services request at its sole discretion.</p>

                  <p className="mb-2"><strong>6. DATA &amp; COMPLIANCE.</strong> (a) All driver consent data is processed in accordance with FMCSA Clearinghouse regulations (49 CFR Part 40), the Electronic Signatures in Global and National Commerce Act (ESIGN Act), and the Uniform Electronic Transactions Act (UETA). (b) ConsentHaul maintains SOC 2 Type II compliance. (c) Partner shall not use ConsentHaul&apos;s services for any purpose other than FMCSA consent collection. (d) Partner is solely responsible for ensuring its carrier customers use the service in compliance with applicable law. ConsentHaul is not liable for Partner&apos;s or its customers&apos; regulatory violations.</p>

                  <p className="mb-2"><strong>7. SUB-ORGANIZATIONS.</strong> If Partner elects auto-creation of carrier sub-organizations: (a) each carrier receives its own organization ID, API credentials, and isolated data scope; (b) Partner is responsible for managing carrier access and provisioning; (c) ConsentHaul is not responsible for any misuse of API credentials by Partner&apos;s carriers. The auto-create service fee is non-refundable once provisioning has begun.</p>

                  <p className="mb-2"><strong>8. DATA MIGRATION.</strong> If Partner elects data migration services: (a) migration fees are calculated based on actual data volume at the published per-GB rate and are non-refundable once migration processing begins; (b) Partner warrants that all data submitted for migration is accurate, lawfully obtained, and that Partner has the right to transfer it; (c) ConsentHaul is not liable for data quality issues, formatting errors, or incomplete records in Partner-submitted data.</p>

                  <p className="mb-2"><strong>9. TERM &amp; TERMINATION.</strong> (a) <em>Term.</em> This Agreement is effective upon acceptance and continues for twelve (12) months (&quot;Initial Term&quot;), automatically renewing for successive twelve-month periods unless either party provides sixty (60) days&apos; written notice of non-renewal. (b) <em>Termination for Cause.</em> Either party may terminate immediately upon written notice if the other party materially breaches this Agreement and fails to cure within thirty (30) days of notice. (c) <em>Effect of Termination.</em> Upon termination: remaining unused credits stay active for ninety (90) days; API access is revoked thirty (30) days after the effective termination date; FMCSA data retention obligations survive termination; Partner shall immediately cease using ConsentHaul&apos;s trademarks and remove all references to the partnership from its materials. (d) <em>No Refunds on Termination.</em> Termination does not entitle Partner to a refund of any previously paid fees, credits, or service charges.</p>

                  <p className="mb-2"><strong>10. LIMITATION OF LIABILITY.</strong> (a) TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL CONSENTHAUL BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, REVENUE, DATA, OR BUSINESS OPPORTUNITY, REGARDLESS OF THE CAUSE OF ACTION OR THEORY OF LIABILITY. (b) CONSENTHAUL&apos;S TOTAL AGGREGATE LIABILITY UNDER THIS AGREEMENT SHALL NOT EXCEED THE FEES ACTUALLY PAID BY PARTNER TO CONSENTHAUL IN THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM. (c) THE FOREGOING LIMITATIONS APPLY EVEN IF CONSENTHAUL HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>

                  <p className="mb-2"><strong>11. DISCLAIMER OF WARRANTIES.</strong> THE CONSENTHAUL PLATFORM AND SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE.&quot; CONSENTHAUL EXPRESSLY DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. CONSENTHAUL DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.</p>

                  <p className="mb-2"><strong>12. INDEMNIFICATION.</strong> Partner shall indemnify, defend, and hold harmless ConsentHaul and its officers, directors, employees, and agents from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising out of or relating to: (a) Partner&apos;s breach of this Agreement; (b) Partner&apos;s misuse of the ConsentHaul services; (c) any violation of law by Partner or Partner&apos;s carrier customers; (d) any claim by a third party resulting from Partner&apos;s use of the services or data processed through the platform.</p>

                  <p className="mb-2"><strong>13. CONFIDENTIALITY.</strong> Each party shall treat the other party&apos;s confidential information (including API keys, pricing terms, and technical documentation) with at least the same degree of care it uses for its own confidential information. Neither party shall disclose the other&apos;s confidential information to third parties without prior written consent, except as required by law.</p>

                  <p className="mb-2"><strong>14. GOVERNING LAW &amp; DISPUTE RESOLUTION.</strong> This Agreement shall be governed by the laws of the State of Delaware without regard to conflict of law principles. Any dispute arising under this Agreement shall be resolved exclusively in the state or federal courts located in Wilmington, Delaware. Both parties consent to personal jurisdiction in such courts. The prevailing party in any legal proceeding shall be entitled to recover reasonable attorneys&apos; fees and costs.</p>

                  <p className="mb-2"><strong>15. MISCELLANEOUS.</strong> (a) <em>Entire Agreement.</em> This Agreement, together with the Data Processing Agreement and any order forms, constitutes the entire agreement between the parties. (b) <em>Amendments.</em> ConsentHaul may update this Agreement with thirty (30) days&apos; notice. Continued use after the notice period constitutes acceptance. (c) <em>Severability.</em> If any provision is held unenforceable, the remaining provisions continue in full force. (d) <em>Assignment.</em> Partner may not assign this Agreement without ConsentHaul&apos;s prior written consent. ConsentHaul may assign freely in connection with a merger, acquisition, or sale of substantially all assets. (e) <em>Force Majeure.</em> Neither party is liable for delays caused by events beyond reasonable control, including natural disasters, war, pandemic, or government action. (f) <em>No Waiver.</em> Failure to enforce any provision shall not constitute a waiver of future enforcement.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={partnerAgreementAccepted}
                    onChange={(e) => setPartnerAgreementAccepted(e.target.checked)}
                    className="h-4 w-4 accent-[#C8A75E]"
                  />
                  <span className="text-sm text-[#0c0f14]">
                    I have read and accept the ConsentHaul TMS Partner Agreement
                  </span>
                </label>
              </div>

              {/* DPA */}
              <div className="border border-[#e8e8e3] p-4">
                <p className="text-xs font-bold text-[#8b919a] uppercase tracking-wider mb-2">
                  Data Processing Agreement
                </p>
                <div className="h-48 overflow-y-auto border border-[#e8e8e3] bg-[#fafaf8] p-3 text-xs text-[#3a3f49] leading-relaxed mb-3">
                  <p className="font-bold mb-2">DATA PROCESSING AGREEMENT (DPA)</p>
                  <p className="mb-1 text-[0.65rem] text-[#8b919a]">Supplement to the ConsentHaul TMS Partner Agreement.</p>

                  <p className="mb-2">This Data Processing Agreement (&quot;DPA&quot;) forms part of the Partner Agreement and governs ConsentHaul&apos;s processing of personal data on behalf of Partner and Partner&apos;s carrier customers.</p>

                  <p className="mb-2"><strong>1. DEFINITIONS.</strong> &quot;Personal Data&quot; means any information relating to an identified or identifiable natural person processed through ConsentHaul&apos;s services, including driver names, CDL numbers, contact details, signatures, consent records, and device metadata. &quot;Processing&quot; means any operation performed on Personal Data, including collection, recording, storage, retrieval, use, transmission, and deletion.</p>

                  <p className="mb-2"><strong>2. SCOPE &amp; PURPOSE.</strong> ConsentHaul processes Personal Data solely for: (a) FMCSA Clearinghouse consent collection and document generation; (b) electronic signature capture, verification, and storage; (c) compliance record-keeping as required by 49 CFR Part 40; and (d) service delivery, analytics, and platform improvement. ConsentHaul shall not process Personal Data for any purpose not authorized under this DPA or the Partner Agreement.</p>

                  <p className="mb-2"><strong>3. DATA OWNERSHIP.</strong> Partner and its carrier customers retain ownership of all Personal Data submitted to ConsentHaul. ConsentHaul does not acquire any ownership interest in Personal Data. However, ConsentHaul may use aggregated, anonymized, de-identified data for platform analytics, benchmarking, and service improvement.</p>

                  <p className="mb-2"><strong>4. SECURITY MEASURES.</strong> ConsentHaul implements and maintains the following security measures: (a) AES-256 encryption of data at rest; (b) TLS 1.3 encryption of data in transit; (c) role-based access controls with principle of least privilege; (d) comprehensive audit logging of all data access; (e) regular penetration testing and vulnerability assessments; (f) SOC 2 Type II certification with annual third-party audits; (g) multi-factor authentication for all internal access; (h) automated monitoring and alerting for security events.</p>

                  <p className="mb-2"><strong>5. DATA RETENTION &amp; DELETION.</strong> (a) Signed consent documents are retained for a minimum of three (3) years per FMCSA requirements. (b) Upon written request after the mandatory retention period, ConsentHaul will delete Personal Data within thirty (30) days, except where retention is required by law. (c) ConsentHaul may retain anonymized, aggregated data indefinitely. (d) Data retention obligations survive termination of the Partner Agreement.</p>

                  <p className="mb-2"><strong>6. SUB-PROCESSORS.</strong> Partner acknowledges that ConsentHaul uses the following categories of sub-processors: cloud infrastructure providers, email/SMS delivery services, payment processors, and document storage services. ConsentHaul maintains contractual obligations with sub-processors that are no less protective than this DPA. ConsentHaul will provide thirty (30) days&apos; notice before engaging new categories of sub-processors.</p>

                  <p className="mb-2"><strong>7. DATA BREACH NOTIFICATION.</strong> In the event of a confirmed data breach affecting Personal Data, ConsentHaul shall: (a) notify Partner without undue delay and in no event later than seventy-two (72) hours after becoming aware of the breach; (b) provide details of the nature, scope, and likely consequences of the breach; (c) take immediate steps to contain and remediate the breach; (d) cooperate with Partner in fulfilling any legal notification obligations.</p>

                  <p className="mb-2"><strong>8. PARTNER OBLIGATIONS.</strong> Partner shall: (a) ensure all Personal Data submitted to ConsentHaul is collected lawfully and with appropriate consent; (b) not submit sensitive personal information beyond what is necessary for FMCSA consent collection; (c) notify ConsentHaul promptly of any data subject access requests or complaints; (d) ensure its carrier customers comply with applicable data protection requirements.</p>

                  <p className="mb-2"><strong>9. LIABILITY.</strong> ConsentHaul&apos;s liability under this DPA is subject to the limitations set forth in the Partner Agreement. Partner is solely responsible for the accuracy and lawfulness of Personal Data submitted to ConsentHaul.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dataProcessingAccepted}
                    onChange={(e) => setDataProcessingAccepted(e.target.checked)}
                    className="h-4 w-4 accent-[#C8A75E]"
                  />
                  <span className="text-sm text-[#0c0f14]">
                    I have read and accept the Data Processing Agreement
                  </span>
                </label>
              </div>

              {/* Typed signature */}
              <div>
                <label className={labelCls}>Authorized Signatory — Full Legal Name *</label>
                <input
                  type="text"
                  value={legalSignatoryName}
                  onChange={(e) => setLegalSignatoryName(e.target.value)}
                  placeholder="Type your full legal name as electronic signature"
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-[#8b919a]">
                  By typing your name above, you represent that you are authorized to bind your organization and you acknowledge this constitutes a legally binding electronic signature pursuant to the Electronic Signatures in Global and National Commerce Act (15 U.S.C. &sect; 7001 et seq.) and applicable state law.
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
        {step === 6 && (
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
                <span className="text-sm text-[#8b919a]">Partner Onboarding</span>
                <span className="text-sm font-medium text-emerald-600">
                  Free
                </span>
              </div>

              {selectedPack && (
                <div className="flex justify-between px-4 py-3">
                  <div>
                    <span className="text-sm text-[#8b919a]">{selectedPack.name} Credit Pack</span>
                    <p className="text-xs text-[#8b919a]">
                      {selectedPack.credits.toLocaleString()} consents at ${(discountedPackCents / selectedPack.credits / 100).toFixed(2)}/each <span className="line-through">{selectedPack.per_consent}</span>
                    </p>
                    <p className="text-xs text-emerald-600 font-medium">{Math.round(selectedPack.signup_discount * 100)}% signup discount applied</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-[#0c0f14]">
                      {formatCents(discountedPackCents)}
                    </span>
                    <p className="text-xs text-[#8b919a] line-through">
                      {formatCents(selectedPack.price_cents)}
                    </p>
                  </div>
                </div>
              )}

              {migration.has_migration_data && migration.migration_fee_cents > 0 && (
                <div className="flex justify-between px-4 py-3">
                  <div>
                    <span className="text-sm text-[#8b919a]">Data Migration</span>
                    <p className="text-xs text-[#8b919a]">
                      {migration.migration_estimated_gb > 0
                        ? `${migration.migration_estimated_gb} GB estimated`
                        : `${migration.uploaded_files.length} file(s)`}
                    </p>
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
                  {totalCents > 0 ? formatCents(totalCents) : 'Free'}
                </span>
              </div>
            </div>

            {/* Policy checkboxes */}
            <div className="space-y-3 mb-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={refundPolicyAccepted}
                  onChange={(e) => setRefundPolicyAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#C8A75E] shrink-0"
                />
                <span className="text-xs text-[#3a3f49] leading-relaxed">
                  I acknowledge the <span className="font-medium text-[#0c0f14]">Refund Policy</span>: Credit packs are non-refundable after 30 days from purchase. Unused credits do not expire. Onboarding fees, migration fees, and add-on service fees are non-refundable once services have been initiated.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cancellationPolicyAccepted}
                  onChange={(e) => setCancellationPolicyAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#C8A75E] shrink-0"
                />
                <span className="text-xs text-[#3a3f49] leading-relaxed">
                  I acknowledge the <span className="font-medium text-[#0c0f14]">Cancellation Policy</span>: Either party may cancel the partnership with 60 days written notice. Upon cancellation, remaining credits stay active until used. API access is revoked 30 days after the cancellation effective date. Data retention obligations per FMCSA continue regardless of cancellation.
                </span>
              </label>
            </div>

            <p className="text-xs text-[#8b919a] mb-4">
              Signed by <span className="font-medium text-[#0c0f14]">{legalSignatoryName}</span> — Partner Agreement, DPA, Refund Policy & Cancellation Policy accepted.
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
              <Button
                onClick={handleSubmit}
                loading={submitting}
                disabled={!refundPolicyAccepted || !cancellationPolicyAccepted}
                variant="gold"
              >
                {submitting ? 'Submitting...' : totalCents > 0 ? 'Proceed to Payment' : 'Submit Application'}
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
