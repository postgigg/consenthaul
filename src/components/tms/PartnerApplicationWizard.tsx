'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Download, Link2, Code2, Search, Copy, Check, FileText } from 'lucide-react';
import {
  TMS_PARTNER_PACKS,
  TMS_ONBOARDING_FEE_CENTS,
  TMS_SIGNUP_DISCOUNT,
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
  if (annual <= 100_000) return 'tms_growth';
  if (annual <= 250_000) return 'tms_scale';
  if (annual <= 500_000) return 'tms_enterprise';
  return 'tms_mega';
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
  auto_create_carriers: boolean;
  auto_create_fee_cents: number;
  transfer_token: string | null;
  carrier_count: number | null;
  driver_count: number | null;
  uploaded_files: UploadedFileInfo[];
}

const CARRIERS_TEMPLATE = `company_name,dot_number,mc_number,phone,email,contact_name
"ABC Trucking","1234567","MC-987654","(555) 111-2222","dispatch@abctrucking.com","Mike Johnson"`;

const DRIVERS_TEMPLATE = `carrier_company_name,first_name,last_name,phone,email,cdl_number,cdl_state
"ABC Trucking","John","Smith","(555) 333-4444","john.smith@email.com","D1234567","CA"`;

function downloadTemplate(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

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
    auto_create_carriers: false,
    auto_create_fee_cents: 0,
    transfer_token: null,
    carrier_count: null,
    driver_count: null,
    uploaded_files: [],
  });
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [shareableUrl, setShareableUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeMethod, setActiveMethod] = useState<'upload' | 'link' | 'api' | null>(null);
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

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }

  // ---------------------------------------------------------------------------
  // Shareable link generation
  // ---------------------------------------------------------------------------

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

  function handleCopyLink() {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ---------------------------------------------------------------------------
  // Parse uploaded files
  // ---------------------------------------------------------------------------

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
        migration_file_paths: migration.uploaded_files.map((f) => f.path),
        migration_total_bytes: migration.migration_total_bytes,
        migration_fee_cents: migration.migration_fee_cents,
        transfer_token: migration.transfer_token,
        auto_create_carriers: migration.auto_create_carriers,
        auto_create_fee_cents: migration.auto_create_carriers ? AUTO_CREATE_CARRIER_FEE_CENTS : 0,
        selected_pack_id: selectedPack.id,
        selected_pack_credits: selectedPack.credits,
        selected_pack_price_cents: discountedPackCents,
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

  // Total calculation (25% discount on pack when purchased during signup)
  const discountedPackCents = selectedPack
    ? Math.round(selectedPack.price_cents * (1 - TMS_SIGNUP_DISCOUNT))
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
              Transfer your existing carrier/driver data into ConsentHaul. Upload CSV files, share a link with your data team, or use the API.
              Migration is billed at <span className="font-medium text-[#0c0f14]">{formatCents(MIGRATION_PRICE_PER_GB_CENTS)}/GB</span> (minimum {formatCents(MIGRATION_PRICE_PER_GB_CENTS)}).
            </p>

            <div className="space-y-4">
              {/* CSV Template Downloads */}
              <div className="border border-[#e8e8e3] p-4">
                <p className="text-xs font-medium text-[#8b919a] uppercase tracking-wider mb-3">
                  CSV Templates
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => downloadTemplate('carriers.csv', CARRIERS_TEMPLATE)}
                    className="flex items-center gap-2 px-3 py-2 border border-[#e8e8e3] text-sm text-[#3a3f49] hover:border-[#C8A75E] transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    carriers.csv
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadTemplate('drivers.csv', DRIVERS_TEMPLATE)}
                    className="flex items-center gap-2 px-3 py-2 border border-[#e8e8e3] text-sm text-[#3a3f49] hover:border-[#C8A75E] transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    drivers.csv
                  </button>
                </div>
                <p className="mt-2 text-xs text-[#8b919a]">
                  Use <code className="text-[#0c0f14] bg-[#f0f0ec] px-1">carrier_company_name</code> in drivers.csv to link drivers to their carrier in carriers.csv.
                </p>
              </div>

              {/* Three transfer method cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Upload Here */}
                <button
                  type="button"
                  onClick={() => setActiveMethod(activeMethod === 'upload' ? null : 'upload')}
                  className={`flex flex-col items-center p-4 border text-center transition-colors ${
                    activeMethod === 'upload'
                      ? 'border-[#C8A75E] bg-[#C8A75E]/5'
                      : 'border-[#e8e8e3] hover:border-[#d4d4cf]'
                  }`}
                >
                  <Upload className="h-6 w-6 text-[#C8A75E] mb-2" />
                  <p className="text-sm font-medium text-[#0c0f14]">Upload Here</p>
                  <p className="text-xs text-[#8b919a] mt-1">Drag & drop CSV files</p>
                </button>

                {/* Share Upload Link */}
                <button
                  type="button"
                  onClick={() => setActiveMethod(activeMethod === 'link' ? null : 'link')}
                  className={`flex flex-col items-center p-4 border text-center transition-colors ${
                    activeMethod === 'link'
                      ? 'border-[#C8A75E] bg-[#C8A75E]/5'
                      : 'border-[#e8e8e3] hover:border-[#d4d4cf]'
                  }`}
                >
                  <Link2 className="h-6 w-6 text-[#C8A75E] mb-2" />
                  <p className="text-sm font-medium text-[#0c0f14]">Share Upload Link</p>
                  <p className="text-xs text-[#8b919a] mt-1">Send to your data team</p>
                </button>

                {/* Migration API */}
                <button
                  type="button"
                  onClick={() => setActiveMethod(activeMethod === 'api' ? null : 'api')}
                  className={`flex flex-col items-center p-4 border text-center transition-colors ${
                    activeMethod === 'api'
                      ? 'border-[#C8A75E] bg-[#C8A75E]/5'
                      : 'border-[#e8e8e3] hover:border-[#d4d4cf]'
                  }`}
                >
                  <Code2 className="h-6 w-6 text-[#C8A75E] mb-2" />
                  <p className="text-sm font-medium text-[#0c0f14]">Migration API</p>
                  <p className="text-xs text-[#8b919a] mt-1">POST data programmatically</p>
                </button>
              </div>

              {/* Upload Here panel */}
              {activeMethod === 'upload' && (
                <div className="space-y-3">
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
                      Files upload directly to secure storage. No size limit.
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
                </div>
              )}

              {/* Share Upload Link panel */}
              {activeMethod === 'link' && (
                <div className="border border-[#e8e8e3] p-4 space-y-3">
                  {!shareableUrl ? (
                    <Button
                      onClick={handleGenerateLink}
                      loading={generatingLink}
                      variant="gold"
                      className="w-full"
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      Generate Upload Link
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-[#8b919a] uppercase tracking-wider">
                        Share this link with your data team
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={shareableUrl}
                          readOnly
                          className="flex-1 border border-[#e8e8e3] px-3 py-2 text-sm text-[#0c0f14] bg-[#fafaf8] focus:outline-none"
                        />
                        <Button onClick={handleCopyLink} variant="outline" className="shrink-0">
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-[#8b919a]">
                        Link expires in 7 days. Anyone with this link can upload files.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Migration API panel */}
              {activeMethod === 'api' && (
                <div className="border border-[#e8e8e3] p-4 space-y-3">
                  {!migration.transfer_token ? (
                    <div>
                      <p className="text-sm text-[#8b919a] mb-3">
                        Generate a transfer token first, then use it to POST data via the API.
                      </p>
                      <Button
                        onClick={async () => {
                          setError('');
                          try {
                            await ensureTransferToken();
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'Failed to create token');
                          }
                        }}
                        variant="gold"
                        className="w-full"
                      >
                        Generate API Token
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-medium text-[#8b919a] uppercase tracking-wider mb-2">
                        API Endpoint
                      </p>
                      <div className="bg-[#0c0f14] text-[#e8e8e3] p-3 text-xs font-mono overflow-x-auto whitespace-pre">
{`curl -X POST ${typeof window !== 'undefined' ? window.location.origin : ''}/api/tms/migration/ingest \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "${migration.transfer_token}",
    "type": "carriers",
    "data": [
      {
        "company_name": "ABC Trucking",
        "dot_number": "1234567",
        "mc_number": "MC-987654"
      }
    ]
  }'`}
                      </div>
                      <p className="text-xs text-[#8b919a] mt-2">
                        Use <code className="text-[#0c0f14] bg-[#f0f0ec] px-1">&quot;type&quot;: &quot;drivers&quot;</code> for driver records. Max 10,000 records per request.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Uploaded file list */}
              {migration.uploaded_files.length > 0 && (
                <div className="border border-[#e8e8e3] divide-y divide-[#e8e8e3]">
                  {migration.uploaded_files.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2">
                      <FileText className="h-4 w-4 text-[#8b919a] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[#0c0f14] truncate">{file.name}</p>
                        <p className="text-xs text-[#8b919a]">{formatBytes(file.size_bytes)}</p>
                      </div>
                    </div>
                  ))}
                  <div className="px-4 py-2 bg-[#fafaf8]">
                    <p className="text-xs text-[#8b919a]">
                      {migration.uploaded_files.length} file(s) — {formatBytes(migration.migration_total_bytes)} total
                    </p>
                    {migration.migration_fee_cents > 0 && (
                      <p className="text-xs font-medium text-[#C8A75E] mt-0.5">
                        Migration fee: {formatCents(migration.migration_fee_cents)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Scan Files button */}
              {migration.uploaded_files.length > 0 && migration.transfer_token && (
                <Button
                  onClick={handleParse}
                  loading={parsing}
                  variant="gold"
                  className="w-full"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {parsing ? 'Scanning...' : 'Scan Files'}
                </Button>
              )}

              {/* Parse result */}
              {parseResult && (
                <div className="border border-[#C8A75E]/30 bg-[#C8A75E]/5 p-4">
                  <p className="text-sm font-medium text-[#0c0f14]">
                    Found {parseResult.carrier_count.toLocaleString()} carrier{parseResult.carrier_count !== 1 ? 's' : ''} and{' '}
                    {parseResult.driver_count.toLocaleString()} driver{parseResult.driver_count !== 1 ? 's' : ''}
                  </p>
                  {parseResult.carrier_sample.length > 0 && (
                    <p className="text-xs text-[#8b919a] mt-1">
                      Carriers: {parseResult.carrier_sample.join(', ')}
                      {parseResult.carrier_count > 3 && ', ...'}
                    </p>
                  )}
                  {parseResult.driver_sample.length > 0 && (
                    <p className="text-xs text-[#8b919a] mt-0.5">
                      Drivers: {parseResult.driver_sample.join(', ')}
                      {parseResult.driver_count > 3 && ', ...'}
                    </p>
                  )}
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
            <p className="mb-2 text-sm font-medium text-[#3a3f49]">Select Your Credit Pack</p>
            <p className="mb-4 text-xs text-emerald-600 font-medium">
              Save 25% on credit packs when you purchase during signup. You can also buy credits later at full price.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TMS_PARTNER_PACKS.map((pack) => {
                const isRecommended = pack.id === recommendedPackId;
                const isSelected = selectedPack?.id === pack.id;
                const discountedCents = Math.round(pack.price_cents * (1 - TMS_SIGNUP_DISCOUNT));
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
                        25% Off
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-[#0c0f14] mt-1">
                      {formatCents(discountedCents)}
                      <span className="text-sm text-[#8b919a] line-through ml-2">{formatCents(pack.price_cents)}</span>
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
                  <p className="mb-2"><strong>2. Onboarding.</strong> ConsentHaul provides integration support, sandbox API keys, and a dedicated partner channel as part of the onboarding fee.</p>
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
                <span className="text-sm text-[#8b919a]">Partner Onboarding</span>
                <span className="text-sm font-medium text-emerald-600">
                  Free
                </span>
              </div>

              <div className="flex justify-between px-4 py-3">
                <div>
                  <span className="text-sm text-[#8b919a]">{selectedPack.name} Credit Pack</span>
                  <p className="text-xs text-[#8b919a]">
                    {selectedPack.credits.toLocaleString()} consents at {selectedPack.per_consent}/each
                  </p>
                  <p className="text-xs text-emerald-600 font-medium">25% signup discount applied</p>
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

              {migration.has_migration_data && migration.migration_fee_cents > 0 && (
                <div className="flex justify-between px-4 py-3">
                  <div>
                    <span className="text-sm text-[#8b919a]">Data Migration</span>
                    <p className="text-xs text-[#8b919a]">{migration.uploaded_files.length} file(s)</p>
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
