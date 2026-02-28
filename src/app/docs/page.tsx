'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { LandingNav } from '@/components/landing/LandingNav';
import { LogoFull } from '@/components/brand/Logo';
import { Copy, Check, ChevronRight } from 'lucide-react';

// =============================================================================
// INTERNAL COMPONENTS
// =============================================================================

function CodeBlock({ children, title }: { children: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative group">
      {title && (
        <div className="flex items-center justify-between bg-[#1a1e27] px-4 py-2 border border-[#2a2e36] border-b-0 rounded-t">
          <span className="text-[0.7rem] font-bold text-[#5c6370] uppercase tracking-wider">{title}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[0.65rem] text-[#5c6370] hover:text-[#C8A75E] transition-colors"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}
      <pre className={`bg-[#0c0f14] text-[#d4d4cf] text-[0.8rem] leading-relaxed p-4 overflow-x-auto border border-[#2a2e36] ${title ? 'border-t-0 rounded-b' : 'rounded'}`}>
        <code>{children}</code>
      </pre>
      {!title && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[#5c6370] hover:text-[#C8A75E]"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  );
}

function ParamTable({ params }: { params: { name: string; type: string; required: boolean; description: string }[] }) {
  return (
    <div className="border border-[#e8e8e3] rounded overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#fafaf8] border-b border-[#e8e8e3]">
            <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Parameter</th>
            <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Type</th>
            <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider hidden sm:table-cell">Required</th>
            <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f0ec]">
          {params.map((p) => (
            <tr key={p.name}>
              <td className="px-4 py-2.5 font-mono text-xs text-[#0c0f14] whitespace-nowrap">{p.name}</td>
              <td className="px-4 py-2.5 text-xs text-[#6b6f76] whitespace-nowrap">{p.type}</td>
              <td className="px-4 py-2.5 hidden sm:table-cell">
                {p.required ? (
                  <span className="text-[0.65rem] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">REQUIRED</span>
                ) : (
                  <span className="text-[0.65rem] font-bold text-[#8b919a] bg-[#fafaf8] px-1.5 py-0.5 rounded">OPTIONAL</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-xs text-[#6b6f76]">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EndpointHeader({ method, path, description }: { method: string; path: string; description: string }) {
  const colors: Record<string, string> = {
    GET: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    POST: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    PATCH: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    DELETE: 'text-red-400 bg-red-400/10 border-red-400/20',
  };
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <span className={`inline-block text-[0.65rem] font-bold px-2.5 py-1 border uppercase tracking-wider rounded ${colors[method] ?? ''}`}>
          {method}
        </span>
        <code className="text-sm font-mono font-bold text-[#0c0f14]">{path}</code>
      </div>
      <p className="text-sm text-[#6b6f76] leading-relaxed">{description}</p>
    </div>
  );
}

function AlertBox({ children, variant = 'info' }: { children: React.ReactNode; variant?: 'info' | 'warning' }) {
  const styles = variant === 'warning'
    ? 'border-red-300/40 bg-red-50/50'
    : 'border-[#C8A75E]/30 bg-[#C8A75E]/5';
  return (
    <div className={`border px-4 py-3 rounded ${styles}`}>
      <div className="text-sm text-[#3a3f49]">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    sent: 'bg-blue-50 text-blue-700 border-blue-200',
    delivered: 'bg-[#C8A75E]/10 text-[#9a7d3a] border-[#C8A75E]/30',
    opened: 'bg-[#C8A75E]/10 text-[#9a7d3a] border-[#C8A75E]/30',
    signed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    expired: 'bg-gray-50 text-gray-600 border-gray-200',
    revoked: 'bg-gray-50 text-gray-600 border-gray-200',
    failed: 'bg-red-50 text-red-600 border-red-200',
  };
  return (
    <span className={`text-xs font-bold px-2 py-1 border rounded ${colors[status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {status}
    </span>
  );
}

// =============================================================================
// SIDEBAR NAV — scroll-spy
// =============================================================================

const SECTIONS: readonly { id: string; label: string; indent?: boolean }[] = [
  { id: 'quick-start', label: 'Quick Start' },
  { id: 'authentication', label: 'Authentication' },
  { id: 'create-driver', label: 'Create Driver', indent: true },
  { id: 'list-drivers', label: 'List Drivers', indent: true },
  { id: 'create-consent', label: 'Create Consent', indent: true },
  { id: 'list-consents', label: 'List Consents', indent: true },
  { id: 'consent-status', label: 'Status Flow', indent: true },
  { id: 'create-webhook', label: 'Create Webhook', indent: true },
  { id: 'list-webhooks', label: 'List Webhooks', indent: true },
  { id: 'update-webhook', label: 'Update Webhook', indent: true },
  { id: 'delete-webhook', label: 'Delete Webhook', indent: true },
  { id: 'rotate-secret', label: 'Rotate Secret', indent: true },
  { id: 'webhook-events', label: 'Event Types', indent: true },
  { id: 'errors', label: 'Errors' },
  { id: 'rate-limits', label: 'Rate Limits' },
  { id: 'mcp-server', label: 'MCP Server' },
  { id: 'mcp-tools', label: 'MCP Tools', indent: true },
];

const GROUP_HEADERS: Record<string, string> = {
  'create-driver': 'Drivers',
  'create-consent': 'Consents',
  'create-webhook': 'Webhooks',
  'mcp-server': 'MCP',
};

function SidebarNav({ activeId }: { activeId: string }) {
  return (
    <nav className="space-y-0.5">
      {SECTIONS.map((s) => {
        const groupHeader = GROUP_HEADERS[s.id];
        return (
          <div key={s.id}>
            {groupHeader && (
              <p className="text-[0.6rem] font-bold text-[#8b919a] uppercase tracking-[0.15em] mt-4 mb-1.5 px-3">
                {groupHeader}
              </p>
            )}
            <a
              href={`#${s.id}`}
              className={`block text-[0.8rem] py-1.5 transition-colors rounded ${
                s.indent ? 'pl-6 pr-3' : 'px-3'
              } ${
                activeId === s.id
                  ? 'text-[#0c0f14] font-semibold bg-[#f0f0ec] border-l-2 border-[#C8A75E]'
                  : 'text-[#6b6f76] hover:text-[#0c0f14] hover:bg-[#f8f8f6]'
              }`}
            >
              {s.label}
            </a>
          </div>
        );
      })}
    </nav>
  );
}

// =============================================================================
// TWO-COLUMN SECTION WRAPPER
// =============================================================================

function Section({
  id,
  children,
  code,
}: {
  id: string;
  children: React.ReactNode;
  code?: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 py-12 border-b border-[#e8e8e3] last:border-b-0">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-7 space-y-6">{children}</div>
        {code && (
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24 space-y-4">{code}</div>
          </div>
        )}
      </div>
    </section>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function DocsPage() {
  const [activeId, setActiveId] = useState('quick-start');
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setupObserver = useCallback(() => {
    observerRef.current?.disconnect();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-100px 0px -60% 0px', threshold: 0 },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    observerRef.current = observer;
  }, []);

  useEffect(() => {
    setupObserver();
    return () => observerRef.current?.disconnect();
  }, [setupObserver]);

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <LandingNav />

      {/* ================================================================= */}
      {/* HERO */}
      {/* ================================================================= */}
      <div className="bg-white border-b border-[#e8e8e3]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
          <p className="text-[0.65rem] font-bold text-[#C8A75E] uppercase tracking-[0.2em] mb-3">Developer Docs</p>
          <h1
            className="text-3xl sm:text-4xl font-bold text-[#0c0f14] tracking-tight mb-4"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            API Documentation
          </h1>
          <p className="text-base text-[#6b6f76] leading-relaxed max-w-2xl mb-6">
            Integrate ConsentHaul with your TMS, HR system, or internal tools. Automate FMCSA Clearinghouse
            consent workflows via our REST API.
          </p>
          <div className="flex items-center gap-2 mb-8">
            <span className="text-xs font-bold text-[#8b919a] uppercase tracking-wider">Base URL</span>
            <code className="bg-[#0c0f14] text-[#d4d4cf] text-sm px-3 py-1.5 rounded font-mono">
              https://app.consenthaul.com/api/v1
            </code>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="bg-[#C8A75E] text-white text-[0.8rem] font-bold px-6 py-2.5 rounded hover:bg-[#b8973e] transition-colors"
            >
              Get API Key
            </Link>
            <a
              href="#quick-start"
              className="bg-[#0c0f14] text-white text-[0.8rem] font-bold px-6 py-2.5 rounded hover:bg-[#1a1e27] transition-colors"
            >
              Quick Start
            </a>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* BODY — sidebar + content */}
      {/* ================================================================= */}
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex gap-0">
          {/* Sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-20 py-8 pr-4 max-h-[calc(100vh-5rem)] overflow-y-auto">
              <SidebarNav activeId={activeId} />
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 lg:pl-4 lg:border-l lg:border-[#e8e8e3]">
            {/* -------------------------------------------------------------- */}
            {/* QUICK START */}
            {/* -------------------------------------------------------------- */}
            <Section
              id="quick-start"
              code={
                <>
                  <CodeBlock title="1. Create a driver">{`curl -X POST https://app.consenthaul.com/api/v1/drivers \\
  -H "Authorization: Bearer ch_live_a1b2c3..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+10000000000",
    "email": "john@example.com",
    "cdl_number": "D1234567",
    "cdl_state": "TX"
  }'`}</CodeBlock>
                  <CodeBlock title="2. Send consent request">{`curl -X POST https://app.consenthaul.com/api/v1/consents \\
  -H "Authorization: Bearer ch_live_a1b2c3..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "driver_id": "<driver_id_from_step_1>",
    "consent_type": "limited_query",
    "delivery_method": "sms"
  }'`}</CodeBlock>
                  <CodeBlock title="3. Check status">{`curl https://app.consenthaul.com/api/v1/consents?driver_id=<driver_id> \\
  -H "Authorization: Bearer ch_live_a1b2c3..."`}</CodeBlock>
                </>
              }
            >
              <div>
                <p className="text-[0.65rem] font-bold text-[#C8A75E] uppercase tracking-[0.2em] mb-2">Getting Started</p>
                <h2
                  className="text-2xl font-bold text-[#0c0f14] tracking-tight mb-3"
                  style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
                >
                  Quick Start
                </h2>
                <p className="text-sm text-[#6b6f76] leading-relaxed">
                  Get up and running in three steps. Create an API key, add a driver, and send your first consent request.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0c0f14] text-white text-xs font-bold flex items-center justify-center">1</span>
                  <div>
                    <p className="text-sm font-bold text-[#0c0f14]">Get an API key</p>
                    <p className="text-sm text-[#6b6f76]">
                      Sign up and create an API key from{' '}
                      <Link href="/settings/api-keys" className="text-[#0c0f14] font-semibold underline underline-offset-2 hover:text-[#C8A75E]">
                        Settings &rarr; API Keys
                      </Link>. Select the scopes you need.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0c0f14] text-white text-xs font-bold flex items-center justify-center">2</span>
                  <div>
                    <p className="text-sm font-bold text-[#0c0f14]">Create a driver</p>
                    <p className="text-sm text-[#6b6f76]">Add the driver record you want to request consent from.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0c0f14] text-white text-xs font-bold flex items-center justify-center">3</span>
                  <div>
                    <p className="text-sm font-bold text-[#0c0f14]">Send a consent request</p>
                    <p className="text-sm text-[#6b6f76]">
                      The driver receives a link via SMS, email, or WhatsApp. They sign on their phone and you get a compliant PDF.
                    </p>
                  </div>
                </div>
              </div>
            </Section>

            {/* -------------------------------------------------------------- */}
            {/* AUTHENTICATION */}
            {/* -------------------------------------------------------------- */}
            <Section
              id="authentication"
              code={
                <>
                  <CodeBlock title="Request with API key">{`curl https://app.consenthaul.com/api/v1/drivers \\
  -H "Authorization: Bearer ch_live_a1b2c3d4e5f6..."`}</CodeBlock>
                  <CodeBlock title="401 — Invalid key">{`{
  "error": "Unauthorized",
  "message": "Invalid or missing API key."
}`}</CodeBlock>
                  <CodeBlock title="403 — Insufficient scope">{`{
  "error": "Forbidden",
  "message": "API key does not have drivers:read scope."
}`}</CodeBlock>
                </>
              }
            >
              <div>
                <p className="text-[0.65rem] font-bold text-[#C8A75E] uppercase tracking-[0.2em] mb-2">Security</p>
                <h2
                  className="text-2xl font-bold text-[#0c0f14] tracking-tight mb-3"
                  style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
                >
                  Authentication
                </h2>
                <p className="text-sm text-[#6b6f76] leading-relaxed">
                  All API requests require a valid API key in the{' '}
                  <code className="bg-[#fafaf8] px-1.5 py-0.5 text-[#0c0f14] border border-[#e8e8e3] text-xs rounded">Authorization</code>{' '}
                  header using the Bearer scheme.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#3a3f49] uppercase tracking-wider mb-3">Available Scopes</h3>
                <ParamTable
                  params={[
                    { name: 'drivers:read', type: 'scope', required: false, description: 'List and view driver records' },
                    { name: 'drivers:write', type: 'scope', required: false, description: 'Create and update driver records' },
                    { name: 'consents:read', type: 'scope', required: false, description: 'List and view consent records' },
                    { name: 'consents:write', type: 'scope', required: false, description: 'Create consent requests (deducts credits)' },
                    { name: 'billing:read', type: 'scope', required: false, description: 'View credit balance and transaction history' },
                    { name: 'webhooks:read', type: 'scope', required: false, description: 'List and view webhook endpoints' },
                    { name: 'webhooks:write', type: 'scope', required: false, description: 'Create, update, and delete webhook endpoints' },
                    { name: '*', type: 'scope', required: false, description: 'Full access to all resources' },
                  ]}
                />
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#3a3f49] uppercase tracking-wider mb-3">Security Best Practices</h3>
                <div className="space-y-2">
                  {[
                    'Never expose API keys in client-side code or public repositories',
                    'Use the minimum required scopes for each integration',
                    'Rotate keys periodically and deactivate unused keys',
                    'Store keys in environment variables or a secrets manager',
                  ].map((tip) => (
                    <div key={tip} className="flex items-start gap-2 text-sm text-[#6b6f76]">
                      <ChevronRight className="h-4 w-4 text-[#C8A75E] shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            {/* -------------------------------------------------------------- */}
            {/* DRIVERS — POST */}
            {/* -------------------------------------------------------------- */}
            <Section
              id="create-driver"
              code={
                <>
                  <CodeBlock title="curl">{`curl -X POST https://app.consenthaul.com/api/v1/drivers \\
  -H "Authorization: Bearer ch_live_a1b2c3..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+10000000000",
    "email": "john.doe@example.com",
    "cdl_number": "D1234567",
    "cdl_state": "TX",
    "preferred_language": "en"
  }'`}</CodeBlock>
                  <CodeBlock title="201 Created">{`{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "organization_id": "org-uuid",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+10000000000",
    "email": "john.doe@example.com",
    "cdl_number": "D1234567",
    "cdl_state": "TX",
    "date_of_birth": null,
    "hire_date": null,
    "preferred_language": "en",
    "is_active": true,
    "created_at": "2026-02-24T12:00:00Z",
    "updated_at": "2026-02-24T12:00:00Z",
    "metadata": { "created_via": "api" }
  }
}`}</CodeBlock>
                  <CodeBlock title="409 Conflict">{`{
  "error": "Conflict",
  "message": "A driver with CDL number \\"D1234567\\" already exists."
}`}</CodeBlock>
                </>
              }
            >
              <EndpointHeader
                method="POST"
                path="/api/v1/drivers"
                description="Create a new driver in your organization. Requires drivers:write scope."
              />

              <div>
                <h3 className="text-sm font-bold text-[#3a3f49] uppercase tracking-wider mb-3">Request Body</h3>
                <ParamTable
                  params={[
                    { name: 'first_name', type: 'string', required: true, description: 'Driver first name (max 100 chars)' },
                    { name: 'last_name', type: 'string', required: true, description: 'Driver last name (max 100 chars)' },
                    { name: 'phone', type: 'string', required: false, description: 'Phone in E.164 format. Required if no email.' },
                    { name: 'email', type: 'string', required: false, description: 'Email address. Required if no phone.' },
                    { name: 'cdl_number', type: 'string', required: false, description: 'Commercial Driver License number' },
                    { name: 'cdl_state', type: 'string', required: false, description: '2-letter state code (e.g., "TX")' },
                    { name: 'date_of_birth', type: 'string', required: false, description: 'Date of birth (YYYY-MM-DD)' },
                    { name: 'hire_date', type: 'string', required: false, description: 'Hire date (YYYY-MM-DD)' },
                    { name: 'preferred_language', type: 'string', required: false, description: '"en" or "es". Defaults to "en".' },
                  ]}
                />
              </div>

              <AlertBox>
                <strong>Note:</strong> At least one of <code className="bg-white/50 px-1 py-0.5 border border-[#e8e8e3] text-xs rounded">phone</code> or{' '}
                <code className="bg-white/50 px-1 py-0.5 border border-[#e8e8e3] text-xs rounded">email</code> is required. If a CDL number is provided, it must be unique within your organization.
              </AlertBox>
            </Section>

            {/* -------------------------------------------------------------- */}
            {/* DRIVERS — GET */}
            {/* -------------------------------------------------------------- */}
            <Section
              id="list-drivers"
              code={
                <>
                  <CodeBlock title="curl">{`curl "https://app.consenthaul.com/api/v1/drivers?page=1&per_page=10&is_active=true" \\
  -H "Authorization: Bearer ch_live_a1b2c3..."`}</CodeBlock>
                  <CodeBlock title="200 OK">{`{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "+10000000000",
      "email": "john.doe@example.com",
      "cdl_number": "D1234567",
      "cdl_state": "TX",
      "is_active": true,
      "created_at": "2026-02-24T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total": 47,
    "total_pages": 5
  }
}`}</CodeBlock>
                </>
              }
            >
              <EndpointHeader
                method="GET"
                path="/api/v1/drivers"
                description="List drivers with pagination, search, and filtering. Requires drivers:read scope."
              />

              <div>
                <h3 className="text-sm font-bold text-[#3a3f49] uppercase tracking-wider mb-3">Query Parameters</h3>
                <ParamTable
                  params={[
                    { name: 'page', type: 'integer', required: false, description: 'Page number (default: 1)' },
                    { name: 'per_page', type: 'integer', required: false, description: 'Results per page, max 100 (default: 25)' },
                    { name: 'sort', type: 'string', required: false, description: 'Sort field: created_at, first_name, last_name, email, phone, cdl_number, hire_date, is_active' },
                    { name: 'order', type: 'string', required: false, description: '"asc" or "desc" (default: "desc")' },
                    { name: 'search', type: 'string', required: false, description: 'Search by name, email, phone, or CDL number' },
                    { name: 'is_active', type: 'boolean', required: false, description: 'Filter by active status ("true" or "false")' },
                  ]}
                />
              </div>
            </Section>

            {/* -------------------------------------------------------------- */}
            {/* CONSENTS — POST */}
            {/* -------------------------------------------------------------- */}
            <Section
              id="create-consent"
              code={
                <>
                  <CodeBlock title="curl">{`curl -X POST https://app.consenthaul.com/api/v1/consents \\
  -H "Authorization: Bearer ch_live_a1b2c3..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "driver_id": "550e8400-e29b-41d4-a716-446655440000",
    "consent_type": "limited_query",
    "delivery_method": "sms",
    "language": "en",
    "token_ttl_hours": 72
  }'`}</CodeBlock>
                  <CodeBlock title="201 Created">{`{
  "data": {
    "id": "660f9500-f39c-52e5-b827-557766550000",
    "organization_id": "org-uuid",
    "driver_id": "550e8400-e29b-41d4-a716-446655440000",
    "consent_type": "limited_query",
    "status": "sent",
    "language": "en",
    "delivery_method": "sms",
    "delivery_address": "+10000000000",
    "signing_url": "https://app.consenthaul.com/sign/abc123token",
    "signing_token_expires_at": "2026-02-27T12:00:00Z",
    "created_at": "2026-02-24T12:00:00Z"
  }
}`}</CodeBlock>
                  <CodeBlock title="402 Insufficient credits">{`{
  "error": "Payment Required",
  "message": "Insufficient credits."
}`}</CodeBlock>
                </>
              }
            >
              <EndpointHeader
                method="POST"
                path="/api/v1/consents"
                description="Create a new consent request and optionally deliver it. Requires consents:write scope."
              />

              <AlertBox variant="warning">
                <strong>Credits:</strong> Each consent request costs <strong>1 credit</strong>. If your balance is zero the request returns <code className="bg-white/50 px-1 py-0.5 border border-[#e8e8e3] text-xs rounded">402</code>.
              </AlertBox>

              <div>
                <h3 className="text-sm font-bold text-[#3a3f49] uppercase tracking-wider mb-3">Request Body</h3>
                <ParamTable
                  params={[
                    { name: 'driver_id', type: 'uuid', required: true, description: 'The driver to request consent from' },
                    { name: 'consent_type', type: 'string', required: false, description: '"limited_query", "pre_employment", or "blanket" (default: "limited_query")' },
                    { name: 'delivery_method', type: 'string', required: true, description: '"sms", "whatsapp", "email", or "manual"' },
                    { name: 'delivery_address', type: 'string', required: false, description: 'Override delivery address (uses driver phone/email if omitted)' },
                    { name: 'language', type: 'string', required: false, description: '"en" or "es" (defaults to driver preference)' },
                    { name: 'consent_start_date', type: 'string', required: false, description: 'Start date (YYYY-MM-DD, defaults to today)' },
                    { name: 'consent_end_date', type: 'string', required: false, description: 'End date (YYYY-MM-DD)' },
                    { name: 'query_frequency', type: 'string', required: false, description: 'How often queries will be made' },
                    { name: 'template_id', type: 'uuid', required: false, description: 'Custom consent template ID' },
                    { name: 'token_ttl_hours', type: 'number', required: false, description: 'Signing link expiry in hours (default: 168 = 7 days, max: 8760)' },
                    { name: 'company_name', type: 'string', required: false, description: 'Override company name on consent form' },
                    { name: 'phone', type: 'string', required: false, description: 'Override driver phone for this request' },
                    { name: 'cdl_number', type: 'string', required: false, description: 'Override CDL number for this request' },
                    { name: 'cdl_state', type: 'string', required: false, description: 'Override CDL state for this request' },
                    { name: 'hire_date', type: 'string', required: false, description: 'Override hire date for this request' },
                    { name: 'internal_note', type: 'string', required: false, description: 'Internal note (not visible to driver)' },
                    { name: 'require_cdl_photo', type: 'boolean', required: false, description: 'Require CDL photo upload (default: false)' },
                  ]}
                />
              </div>

              <AlertBox>
                <strong>Manual delivery:</strong> When <code className="bg-white/50 px-1 py-0.5 border border-[#e8e8e3] text-xs rounded">delivery_method</code> is{' '}
                <code className="bg-white/50 px-1 py-0.5 border border-[#e8e8e3] text-xs rounded">&quot;manual&quot;</code>,
                no message is sent. Use the returned <code className="bg-white/50 px-1 py-0.5 border border-[#e8e8e3] text-xs rounded">signing_url</code> to share
                the link with the driver yourself.
              </AlertBox>
            </Section>

            {/* -------------------------------------------------------------- */}
            {/* CONSENTS — GET */}
            {/* -------------------------------------------------------------- */}
            <Section
              id="list-consents"
              code={
                <>
                  <CodeBlock title="curl">{`curl "https://app.consenthaul.com/api/v1/consents?status=signed&per_page=50" \\
  -H "Authorization: Bearer ch_live_a1b2c3..."`}</CodeBlock>
                  <CodeBlock title="200 OK">{`{
  "data": [
    {
      "id": "660f9500-f39c-52e5-b827-557766550000",
      "driver_id": "550e8400-e29b-41d4-a716-446655440000",
      "consent_type": "limited_query",
      "status": "signed",
      "language": "en",
      "delivery_method": "sms",
      "signed_at": "2026-02-24T14:30:00Z",
      "created_at": "2026-02-24T12:00:00Z",
      "driver": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "first_name": "John",
        "last_name": "Doe",
        "phone": "+10000000000",
        "email": "john.doe@example.com",
        "cdl_number": "D1234567"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total": 12,
    "total_pages": 1
  }
}`}</CodeBlock>
                </>
              }
            >
              <EndpointHeader
                method="GET"
                path="/api/v1/consents"
                description="List consent requests with pagination, filtering by status, driver, and date range. Requires consents:read scope."
              />

              <div>
                <h3 className="text-sm font-bold text-[#3a3f49] uppercase tracking-wider mb-3">Query Parameters</h3>
                <ParamTable
                  params={[
                    { name: 'page', type: 'integer', required: false, description: 'Page number (default: 1)' },
                    { name: 'per_page', type: 'integer', required: false, description: 'Results per page, max 100 (default: 25)' },
                    { name: 'sort', type: 'string', required: false, description: 'Sort field: created_at, updated_at, status, consent_type, delivery_method, signed_at' },
                    { name: 'order', type: 'string', required: false, description: '"asc" or "desc" (default: "desc")' },
                    { name: 'status', type: 'string', required: false, description: 'Filter: pending, sent, delivered, opened, signed, expired, revoked, failed' },
                    { name: 'driver_id', type: 'uuid', required: false, description: 'Filter by driver ID' },
                    { name: 'created_after', type: 'string', required: false, description: 'ISO date — filter consents created after this date' },
                    { name: 'created_before', type: 'string', required: false, description: 'ISO date — filter consents created before this date' },
                  ]}
                />
              </div>
            </Section>

            {/* -------------------------------------------------------------- */}
            {/* CONSENT STATUS FLOW */}
            {/* -------------------------------------------------------------- */}
            <Section id="consent-status">
              <div>
                <p className="text-[0.65rem] font-bold text-[#C8A75E] uppercase tracking-[0.2em] mb-2">Lifecycle</p>
                <h2
                  className="text-2xl font-bold text-[#0c0f14] tracking-tight mb-3"
                  style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
                >
                  Consent Status Flow
                </h2>
                <p className="text-sm text-[#6b6f76] leading-relaxed mb-6">
                  Each consent request progresses through a series of statuses. The happy path flows left to right below.
                </p>
              </div>

              {/* Status flow visual */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <StatusBadge status="pending" />
                <ChevronRight className="h-3 w-3 text-[#d4d4cf]" />
                <StatusBadge status="sent" />
                <ChevronRight className="h-3 w-3 text-[#d4d4cf]" />
                <StatusBadge status="delivered" />
                <ChevronRight className="h-3 w-3 text-[#d4d4cf]" />
                <StatusBadge status="opened" />
                <ChevronRight className="h-3 w-3 text-[#d4d4cf]" />
                <StatusBadge status="signed" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#3a3f49] uppercase tracking-wider mb-3">Terminal States</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  <StatusBadge status="expired" />
                  <StatusBadge status="revoked" />
                  <StatusBadge status="failed" />
                </div>
                <p className="text-xs text-[#8b919a]">
                  A consent can reach <strong>expired</strong> (signing link timed out), <strong>revoked</strong> (manually revoked), or <strong>failed</strong> (delivery failure) at any point.
                </p>
              </div>

              <div className="border border-[#e8e8e3] rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#fafaf8] border-b border-[#e8e8e3]">
                      <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0ec]">
                    {[
                      ['pending', 'Consent record created, not yet delivered'],
                      ['sent', 'Delivery initiated (SMS/email/WhatsApp sent)'],
                      ['delivered', 'Message confirmed delivered to device'],
                      ['opened', 'Driver opened the signing link'],
                      ['signed', 'Driver signed the consent form — PDF generated'],
                      ['expired', 'Signing link expired before completion'],
                      ['revoked', 'Consent manually revoked by the organization'],
                      ['failed', 'Delivery failed (bad number, bounced email, etc.)'],
                    ].map(([s, desc]) => (
                      <tr key={s}>
                        <td className="px-4 py-2.5"><StatusBadge status={s} /></td>
                        <td className="px-4 py-2.5 text-xs text-[#6b6f76]">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            {/* -------------------------------------------------------------- */}
            {/* WEBHOOKS — POST */}
            {/* -------------------------------------------------------------- */}
            <Section
              id="create-webhook"
              code={
                <>
                  <CodeBlock title="curl">{`curl -X POST https://app.consenthaul.com/api/v1/webhooks \\
  -H "Authorization: Bearer ch_live_a1b2c3..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://your-app.com/webhooks/consenthaul",
    "events": ["consent.signed", "consent.failed"],
    "description": "Production webhook"
  }'`}</CodeBlock>
                  <CodeBlock title="201 Created">{`{
  "data": {
    "id": "wh_abc123",
    "organization_id": "org-uuid",
    "url": "https://your-app.com/webhooks/consenthaul",
    "description": "Production webhook",
    "events": ["consent.signed", "consent.failed"],
    "is_active": true,
    "secret": "whsec_a1b2c3d4e5f6g7h8i9j0...",
    "created_at": "2026-02-24T12:00:00Z",
    "updated_at": "2026-02-24T12:00:00Z"
  }
}`}</CodeBlock>
                </>
              }
            >
              <EndpointHeader
                method="POST"
                path="/api/v1/webhooks"
                description="Create a new webhook endpoint. Requires webhooks:write scope."
              />

              <AlertBox variant="warning">
                <strong>Important:</strong> The <code className="bg-white/50 px-1 py-0.5 border border-[#e8e8e3] text-xs rounded">secret</code> is only returned once at creation time. Store it securely — you will need it to verify webhook signatures.
              </AlertBox>

              <div>
                <h3 className="text-sm font-bold text-[#3a3f49] uppercase tracking-wider mb-3">Request Body</h3>
                <ParamTable
                  params={[
                    { name: 'url', type: 'string', required: true, description: 'HTTPS URL to receive webhook events' },
                    { name: 'events', type: 'string[]', required: true, description: 'Array of event types to subscribe to' },
                    { name: 'description', type: 'string', required: false, description: 'Optional description (max 500 chars)' },
                  ]}
                />
              </div>
            </Section>

            {/* -------------------------------------------------------------- */}
            {/* WEBHOOKS — GET */}
            {/* -------------------------------------------------------------- */}
            <Section
              id="list-webhooks"
              code={
                <>
                  <CodeBlock title="curl">{`curl https://app.consenthaul.com/api/v1/webhooks \\
  -H "Authorization: Bearer ch_live_a1b2c3..."`}</CodeBlock>
                  <CodeBlock title="200 OK">{`{
  "data": [
    {
      "id": "wh_abc123",
      "organization_id": "org-uuid",
      "url": "https://your-app.com/webhooks/consenthaul",
      "description": "Production webhook",
      "events": ["consent.signed", "consent.failed"],
      "is_active": true,
      "created_at": "2026-02-24T12:00:00Z",
      "updated_at": "2026-02-24T12:00:00Z"
    }
  ]
}`}</CodeBlock>
                </>
              }
            >
              <EndpointHeader
                method="GET"
                path="/api/v1/webhooks"
                description="List all webhook endpoints for your organization. Requires webhooks:read scope."
              />
              <p className="text-sm text-[#6b6f76]">
                Returns all endpoints ordered by creation date (newest first). Secrets are not included in list responses.
              </p>
            </Section>

            {/* -------------------------------------------------------------- */}
            {/* WEBHOOKS — PATCH */}
            {/* -------------------------------------------------------------- */}
            <Section
              id="update-webhook"
              code={
                <>
                  <CodeBlock title="curl">{`curl -X PATCH https://app.consenthaul.com/api/v1/webhooks/wh_abc123 \\
  -H "Authorization: Bearer ch_live_a1b2c3..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "events": ["consent.signed", "consent.failed", "consent.expired"],
    "is_active": true
  }'`}</CodeBlock>
                  <CodeBlock title="200 OK">{`{
  "data": {
    "id": "wh_abc123",
    "organization_id": "org-uuid",
    "url": "https://your-app.com/webhooks/consenthaul",
    "description": "Production webhook",
    "events": ["consent.signed", "consent.failed", "consent.expired"],
    "is_active": true,
    "created_at": "2026-02-24T12:00:00Z",
    "updated_at": "2026-02-24T15:00:00Z"
  }
}`}</CodeBlock>
                </>
              }
            >
              <EndpointHeader
                method="PATCH"
                path="/api/v1/webhooks/:id"
                description="Update a webhook endpoint. Requires webhooks:write scope."
              />

              <div>
                <h3 className="text-sm font-bold text-[#3a3f49] uppercase tracking-wider mb-3">Request Body</h3>
                <ParamTable
                  params={[
                    { name: 'url', type: 'string', required: false, description: 'New HTTPS URL' },
                    { name: 'events', type: 'string[]', required: false, description: 'New event types to subscribe to' },
                    { name: 'description', type: 'string', required: false, description: 'Updated description' },
                    { name: 'is_active', type: 'boolean', required: false, description: 'Enable or disable the endpoint' },
                  ]}
                />
              </div>
            </Section>

            {/* -------------------------------------------------------------- */}
            {/* WEBHOOKS — DELETE */}
            {/* -------------------------------------------------------------- */}
            <Section
              id="delete-webhook"
              code={
                <>
                  <CodeBlock title="curl">{`curl -X DELETE https://app.consenthaul.com/api/v1/webhooks/wh_abc123 \\
  -H "Authorization: Bearer ch_live_a1b2c3..."`}</CodeBlock>
                  <CodeBlock title="200 OK">{`{
  "data": {
    "deleted": true
  }
}`}</CodeBlock>
                </>
              }
            >
              <EndpointHeader
                method="DELETE"
                path="/api/v1/webhooks/:id"
                description="Permanently delete a webhook endpoint. Requires webhooks:write scope."
              />
              <p className="text-sm text-[#6b6f76]">
                This action is irreversible. Any pending deliveries for this endpoint will be cancelled.
              </p>
            </Section>

            {/* -------------------------------------------------------------- */}
            {/* WEBHOOKS — ROTATE SECRET */}
            {/* -------------------------------------------------------------- */}
            <Section
              id="rotate-secret"
              code={
                <>
                  <CodeBlock title="curl">{`curl -X POST https://app.consenthaul.com/api/v1/webhooks/wh_abc123/secret \\
  -H "Authorization: Bearer ch_live_a1b2c3..."`}</CodeBlock>
                  <CodeBlock title="200 OK">{`{
  "data": {
    "secret": "whsec_new_secret_value..."
  }
}`}</CodeBlock>
                </>
              }
            >
              <EndpointHeader
                method="POST"
                path="/api/v1/webhooks/:id/secret"
                description="Rotate the signing secret for a webhook endpoint. Requires webhooks:write scope."
              />

              <AlertBox>
                <strong>After rotation:</strong> The old secret becomes invalid immediately. Update your webhook verification code with the new secret before processing the next event.
              </AlertBox>
            </Section>

            {/* -------------------------------------------------------------- */}
            {/* WEBHOOK EVENTS */}
            {/* -------------------------------------------------------------- */}
            <Section
              id="webhook-events"
              code={
                <CodeBlock title="Example payload">{`{
  "id": "evt_abc123",
  "type": "consent.signed",
  "created_at": "2026-02-24T14:30:00Z",
  "data": {
    "consent_id": "660f9500-f39c-52e5-b827-557766550000",
    "organization_id": "org-uuid",
    "driver_id": "550e8400-e29b-41d4-a716-446655440000",
    "consent_type": "limited_query",
    "status": "signed",
    "delivery_method": "sms",
    "signed_at": "2026-02-24T14:30:00Z",
    "driver": {
      "first_name": "John",
      "last_name": "Doe",
      "cdl_number": "D1234567"
    }
  }
}`}</CodeBlock>
              }
            >
              <div>
                <p className="text-[0.65rem] font-bold text-[#C8A75E] uppercase tracking-[0.2em] mb-2">Webhooks</p>
                <h2
                  className="text-2xl font-bold text-[#0c0f14] tracking-tight mb-3"
                  style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
                >
                  Event Types
                </h2>
                <p className="text-sm text-[#6b6f76] leading-relaxed mb-4">
                  Webhook payloads are sent as <code className="bg-[#fafaf8] px-1.5 py-0.5 text-[#0c0f14] border border-[#e8e8e3] text-xs rounded">POST</code> requests
                  with a JSON body. Each payload includes a signature header for verification.
                </p>
              </div>

              <div className="border border-[#e8e8e3] rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#fafaf8] border-b border-[#e8e8e3]">
                      <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Event</th>
                      <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0ec]">
                    {[
                      ['consent.created', 'A new consent request was created'],
                      ['consent.sent', 'Consent link was sent to the driver'],
                      ['consent.delivered', 'Delivery confirmed (SMS delivered, email opened)'],
                      ['consent.opened', 'Driver opened the signing link'],
                      ['consent.signed', 'Driver signed the consent — PDF generated'],
                      ['consent.failed', 'Delivery failed (bad number, bounced email)'],
                      ['consent.expired', 'Signing link expired before completion'],
                      ['consent.revoked', 'Consent was manually revoked'],
                    ].map(([event, desc]) => (
                      <tr key={event}>
                        <td className="px-4 py-2.5 font-mono text-xs text-[#0c0f14] whitespace-nowrap">{event}</td>
                        <td className="px-4 py-2.5 text-xs text-[#6b6f76]">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <AlertBox>
                <strong>Signature verification:</strong> Each webhook includes an{' '}
                <code className="bg-white/50 px-1 py-0.5 border border-[#e8e8e3] text-xs rounded">X-Webhook-Signature</code> header.
                Compute an HMAC-SHA256 of the raw request body using your endpoint secret and compare it to the header value.
              </AlertBox>
            </Section>

            {/* -------------------------------------------------------------- */}
            {/* ERRORS */}
            {/* -------------------------------------------------------------- */}
            <Section
              id="errors"
              code={
                <>
                  <CodeBlock title="Validation error">{`{
  "error": "Validation Error",
  "message": "Invalid driver data.",
  "details": {
    "first_name": ["First name is required"],
    "phone": ["Either phone or email is required"]
  }
}`}</CodeBlock>
                  <CodeBlock title="402 Payment Required">{`{
  "error": "Payment Required",
  "message": "Insufficient credits."
}`}</CodeBlock>
                </>
              }
            >
              <div>
                <p className="text-[0.65rem] font-bold text-[#C8A75E] uppercase tracking-[0.2em] mb-2">Reference</p>
                <h2
                  className="text-2xl font-bold text-[#0c0f14] tracking-tight mb-3"
                  style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
                >
                  Errors
                </h2>
                <p className="text-sm text-[#6b6f76] leading-relaxed">
                  The API uses standard HTTP status codes. All error responses return JSON with an{' '}
                  <code className="bg-[#fafaf8] px-1.5 py-0.5 text-[#0c0f14] border border-[#e8e8e3] text-xs rounded">error</code> type and a{' '}
                  <code className="bg-[#fafaf8] px-1.5 py-0.5 text-[#0c0f14] border border-[#e8e8e3] text-xs rounded">message</code>.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#3a3f49] uppercase tracking-wider mb-3">Error Format</h3>
                <CodeBlock>{`{
  "error": "Error Type",
  "message": "A human-readable description.",
  "details": { }  // Optional — present on validation errors
}`}</CodeBlock>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#3a3f49] uppercase tracking-wider mb-3">HTTP Status Codes</h3>
                <div className="border border-[#e8e8e3] rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#fafaf8] border-b border-[#e8e8e3]">
                        <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Code</th>
                        <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Type</th>
                        <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f0ec]">
                      {([
                        ['200', 'OK', 'Request succeeded', 'emerald'],
                        ['201', 'Created', 'Resource created successfully', 'emerald'],
                        ['401', 'Unauthorized', 'Missing or invalid API key', 'red'],
                        ['402', 'Payment Required', 'Insufficient credits', 'red'],
                        ['403', 'Forbidden', 'API key lacks the required scope', 'red'],
                        ['404', 'Not Found', 'Resource does not exist', 'red'],
                        ['409', 'Conflict', 'Duplicate resource (e.g., CDL already exists)', 'red'],
                        ['422', 'Validation Error', 'Request body failed validation', 'red'],
                        ['429', 'Too Many Requests', 'Rate limit exceeded', 'red'],
                        ['500', 'Internal Error', 'Something went wrong on our end', 'red'],
                        ['502', 'Delivery Error', 'Consent created but SMS/email delivery failed', 'red'],
                      ] as const).map(([code, type, desc, color]) => (
                        <tr key={code}>
                          <td className={`px-4 py-2.5 font-mono text-xs font-bold ${color === 'emerald' ? 'text-emerald-600' : 'text-red-600'}`}>{code}</td>
                          <td className="px-4 py-2.5 text-xs text-[#0c0f14] font-bold">{type}</td>
                          <td className="px-4 py-2.5 text-xs text-[#6b6f76]">{desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Section>

            {/* -------------------------------------------------------------- */}
            {/* RATE LIMITS */}
            {/* -------------------------------------------------------------- */}
            <Section
              id="rate-limits"
              code={
                <CodeBlock title="429 Too Many Requests">{`{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again later."
}

// Response headers:
// Retry-After: 30`}</CodeBlock>
              }
            >
              <div>
                <p className="text-[0.65rem] font-bold text-[#C8A75E] uppercase tracking-[0.2em] mb-2">Reference</p>
                <h2
                  className="text-2xl font-bold text-[#0c0f14] tracking-tight mb-3"
                  style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
                >
                  Rate Limits
                </h2>
                <p className="text-sm text-[#6b6f76] leading-relaxed">
                  The API enforces per-IP rate limits to ensure fair usage. If you exceed the limit, requests return{' '}
                  <code className="bg-[#fafaf8] px-1.5 py-0.5 text-[#0c0f14] border border-[#e8e8e3] text-xs rounded">429</code>{' '}
                  with a <code className="bg-[#fafaf8] px-1.5 py-0.5 text-[#0c0f14] border border-[#e8e8e3] text-xs rounded">Retry-After</code> header.
                </p>
              </div>

              <div className="border border-[#e8e8e3] rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#fafaf8] border-b border-[#e8e8e3]">
                      <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Endpoint</th>
                      <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Limit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0ec]">
                    <tr>
                      <td className="px-4 py-2.5 text-xs text-[#0c0f14]">Drivers &amp; Consents</td>
                      <td className="px-4 py-2.5 text-xs text-[#6b6f76]">100 requests per minute per IP</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 text-xs text-[#0c0f14]">Webhook management</td>
                      <td className="px-4 py-2.5 text-xs text-[#6b6f76]">30 requests per minute per IP</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <AlertBox>
                <strong>Tip:</strong> If you receive a 429, wait for the number of seconds specified in the <code className="bg-white/50 px-1 py-0.5 border border-[#e8e8e3] text-xs rounded">Retry-After</code> response header before retrying. Implement exponential back-off for production integrations.
              </AlertBox>
            </Section>

            {/* -------------------------------------------------------------- */}
            {/* MCP SERVER */}
            {/* -------------------------------------------------------------- */}
            <Section
              id="mcp-server"
              code={
                <>
                  <CodeBlock title="Claude Desktop — claude_desktop_config.json">{`{
  "mcpServers": {
    "consenthaul": {
      "command": "npx",
      "args": ["@consenthaul/mcp-server"],
      "env": {
        "CONSENTHAUL_API_KEY": "ch_your_key_here"
      }
    }
  }
}`}</CodeBlock>
                  <CodeBlock title="Local development">{`{
  "mcpServers": {
    "consenthaul": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "CONSENTHAUL_API_KEY": "ch_your_key_here",
        "CONSENTHAUL_BASE_URL": "http://localhost:3000"
      }
    }
  }
}`}</CodeBlock>
                </>
              }
            >
              <div>
                <p className="text-[0.65rem] font-bold text-[#C8A75E] uppercase tracking-[0.2em] mb-2">AI Integration</p>
                <h2
                  className="text-2xl font-bold text-[#0c0f14] tracking-tight mb-3"
                  style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
                >
                  MCP Server
                </h2>
                <p className="text-sm text-[#6b6f76] leading-relaxed">
                  The ConsentHaul MCP (Model Context Protocol) server lets AI agents — like Claude — manage drivers, consents, and billing
                  through natural language. Connect it to Claude Desktop, Cursor, or any MCP-compatible client to automate FMCSA consent workflows.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#3a3f49] uppercase tracking-wider mb-3">Installation</h3>
                <CodeBlock>{`npm install @consenthaul/mcp-server`}</CodeBlock>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#3a3f49] uppercase tracking-wider mb-3">Environment Variables</h3>
                <ParamTable
                  params={[
                    { name: 'CONSENTHAUL_API_KEY', type: 'string', required: true, description: 'Your ch_ prefixed API key' },
                    { name: 'CONSENTHAUL_BASE_URL', type: 'string', required: false, description: 'API base URL (default: https://app.consenthaul.com)' },
                  ]}
                />
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#3a3f49] uppercase tracking-wider mb-3">Example Prompts</h3>
                <div className="space-y-2">
                  {[
                    'List all my drivers',
                    'Create a driver named John Smith with CDL TX12345 and phone +15551234567',
                    'Send a consent request to driver John Smith via SMS',
                    'How many credits do I have left?',
                    'Show me all pending consents from last week',
                    'Download the signed PDF for consent abc-123',
                  ].map((prompt) => (
                    <div key={prompt} className="flex items-start gap-2 text-sm text-[#6b6f76]">
                      <ChevronRight className="h-4 w-4 text-[#C8A75E] shrink-0 mt-0.5" />
                      <span>&quot;{prompt}&quot;</span>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            {/* -------------------------------------------------------------- */}
            {/* MCP TOOLS */}
            {/* -------------------------------------------------------------- */}
            <Section id="mcp-tools">
              <div>
                <p className="text-[0.65rem] font-bold text-[#C8A75E] uppercase tracking-[0.2em] mb-2">MCP Reference</p>
                <h2
                  className="text-2xl font-bold text-[#0c0f14] tracking-tight mb-3"
                  style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
                >
                  Available Tools
                </h2>
                <p className="text-sm text-[#6b6f76] leading-relaxed mb-6">
                  The MCP server exposes the following tools. Each tool maps to one or more REST API calls under the hood.
                </p>
              </div>

              {/* Drivers tools */}
              <div>
                <h3 className="text-sm font-bold text-[#3a3f49] uppercase tracking-wider mb-3">Driver Tools</h3>
                <div className="border border-[#e8e8e3] rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#fafaf8] border-b border-[#e8e8e3]">
                        <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Tool</th>
                        <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f0ec]">
                      {[
                        ['list_drivers', 'List drivers with search and pagination'],
                        ['get_driver', 'Get a single driver by ID'],
                        ['create_driver', 'Create a new driver'],
                        ['update_driver', 'Update driver fields'],
                        ['deactivate_driver', 'Soft-delete (deactivate) a driver'],
                      ].map(([tool, desc]) => (
                        <tr key={tool}>
                          <td className="px-4 py-2.5 font-mono text-xs text-[#0c0f14] whitespace-nowrap">{tool}</td>
                          <td className="px-4 py-2.5 text-xs text-[#6b6f76]">{desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Consent tools */}
              <div>
                <h3 className="text-sm font-bold text-[#3a3f49] uppercase tracking-wider mb-3">Consent Tools</h3>
                <div className="border border-[#e8e8e3] rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#fafaf8] border-b border-[#e8e8e3]">
                        <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Tool</th>
                        <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Description</th>
                        <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider hidden sm:table-cell">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f0ec]">
                      {([
                        ['list_consents', 'List consents with filters', 'Free'],
                        ['get_consent', 'Get consent details by ID', 'Free'],
                        ['create_consent', 'Create and send a consent request', '1 credit'],
                        ['revoke_consent', 'Revoke an active consent', 'Free'],
                        ['resend_consent', 'Resend signing link', 'Free'],
                        ['get_consent_pdf_url', 'Get download URL for signed PDF', 'Free'],
                      ] as const).map(([tool, desc, cost]) => (
                        <tr key={tool}>
                          <td className="px-4 py-2.5 font-mono text-xs text-[#0c0f14] whitespace-nowrap">{tool}</td>
                          <td className="px-4 py-2.5 text-xs text-[#6b6f76]">{desc}</td>
                          <td className="px-4 py-2.5 text-xs hidden sm:table-cell">
                            {cost === '1 credit' ? (
                              <span className="text-[0.65rem] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{cost}</span>
                            ) : (
                              <span className="text-[0.65rem] font-bold text-[#8b919a] bg-[#fafaf8] px-1.5 py-0.5 rounded">{cost}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Billing tools */}
              <div>
                <h3 className="text-sm font-bold text-[#3a3f49] uppercase tracking-wider mb-3">Billing Tools</h3>
                <div className="border border-[#e8e8e3] rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#fafaf8] border-b border-[#e8e8e3]">
                        <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Tool</th>
                        <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f0ec]">
                      {[
                        ['get_credit_balance', 'Check current credit balance'],
                        ['list_credit_packs', 'Show available packs and pricing'],
                      ].map(([tool, desc]) => (
                        <tr key={tool}>
                          <td className="px-4 py-2.5 font-mono text-xs text-[#0c0f14] whitespace-nowrap">{tool}</td>
                          <td className="px-4 py-2.5 text-xs text-[#6b6f76]">{desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <AlertBox>
                <strong>Scopes:</strong> The MCP server inherits scopes from your API key. Make sure your key includes the scopes needed for the tools you want to use (e.g., <code className="bg-white/50 px-1 py-0.5 border border-[#e8e8e3] text-xs rounded">drivers:read</code>, <code className="bg-white/50 px-1 py-0.5 border border-[#e8e8e3] text-xs rounded">consents:write</code>, <code className="bg-white/50 px-1 py-0.5 border border-[#e8e8e3] text-xs rounded">billing:read</code>).
              </AlertBox>
            </Section>
          </main>
        </div>
      </div>

      {/* ================================================================= */}
      {/* FOOTER */}
      {/* ================================================================= */}
      <footer className="bg-[#0c0f14] text-white mt-16">
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <LogoFull mode="dark" className="h-5 w-auto" />
              <p className="mt-4 text-sm text-[#5c6370] leading-relaxed max-w-xs">
                Digital FMCSA consent collection for motor carriers. Text a link. Driver signs. PDF filed.
              </p>
            </div>

            <div>
              <p className="text-[0.65rem] font-bold text-[#5c6370] uppercase tracking-[0.15em] mb-4">Product</p>
              <ul className="space-y-2.5">
                <li><Link href="/signup" className="text-sm text-[#8b919a] hover:text-[#C8A75E] transition-colors">Get Started</Link></li>
                <li><Link href="/login" className="text-sm text-[#8b919a] hover:text-[#C8A75E] transition-colors">Sign In</Link></li>
                <li><Link href="/docs" className="text-sm text-[#8b919a] hover:text-[#C8A75E] transition-colors">API Documentation</Link></li>
                <li><Link href="/tms" className="text-sm text-[#8b919a] hover:text-[#C8A75E] transition-colors">TMS Partners</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-[0.65rem] font-bold text-[#5c6370] uppercase tracking-[0.15em] mb-4">Company</p>
              <ul className="space-y-2.5">
                <li><span className="text-sm text-[#8b919a]">Workbird LLC</span></li>
                <li><Link href="mailto:support@consenthaul.com" className="text-sm text-[#8b919a] hover:text-[#C8A75E] transition-colors">support@consenthaul.com</Link></li>
                <li><Link href="mailto:partnerships@consenthaul.com" className="text-sm text-[#8b919a] hover:text-[#C8A75E] transition-colors">partnerships@consenthaul.com</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-[0.65rem] font-bold text-[#5c6370] uppercase tracking-[0.15em] mb-4">Legal</p>
              <ul className="space-y-2.5">
                <li><Link href="/terms" className="text-sm text-[#8b919a] hover:text-[#C8A75E] transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-sm text-[#8b919a] hover:text-[#C8A75E] transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-[#1e2129]">
            <div className="space-y-3 mb-8">
              <p className="text-[0.7rem] leading-relaxed text-[#8b919a]">
                ConsentHaul is not affiliated with, endorsed by, or sponsored by the Federal Motor Carrier Safety Administration (FMCSA) or the U.S. Department of Transportation. &quot;FMCSA Clearinghouse&quot; is a registered trademark of the U.S. Department of Transportation.
              </p>
              <p className="text-[0.7rem] leading-relaxed text-[#8b919a]">
                ConsentHaul provides a digital platform for collecting electronic consent signatures as permitted under 49 CFR Part 382. Consent retention complies with &sect; 382.703(a) (3-year minimum). It is the responsibility of the employer/carrier to ensure compliance with all applicable federal and state regulations. Electronic signatures comply with the ESIGN Act and UETA. Signed documents are retained for the FMCSA-required minimum of three (3) years.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <p className="text-[0.7rem] text-[#5c6370]">
                &copy; {new Date().getFullYear()} ConsentHaul &middot; Operated by Workbird LLC
              </p>
              <div className="flex items-center gap-4">
                <Link href="/terms" className="text-[0.7rem] text-[#5c6370] hover:text-[#8b919a] transition-colors">Terms</Link>
                <Link href="/privacy" className="text-[0.7rem] text-[#5c6370] hover:text-[#8b919a] transition-colors">Privacy</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
