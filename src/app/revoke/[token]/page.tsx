'use client';

import { useState, useEffect, useCallback } from 'react';
import { LogoFull } from '@/components/brand/Logo';
import { LanguageToggle } from '@/components/signing/LanguageToggle';
import { ShieldX, CheckCircle2, AlertTriangle } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConsentInfo {
  consent_id: string;
  driver_name: string;
  organization_name: string;
  signed_at: string;
  status: string;
}

type PageState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'confirm'; data: ConsentInfo }
  | { kind: 'revoking'; data: ConsentInfo }
  | { kind: 'revoked' };

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------

const labels = {
  en: {
    loading: 'Loading consent details',
    title: 'Withdraw Consent to Electronic Transactions',
    explanation:
      'This will withdraw your consent to conduct transactions electronically. This does NOT revoke the underlying FMCSA consent — it only means future consent documents must be provided to you on paper.',
    driver: 'Driver',
    company: 'Company',
    signedOn: 'Signed on',
    consentId: 'Consent ID',
    warning: 'This action cannot be undone.',
    confirmButton: 'WITHDRAW ELECTRONIC CONSENT',
    revoking: 'PROCESSING',
    revokedTitle: 'Consent Withdrawn',
    revokedMessage: 'Your consent to electronic transactions has been withdrawn. Your employer will be notified and must provide future documents on paper.',
    close: 'You can safely close this page.',
    notFound: 'This link is invalid or the consent was not found.',
    alreadyRevoked: 'This consent has already been withdrawn.',
    notSigned: 'This consent has not been signed yet.',
    errorGeneric: 'Something went wrong. Please try again.',
    poweredBy: 'Powered by',
  },
  es: {
    loading: 'Cargando detalles del consentimiento',
    title: 'Retirar Consentimiento para Transacciones Electrónicas',
    explanation:
      'Esto retirará su consentimiento para realizar transacciones electrónicamente. Esto NO revoca el consentimiento FMCSA subyacente — solo significa que los documentos de consentimiento futuros deben proporcionársele en papel.',
    driver: 'Conductor',
    company: 'Empresa',
    signedOn: 'Firmado el',
    consentId: 'ID de consentimiento',
    warning: 'Esta acción no se puede deshacer.',
    confirmButton: 'RETIRAR CONSENTIMIENTO ELECTRÓNICO',
    revoking: 'PROCESANDO',
    revokedTitle: 'Consentimiento Retirado',
    revokedMessage: 'Su consentimiento para transacciones electrónicas ha sido retirado. Su empleador será notificado y deberá proporcionar documentos futuros en papel.',
    close: 'Puede cerrar esta página de forma segura.',
    notFound: 'Este enlace es inválido o el consentimiento no fue encontrado.',
    alreadyRevoked: 'Este consentimiento ya ha sido retirado.',
    notSigned: 'Este consentimiento aún no ha sido firmado.',
    errorGeneric: 'Algo salió mal. Inténtelo de nuevo.',
    poweredBy: 'Desarrollado por',
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RevokePage({ params }: { params: { token: string } }) {
  const { token } = params;
  const [state, setState] = useState<PageState>({ kind: 'loading' });
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const t = labels[language];

  // Fetch consent info on mount
  const fetchConsent = useCallback(async () => {
    try {
      const res = await fetch(`/api/revoke/${token}`);
      const json = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setState({ kind: 'error', message: t.alreadyRevoked });
        } else if (res.status === 404) {
          setState({ kind: 'error', message: t.notFound });
        } else if (res.status === 422) {
          setState({ kind: 'error', message: t.notSigned });
        } else {
          setState({ kind: 'error', message: json?.message ?? t.errorGeneric });
        }
        return;
      }

      setState({ kind: 'confirm', data: json.data });
    } catch {
      setState({ kind: 'error', message: t.errorGeneric });
    }
  }, [token, t]);

  // Fetch on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchConsent(); }, [token]);

  // Handle revocation
  const handleRevoke = useCallback(async () => {
    if (state.kind !== 'confirm') return;
    setState({ kind: 'revoking', data: state.data });

    try {
      const res = await fetch(`/api/revoke/${token}`, { method: 'POST' });

      if (!res.ok) {
        const json = await res.json();
        setState({ kind: 'error', message: json?.message ?? t.errorGeneric });
        return;
      }

      setState({ kind: 'revoked' });
    } catch {
      setState({ kind: 'confirm', data: state.data });
    }
  }, [state, token, t]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(language === 'es' ? 'es-US' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  // -------------------------------------------------------------------------
  // Render: Loading
  // -------------------------------------------------------------------------
  if (state.kind === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f8f6] px-4">
        <div className="text-center">
          <div className="flex items-center gap-1 justify-center mb-4">
            <div className="w-2 h-8 bg-[#0c0f14] animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-8 bg-[#0c0f14] animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-8 bg-[#C8A75E] animate-pulse" style={{ animationDelay: '300ms' }} />
            <div className="w-2 h-8 bg-[#0c0f14] animate-pulse" style={{ animationDelay: '450ms' }} />
          </div>
          <p className="text-xs uppercase tracking-widest text-[#8b919a] font-semibold">{t.loading}</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Error
  // -------------------------------------------------------------------------
  if (state.kind === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f8f6] px-4">
        <div className="max-w-sm w-full">
          <div className="mb-8 flex justify-end">
            <LanguageToggle language={language} onChange={setLanguage} />
          </div>
          <div className="w-full h-1 mb-8 bg-red-500" />
          <h1 className="text-2xl font-bold text-[#0c0f14] tracking-tight">
            {t.errorGeneric}
          </h1>
          <p className="mt-3 text-[#6b6f76] text-[0.9rem] leading-relaxed">{state.message}</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Revoked
  // -------------------------------------------------------------------------
  if (state.kind === 'revoked') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f8f6] px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
            <CheckCircle2 className="h-10 w-10 text-amber-600" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-[#0c0f14]">{t.revokedTitle}</h1>
          <p className="mt-3 text-[#6b6f76] leading-relaxed">{t.revokedMessage}</p>
          <p className="mt-8 text-sm text-[#b5b5ae]">{t.close}</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Confirm / Revoking
  // -------------------------------------------------------------------------
  const consentInfo = state.data;
  const isRevoking = state.kind === 'revoking';

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <header className="sticky top-0 z-10 border-b border-[#e8e8e3] bg-[#0c0f14]">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <LogoFull mode="dark" className="h-6 w-auto" />
          <LanguageToggle language={language} onChange={setLanguage} />
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-8">
        {/* Title */}
        <div className="flex items-center gap-2 mb-4">
          <ShieldX className="h-5 w-5 text-amber-500 shrink-0" />
          <h1 className="text-xl font-bold text-[#0c0f14] tracking-tight">
            {t.title}
          </h1>
        </div>

        <p className="text-sm text-[#6b6f76] leading-relaxed mb-6">
          {t.explanation}
        </p>

        {/* Consent details */}
        <div className="bg-white border border-[#e8e8e3] p-5 mb-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-xs text-[#8b919a] uppercase tracking-widest font-semibold">{t.driver}</span>
              <span className="text-sm font-semibold text-[#0c0f14]">{consentInfo.driver_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-[#8b919a] uppercase tracking-widest font-semibold">{t.company}</span>
              <span className="text-sm font-semibold text-[#0c0f14]">{consentInfo.organization_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-[#8b919a] uppercase tracking-widest font-semibold">{t.signedOn}</span>
              <span className="text-sm text-[#0c0f14]">{formatDate(consentInfo.signed_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-[#8b919a] uppercase tracking-widest font-semibold">{t.consentId}</span>
              <span className="text-xs font-mono text-[#6b6f76]">{consentInfo.consent_id.slice(0, 8)}...</span>
            </div>
          </div>
          <div className="mt-4 h-0.5 bg-[#C8A75E]" />
        </div>

        {/* Warning */}
        <div className="mb-6 border-l-[3px] border-amber-500 bg-amber-50/60 px-4 py-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 font-medium">{t.warning}</p>
        </div>

        {/* Confirm button */}
        <button
          type="button"
          onClick={handleRevoke}
          disabled={isRevoking}
          className="w-full bg-amber-600 text-white font-bold text-base uppercase tracking-wider py-5 transition-all hover:bg-amber-700 active:bg-amber-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isRevoking ? (
            <>
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t.revoking}
            </>
          ) : (
            <>
              <ShieldX className="h-5 w-5" />
              {t.confirmButton}
            </>
          )}
        </button>

        {/* Footer */}
        <div className="mt-8 pb-8 flex items-center justify-center gap-2">
          <div className="w-4 h-0.5 bg-[#C8A75E]" />
          <p className="text-xs text-[#b5b5ae] uppercase tracking-wider">
            {t.poweredBy} ConsentHaul
          </p>
          <div className="w-4 h-0.5 bg-[#C8A75E]" />
        </div>
      </main>
    </div>
  );
}
