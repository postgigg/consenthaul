'use client';

import { useState } from 'react';
import { Copy, Check, FileText, HardDrive, Truck, Users, ChevronDown, ChevronRight, Key, Clock, AlertTriangle } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UploadedFile {
  path: string;
  name: string;
  size_bytes: number;
  uploaded_at: string;
}

interface MigrationTransfer {
  id: string;
  token: string;
  total_bytes: number;
  carrier_count: number | null;
  driver_count: number | null;
  uploaded_files: unknown;
  parsed_at: string | null;
  expires_at: string;
  created_at: string;
}

interface MigrationApiPortalProps {
  transfers: MigrationTransfer[];
  baseUrl: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1 hover:bg-[#f0f0ec] transition-colors"
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-[#8b919a]" />}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Endpoint documentation block
// ---------------------------------------------------------------------------

function EndpointDoc({
  method,
  path,
  description,
  requestBody,
  responseBody,
  curlExample,
}: {
  method: string;
  path: string;
  description: string;
  requestBody: string;
  responseBody: string;
  curlExample: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-[#e8e8e3]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#fafaf8] transition-colors"
      >
        {open ? <ChevronDown className="h-4 w-4 text-[#8b919a] shrink-0" /> : <ChevronRight className="h-4 w-4 text-[#8b919a] shrink-0" />}
        <span className="inline-flex items-center px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
          {method}
        </span>
        <code className="text-sm font-mono text-[#0c0f14]">{path}</code>
        <span className="text-xs text-[#8b919a] ml-auto hidden sm:inline">{description}</span>
      </button>

      {open && (
        <div className="border-t border-[#e8e8e3] px-4 py-4 space-y-4">
          <p className="text-sm text-[#3a3f49]">{description}</p>

          <div>
            <p className="text-xs font-bold text-[#8b919a] uppercase tracking-wider mb-2">Request Body</p>
            <div className="relative">
              <pre className="bg-[#0c0f14] text-[#e8e8e3] p-4 text-xs font-mono overflow-x-auto whitespace-pre">{requestBody}</pre>
              <div className="absolute top-2 right-2">
                <CopyButton text={requestBody} />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-[#8b919a] uppercase tracking-wider mb-2">Response</p>
            <pre className="bg-[#0c0f14] text-[#e8e8e3] p-4 text-xs font-mono overflow-x-auto whitespace-pre">{responseBody}</pre>
          </div>

          <div>
            <p className="text-xs font-bold text-[#8b919a] uppercase tracking-wider mb-2">cURL Example</p>
            <div className="relative">
              <pre className="bg-[#0c0f14] text-[#e8e8e3] p-4 text-xs font-mono overflow-x-auto whitespace-pre">{curlExample}</pre>
              <div className="absolute top-2 right-2">
                <CopyButton text={curlExample} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MigrationApiPortal({ transfers, baseUrl }: MigrationApiPortalProps) {
  const activeTransfer = transfers.find((t) => !isExpired(t.expires_at));
  const allFiles = transfers.flatMap((t) => {
    const files = Array.isArray(t.uploaded_files) ? (t.uploaded_files as unknown as UploadedFile[]) : [];
    return files.map((f) => ({ ...f, transferId: t.id, token: t.token }));
  });

  return (
    <div className="space-y-8">

      {/* ----------------------------------------------------------------- */}
      {/* Active Transfer Token */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <h2 className="text-sm font-bold text-[#8b919a] uppercase tracking-wider mb-4">
          Transfer Token
        </h2>
        {activeTransfer ? (
          <div className="border border-[#e8e8e3] bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center bg-[#C8A75E]/10 shrink-0">
                <Key className="h-4 w-4 text-[#C8A75E]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-[#8b919a] uppercase tracking-wider mb-1">Active Token</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-[#0c0f14] bg-[#fafaf8] border border-[#e8e8e3] px-3 py-1.5 break-all">
                    {activeTransfer.token}
                  </code>
                  <CopyButton text={activeTransfer.token} />
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-[#8b919a]">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Expires {new Date(activeTransfer.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span>Created {new Date(activeTransfer.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-[#e8e8e3]">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-semibold text-[#0c0f14] tabular-nums">
                    {(Array.isArray(activeTransfer.uploaded_files) ? activeTransfer.uploaded_files.length : 0)}
                  </p>
                  <p className="text-[0.65rem] text-[#8b919a]">Files</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm font-semibold text-[#0c0f14] tabular-nums">{formatBytes(activeTransfer.total_bytes)}</p>
                  <p className="text-[0.65rem] text-[#8b919a]">Total Size</p>
                </div>
              </div>
              {activeTransfer.carrier_count !== null && (
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-amber-500" />
                  <div>
                    <p className="text-sm font-semibold text-[#0c0f14] tabular-nums">{activeTransfer.carrier_count.toLocaleString()}</p>
                    <p className="text-[0.65rem] text-[#8b919a]">Carriers</p>
                  </div>
                </div>
              )}
              {activeTransfer.driver_count !== null && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-semibold text-[#0c0f14] tabular-nums">{activeTransfer.driver_count.toLocaleString()}</p>
                    <p className="text-[0.65rem] text-[#8b919a]">Drivers</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="border border-[#e8e8e3] bg-[#fafaf8] p-6 text-center">
            <AlertTriangle className="h-5 w-5 text-[#8b919a] mx-auto mb-2" />
            <p className="text-sm text-[#8b919a]">
              No active transfer token. A token is created when you start a migration during the partner application, or you can request a new one from your partner dashboard.
            </p>
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Data Schemas */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <h2 className="text-sm font-bold text-[#8b919a] uppercase tracking-wider mb-4">
          Data Schemas
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Carrier Schema */}
          <div className="border border-[#e8e8e3] bg-white">
            <div className="px-4 py-3 border-b border-[#e8e8e3] bg-[#fafaf8]">
              <p className="text-xs font-bold text-[#0c0f14] uppercase tracking-wider">Carrier Schema</p>
              <p className="text-xs text-[#8b919a] mt-0.5">Used for <code className="bg-[#f0f0ec] px-1">&quot;type&quot;: &quot;carriers&quot;</code></p>
            </div>
            <div className="divide-y divide-[#e8e8e3]">
              {[
                { field: 'company_name', type: 'string', required: true, desc: 'Carrier company name (1-300 chars)' },
                { field: 'dot_number', type: 'string', required: false, desc: 'USDOT number (max 20 chars)' },
                { field: 'mc_number', type: 'string', required: false, desc: 'MC number (max 20 chars)' },
                { field: 'phone', type: 'string', required: false, desc: 'Phone number (max 30 chars)' },
                { field: 'email', type: 'string', required: false, desc: 'Email address (valid email format)' },
                { field: 'contact_name', type: 'string', required: false, desc: 'Primary contact name (max 200 chars)' },
              ].map((f) => (
                <div key={f.field} className="flex items-start gap-3 px-4 py-2.5">
                  <code className="text-xs font-mono text-[#0c0f14] bg-[#fafaf8] px-1.5 py-0.5 shrink-0">{f.field}</code>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#8b919a]">{f.type}</span>
                      {f.required && (
                        <span className="text-[0.6rem] font-bold uppercase tracking-wider text-red-500">required</span>
                      )}
                    </div>
                    <p className="text-xs text-[#8b919a] mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Driver Schema */}
          <div className="border border-[#e8e8e3] bg-white">
            <div className="px-4 py-3 border-b border-[#e8e8e3] bg-[#fafaf8]">
              <p className="text-xs font-bold text-[#0c0f14] uppercase tracking-wider">Driver Schema</p>
              <p className="text-xs text-[#8b919a] mt-0.5">Used for <code className="bg-[#f0f0ec] px-1">&quot;type&quot;: &quot;drivers&quot;</code></p>
            </div>
            <div className="divide-y divide-[#e8e8e3]">
              {[
                { field: 'carrier_company_name', type: 'string', required: true, desc: 'Links driver to carrier (1-300 chars)' },
                { field: 'first_name', type: 'string', required: true, desc: 'Driver first name (1-100 chars)' },
                { field: 'last_name', type: 'string', required: true, desc: 'Driver last name (1-100 chars)' },
                { field: 'phone', type: 'string', required: false, desc: 'Phone number (max 30 chars)' },
                { field: 'email', type: 'string', required: false, desc: 'Email address (valid email format)' },
                { field: 'cdl_number', type: 'string', required: false, desc: 'CDL number (max 30 chars)' },
                { field: 'cdl_state', type: 'string', required: false, desc: '2-letter state code (max 2 chars)' },
                { field: 'resend_date', type: 'string', required: false, desc: 'Next consent send date (YYYY-MM-DD)' },
              ].map((f) => (
                <div key={f.field} className="flex items-start gap-3 px-4 py-2.5">
                  <code className="text-xs font-mono text-[#0c0f14] bg-[#fafaf8] px-1.5 py-0.5 shrink-0">{f.field}</code>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#8b919a]">{f.type}</span>
                      {f.required && (
                        <span className="text-[0.6rem] font-bold uppercase tracking-wider text-red-500">required</span>
                      )}
                    </div>
                    <p className="text-xs text-[#8b919a] mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* API Endpoints */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <h2 className="text-sm font-bold text-[#8b919a] uppercase tracking-wider mb-2">
          API Endpoints
        </h2>
        <p className="text-xs text-[#8b919a] mb-4">
          All endpoints require a valid transfer token. Rate limited to 10 requests/min per IP. Click an endpoint to expand full documentation.
        </p>

        <div className="space-y-2">
          <EndpointDoc
            method="POST"
            path="/api/tms/migration/ingest"
            description="Bulk import carriers or drivers via JSON"
            requestBody={`{
  "token": "YOUR_TRANSFER_TOKEN",
  "type": "carriers",   // or "drivers"
  "data": [
    {
      "company_name": "ABC Trucking",
      "dot_number": "1234567",
      "mc_number": "MC-987654",
      "phone": "(555) 111-2222",
      "email": "dispatch@abc.com",
      "contact_name": "Mike Johnson"
    }
  ]
}`}
            responseBody={`{
  "records_received": 1,
  "total_bytes": 1024,
  "migration_fee_cents": 1700,
  "validation_errors": []        // only present if some records failed
}`}
            curlExample={`curl -X POST ${baseUrl}/api/tms/migration/ingest \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "${activeTransfer?.token ?? 'YOUR_TRANSFER_TOKEN'}",
    "type": "carriers",
    "data": [
      {
        "company_name": "ABC Trucking",
        "dot_number": "1234567",
        "mc_number": "MC-987654"
      }
    ]
  }'`}
          />

          <EndpointDoc
            method="POST"
            path="/api/tms/migration/presign"
            description="Generate a presigned URL for direct file upload"
            requestBody={`{
  "token": "YOUR_TRANSFER_TOKEN",
  "filename": "carriers.csv"
}`}
            responseBody={`{
  "signed_url": "https://storage.example.com/...",
  "path": "transfer-id/carriers.csv",
  "token": "upload-token"
}`}
            curlExample={`# Step 1: Get presigned URL
curl -X POST ${baseUrl}/api/tms/migration/presign \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "${activeTransfer?.token ?? 'YOUR_TRANSFER_TOKEN'}",
    "filename": "carriers.csv"
  }'

# Step 2: Upload file to the signed URL
curl -X PUT "SIGNED_URL_FROM_STEP_1" \\
  -H "Content-Type: text/csv" \\
  --data-binary @carriers.csv`}
          />

          <EndpointDoc
            method="POST"
            path="/api/tms/migration/confirm"
            description="Confirm file upload and update transfer metadata"
            requestBody={`{
  "token": "YOUR_TRANSFER_TOKEN",
  "path": "transfer-id/carriers.csv",
  "filename": "carriers.csv",
  "size_bytes": 2048
}`}
            responseBody={`{
  "total_bytes": 2048,
  "file_count": 1,
  "migration_fee_cents": 1700
}`}
            curlExample={`curl -X POST ${baseUrl}/api/tms/migration/confirm \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "${activeTransfer?.token ?? 'YOUR_TRANSFER_TOKEN'}",
    "path": "transfer-id/carriers.csv",
    "filename": "carriers.csv",
    "size_bytes": 2048
  }'`}
          />

          <EndpointDoc
            method="POST"
            path="/api/tms/migration/parse"
            description="Parse uploaded CSVs and extract carrier/driver counts"
            requestBody={`{
  "token": "YOUR_TRANSFER_TOKEN"
}`}
            responseBody={`{
  "carrier_count": 150,
  "driver_count": 1200,
  "carrier_sample": ["ABC Trucking", "XYZ Logistics", "Fast Freight"],
  "driver_sample": ["John Smith", "Jane Doe", "Bob Wilson"]
}`}
            curlExample={`curl -X POST ${baseUrl}/api/tms/migration/parse \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "${activeTransfer?.token ?? 'YOUR_TRANSFER_TOKEN'}"
  }'`}
          />
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* CSV Templates */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <h2 className="text-sm font-bold text-[#8b919a] uppercase tracking-wider mb-4">
          CSV Templates
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border border-[#e8e8e3] bg-white">
            <div className="px-4 py-3 border-b border-[#e8e8e3] bg-[#fafaf8]">
              <p className="text-xs font-bold text-[#0c0f14] uppercase tracking-wider">carriers.csv</p>
            </div>
            <pre className="px-4 py-3 text-xs font-mono text-[#3a3f49] overflow-x-auto whitespace-pre">
{`company_name,dot_number,mc_number,phone,email,contact_name
"ABC Trucking","1234567","MC-987654","(555) 111-2222","dispatch@abctrucking.com","Mike Johnson"
"XYZ Logistics","2345678","MC-876543","(555) 333-4444","ops@xyzlogistics.com","Sarah Chen"`}
            </pre>
          </div>
          <div className="border border-[#e8e8e3] bg-white">
            <div className="px-4 py-3 border-b border-[#e8e8e3] bg-[#fafaf8]">
              <p className="text-xs font-bold text-[#0c0f14] uppercase tracking-wider">drivers.csv</p>
            </div>
            <pre className="px-4 py-3 text-xs font-mono text-[#3a3f49] overflow-x-auto whitespace-pre">
{`carrier_company_name,first_name,last_name,phone,email,cdl_number,cdl_state,resend_date
"ABC Trucking","John","Smith","(555) 222-3333","john@email.com","D1234567","CA","2026-06-15"
"ABC Trucking","Jane","Doe","(555) 444-5555","jane@email.com","D7654321","TX","2026-09-01"`}
            </pre>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Transfer Log */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <h2 className="text-sm font-bold text-[#8b919a] uppercase tracking-wider mb-4">
          Transfer Log
        </h2>
        {allFiles.length > 0 ? (
          <div className="border border-[#e8e8e3] bg-white divide-y divide-[#e8e8e3]">
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2 bg-[#fafaf8]">
              <p className="text-xs font-bold text-[#8b919a] uppercase tracking-wider">File</p>
              <p className="text-xs font-bold text-[#8b919a] uppercase tracking-wider">Size</p>
              <p className="text-xs font-bold text-[#8b919a] uppercase tracking-wider">Uploaded</p>
            </div>
            {allFiles.map((file, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2.5 items-center">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-3.5 w-3.5 text-[#8b919a] shrink-0" />
                  <p className="text-sm text-[#0c0f14] truncate">{file.name}</p>
                </div>
                <p className="text-xs text-[#8b919a] tabular-nums whitespace-nowrap">{formatBytes(file.size_bytes)}</p>
                <p className="text-xs text-[#8b919a] whitespace-nowrap">
                  {new Date(file.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-[#e8e8e3] bg-[#fafaf8] p-6 text-center">
            <p className="text-sm text-[#8b919a]">No files uploaded yet. Use the API endpoints above or upload via the partner application wizard.</p>
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Pricing */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <h2 className="text-sm font-bold text-[#8b919a] uppercase tracking-wider mb-4">
          Migration Pricing
        </h2>
        <div className="border border-[#e8e8e3] bg-white p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-2xl font-bold text-[#0c0f14]">$17<span className="text-sm font-normal text-[#8b919a]">/GB</span></p>
              <p className="text-xs text-[#8b919a] mt-1">Data migration fee (1 GB minimum)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0c0f14]">$5,000</p>
              <p className="text-xs text-[#8b919a] mt-1">Auto-create carrier sub-organizations</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0c0f14]">10K<span className="text-sm font-normal text-[#8b919a]">/request</span></p>
              <p className="text-xs text-[#8b919a] mt-1">Max records per ingest request</p>
            </div>
          </div>
          <p className="text-xs text-[#8b919a] mt-4 pt-4 border-t border-[#e8e8e3]">
            Transfer tokens expire after 7 days. All data is encrypted at rest and in transit. Files are stored in secure, isolated storage per partner.
          </p>
        </div>
      </section>
    </div>
  );
}
