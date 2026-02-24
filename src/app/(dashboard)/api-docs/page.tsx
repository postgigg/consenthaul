'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
  Key,
  Copy,
  Check,
  ChevronRight,
  Terminal,
  BookOpen,
  Shield,
  Zap,
  AlertTriangle,
} from 'lucide-react';

type TabId = 'overview' | 'auth' | 'drivers' | 'consents' | 'errors';

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'auth', label: 'Authentication', icon: Shield },
  { id: 'drivers', label: 'Drivers', icon: Zap },
  { id: 'consents', label: 'Consents', icon: Terminal },
  { id: 'errors', label: 'Errors', icon: AlertTriangle },
];

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
        <div className="flex items-center justify-between bg-[#1a1e27] px-4 py-2 border border-[#2a2e36] border-b-0">
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
      <pre className={`bg-[#0c0f14] text-[#d4d4cf] text-[0.8rem] leading-relaxed p-4 overflow-x-auto border border-[#2a2e36] ${!title ? '' : 'border-t-0'}`}>
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

function Endpoint({ method, path, description }: { method: string; path: string; description: string }) {
  const methodColor = method === 'GET' ? 'text-emerald-400 bg-emerald-400/10' : 'text-blue-400 bg-blue-400/10';
  return (
    <div className="flex items-center gap-3 py-2">
      <span className={`inline-block text-[0.65rem] font-bold px-2 py-0.5 ${methodColor} uppercase tracking-wider`}>
        {method}
      </span>
      <code className="text-sm font-mono text-[#0c0f14]">{path}</code>
      <span className="text-sm text-[#8b919a]">— {description}</span>
    </div>
  );
}

