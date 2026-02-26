import Link from 'next/link';
import type { Metadata } from 'next';
import { LogoFull } from '@/components/brand/Logo';
import { LandingNav } from '@/components/landing/LandingNav';

export const metadata: Metadata = {
  title: 'Migration API Documentation — ConsentHaul TMS Partners',
  description:
    'Dedicated secure API for migrating carrier and driver data into ConsentHaul. Full endpoint documentation, data schemas, CSV templates, and cURL examples.',
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const CARRIER_FIELDS = [
  { field: 'company_name', type: 'string', required: true, desc: 'Carrier company name (1\u2013300 chars)' },
  { field: 'dot_number', type: 'string', required: false, desc: 'USDOT number (max 20 chars)' },
  { field: 'mc_number', type: 'string', required: false, desc: 'MC number (max 20 chars)' },
  { field: 'phone', type: 'string', required: false, desc: 'Phone number (max 30 chars)' },
  { field: 'email', type: 'string', required: false, desc: 'Email address (valid format)' },
  { field: 'contact_name', type: 'string', required: false, desc: 'Primary contact name (max 200 chars)' },
];

const DRIVER_FIELDS = [
  { field: 'carrier_company_name', type: 'string', required: true, desc: 'Links driver to carrier (1\u2013300 chars)' },
  { field: 'first_name', type: 'string', required: true, desc: 'Driver first name (1\u2013100 chars)' },
  { field: 'last_name', type: 'string', required: true, desc: 'Driver last name (1\u2013100 chars)' },
  { field: 'phone', type: 'string', required: false, desc: 'Phone number (max 30 chars)' },
  { field: 'email', type: 'string', required: false, desc: 'Email address (valid format)' },
  { field: 'cdl_number', type: 'string', required: false, desc: 'CDL number (max 30 chars)' },
  { field: 'cdl_state', type: 'string', required: false, desc: '2-letter state code' },
  { field: 'resend_date', type: 'string', required: false, desc: 'Next consent send date (YYYY-MM-DD)' },
];

const ENDPOINTS = [
  {
    method: 'POST',
    path: '/api/tms/migration/ingest',
    title: 'Bulk Import',
    desc: 'Import up to 10,000 carrier or driver records per request via JSON. Records are validated against the schema, converted to CSV, and stored securely.',
    request: `{
  "token": "YOUR_TRANSFER_TOKEN",
  "type": "carriers",
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
}`,
    response: `{
  "records_received": 1,
  "total_bytes": 1024,
  "migration_fee_cents": 1700,
  "validation_errors": []
}`,
    curl: `curl -X POST https://consenthaul.com/api/tms/migration/ingest \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "YOUR_TRANSFER_TOKEN",
    "type": "carriers",
    "data": [
      {
        "company_name": "ABC Trucking",
        "dot_number": "1234567",
        "mc_number": "MC-987654"
      }
    ]
  }'`,
    notes: 'Use "type": "drivers" for driver records. Invalid records are skipped and returned in validation_errors.',
  },
  {
    method: 'POST',
    path: '/api/tms/migration/presign',
    title: 'Presign Upload',
    desc: 'Generate a presigned URL for direct file upload to secure storage. Use this for large CSV files instead of the ingest endpoint.',
    request: `{
  "token": "YOUR_TRANSFER_TOKEN",
  "filename": "carriers.csv"
}`,
    response: `{
  "signed_url": "https://storage.supabase.co/...",
  "path": "transfer-id/carriers.csv",
  "token": "upload-token"
}`,
    curl: `# Step 1: Get presigned URL
curl -X POST https://consenthaul.com/api/tms/migration/presign \\
  -H "Content-Type: application/json" \\
  -d '{ "token": "YOUR_TRANSFER_TOKEN", "filename": "carriers.csv" }'

# Step 2: Upload file to the signed URL
curl -X PUT "SIGNED_URL_FROM_STEP_1" \\
  -H "Content-Type: text/csv" \\
  --data-binary @carriers.csv`,
    notes: 'After uploading, call /confirm to register the file. The signed URL expires after 1 hour.',
  },
  {
    method: 'POST',
    path: '/api/tms/migration/confirm',
    title: 'Confirm Upload',
    desc: 'Confirm that a file was successfully uploaded to storage. Updates transfer metadata with file info and recalculates migration fee.',
    request: `{
  "token": "YOUR_TRANSFER_TOKEN",
  "path": "transfer-id/carriers.csv",
  "filename": "carriers.csv",
  "size_bytes": 2048
}`,
    response: `{
  "total_bytes": 2048,
  "file_count": 1,
  "migration_fee_cents": 1700
}`,
    curl: `curl -X POST https://consenthaul.com/api/tms/migration/confirm \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "YOUR_TRANSFER_TOKEN",
    "path": "transfer-id/carriers.csv",
    "filename": "carriers.csv",
    "size_bytes": 2048
  }'`,
    notes: 'size_bytes should match the actual uploaded file size.',
  },
  {
    method: 'POST',
    path: '/api/tms/migration/parse',
    title: 'Parse & Preview',
    desc: 'Parse all uploaded CSV files and return carrier/driver counts with sample names. Use this to verify data before finalizing.',
    request: `{
  "token": "YOUR_TRANSFER_TOKEN"
}`,
    response: `{
  "carrier_count": 150,
  "driver_count": 1200,
  "carrier_sample": ["ABC Trucking", "XYZ Logistics", "Fast Freight"],
  "driver_sample": ["John Smith", "Jane Doe", "Bob Wilson"]
}`,
    curl: `curl -X POST https://consenthaul.com/api/tms/migration/parse \\
  -H "Content-Type: application/json" \\
  -d '{ "token": "YOUR_TRANSFER_TOKEN" }'`,
    notes: 'Carrier files are detected by the company_name header. Driver files are detected by the carrier_company_name header.',
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function SchemaTable({ title, subtitle, fields }: { title: string; subtitle: string; fields: typeof CARRIER_FIELDS }) {
  return (
    <div className="border border-[#d4d4cf] bg-white">
      <div className="px-5 py-4 border-b border-[#d4d4cf] bg-[#fafaf8]">
        <p className="text-sm font-bold text-[#0c0f14] uppercase tracking-wider">{title}</p>
        <p className="text-xs text-[#8b919a] mt-0.5">{subtitle}</p>
      </div>
      <div className="divide-y divide-[#e8e8e3]">
        {fields.map((f) => (
          <div key={f.field} className="flex items-start gap-4 px-5 py-3">
            <code className="text-sm font-mono text-[#0c0f14] bg-[#fafaf8] px-2 py-0.5 shrink-0">{f.field}</code>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8b919a]">{f.type}</span>
                {f.required && (
                  <span className="text-[0.6rem] font-bold uppercase tracking-wider text-red-500 bg-red-50 px-1.5 py-0.5 border border-red-200">required</span>
                )}
              </div>
              <p className="text-sm text-[#3a3f49] mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MigrationApiDocsPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-[#e8e8e3] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="shrink-0">
            <LogoFull className="h-6" />
          </Link>
          <LandingNav />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-12 sm:py-16">
        {/* Hero */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <h1
              className="text-3xl sm:text-4xl font-bold text-[#0c0f14] tracking-tight"
              style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
            >
              Migration API
            </h1>
            <span className="inline-flex items-center px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200">
              Secure
            </span>
          </div>
          <p className="text-lg text-[#6b6f76] max-w-2xl">
            Dedicated API for migrating your existing carrier and driver data into ConsentHaul. All endpoints are authenticated via transfer token and rate limited to 10 requests/min.
          </p>
        </div>

        {/* Quick overview */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-12">
          {[
            { label: '4 Endpoints', sub: 'Ingest, Presign, Confirm, Parse' },
            { label: '$17/GB', sub: 'Migration fee (1 GB minimum)' },
            { label: '10K/request', sub: 'Max records per ingest call' },
            { label: '7-day tokens', sub: 'Auto-generated during application' },
          ].map((s) => (
            <div key={s.label} className="border border-[#d4d4cf] bg-white p-4">
              <p className="text-lg font-bold text-[#0c0f14]">{s.label}</p>
              <p className="text-xs text-[#8b919a] mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <section className="mb-12">
          <h2 className="text-sm font-bold text-[#8b919a] uppercase tracking-[0.15em] mb-4">How It Works</h2>
          <div className="border border-[#d4d4cf] bg-white divide-y divide-[#e8e8e3]">
            {[
              { step: '1', title: 'Get Your Transfer Token', desc: 'A token is generated automatically when you start the partner application. It authenticates all migration API calls.' },
              { step: '2', title: 'Upload Data', desc: 'Use the /ingest endpoint for JSON records, or /presign + /confirm for CSV file uploads. Mix and match as needed.' },
              { step: '3', title: 'Verify', desc: 'Call /parse to scan your uploaded files and get carrier/driver counts with sample names for verification.' },
              { step: '4', title: 'Done', desc: 'Your data is securely stored. After your application is approved, we import it into your partner account.' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4 px-5 py-4">
                <span className="flex h-7 w-7 items-center justify-center bg-[#0c0f14] text-white text-xs font-bold shrink-0">{s.step}</span>
                <div>
                  <p className="text-sm font-bold text-[#0c0f14]">{s.title}</p>
                  <p className="text-sm text-[#6b6f76] mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Data Schemas */}
        <section className="mb-12">
          <h2 className="text-sm font-bold text-[#8b919a] uppercase tracking-[0.15em] mb-4">Data Schemas</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SchemaTable
              title="Carrier Schema"
              subtitle='Used for "type": "carriers"'
              fields={CARRIER_FIELDS}
            />
            <SchemaTable
              title="Driver Schema"
              subtitle='Used for "type": "drivers"'
              fields={DRIVER_FIELDS}
            />
          </div>
        </section>

        {/* CSV Templates */}
        <section className="mb-12">
          <h2 className="text-sm font-bold text-[#8b919a] uppercase tracking-[0.15em] mb-4">CSV Templates</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border border-[#d4d4cf] bg-white">
              <div className="px-5 py-3 border-b border-[#d4d4cf] bg-[#fafaf8]">
                <p className="text-sm font-bold text-[#0c0f14] uppercase tracking-wider">carriers.csv</p>
              </div>
              <pre className="px-5 py-4 text-xs font-mono text-[#3a3f49] overflow-x-auto whitespace-pre leading-relaxed">
{`company_name,dot_number,mc_number,phone,email,contact_name
"ABC Trucking","1234567","MC-987654","(555) 111-2222","dispatch@abc.com","Mike Johnson"
"XYZ Logistics","2345678","MC-876543","(555) 333-4444","ops@xyz.com","Sarah Chen"`}
              </pre>
            </div>
            <div className="border border-[#d4d4cf] bg-white">
              <div className="px-5 py-3 border-b border-[#d4d4cf] bg-[#fafaf8]">
                <p className="text-sm font-bold text-[#0c0f14] uppercase tracking-wider">drivers.csv</p>
              </div>
              <pre className="px-5 py-4 text-xs font-mono text-[#3a3f49] overflow-x-auto whitespace-pre leading-relaxed">
{`carrier_company_name,first_name,last_name,phone,email,cdl_number,cdl_state,resend_date
"ABC Trucking","John","Smith","(555) 222-3333","john@email.com","D1234567","CA","2026-06-15"
"ABC Trucking","Jane","Doe","(555) 444-5555","jane@email.com","D7654321","TX","2026-09-01"`}
              </pre>
            </div>
          </div>
        </section>

        {/* API Endpoints */}
        <section className="mb-12">
          <h2 className="text-sm font-bold text-[#8b919a] uppercase tracking-[0.15em] mb-4">API Endpoints</h2>
          <div className="space-y-6">
            {ENDPOINTS.map((ep) => (
              <div key={ep.path} className="border border-[#d4d4cf] bg-white">
                {/* Header */}
                <div className="px-5 py-4 border-b border-[#d4d4cf] bg-[#fafaf8]">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {ep.method}
                    </span>
                    <code className="text-sm font-mono font-bold text-[#0c0f14]">{ep.path}</code>
                  </div>
                  <p className="text-sm text-[#6b6f76] mt-1">{ep.desc}</p>
                </div>

                <div className="divide-y divide-[#e8e8e3]">
                  {/* Request */}
                  <div className="px-5 py-4">
                    <p className="text-xs font-bold text-[#8b919a] uppercase tracking-wider mb-2">Request Body</p>
                    <pre className="bg-[#0c0f14] text-[#e8e8e3] p-4 text-xs font-mono overflow-x-auto whitespace-pre rounded-none">{ep.request}</pre>
                  </div>

                  {/* Response */}
                  <div className="px-5 py-4">
                    <p className="text-xs font-bold text-[#8b919a] uppercase tracking-wider mb-2">Response</p>
                    <pre className="bg-[#0c0f14] text-[#e8e8e3] p-4 text-xs font-mono overflow-x-auto whitespace-pre rounded-none">{ep.response}</pre>
                  </div>

                  {/* cURL */}
                  <div className="px-5 py-4">
                    <p className="text-xs font-bold text-[#8b919a] uppercase tracking-wider mb-2">cURL Example</p>
                    <pre className="bg-[#0c0f14] text-[#e8e8e3] p-4 text-xs font-mono overflow-x-auto whitespace-pre rounded-none">{ep.curl}</pre>
                  </div>

                  {/* Notes */}
                  <div className="px-5 py-3 bg-[#fafaf8]">
                    <p className="text-xs text-[#8b919a]">{ep.notes}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Rate Limits & Pricing */}
        <section className="mb-12">
          <h2 className="text-sm font-bold text-[#8b919a] uppercase tracking-[0.15em] mb-4">Rate Limits &amp; Pricing</h2>
          <div className="border border-[#d4d4cf] bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#e8e8e3]">
              {[
                { label: 'Rate Limit', value: '10 req/min', sub: 'Per IP address, all endpoints' },
                { label: 'Migration Fee', value: '$17/GB', sub: '1 GB minimum charge' },
                { label: 'Max Records', value: '10,000', sub: 'Per /ingest request' },
                { label: 'Token Expiry', value: '7 days', sub: 'From creation date' },
              ].map((item) => (
                <div key={item.label} className="p-5">
                  <p className="text-xs font-bold text-[#8b919a] uppercase tracking-wider">{item.label}</p>
                  <p className="text-xl font-bold text-[#0c0f14] mt-1">{item.value}</p>
                  <p className="text-xs text-[#8b919a] mt-0.5">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Error Codes */}
        <section className="mb-12">
          <h2 className="text-sm font-bold text-[#8b919a] uppercase tracking-[0.15em] mb-4">Error Codes</h2>
          <div className="border border-[#d4d4cf] bg-white divide-y divide-[#e8e8e3]">
            {[
              { code: '400', desc: 'Invalid request body or no valid records in payload' },
              { code: '404', desc: 'Invalid or unknown transfer token' },
              { code: '410', desc: 'Transfer token has expired (older than 7 days)' },
              { code: '429', desc: 'Rate limit exceeded (10 requests/min)' },
              { code: '500', desc: 'Internal server error \u2014 contact support' },
            ].map((e) => (
              <div key={e.code} className="flex items-center gap-4 px-5 py-3">
                <code className="text-sm font-mono font-bold text-[#0c0f14] bg-[#fafaf8] px-2 py-0.5 shrink-0">{e.code}</code>
                <p className="text-sm text-[#6b6f76]">{e.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Security */}
        <section className="mb-16">
          <h2 className="text-sm font-bold text-[#8b919a] uppercase tracking-[0.15em] mb-4">Security</h2>
          <div className="border border-[#d4d4cf] bg-[#0c0f14] p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { title: 'Encrypted Storage', desc: 'All uploaded files are encrypted at rest using AES-256. Data in transit is protected via TLS 1.3.' },
                { title: 'Isolated Per Partner', desc: 'Each transfer token maps to an isolated storage scope. Partners cannot access other partners\u2019 data.' },
                { title: 'SOC 2 Type II', desc: 'ConsentHaul maintains SOC 2 Type II compliance with regular third-party security audits.' },
              ].map((s) => (
                <div key={s.title}>
                  <p className="text-sm font-bold text-white">{s.title}</p>
                  <p className="text-xs text-[#8b919a] mt-1 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/tms/apply"
            className="inline-flex items-center justify-center px-8 py-3 bg-[#C8A75E] text-[#0c0f14] text-sm font-bold uppercase tracking-wider hover:bg-[#b8974e] transition-colors"
          >
            Apply for Partner Account
          </Link>
          <p className="text-xs text-[#8b919a] mt-3">
            A transfer token is generated automatically when you start the application.
          </p>
        </div>
      </main>
    </div>
  );
}
