'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, ArrowLeft, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';

interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

export default function LeadImportPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }
    setFile(f);
    setError('');
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/outreach/leads/import', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'Import failed');
        return;
      }

      setResult(json.data);
    } catch (err) {
      setError('Import failed. Please try again.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => router.push('/admin/outreach/leads')}
        className="flex items-center gap-1 text-sm text-[#8b919a] hover:text-[#0c0f14] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Leads
      </button>

      <div>
        <h1 className="text-xl font-semibold text-[#0c0f14]">Import Leads</h1>
        <p className="text-sm text-[#8b919a] mt-1">
          Upload a CSV file with prospect carrier data. Required column: company_name.
          Optional: dot_number, mc_number, phone, email, contact_name, contact_title, city, state, fleet_size, driver_count.
        </p>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-[#C8A75E] bg-[#C8A75E]/5'
            : 'border-[#e8e8e3] bg-white hover:border-[#C8A75E]/50'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <Upload className="h-8 w-8 text-[#8b919a] mx-auto mb-3" />
        <p className="text-sm font-medium text-[#0c0f14]">
          {file ? file.name : 'Drop CSV file here or click to browse'}
        </p>
        <p className="text-xs text-[#8b919a] mt-1">
          Maximum 5,000 rows. Duplicates by DOT# are automatically skipped.
        </p>
      </div>

      {file && !result && (
        <div className="flex items-center justify-between p-3 bg-[#fafaf8] border border-[#e8e8e3]">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-[#C8A75E]" />
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-[#8b919a]">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="px-4 py-2 text-sm font-medium bg-[#C8A75E] text-white hover:bg-[#b8974e] transition-colors disabled:opacity-50"
          >
            {uploading ? 'Importing...' : 'Start Import'}
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-700">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">Import complete</p>
              <p className="text-sm">
                {result.imported} imported, {result.skipped} skipped (duplicates),{' '}
                {result.errors.length} errors out of {result.total} total rows.
              </p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="border border-[#e8e8e3] bg-white p-4">
              <h3 className="font-medium text-[#0c0f14] mb-2">Errors</h3>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {result.errors.map((e, i) => (
                  <p key={i} className="text-sm text-red-600">
                    Row {e.row}: {e.message}
                  </p>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => router.push('/admin/outreach/leads')}
            className="px-4 py-2 text-sm font-medium bg-[#C8A75E] text-white hover:bg-[#b8974e] transition-colors"
          >
            View Leads
          </button>
        </div>
      )}
    </div>
  );
}