function ParamTable({ params }: { params: { name: string; type: string; required: boolean; description: string }[] }) {
  return (
    <div className="border border-[#e8e8e3] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#fafaf8] border-b border-[#e8e8e3]">
            <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Parameter</th>
            <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Type</th>
            <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Required</th>
            <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f0ec]">
          {params.map((p) => (
            <tr key={p.name}>
              <td className="px-4 py-2.5 font-mono text-xs text-[#0c0f14]">{p.name}</td>
              <td className="px-4 py-2.5 text-xs text-[#6b6f76]">{p.type}</td>
              <td className="px-4 py-2.5">
                {p.required ? (
                  <span className="text-[0.65rem] font-bold text-red-600 bg-red-50 px-1.5 py-0.5">REQUIRED</span>
                ) : (
                  <span className="text-[0.65rem] font-bold text-[#8b919a] bg-[#fafaf8] px-1.5 py-0.5">OPTIONAL</span>
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-[#0c0f14] tracking-tight mb-4" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
      {children}
    </h2>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-[#3a3f49] uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab Content
// ---------------------------------------------------------------------------

function OverviewTab() {
  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>API Overview</SectionTitle>
        <p className="text-sm text-[#6b6f76] leading-relaxed max-w-2xl">
          The ConsentHaul API lets you programmatically manage drivers and consent requests.
          Integrate with your TMS, HR system, or internal tools to automate FMCSA Clearinghouse
          consent workflows.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex h-10 w-10 items-center justify-center bg-[#0c0f14] mb-3">
              <Shield className="h-4 w-4 text-[#C8A75E]" />
            </div>
            <p className="text-sm font-bold text-[#0c0f14]">API Key Auth</p>
            <p className="text-xs text-[#8b919a] mt-1">Bearer token authentication with scoped permissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex h-10 w-10 items-center justify-center bg-[#0c0f14] mb-3">
              <Zap className="h-4 w-4 text-[#C8A75E]" />
            </div>
            <p className="text-sm font-bold text-[#0c0f14]">RESTful JSON</p>
            <p className="text-xs text-[#8b919a] mt-1">Standard REST endpoints with JSON request/response bodies</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex h-10 w-10 items-center justify-center bg-[#0c0f14] mb-3">
              <Terminal className="h-4 w-4 text-[#C8A75E]" />
            </div>
            <p className="text-sm font-bold text-[#0c0f14]">Paginated Lists</p>
            <p className="text-xs text-[#8b919a] mt-1">Built-in pagination, filtering, and sorting on all list endpoints</p>
          </CardContent>
        </Card>
      </div>

      <SubSection title="Base URL">
        <CodeBlock>{`https://app.consenthaul.com/api/v1`}</CodeBlock>
      </SubSection>

      <SubSection title="Available Endpoints">
        <Card>
          <CardContent className="p-4 space-y-1">
            <Endpoint method="POST" path="/api/v1/drivers" description="Create a driver" />
            <Endpoint method="GET" path="/api/v1/drivers" description="List drivers" />
            <Endpoint method="POST" path="/api/v1/consents" description="Create a consent request" />
            <Endpoint method="GET" path="/api/v1/consents" description="List consents" />
          </CardContent>
        </Card>
      </SubSection>

      <SubSection title="Quick Start">
        <p className="text-sm text-[#6b6f76]">
          1. Create an API key in{' '}
          <Link href="/settings/api-keys" className="text-[#0c0f14] font-semibold underline underline-offset-2 hover:text-[#C8A75E]">
            Settings &rarr; API Keys
          </Link>
        </p>
        <p className="text-sm text-[#6b6f76]">2. Add a driver via the API</p>
        <p className="text-sm text-[#6b6f76]">3. Send a consent request to that driver</p>
        <p className="text-sm text-[#6b6f76]">4. The driver signs on their phone — you get a compliant PDF</p>

        <CodeBlock title="Example: Create a driver and send consent">{`# 1. Create a driver
curl -X POST https://app.consenthaul.com/api/v1/drivers \\
  -H "Authorization: Bearer ch_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+15551234567",
    "email": "john@example.com",
    "cdl_number": "D1234567",
    "cdl_state": "TX"
  }'

# 2. Send a consent request (use the driver ID from step 1)
curl -X POST https://app.consenthaul.com/api/v1/consents \\
  -H "Authorization: Bearer ch_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "driver_id": "uuid-from-step-1",
    "consent_type": "limited_query",
    "delivery_method": "sms"
  }'`}</CodeBlock>
      </SubSection>
    </div>
  );
}

function AuthTab() {
  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Authentication</SectionTitle>
        <p className="text-sm text-[#6b6f76] leading-relaxed max-w-2xl">
          All API requests must include a valid API key in the <code className="bg-[#fafaf8] px-1.5 py-0.5 text-[#0c0f14] border border-[#e8e8e3] text-xs">Authorization</code> header using the Bearer scheme.
        </p>
      </div>

      <SubSection title="Header Format">
        <CodeBlock>{`Authorization: Bearer ch_your_api_key_here`}</CodeBlock>
      </SubSection>

      <SubSection title="Creating API Keys">
        <p className="text-sm text-[#6b6f76] leading-relaxed">
          API keys are managed in{' '}
          <Link href="/settings/api-keys" className="text-[#0c0f14] font-semibold underline underline-offset-2 hover:text-[#C8A75E]">
            Settings &rarr; API Keys
          </Link>.
          Only organization owners and admins can create keys. Each key has a set of scopes
          that limit what it can access.
        </p>
      </SubSection>

      <SubSection title="Available Scopes">
        <ParamTable
          params={[
            { name: 'drivers:read', type: 'scope', required: false, description: 'List and view driver records' },
            { name: 'drivers:write', type: 'scope', required: false, description: 'Create and update driver records' },
            { name: 'consents:read', type: 'scope', required: false, description: 'List and view consent records' },
            { name: 'consents:write', type: 'scope', required: false, description: 'Create consent requests (deducts credits)' },
            { name: 'billing:read', type: 'scope', required: false, description: 'View credit balance and transaction history' },
          ]}
        />
      </SubSection>

      <SubSection title="Security Best Practices">
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm text-[#6b6f76]">
            <ChevronRight className="h-4 w-4 text-[#C8A75E] shrink-0 mt-0.5" />
            <span>Never expose API keys in client-side code or public repositories</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-[#6b6f76]">
            <ChevronRight className="h-4 w-4 text-[#C8A75E] shrink-0 mt-0.5" />
            <span>Use the minimum required scopes for each integration</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-[#6b6f76]">
            <ChevronRight className="h-4 w-4 text-[#C8A75E] shrink-0 mt-0.5" />
            <span>Rotate keys periodically and deactivate unused keys</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-[#6b6f76]">
            <ChevronRight className="h-4 w-4 text-[#C8A75E] shrink-0 mt-0.5" />
            <span>Store keys in environment variables or a secrets manager</span>
          </div>
        </div>
      </SubSection>

      <SubSection title="Example Request">
        <CodeBlock title="curl">{`curl -X GET https://app.consenthaul.com/api/v1/drivers \\
  -H "Authorization: Bearer ch_live_a1b2c3d4e5f6g7h8..." \\
  -H "Content-Type: application/json"`}</CodeBlock>
      </SubSection>

      <SubSection title="Unauthorized Response">
        <CodeBlock title="401 Unauthorized">{`{
  "error": "Unauthorized",
  "message": "Invalid or missing API key."
}`}</CodeBlock>
      </SubSection>
    </div>
  );
}

function DriversTab() {
  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Drivers API</SectionTitle>
        <p className="text-sm text-[#6b6f76] leading-relaxed max-w-2xl">
          Create and list driver records for your organization. Drivers must be created before you can send them consent requests.
        </p>
      </div>

      {/* POST /drivers */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="text-[0.65rem] font-bold px-2 py-0.5 text-blue-400 bg-blue-400/10 uppercase tracking-wider">POST</span>
          <code className="text-sm font-mono font-bold text-[#0c0f14]">/api/v1/drivers</code>
        </div>
        <p className="text-sm text-[#6b6f76]">
          Create a new driver in your organization. Requires <code className="bg-[#fafaf8] px-1 py-0.5 border border-[#e8e8e3] text-xs">drivers:write</code> scope.
        </p>

        <SubSection title="Request Body">
          <ParamTable
            params={[
              { name: 'first_name', type: 'string', required: true, description: 'Driver first name' },
              { name: 'last_name', type: 'string', required: true, description: 'Driver last name' },
              { name: 'phone', type: 'string', required: false, description: 'Phone number (E.164 format). Required if no email.' },
              { name: 'email', type: 'string', required: false, description: 'Email address. Required if no phone.' },
              { name: 'cdl_number', type: 'string', required: false, description: 'Commercial Driver License number' },
              { name: 'cdl_state', type: 'string', required: false, description: '2-letter state code (e.g., "TX", "CA")' },
              { name: 'date_of_birth', type: 'string', required: false, description: 'Date of birth (YYYY-MM-DD)' },
              { name: 'hire_date', type: 'string', required: false, description: 'Hire date (YYYY-MM-DD)' },
              { name: 'preferred_language', type: 'string', required: false, description: '"en" or "es". Defaults to "en".' },
            ]}
          />
        </SubSection>

        <SubSection title="Example Request">
          <CodeBlock title="curl">{`curl -X POST https://app.consenthaul.com/api/v1/drivers \\
  -H "Authorization: Bearer ch_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+15551234567",
    "email": "john.doe@example.com",
    "cdl_number": "D1234567",
    "cdl_state": "TX",
    "preferred_language": "en"
  }'`}</CodeBlock>
        </SubSection>

        <SubSection title="Response">
          <CodeBlock title="201 Created">{`{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "organization_id": "org-uuid",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+15551234567",
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
        </SubSection>
      </div>

      <div className="border-t border-[#e8e8e3]" />

      {/* GET /drivers */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="text-[0.65rem] font-bold px-2 py-0.5 text-emerald-400 bg-emerald-400/10 uppercase tracking-wider">GET</span>
          <code className="text-sm font-mono font-bold text-[#0c0f14]">/api/v1/drivers</code>
        </div>
        <p className="text-sm text-[#6b6f76]">
          List drivers in your organization with pagination, search, and filtering. Requires <code className="bg-[#fafaf8] px-1 py-0.5 border border-[#e8e8e3] text-xs">drivers:read</code> scope.
        </p>

        <SubSection title="Query Parameters">
          <ParamTable
            params={[
              { name: 'page', type: 'integer', required: false, description: 'Page number (default: 1)' },
              { name: 'per_page', type: 'integer', required: false, description: 'Results per page, max 100 (default: 25)' },
              { name: 'sort', type: 'string', required: false, description: 'Sort field (default: "created_at")' },
              { name: 'order', type: 'string', required: false, description: '"asc" or "desc" (default: "desc")' },
              { name: 'search', type: 'string', required: false, description: 'Search by name, email, phone, or CDL number' },
              { name: 'is_active', type: 'boolean', required: false, description: 'Filter by active status ("true" or "false")' },
            ]}
          />
        </SubSection>

        <SubSection title="Example Request">
          <CodeBlock title="curl">{`curl -X GET "https://app.consenthaul.com/api/v1/drivers?page=1&per_page=10&is_active=true" \\
  -H "Authorization: Bearer ch_your_api_key"`}</CodeBlock>
        </SubSection>

        <SubSection title="Response">
          <CodeBlock title="200 OK">{`{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "+15551234567",
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
        </SubSection>
      </div>
    </div>
  );
}

function ConsentsTab() {
  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Consents API</SectionTitle>
        <p className="text-sm text-[#6b6f76] leading-relaxed max-w-2xl">
          Create and list consent requests. Each consent request generates a unique signing link
          that can be delivered via SMS, WhatsApp, email, or manually shared with the driver.
          Creating a consent request deducts one credit from your balance.
        </p>
      </div>

      {/* POST /consents */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="text-[0.65rem] font-bold px-2 py-0.5 text-blue-400 bg-blue-400/10 uppercase tracking-wider">POST</span>
          <code className="text-sm font-mono font-bold text-[#0c0f14]">/api/v1/consents</code>
        </div>
        <p className="text-sm text-[#6b6f76]">
          Create a new consent request and optionally deliver it to the driver. Requires <code className="bg-[#fafaf8] px-1 py-0.5 border border-[#e8e8e3] text-xs">consents:write</code> scope. Costs 1 credit.
        </p>

        <SubSection title="Request Body">
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
              { name: 'token_ttl_hours', type: 'number', required: false, description: 'Signing link expiry in hours (default: 168 = 7 days)' },
            ]}
          />
        </SubSection>

        <SubSection title="Example Request">
          <CodeBlock title="curl">{`curl -X POST https://app.consenthaul.com/api/v1/consents \\
  -H "Authorization: Bearer ch_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "driver_id": "550e8400-e29b-41d4-a716-446655440000",
    "consent_type": "limited_query",
    "delivery_method": "sms",
    "language": "en",
    "token_ttl_hours": 72
  }'`}</CodeBlock>
        </SubSection>

        <SubSection title="Response">
          <CodeBlock title="201 Created">{`{
  "data": {
    "id": "660f9500-f39c-52e5-b827-557766550000",
    "organization_id": "org-uuid",
    "driver_id": "550e8400-e29b-41d4-a716-446655440000",
    "consent_type": "limited_query",
    "status": "sent",
    "language": "en",
    "delivery_method": "sms",
    "delivery_address": "+15551234567",
    "signing_url": "https://app.consenthaul.com/sign/abc123token",
    "signing_token_expires_at": "2026-02-27T12:00:00Z",
    "created_at": "2026-02-24T12:00:00Z"
  }
}`}</CodeBlock>
        </SubSection>

        <div className="border border-[#C8A75E]/30 bg-[#C8A75E]/5 px-4 py-3">
          <p className="text-sm text-[#3a3f49]">
            <strong>Note:</strong> When <code className="bg-white/50 px-1 py-0.5 border border-[#e8e8e3] text-xs">delivery_method</code> is <code className="bg-white/50 px-1 py-0.5 border border-[#e8e8e3] text-xs">&quot;manual&quot;</code>,
            no message is sent. Use the returned <code className="bg-white/50 px-1 py-0.5 border border-[#e8e8e3] text-xs">signing_url</code> to share
            the link with the driver yourself.
          </p>
        </div>
      </div>

      <div className="border-t border-[#e8e8e3]" />

      {/* GET /consents */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="text-[0.65rem] font-bold px-2 py-0.5 text-emerald-400 bg-emerald-400/10 uppercase tracking-wider">GET</span>
          <code className="text-sm font-mono font-bold text-[#0c0f14]">/api/v1/consents</code>
        </div>
        <p className="text-sm text-[#6b6f76]">
          List consent requests with pagination, filtering by status, driver, and date range. Requires <code className="bg-[#fafaf8] px-1 py-0.5 border border-[#e8e8e3] text-xs">consents:read</code> scope.
        </p>

        <SubSection title="Query Parameters">
          <ParamTable
            params={[
              { name: 'page', type: 'integer', required: false, description: 'Page number (default: 1)' },
              { name: 'per_page', type: 'integer', required: false, description: 'Results per page, max 100 (default: 25)' },
              { name: 'sort', type: 'string', required: false, description: 'Sort field (default: "created_at")' },
              { name: 'order', type: 'string', required: false, description: '"asc" or "desc" (default: "desc")' },
              { name: 'status', type: 'string', required: false, description: 'Filter by status: pending, sent, delivered, opened, signed, expired, revoked, failed' },
              { name: 'driver_id', type: 'uuid', required: false, description: 'Filter by driver ID' },
              { name: 'created_after', type: 'string', required: false, description: 'Filter consents created after this ISO date' },
              { name: 'created_before', type: 'string', required: false, description: 'Filter consents created before this ISO date' },
            ]}
          />
        </SubSection>

        <SubSection title="Example Request">
          <CodeBlock title="curl">{`curl -X GET "https://app.consenthaul.com/api/v1/consents?status=signed&per_page=50" \\
  -H "Authorization: Bearer ch_your_api_key"`}</CodeBlock>
        </SubSection>

        <SubSection title="Response">
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
        "phone": "+15551234567",
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
        </SubSection>

        <SubSection title="Consent Status Flow">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 font-bold">pending</span>
            <ChevronRight className="h-3 w-3 text-[#d4d4cf]" />
            <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 font-bold">sent</span>
            <ChevronRight className="h-3 w-3 text-[#d4d4cf]" />
            <span className="bg-[#C8A75E]/10 text-[#9a7d3a] border border-[#C8A75E]/30 px-2 py-1 font-bold">delivered</span>
            <ChevronRight className="h-3 w-3 text-[#d4d4cf]" />
            <span className="bg-[#C8A75E]/10 text-[#9a7d3a] border border-[#C8A75E]/30 px-2 py-1 font-bold">opened</span>
            <ChevronRight className="h-3 w-3 text-[#d4d4cf]" />
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 font-bold">signed</span>
          </div>
          <p className="text-xs text-[#8b919a] mt-2">
            Consents can also reach <span className="font-bold text-[#6b6f76]">expired</span>, <span className="font-bold text-[#6b6f76]">revoked</span>, or <span className="font-bold text-[#6b6f76]">failed</span> terminal states.
          </p>
        </SubSection>
      </div>
    </div>
  );
}

function ErrorsTab() {
  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Error Handling</SectionTitle>
        <p className="text-sm text-[#6b6f76] leading-relaxed max-w-2xl">
          The ConsentHaul API uses standard HTTP status codes. All error responses return a JSON body
          with an <code className="bg-[#fafaf8] px-1 py-0.5 border border-[#e8e8e3] text-xs">error</code> type and
          a human-readable <code className="bg-[#fafaf8] px-1 py-0.5 border border-[#e8e8e3] text-xs">message</code>.
        </p>
      </div>

      <SubSection title="Error Response Format">
        <CodeBlock>{`{
  "error": "Error Type",
  "message": "A human-readable description of what went wrong.",
  "details": { }  // Optional: validation error details
}`}</CodeBlock>
      </SubSection>

      <SubSection title="HTTP Status Codes">
        <div className="border border-[#e8e8e3] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#fafaf8] border-b border-[#e8e8e3]">
                <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Code</th>
                <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0ec]">
              <tr>
                <td className="px-4 py-2.5 font-mono text-xs font-bold text-emerald-600">200</td>
                <td className="px-4 py-2.5 text-xs text-[#0c0f14] font-bold">OK</td>
                <td className="px-4 py-2.5 text-xs text-[#6b6f76]">Request succeeded</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-xs font-bold text-emerald-600">201</td>
                <td className="px-4 py-2.5 text-xs text-[#0c0f14] font-bold">Created</td>
                <td className="px-4 py-2.5 text-xs text-[#6b6f76]">Resource successfully created</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-xs font-bold text-red-600">401</td>
                <td className="px-4 py-2.5 text-xs text-[#0c0f14] font-bold">Unauthorized</td>
                <td className="px-4 py-2.5 text-xs text-[#6b6f76]">Missing or invalid API key</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-xs font-bold text-red-600">402</td>
                <td className="px-4 py-2.5 text-xs text-[#0c0f14] font-bold">Payment Required</td>
                <td className="px-4 py-2.5 text-xs text-[#6b6f76]">Insufficient credits — purchase more at /billing</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-xs font-bold text-red-600">403</td>
                <td className="px-4 py-2.5 text-xs text-[#0c0f14] font-bold">Forbidden</td>
                <td className="px-4 py-2.5 text-xs text-[#6b6f76]">API key lacks the required scope</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-xs font-bold text-red-600">404</td>
                <td className="px-4 py-2.5 text-xs text-[#0c0f14] font-bold">Not Found</td>
                <td className="px-4 py-2.5 text-xs text-[#6b6f76]">The requested resource does not exist</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-xs font-bold text-red-600">409</td>
                <td className="px-4 py-2.5 text-xs text-[#0c0f14] font-bold">Conflict</td>
                <td className="px-4 py-2.5 text-xs text-[#6b6f76]">Duplicate resource (e.g., driver with same CDL already exists)</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-xs font-bold text-red-600">422</td>
                <td className="px-4 py-2.5 text-xs text-[#0c0f14] font-bold">Validation Error</td>
                <td className="px-4 py-2.5 text-xs text-[#6b6f76]">Request body failed validation — check the details field</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-xs font-bold text-red-600">500</td>
                <td className="px-4 py-2.5 text-xs text-[#0c0f14] font-bold">Internal Error</td>
                <td className="px-4 py-2.5 text-xs text-[#6b6f76]">Something went wrong on our end</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-xs font-bold text-red-600">502</td>
                <td className="px-4 py-2.5 text-xs text-[#0c0f14] font-bold">Delivery Error</td>
                <td className="px-4 py-2.5 text-xs text-[#6b6f76]">Consent created but SMS/email delivery failed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SubSection>

      <SubSection title="Validation Error Example">
        <CodeBlock title="422 Validation Error">{`{
  "error": "Validation Error",
  "message": "Invalid driver data.",
  "details": {
    "first_name": ["First name is required"],
    "phone": ["Either phone or email is required"]
  }
}`}</CodeBlock>
      </SubSection>

      <SubSection title="Rate Limits">
        <p className="text-sm text-[#6b6f76] leading-relaxed">
          The API currently does not enforce rate limits. However, we reserve the right to
          introduce rate limiting in the future. We recommend keeping requests to a reasonable
          volume (under 100 requests per minute).
        </p>
      </SubSection>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <div className="w-8 h-0.5 bg-[#C8A75E] mb-4" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#0c0f14] tracking-tight">API Documentation</h1>
            <p className="mt-1 text-sm text-[#8b919a]">
              Integrate ConsentHaul with your systems using the REST API.
            </p>
          </div>
          <Link
            href="/settings/api-keys"
            className="inline-flex items-center gap-2 bg-[#0c0f14] px-4 py-2.5 text-xs font-bold text-white uppercase tracking-wider hover:bg-[#1a1e27] transition-colors shrink-0"
          >
            <Key className="h-3.5 w-3.5" />
            Manage API Keys
          </Link>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-0 border-b border-[#e8e8e3] overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-[#0c0f14] text-[#0c0f14]'
                  : 'border-transparent text-[#8b919a] hover:text-[#3a3f49] hover:border-[#d4d4cf]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="pb-12">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'auth' && <AuthTab />}
        {activeTab === 'drivers' && <DriversTab />}
        {activeTab === 'consents' && <ConsentsTab />}
        {activeTab === 'errors' && <ErrorsTab />}
      </div>
    </div>
  );
}
