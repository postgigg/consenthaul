'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MIGRATION_PRICE_PER_GB_CENTS } from '@/lib/stripe/credits';

interface UploadedFile {
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

interface Props {
  token: string;
  label: string;
  companyName: string;
  initialFiles: UploadedFile[];
  initialTotalBytes: number;
  initialCarrierCount: number | null;
  initialDriverCount: number | null;
  expiresAt: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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

export function MigrationUploadClient({
  token,
  label,
  companyName,
  initialFiles,
  initialTotalBytes,
  initialCarrierCount,
  initialDriverCount,
  expiresAt,
}: Props) {
  const [files, setFiles] = useState<UploadedFile[]>(initialFiles);
  const [totalBytes, setTotalBytes] = useState(initialTotalBytes);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(
    initialCarrierCount != null && initialDriverCount != null
      ? { carrier_count: initialCarrierCount, driver_count: initialDriverCount, carrier_sample: [], driver_sample: [] }
      : null,
  );
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const migrationFeeCents = Math.max(1, Math.ceil(totalBytes / (1024 * 1024 * 1024))) * MIGRATION_PRICE_PER_GB_CENTS;

  const uploadFile = useCallback(async (file: File) => {
    // 1. Get presigned URL
    const presignRes = await fetch('/api/tms/migration/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
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

    // 2. Upload directly to storage
    const uploadRes = await fetch(signed_url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'text/csv',
      },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload failed for ${file.name}`);
    }

    // 3. Confirm upload
    const confirmRes = await fetch('/api/tms/migration/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        path,
        filename: file.name,
        size_bytes: file.size,
      }),
    });

    if (!confirmRes.ok) {
      const data = await confirmRes.json();
      throw new Error(data.error || 'Failed to confirm upload');
    }

    const confirmData = await confirmRes.json();
    return { path, confirmData };
  }, [token]);

  const handleFiles = useCallback(async (newFiles: File[]) => {
    const csvFiles = newFiles.filter((f) => f.name.endsWith('.csv'));
    if (csvFiles.length === 0) {
      setError('Only CSV files are accepted');
      return;
    }

    setUploading(true);
    setError('');

    try {
      for (const file of csvFiles) {
        const { path, confirmData } = await uploadFile(file);

        setFiles((prev) => [...prev, {
          path,
          name: file.name,
          size_bytes: file.size,
          uploaded_at: new Date().toISOString(),
        }]);
        setTotalBytes(confirmData.total_bytes);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [uploadFile]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }

  async function handleParse() {
    setParsing(true);
    setError('');

    try {
      const res = await fetch('/api/tms/migration/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Parse failed');
      }

      const result = await res.json();
      setParseResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parse failed');
    } finally {
      setParsing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#0c0f14]">{label}</h1>
        {companyName && (
          <p className="mt-1 text-sm text-[#8b919a]">For {companyName}</p>
        )}
        <p className="mt-1 text-xs text-[#8b919a]">
          Link expires {new Date(expiresAt).toLocaleDateString()}
        </p>
      </div>

      {/* Template downloads */}
      <div className="border border-[#e8e8e3] p-4">
        <p className="text-xs font-medium text-[#8b919a] uppercase tracking-wider mb-3">
          CSV Templates
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => downloadTemplate('carriers.csv', CARRIERS_TEMPLATE)}
            className="flex items-center gap-2 px-3 py-2 border border-[#e8e8e3] text-sm text-[#3a3f49] hover:border-[#C8A75E] transition-colors"
          >
            <Download className="h-4 w-4" />
            carriers.csv
          </button>
          <button
            onClick={() => downloadTemplate('drivers.csv', DRIVERS_TEMPLATE)}
            className="flex items-center gap-2 px-3 py-2 border border-[#e8e8e3] text-sm text-[#3a3f49] hover:border-[#C8A75E] transition-colors"
          >
            <Download className="h-4 w-4" />
            drivers.csv
          </button>
        </div>
        <p className="mt-2 text-xs text-[#8b919a]">
          Use <code className="text-[#0c0f14] bg-[#f0f0ec] px-1">carrier_company_name</code> in drivers.csv to link drivers to carriers.
        </p>
      </div>

      {/* Drop zone */}
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

      {/* File list */}
      {files.length > 0 && (
        <div className="border border-[#e8e8e3] divide-y divide-[#e8e8e3]">
          {files.map((file, i) => (
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
              {files.length} file(s) — {formatBytes(totalBytes)} total
            </p>
            {totalBytes > 0 && (
              <p className="text-xs font-medium text-[#C8A75E] mt-0.5">
                Estimated migration fee: {formatCents(migrationFeeCents)}
                {' '}({formatCents(MIGRATION_PRICE_PER_GB_CENTS)}/GB, minimum {formatCents(MIGRATION_PRICE_PER_GB_CENTS)})
              </p>
            )}
          </div>
        </div>
      )}

      {/* Parse button */}
      {files.length > 0 && (
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

      {/* Error */}
      {error && (
        <div className="border-l-[3px] border-red-500 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
