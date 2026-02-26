'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
  X,
  Coins,
} from 'lucide-react';

interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; message: string }[];
  credits_used: number;
  violations_escalated?: number;
}

interface QueryResultImportProps {
  onComplete?: () => void;
}

export function QueryResultImport({ onComplete }: QueryResultImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorsExpanded, setErrorsExpanded] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [creditCost, setCreditCost] = useState<number | null>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.name.endsWith('.csv')) {
      setError('Please upload a CSV file.');
      return;
    }
    setFile(f);
    setResult(null);
    setError(null);

    // Parse locally to show row count & credit estimate
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      const dataRows = Math.max(0, lines.length - 1); // subtract header
      setPreviewCount(dataRows);
      setCreditCost(Math.ceil(dataRows / 4));
    };
    reader.readAsText(f);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFile(selectedFile);
  }

  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90));
    }, 300);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/queries/import-results', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402 && data.needed) {
          setError(`Insufficient credits. Need ${data.needed}, have ${data.available}. Purchase more credits to continue.`);
        } else {
          setError(data.message ?? data.error ?? 'Import failed.');
        }
        return;
      }

      setResult(data.data as ImportResult);
      onComplete?.();
    } catch {
      clearInterval(progressInterval);
      setError('An unexpected error occurred during import.');
    } finally {
      setUploading(false);
    }
  }

  function resetForm() {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setPreviewCount(null);
    setCreditCost(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function downloadSample() {
    const csv = 'cdl_number,query_date,result\nA1234567,2026-02-20,no_violations\nB9876543,2026-02-20,violations_found\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_query_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Import Query Results (CSV)</CardTitle>
        <CardDescription>
          Upload a CSV with columns: cdl_number, query_date (YYYY-MM-DD), result (no_violations or violations_found).
          Cost: 1 credit per 4 drivers ($0.25/driver).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sample download */}
        <button
          type="button"
          onClick={downloadSample}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#0c0f14] hover:text-[#C8A75E] transition-colors"
        >
          <Download className="h-4 w-4" />
          Download sample CSV
        </button>

        {/* Drop zone */}
        {!result && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex cursor-pointer flex-col items-center justify-center border-2 border-dashed px-6 py-10 text-center transition-colors ${
              dragOver
                ? 'border-[#C8A75E] bg-[#fafaf8]'
                : 'border-[#d4d4cf] bg-[#fafaf8] hover:border-[#b5b5ae] hover:bg-[#f0f0ec]'
            }`}
            role="button"
            tabIndex={0}
            aria-label="Upload CSV file"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            {file ? (
              <>
                <FileSpreadsheet className="h-8 w-8 text-[#0c0f14] mb-2" />
                <p className="text-sm font-medium text-[#0c0f14]">{file.name}</p>
                <p className="text-xs text-[#8b919a] mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                  {previewCount !== null && ` — ${previewCount} rows`}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetForm();
                  }}
                  className="absolute top-3 right-3 rounded-md p-1 text-[#b5b5ae] hover:text-[#6b6f76]"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-[#b5b5ae] mb-2" />
                <p className="text-sm font-medium text-[#3a3f49]">
                  Drag & drop your CSV here, or click to browse
                </p>
                <p className="text-xs text-[#8b919a] mt-1">Maximum 5,000 rows per file</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
              aria-hidden="true"
            />
          </div>
        )}

        {/* Credit cost preview */}
        {file && creditCost !== null && !result && !uploading && (
          <div className="flex items-center gap-3 border border-[#e8e8e3] bg-[#fafaf8] px-4 py-3">
            <Coins className="h-4 w-4 text-[#C8A75E] shrink-0" />
            <p className="text-sm text-[#3a3f49]">
              This will use <span className="font-bold">{creditCost} credit{creditCost !== 1 ? 's' : ''}</span> for {previewCount} driver result{previewCount !== 1 ? 's' : ''}.
            </p>
          </div>
        )}

        {/* Progress bar */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#6b6f76]">Uploading and processing...</span>
              <span className="font-medium text-[#0c0f14]">{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#e8e8e3]">
              <div
                className="h-full rounded-full bg-[#0c0f14] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="border border-green-200 bg-green-50 p-3 text-center">
                <CheckCircle2 className="mx-auto h-5 w-5 text-green-600 mb-1" />
                <p className="text-xl font-bold text-green-800">{result.imported}</p>
                <p className="text-xs text-green-600">Imported</p>
              </div>
              <div className="border border-yellow-200 bg-yellow-50 p-3 text-center">
                <AlertCircle className="mx-auto h-5 w-5 text-yellow-600 mb-1" />
                <p className="text-xl font-bold text-yellow-800">{result.skipped}</p>
                <p className="text-xs text-yellow-600">Skipped</p>
              </div>
              <div className="border border-[#e8e8e3] bg-[#fafaf8] p-3 text-center">
                <Coins className="mx-auto h-5 w-5 text-[#C8A75E] mb-1" />
                <p className="text-xl font-bold text-[#0c0f14]">{result.credits_used}</p>
                <p className="text-xs text-[#8b919a]">Credits Used</p>
              </div>
              {(result.violations_escalated ?? 0) > 0 && (
                <div className="border border-red-200 bg-red-50 p-3 text-center">
                  <AlertCircle className="mx-auto h-5 w-5 text-red-600 mb-1" />
                  <p className="text-xl font-bold text-red-800">{result.violations_escalated}</p>
                  <p className="text-xs text-red-600">Escalated</p>
                </div>
              )}
            </div>

            {/* Expandable error list */}
            {result.errors.length > 0 && (
              <div className="border border-red-200 bg-red-50">
                <button
                  type="button"
                  onClick={() => setErrorsExpanded(!errorsExpanded)}
                  className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-red-800"
                >
                  <span>
                    {result.errors.length} error{result.errors.length !== 1 ? 's' : ''} found
                  </span>
                  {errorsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {errorsExpanded && (
                  <ul className="border-t border-red-200 px-4 py-3 space-y-1 max-h-60 overflow-auto">
                    {result.errors.map((err, i) => (
                      <li key={i} className="text-xs text-red-700">
                        <span className="font-medium">Row {err.row}:</span> {err.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <Button variant="outline" size="sm" onClick={resetForm}>
              Import Another File
            </Button>
          </div>
        )}

        {/* Upload button */}
        {file && !result && !uploading && (
          <div className="flex justify-end">
            <Button onClick={handleUpload} size="sm">
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Upload and Import
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
