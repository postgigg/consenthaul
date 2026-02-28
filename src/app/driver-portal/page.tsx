'use client';

import { useState, useEffect, useCallback } from 'react';
import { LogoFull } from '@/components/brand/Logo';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DriverInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  cdl_number: string | null;
  cdl_state: string | null;
}

interface ConsentRecord {
  id: string;
  status: string;
  consent_type: string;
  language: string;
  consent_start_date: string;
  consent_end_date: string | null;
  signed_at: string | null;
  pdf_storage_path: string | null;
  signing_token: string | null;
  created_at: string;
}

interface QueryRecord {
  id: string;
  query_type: string;
  query_date: string;
  result: string;
  created_at: string;
}

interface PortalData {
  driver: DriverInfo;
  organization_name: string;
  consents: ConsentRecord[];
  queries: QueryRecord[];
}

type PageState =
  | { kind: 'login' }
  | { kind: 'login_submitting' }
  | { kind: 'login_success' }
  | { kind: 'loading_portal' }
  | { kind: 'error'; message: string }
  | { kind: 'portal'; data: PortalData };

// ---------------------------------------------------------------------------
// Status badge colors
// ---------------------------------------------------------------------------

function statusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    signed: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Signed' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
    sent: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Sent' },
    delivered: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Delivered' },
    opened: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Opened' },
    expired: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Expired' },
    revoked: { bg: 'bg-red-100', text: 'text-red-800', label: 'Revoked' },
    failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' },
  };
  const s = map[status] ?? { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function queryResultBadge(result: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    no_violations: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'No Violations' },
    violations_found: { bg: 'bg-red-100', text: 'text-red-800', label: 'Violations Found' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
    error: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Error' },
  };
  const r = map[result] ?? { bg: 'bg-gray-100', text: 'text-gray-700', label: result };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${r.bg} ${r.text}`}>
      {r.label}
    </span>
  );
}

function consentTypeLabel(type: string) {
  const map: Record<string, string> = {
    limited_query: 'Limited Query',
    pre_employment: 'Pre-Employment',
    blanket: 'Blanket',
  };
  return map[type] ?? type;
}

function queryTypeLabel(type: string) {
  const map: Record<string, string> = {
    limited: 'Limited',
    pre_employment: 'Pre-Employment',
  };
  return map[type] ?? type;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DriverPortalPage() {
  const [state, setState] = useState<PageState>({ kind: 'login' });
  const [email, setEmail] = useState('');
  const [cdlNumber, setCdlNumber] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'consents' | 'queries'>('consents');

  // Track the portal token in state
  const [portalToken, setPortalToken] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // On mount: check URL for ?token= param (magic link flow)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setPortalToken(token);
      setState({ kind: 'loading_portal' });
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Verify token when we have one
  // ---------------------------------------------------------------------------
  const verifyToken = useCallback(async (token: string) => {
    try {
      const res = await fetch(`/api/driver-portal/verify?token=${encodeURIComponent(token)}`);
      const json = await res.json();

      if (!res.ok) {
        setState({ kind: 'error', message: json?.message ?? 'Invalid or expired link.' });
        return;
      }

      setState({ kind: 'portal', data: json.data as PortalData });
    } catch {
      setState({ kind: 'error', message: 'An unexpected error occurred. Please try again.' });
    }
  }, []);

  useEffect(() => {
    if (portalToken && state.kind === 'loading_portal') {
      verifyToken(portalToken);
    }
  }, [portalToken, state.kind, verifyToken]);

  // ---------------------------------------------------------------------------
  // Login handler
  // ---------------------------------------------------------------------------
  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!email.trim() || !cdlNumber.trim()) {
      setLoginError('Please provide both your email and CDL number.');
      return;
    }

    setState({ kind: 'login_submitting' });

    try {
      const res = await fetch('/api/driver-portal/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), cdl_number: cdlNumber.trim() }),
      });

      const json = await res.json();

      if (!res.ok && res.status !== 200) {
        setState({ kind: 'login' });
        setLoginError(json?.message ?? 'Something went wrong. Please try again.');
        return;
      }

      setState({ kind: 'login_success' });
    } catch {
      setState({ kind: 'login' });
      setLoginError('Network error. Please check your connection and try again.');
    }
  }, [email, cdlNumber]);

  // ---------------------------------------------------------------------------
  // Render: Loading bar (reusable)
  // ---------------------------------------------------------------------------
  const loadingIndicator = (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f8f6] px-4">
      <div className="text-center">
        <div className="flex items-center gap-1 justify-center mb-4">
          <div className="w-2 h-8 bg-[#0c0f14] animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-8 bg-[#0c0f14] animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-8 bg-[#C8A75E] animate-pulse" style={{ animationDelay: '300ms' }} />
          <div className="w-2 h-8 bg-[#0c0f14] animate-pulse" style={{ animationDelay: '450ms' }} />
        </div>
        <p className="text-xs uppercase tracking-widest text-[#8b919a] font-semibold">Loading your portal</p>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Loading portal
  // ---------------------------------------------------------------------------
  if (state.kind === 'loading_portal') {
    return loadingIndicator;
  }

  // ---------------------------------------------------------------------------
  // Render: Error
  // ---------------------------------------------------------------------------
  if (state.kind === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f8f6] px-4">
        <div className="max-w-sm w-full">
          <div className="w-full h-1 mb-8 bg-red-500" />
          <h1
            className="text-2xl font-bold text-[#0c0f14] tracking-tight"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            Unable to Access Portal
          </h1>
          <p className="mt-3 text-[#6b6f76] text-[0.9rem] leading-relaxed">
            {state.message}
          </p>
          <button
            type="button"
            onClick={() => {
              setPortalToken(null);
              setState({ kind: 'login' });
              // Remove token from URL
              window.history.replaceState({}, '', '/driver-portal');
            }}
            className="mt-6 w-full bg-[#0c0f14] text-white font-semibold text-[0.9rem] py-3.5 hover:bg-[#1a1e27] active:bg-[#000] transition-colors flex items-center justify-center gap-2"
          >
            BACK TO LOGIN
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Login form
  // ---------------------------------------------------------------------------
  if (state.kind === 'login' || state.kind === 'login_submitting') {
    const isSubmitting = state.kind === 'login_submitting';

    return (
      <div className="min-h-screen bg-[#f8f8f6]">
        {/* Header */}
        <header className="border-b border-[#e8e8e3] bg-[#0c0f14]">
          <div className="mx-auto flex max-w-lg items-center justify-center px-4 py-4">
            <LogoFull mode="dark" className="h-6 w-auto" />
          </div>
        </header>

        <main className="mx-auto max-w-sm px-4 py-12">
          {/* Title */}
          <div className="mb-8">
            <h1
              className="text-[1.75rem] font-bold text-[#0c0f14] tracking-tight leading-tight"
              style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
            >
              Driver Portal
            </h1>
            <p className="mt-2 text-[#6b6f76] text-[0.9rem]">
              Enter your email and CDL number to receive a secure login link.
            </p>
          </div>

          {/* Error */}
          {loginError && (
            <div className="mb-6 border-l-[3px] border-red-500 bg-red-50/60 px-4 py-3">
              <p className="text-sm text-red-700 font-medium">{loginError}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-[#3a3f49] uppercase tracking-wider mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="driver@example.com"
                disabled={isSubmitting}
                className="w-full border border-[#d4d4cf] bg-white px-4 py-3 text-[0.9rem] text-[#0c0f14] placeholder:text-[#b5b5ae] focus:border-[#0c0f14] focus:outline-none focus:ring-1 focus:ring-[#0c0f14] transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="cdl"
                className="block text-xs font-semibold text-[#3a3f49] uppercase tracking-wider mb-2"
              >
                CDL Number
              </label>
              <input
                id="cdl"
                type="text"
                value={cdlNumber}
                onChange={(e) => setCdlNumber(e.target.value)}
                required
                autoComplete="off"
                placeholder="Enter your CDL number"
                disabled={isSubmitting}
                className="w-full border border-[#d4d4cf] bg-white px-4 py-3 text-[0.9rem] text-[#0c0f14] placeholder:text-[#b5b5ae] focus:border-[#0c0f14] focus:outline-none focus:ring-1 focus:ring-[#0c0f14] transition-colors disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0c0f14] text-white font-semibold text-[0.9rem] py-3.5 hover:bg-[#1a1e27] active:bg-[#000] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  SENDING...
                </>
              ) : (
                'SEND LOGIN LINK'
              )}
            </button>
          </form>

          {/* Info note */}
          <div className="mt-6 border border-[#e8e8e3] bg-white px-4 py-3">
            <p className="text-xs text-[#8b919a] leading-relaxed">
              A secure one-time link will be sent to your email address.
              The link is valid for 24 hours.
            </p>
          </div>

          {/* Footer */}
          <div className="mt-12 flex items-center justify-center gap-2">
            <div className="w-4 h-0.5 bg-[#C8A75E]" />
            <p className="text-xs text-[#b5b5ae] uppercase tracking-wider">
              Powered by ConsentHaul
            </p>
            <div className="w-4 h-0.5 bg-[#C8A75E]" />
          </div>
        </main>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Login success (check email)
  // ---------------------------------------------------------------------------
  if (state.kind === 'login_success') {
    return (
      <div className="min-h-screen bg-[#f8f8f6]">
        <header className="border-b border-[#e8e8e3] bg-[#0c0f14]">
          <div className="mx-auto flex max-w-lg items-center justify-center px-4 py-4">
            <LogoFull mode="dark" className="h-6 w-auto" />
          </div>
        </header>

        <main className="mx-auto max-w-sm px-4 py-12">
          <div className="text-center">
            {/* Check icon */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-10 w-10 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h1
              className="text-2xl font-bold text-[#0c0f14] tracking-tight"
              style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
            >
              Check Your Email
            </h1>
            <p className="mt-3 text-[#6b6f76] text-[0.9rem] leading-relaxed">
              If a matching driver account exists, we&apos;ve sent a secure login link to your email address.
              Please check your inbox (and spam folder).
            </p>
            <p className="mt-6 text-xs text-[#b5b5ae]">
              The link will expire in 24 hours.
            </p>

            <button
              type="button"
              onClick={() => {
                setState({ kind: 'login' });
                setEmail('');
                setCdlNumber('');
                setLoginError(null);
              }}
              className="mt-8 text-sm text-[#6b6f76] hover:text-[#0c0f14] transition-colors underline underline-offset-2"
            >
              Back to login
            </button>
          </div>

          {/* Footer */}
          <div className="mt-12 flex items-center justify-center gap-2">
            <div className="w-4 h-0.5 bg-[#C8A75E]" />
            <p className="text-xs text-[#b5b5ae] uppercase tracking-wider">
              Powered by ConsentHaul
            </p>
            <div className="w-4 h-0.5 bg-[#C8A75E]" />
          </div>
        </main>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Portal Dashboard
  // ---------------------------------------------------------------------------
  const { driver, organization_name, consents, queries } = state.data;

  const signedConsents = consents.filter((c) => c.status === 'signed');
  const revokedConsents = consents.filter((c) => c.status === 'revoked');
  const activeConsents = consents.filter((c) => c.status !== 'expired' && c.status !== 'failed');

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[#e8e8e3] bg-[#0c0f14]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <LogoFull mode="dark" className="h-6 w-auto" />
          <span className="text-xs text-[#8b919a] uppercase tracking-wider font-semibold">
            Driver Portal
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* Driver info card */}
        <div className="bg-white border border-[#e8e8e3] p-5 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-[#8b919a] uppercase tracking-widest font-semibold mb-1">Driver</p>
              <p
                className="text-xl font-bold text-[#0c0f14] tracking-tight"
                style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
              >
                {driver.first_name} {driver.last_name}
              </p>
              {driver.email && (
                <p className="text-sm text-[#6b6f76] mt-1">{driver.email}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-[#8b919a] uppercase tracking-widest font-semibold mb-1">Organization</p>
              <p className="text-sm font-semibold text-[#0c0f14]">{organization_name}</p>
              {driver.cdl_number && (
                <p className="text-xs text-[#6b6f76] mt-1 font-mono">
                  CDL: {driver.cdl_number}
                  {driver.cdl_state ? ` (${driver.cdl_state})` : ''}
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 h-0.5 bg-[#C8A75E]" />
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-[#e8e8e3] p-4 text-center">
            <p className="text-2xl font-bold text-[#0c0f14]">{activeConsents.length}</p>
            <p className="text-xs text-[#8b919a] uppercase tracking-widest font-semibold mt-1">Active</p>
          </div>
          <div className="bg-white border border-[#e8e8e3] p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{signedConsents.length}</p>
            <p className="text-xs text-[#8b919a] uppercase tracking-widest font-semibold mt-1">Signed</p>
          </div>
          <div className="bg-white border border-[#e8e8e3] p-4 text-center">
            <p className="text-2xl font-bold text-[#6b6f76]">{queries.length}</p>
            <p className="text-xs text-[#8b919a] uppercase tracking-widest font-semibold mt-1">Queries</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#e8e8e3] mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('consents')}
            className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'consents'
                ? 'text-[#0c0f14] border-b-2 border-[#C8A75E]'
                : 'text-[#8b919a] hover:text-[#0c0f14]'
            }`}
          >
            Consents ({consents.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('queries')}
            className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'queries'
                ? 'text-[#0c0f14] border-b-2 border-[#C8A75E]'
                : 'text-[#8b919a] hover:text-[#0c0f14]'
            }`}
          >
            Query History ({queries.length})
          </button>
        </div>

        {/* Consents tab */}
        {activeTab === 'consents' && (
          <div className="space-y-3">
            {consents.length === 0 ? (
              <div className="bg-white border border-[#e8e8e3] p-8 text-center">
                <p className="text-sm text-[#8b919a]">No consent records found.</p>
              </div>
            ) : (
              consents.map((consent) => (
                <div key={consent.id} className="bg-white border border-[#e8e8e3] p-4">
                  {/* Top row: type + status */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#0c0f14]">
                        {consentTypeLabel(consent.consent_type)}
                      </span>
                      <span className="text-xs text-[#b5b5ae] font-mono">
                        {consent.id.slice(0, 8)}
                      </span>
                    </div>
                    {statusBadge(consent.status)}
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-[#8b919a] uppercase tracking-wider font-semibold">Start</span>
                      <p className="text-[#3a3f49] mt-0.5">{formatDate(consent.consent_start_date)}</p>
                    </div>
                    {consent.consent_end_date && (
                      <div>
                        <span className="text-[#8b919a] uppercase tracking-wider font-semibold">End</span>
                        <p className="text-[#3a3f49] mt-0.5">{formatDate(consent.consent_end_date)}</p>
                      </div>
                    )}
                    {consent.signed_at && (
                      <div>
                        <span className="text-[#8b919a] uppercase tracking-wider font-semibold">Signed</span>
                        <p className="text-[#3a3f49] mt-0.5">{formatDate(consent.signed_at)}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-[#8b919a] uppercase tracking-wider font-semibold">Created</span>
                      <p className="text-[#3a3f49] mt-0.5">{formatDate(consent.created_at)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-[#e8e8e3]">
                    {/* PDF download — only for signed/revoked with a PDF */}
                    {(consent.status === 'signed' || consent.status === 'revoked') && consent.pdf_storage_path && portalToken && (
                      <a
                        href={`/api/driver-portal/consents/${consent.id}/pdf?token=${encodeURIComponent(portalToken)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-[#0c0f14] text-white hover:bg-[#1a1e27] transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download PDF
                      </a>
                    )}

                    {/* Revoke button — only for signed consents with a signing token */}
                    {consent.status === 'signed' && consent.signing_token && (
                      <a
                        href={`/revoke/${consent.signing_token}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border border-amber-500 text-amber-700 hover:bg-amber-50 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                        </svg>
                        Withdraw Consent
                      </a>
                    )}

                    {/* Status hint for non-actionable consents */}
                    {consent.status !== 'signed' && consent.status !== 'revoked' && (
                      <p className="text-xs text-[#b5b5ae] italic">
                        {consent.status === 'pending' || consent.status === 'sent' || consent.status === 'delivered' || consent.status === 'opened'
                          ? 'Awaiting your signature'
                          : consent.status === 'expired'
                            ? 'This consent has expired'
                            : 'No actions available'}
                      </p>
                    )}

                    {consent.status === 'revoked' && !consent.pdf_storage_path && (
                      <p className="text-xs text-[#b5b5ae] italic">
                        Consent has been withdrawn
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Revocation notice */}
            {revokedConsents.length > 0 && (
              <div className="border-l-[3px] border-amber-500 bg-amber-50/60 px-4 py-3 mt-4">
                <p className="text-xs text-amber-800 font-medium">
                  {revokedConsents.length} consent{revokedConsents.length !== 1 ? 's have' : ' has'} been
                  withdrawn. Your employer has been notified.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Queries tab */}
        {activeTab === 'queries' && (
          <div className="space-y-3">
            {queries.length === 0 ? (
              <div className="bg-white border border-[#e8e8e3] p-8 text-center">
                <p className="text-sm text-[#8b919a]">No query records found.</p>
              </div>
            ) : (
              queries.map((query) => (
                <div key={query.id} className="bg-white border border-[#e8e8e3] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-[#0c0f14]">
                          {queryTypeLabel(query.query_type)} Query
                        </span>
                        <span className="text-xs text-[#b5b5ae] font-mono">
                          {query.id.slice(0, 8)}
                        </span>
                      </div>
                      <p className="text-xs text-[#6b6f76]">
                        Queried on {formatDate(query.query_date)}
                      </p>
                    </div>
                    {queryResultBadge(query.result)}
                  </div>
                </div>
              ))
            )}

            {/* Info note about queries */}
            <div className="border border-[#e8e8e3] bg-white px-4 py-3 mt-4">
              <p className="text-xs text-[#8b919a] leading-relaxed">
                Query records show when your FMCSA Clearinghouse was queried by your
                employer. Under FMCSA regulations, employers must have your signed consent
                before conducting queries.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pb-8 flex items-center justify-center gap-2">
          <div className="w-4 h-0.5 bg-[#C8A75E]" />
          <p className="text-xs text-[#b5b5ae] uppercase tracking-wider">
            Powered by ConsentHaul
          </p>
          <div className="w-4 h-0.5 bg-[#C8A75E]" />
        </div>
      </main>
    </div>
  );
}
