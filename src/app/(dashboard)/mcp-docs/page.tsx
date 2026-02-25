'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
  Key,
  Copy,
  Check,
  ChevronRight,
  Cpu,
  MessageSquare,
  KeyRound,
} from 'lucide-react';

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

function ToolTable({ tools }: { tools: { name: string; description: string }[] }) {
  return (
    <div className="border border-[#e8e8e3] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#fafaf8] border-b border-[#e8e8e3]">
            <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Tool</th>
            <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f0ec]">
          {tools.map((t) => (
            <tr key={t.name}>
              <td className="px-4 py-2.5 font-mono text-xs text-[#0c0f14] whitespace-nowrap">{t.name}</td>
              <td className="px-4 py-2.5 text-xs text-[#6b6f76]">{t.description}</td>
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

const driverTools = [
  { name: 'list_drivers', description: 'List drivers in your organization. Supports search by name, email, phone, or CDL number. Returns paginated results.' },
  { name: 'get_driver', description: 'Get a single driver by ID. Returns full driver details including CDL info, contact details, and metadata.' },
  { name: 'create_driver', description: 'Create a new driver in your organization. At minimum, first_name and last_name are required.' },
  { name: 'update_driver', description: 'Update an existing driver\'s information. Only provided fields will be updated.' },
  { name: 'deactivate_driver', description: 'Deactivate (soft-delete) a driver. The driver record is retained but marked as inactive. Active consents are not affected.' },
];

const consentTools = [
  { name: 'list_consents', description: 'List consent requests with optional filters. Returns paginated results with driver info included.' },
  { name: 'get_consent', description: 'Get a single consent request by ID. Returns full consent details including status, driver info, delivery info, and signing timestamps.' },
  { name: 'create_consent', description: 'Create and send a new consent request to a driver. COSTS 1 CREDIT. The driver will receive a signing link via the specified delivery method.' },
  { name: 'revoke_consent', description: 'Revoke an active consent. The consent will be marked as revoked and can no longer be used for Clearinghouse queries.' },
  { name: 'resend_consent', description: 'Resend the signing link for a pending or sent consent request. Useful if the driver lost the original link.' },
  { name: 'get_consent_pdf_url', description: 'Get a temporary download URL for the signed consent PDF. Only available for consents with status \'signed\'.' },
];

const billingTools = [
  { name: 'get_credit_balance', description: 'Check your organization\'s current credit balance. Each consent request costs 1 credit.' },
  { name: 'list_credit_packs', description: 'Show available credit packs and their pricing. Credits never expire. Buy more at any time from the ConsentHaul dashboard.' },
];

export default function McpDocsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <div className="w-8 h-0.5 bg-[#C8A75E] mb-4" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#0c0f14] tracking-tight" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>MCP Server Documentation</h1>
            <p className="mt-1 text-sm text-[#8b919a]">
              Connect AI agents to ConsentHaul using the Model Context Protocol.
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

      <div className="space-y-8 pb-12">
        {/* Overview */}
        <div className="space-y-6">
          <SectionTitle>Overview</SectionTitle>
          <p className="text-sm text-[#6b6f76] leading-relaxed max-w-2xl">
            The <strong className="text-[#0c0f14]">Model Context Protocol (MCP)</strong> is an open standard that lets AI agents call
            tools on external services. The ConsentHaul MCP server exposes your account&apos;s driver, consent, and billing
            functionality as tools that any MCP-compatible agent (like Claude) can invoke using natural language.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-5">
                <div className="flex h-10 w-10 items-center justify-center bg-[#0c0f14] mb-3">
                  <Cpu className="h-4 w-4 text-[#C8A75E]" />
                </div>
                <p className="text-sm font-bold text-[#0c0f14]">14 Tools</p>
                <p className="text-xs text-[#8b919a] mt-1">Manage drivers, consents, and billing through structured MCP tools</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex h-10 w-10 items-center justify-center bg-[#0c0f14] mb-3">
                  <MessageSquare className="h-4 w-4 text-[#C8A75E]" />
                </div>
                <p className="text-sm font-bold text-[#0c0f14]">Natural Language</p>
                <p className="text-xs text-[#8b919a] mt-1">Ask your AI agent in plain English — it picks the right tools automatically</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex h-10 w-10 items-center justify-center bg-[#0c0f14] mb-3">
                  <KeyRound className="h-4 w-4 text-[#C8A75E]" />
                </div>
                <p className="text-sm font-bold text-[#0c0f14]">Same API Key</p>
                <p className="text-xs text-[#8b919a] mt-1">Uses the same API keys and scopes as the REST API — no extra setup</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Installation */}
        <div className="space-y-6">
          <SectionTitle>Installation</SectionTitle>
          <SubSection title="Install the package">
            <CodeBlock title="npm">{`npm install -g @consenthaul/mcp-server`}</CodeBlock>
          </SubSection>

          <SubSection title="Environment Variables">
            <div className="border border-[#e8e8e3] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#fafaf8] border-b border-[#e8e8e3]">
                    <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Variable</th>
                    <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Required</th>
                    <th className="text-left px-4 py-2.5 text-[0.7rem] font-bold text-[#8b919a] uppercase tracking-wider">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0ec]">
                  <tr>
                    <td className="px-4 py-2.5 font-mono text-xs text-[#0c0f14]">CONSENTHAUL_API_KEY</td>
                    <td className="px-4 py-2.5">
                      <span className="text-[0.65rem] font-bold text-red-600 bg-red-50 px-1.5 py-0.5">REQUIRED</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-[#6b6f76]">Your ConsentHaul API key (starts with ch_)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-mono text-xs text-[#0c0f14]">CONSENTHAUL_BASE_URL</td>
                    <td className="px-4 py-2.5">
                      <span className="text-[0.65rem] font-bold text-[#8b919a] bg-[#fafaf8] px-1.5 py-0.5">OPTIONAL</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-[#6b6f76]">Override the API base URL (defaults to https://app.consenthaul.com)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </SubSection>
        </div>

        {/* Configuration */}
        <div className="space-y-6">
          <SectionTitle>Configuration</SectionTitle>
          <p className="text-sm text-[#6b6f76] leading-relaxed max-w-2xl">
            Add the ConsentHaul MCP server to your AI agent&apos;s configuration. Below is the setup for Claude Desktop:
          </p>

          <SubSection title="Claude Desktop">
            <CodeBlock title="claude_desktop_config.json">{`{
  "mcpServers": {
    "consenthaul": {
      "command": "consenthaul-mcp",
      "env": {
        "CONSENTHAUL_API_KEY": "ch_your_api_key_here"
      }
    }
  }
}`}</CodeBlock>
          </SubSection>

          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm text-[#6b6f76]">
              <ChevronRight className="h-4 w-4 text-[#C8A75E] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[#3a3f49]">macOS:</strong>{' '}
                <code className="bg-[#fafaf8] px-1.5 py-0.5 text-[#0c0f14] border border-[#e8e8e3] text-xs">~/Library/Application Support/Claude/claude_desktop_config.json</code>
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm text-[#6b6f76]">
              <ChevronRight className="h-4 w-4 text-[#C8A75E] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[#3a3f49]">Windows:</strong>{' '}
                <code className="bg-[#fafaf8] px-1.5 py-0.5 text-[#0c0f14] border border-[#e8e8e3] text-xs">%APPDATA%\Claude\claude_desktop_config.json</code>
              </span>
            </div>
          </div>
        </div>

        {/* Driver Tools */}
        <div className="space-y-6">
          <SectionTitle>Driver Tools</SectionTitle>
          <p className="text-sm text-[#6b6f76] leading-relaxed max-w-2xl">
            Create, update, and manage driver records. Requires API key with <code className="bg-[#fafaf8] px-1 py-0.5 border border-[#e8e8e3] text-xs">drivers:read</code> and/or <code className="bg-[#fafaf8] px-1 py-0.5 border border-[#e8e8e3] text-xs">drivers:write</code> scopes.
          </p>
          <ToolTable tools={driverTools} />
        </div>

        {/* Consent Tools */}
        <div className="space-y-6">
          <SectionTitle>Consent Tools</SectionTitle>
          <p className="text-sm text-[#6b6f76] leading-relaxed max-w-2xl">
            Send, track, and manage FMCSA Clearinghouse consent requests. Requires API key with <code className="bg-[#fafaf8] px-1 py-0.5 border border-[#e8e8e3] text-xs">consents:read</code> and/or <code className="bg-[#fafaf8] px-1 py-0.5 border border-[#e8e8e3] text-xs">consents:write</code> scopes.
          </p>
          <ToolTable tools={consentTools} />
          <div className="border border-[#C8A75E]/30 bg-[#C8A75E]/5 px-4 py-3">
            <p className="text-sm text-[#3a3f49]">
              <strong>Note:</strong> The <code className="bg-white/50 px-1 py-0.5 border border-[#e8e8e3] text-xs">create_consent</code> tool costs <strong>1 credit</strong> per call. Make sure your organization has sufficient credits before sending consent requests.
            </p>
          </div>
        </div>

        {/* Billing Tools */}
        <div className="space-y-6">
          <SectionTitle>Billing Tools</SectionTitle>
          <p className="text-sm text-[#6b6f76] leading-relaxed max-w-2xl">
            Check your credit balance and view available packs. Requires API key with <code className="bg-[#fafaf8] px-1 py-0.5 border border-[#e8e8e3] text-xs">billing:read</code> scope.
          </p>
          <ToolTable tools={billingTools} />
        </div>

        {/* Example Usage */}
        <div className="space-y-6">
          <SectionTitle>Example Usage</SectionTitle>
          <p className="text-sm text-[#6b6f76] leading-relaxed max-w-2xl">
            Once configured, you can interact with ConsentHaul through natural language. Here&apos;s an example conversation with Claude:
          </p>
          <CodeBlock title="Example prompt">{`You: "Add a new driver named Maria Garcia with CDL number G9876543
     from California, then send her a consent request via SMS
     to +15559876543."

Claude will automatically:
  1. Call create_driver with the provided details
  2. Call create_consent with the new driver's ID,
     delivery_method "sms", and the phone number
  3. Return the signing link and confirmation`}</CodeBlock>
          <CodeBlock title="Another example">{`You: "Show me all consents that are still pending and check
     how many credits we have left."

Claude will automatically:
  1. Call list_consents with status filter "pending"
  2. Call get_credit_balance
  3. Summarize the pending consents and remaining credits`}</CodeBlock>
        </div>

        {/* Important Notes */}
        <div className="space-y-6">
          <SectionTitle>Important Notes</SectionTitle>
          <div className="border border-[#C8A75E]/30 bg-[#C8A75E]/5 px-4 py-3 space-y-3">
            <div className="flex items-start gap-2 text-sm text-[#3a3f49]">
              <ChevronRight className="h-4 w-4 text-[#C8A75E] shrink-0 mt-0.5" />
              <span>The MCP server uses the same API key scopes as the REST API. A key with <code className="bg-white/50 px-1 py-0.5 border border-[#e8e8e3] text-xs">drivers:read</code> can list drivers but not create them.</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-[#3a3f49]">
              <ChevronRight className="h-4 w-4 text-[#C8A75E] shrink-0 mt-0.5" />
              <span>
                Get your API key from{' '}
                <Link href="/settings/api-keys" className="text-[#0c0f14] font-semibold underline underline-offset-2 hover:text-[#C8A75E]">
                  Settings &rarr; API Keys
                </Link>.
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm text-[#3a3f49]">
              <ChevronRight className="h-4 w-4 text-[#C8A75E] shrink-0 mt-0.5" />
              <span>
                For detailed endpoint parameters and response formats, see the{' '}
                <Link href="/api-docs" className="text-[#0c0f14] font-semibold underline underline-offset-2 hover:text-[#C8A75E]">
                  REST API Documentation
                </Link>.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
