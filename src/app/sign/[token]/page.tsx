'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ConsentDocument } from '@/components/signing/ConsentDocument';
import { SignaturePad } from '@/components/signing/SignaturePad';
import { LanguageToggle } from '@/components/signing/LanguageToggle';
import { SigningComplete } from '@/components/signing/SigningComplete';
import { ESignDisclosure } from '@/components/signing/ESignDisclosure';
import type { ConsentType } from '@/types/database';
import { LogoFull } from '@/components/brand/Logo';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConsentData {
  consent_id: string;
  consent_type: ConsentType;
  status: string;
  language: string;
  consent_start_date: string;
  consent_end_date: string | null;
  query_frequency: string | null;
  expires_at: string | null;
  created_at: string;
  driver_name: string;
  organization_name: string;
}

type PageState =
  | { kind: 'loading' }
  | { kind: 'error'; code: number; title: string; message: string }
  | { kind: 'form'; data: ConsentData }
  | { kind: 'submitting'; data: ConsentData }
  | { kind: 'complete'; signedAt: string; pdfDownloadUrl: string | null; signingToken: string };

// ---------------------------------------------------------------------------
// i18n labels
// ---------------------------------------------------------------------------

const labels = {
  en: {
    loading: 'Loading consent form',
    checkboxLabel: 'I have read and understand the above consent',
    esignCheckboxLabel: 'I consent to conduct this transaction electronically and have reviewed the electronic transaction disclosure above',
    esignRequired: 'You must consent to electronic transactions before signing',
    submit: 'SIGN & SUBMIT',
    submitting: 'SUBMITTING',
    signatureRequired: 'Please provide your signature above',
    checkboxRequired: 'You must acknowledge the consent before signing',
    errorTitle404: 'Link Not Found',
    errorMessage404: 'This signing link is invalid or has been removed.',
    errorTitle410: 'Link Expired',
    errorMessage410: 'This signing link has expired. Please contact your carrier for a new link.',
    errorTitle409: 'Already Signed',
    errorMessage409: 'This consent has already been signed.',
    errorTitleGeneric: 'Something Went Wrong',
    errorMessageGeneric: 'An unexpected error occurred. Please try again or contact your carrier.',
    submissionError: 'Failed to submit signature. Please try again.',
    poweredBy: 'Powered by',
    yourSignature: 'YOUR SIGNATURE',
    clear: 'Clear',
    consentFor: 'Consent for',
    requestedBy: 'Requested by',
  },
  es: {
    loading: 'Cargando formulario de consentimiento',
    checkboxLabel: 'He leido y entiendo el consentimiento anterior',
    esignCheckboxLabel: 'Consiento en realizar esta transaccion electronicamente y he revisado la divulgacion de transaccion electronica anterior',
    esignRequired: 'Debe consentir las transacciones electronicas antes de firmar',
    submit: 'FIRMAR Y ENVIAR',
    submitting: 'ENVIANDO',
    signatureRequired: 'Por favor proporcione su firma arriba',
    checkboxRequired: 'Debe reconocer el consentimiento antes de firmar',
    errorTitle404: 'Enlace No Encontrado',
    errorMessage404: 'Este enlace de firma es invalido o ha sido eliminado.',
    errorTitle410: 'Enlace Expirado',
    errorMessage410: 'Este enlace de firma ha expirado. Comuniquese con su transportista para un nuevo enlace.',
    errorTitle409: 'Ya Firmado',
    errorMessage409: 'Este consentimiento ya ha sido firmado.',
    errorTitleGeneric: 'Algo Salio Mal',
    errorMessageGeneric: 'Ocurrio un error inesperado. Intentelo de nuevo o comuniquese con su transportista.',
    submissionError: 'No se pudo enviar la firma. Intentelo de nuevo.',
    poweredBy: 'Desarrollado por',
    yourSignature: 'SU FIRMA',
    clear: 'Borrar',
    consentFor: 'Consentimiento para',
    requestedBy: 'Solicitado por',
  },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SignPage({ params }: { params: { token: string } }) {
  const { token } = params;

  const [state, setState] = useState<PageState>({ kind: 'loading' });
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [acknowledged, setAcknowledged] = useState(false);
  const [esignConsented, setEsignConsented] = useState(false);
  const [signatureData, setSignatureData] = useState<string>('');
  const [signatureType, setSignatureType] = useState<'drawn' | 'typed'>('drawn');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Prevent double-submission
  const submittingRef = useRef(false);

  const t = labels[language];

  // ---------------------------------------------------------------------------
  // Fetch consent data on mount
  // ---------------------------------------------------------------------------

  const fetchConsent = useCallback(async () => {
    try {
      const res = await fetch(`/api/sign/${token}`);
      const json = await res.json();

      if (!res.ok) {
        const code = res.status;
        let title: string;
        let message: string;

        if (code === 404) {
          title = labels[language].errorTitle404;
          message = labels[language].errorMessage404;
        } else if (code === 410) {
          title = labels[language].errorTitle410;
          message = labels[language].errorMessage410;
        } else if (code === 409) {
          title = labels[language].errorTitle409;
          message = labels[language].errorMessage409;
        } else {
          title = labels[language].errorTitleGeneric;
          message = json?.message ?? labels[language].errorMessageGeneric;
        }

        setState({ kind: 'error', code, title, message });
        return;
      }

      const data = json.data as ConsentData;

      // Default language to the consent's language
      if (data.language === 'es' || data.language === 'en') {
        setLanguage(data.language);
      }

      setState({ kind: 'form', data });
    } catch {
      setState({
        kind: 'error',
        code: 0,
        title: labels[language].errorTitleGeneric,
        message: labels[language].errorMessageGeneric,
      });
    }
  }, [token, language]);

  useEffect(() => {
    fetchConsent();
    // Only run on mount; language changes just update labels, not refetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ---------------------------------------------------------------------------
  // Submit handler
  // ---------------------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return;
    if (state.kind !== 'form') return;

    // Validate
    if (!esignConsented) {
      setValidationError(t.esignRequired);
      return;
    }
    if (!acknowledged) {
      setValidationError(t.checkboxRequired);
      return;
    }
    if (!signatureData) {
      setValidationError(t.signatureRequired);
      return;
    }

    setValidationError(null);
    submittingRef.current = true;
    setState({ kind: 'submitting', data: state.data });

    try {
      const res = await fetch(`/api/sign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature_data: signatureData,
          confirmed: true,
          esign_consent: true,
          signature_type: signatureType,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setState({ kind: 'form', data: state.data });
        setValidationError(json?.message ?? t.submissionError);
        submittingRef.current = false;
        return;
      }

      setState({
        kind: 'complete',
        signedAt: json.data.signed_at,
        pdfDownloadUrl: json.data.pdf_download_url ?? null,
        signingToken: token,
      });
    } catch {
      setState({ kind: 'form', data: state.data });
      setValidationError(t.submissionError);
      submittingRef.current = false;
    }
  }, [state, token, acknowledged, esignConsented, signatureData, signatureType, t]);

  // ---------------------------------------------------------------------------
  // Render: Loading
  // ---------------------------------------------------------------------------

  if (state.kind === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f8f6] px-4">
        <div className="text-center">
          {/* Pulsing bar loader */}
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

  // ---------------------------------------------------------------------------
  // Render: Error
  // ---------------------------------------------------------------------------

  if (state.kind === 'error') {
    const isWarning = state.code === 409 || state.code === 410;

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f8f6] px-4">
        <div className="max-w-sm w-full">
          {/* Language toggle */}
          <div className="mb-8 flex justify-end">
            <LanguageToggle language={language} onChange={setLanguage} />
          </div>

          {/* Error indicator */}
          <div className={`w-full h-1 mb-8 ${isWarning ? 'bg-[#C8A75E]' : 'bg-red-500'}`} />

          <h1
            className="text-2xl font-bold text-[#0c0f14] tracking-tight"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            {state.title}
          </h1>
          <p className="mt-3 text-[#6b6f76] text-[0.9rem] leading-relaxed">
            {state.message}
          </p>

          {/* Error code */}
          <div className="mt-8 pt-6 border-t border-[#e8e8e3]">
            <p className="text-xs text-[#b5b5ae] uppercase tracking-wider">
              {state.code > 0 ? `Error ${state.code}` : 'Network Error'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Complete
  // ---------------------------------------------------------------------------

  if (state.kind === 'complete') {
    return (
      <div className="min-h-screen bg-[#f8f8f6]">
        <SigningComplete
          signedAt={state.signedAt}
          language={language}
          pdfDownloadUrl={state.pdfDownloadUrl}
          revokeToken={state.signingToken}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Form / Submitting
  // ---------------------------------------------------------------------------

  const consentData = state.data;
  const isSubmitting = state.kind === 'submitting';

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-[#e8e8e3] bg-[#0c0f14]">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <LogoFull mode="dark" className="h-6 w-auto" />
          <LanguageToggle language={language} onChange={setLanguage} />
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-2xl px-4 py-6">
        {/* Driver identity block */}
        <div className="bg-white border border-[#e8e8e3] p-5 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-[#8b919a] uppercase tracking-widest font-semibold mb-1">{t.consentFor}</p>
              <p
                className="text-xl font-bold text-[#0c0f14] tracking-tight"
                style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
              >
                {consentData.driver_name}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-[#8b919a] uppercase tracking-widest font-semibold mb-1">{t.requestedBy}</p>
              <p className="text-sm font-semibold text-[#0c0f14]">{consentData.organization_name}</p>
            </div>
          </div>
          {/* Yellow accent bar at bottom */}
          <div className="mt-4 h-0.5 bg-[#C8A75E]" />
        </div>

        {/* E-Sign Act Disclosure */}
        <ESignDisclosure language={language} companyName={consentData.organization_name} />

        {/* Consent document */}
        <div className="bg-white border border-[#e8e8e3] mb-6">
          <ConsentDocument
            driverName={consentData.driver_name}
            companyName={consentData.organization_name}
            consentType={consentData.consent_type}
            startDate={consentData.consent_start_date}
            endDate={consentData.consent_end_date}
            frequency={consentData.query_frequency ?? 'annual'}
            language={language}
          />
        </div>

        {/* E-Sign consent checkbox */}
        <div className="mb-3">
          <label className="flex items-start gap-3.5 cursor-pointer bg-white border border-[#e8e8e3] p-4 transition-colors hover:bg-[#fafaf8] select-none">
            <input
              type="checkbox"
              checked={esignConsented}
              onChange={(e) => {
                setEsignConsented(e.target.checked);
                if (validationError) setValidationError(null);
              }}
              disabled={isSubmitting}
              className="mt-0.5 h-5 w-5 border-[#d4d4cf] text-[#0c0f14] focus:ring-[#0c0f14] focus:ring-offset-0 shrink-0 accent-[#0c0f14]"
            />
            <span className="text-sm leading-relaxed text-[#3a3f49]">
              {t.esignCheckboxLabel}
            </span>
          </label>
        </div>

        {/* FMCSA consent acknowledgment */}
        <div className="mb-6">
          <label className="flex items-start gap-3.5 cursor-pointer bg-white border border-[#e8e8e3] p-4 transition-colors hover:bg-[#fafaf8] select-none">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => {
                setAcknowledged(e.target.checked);
                if (validationError) setValidationError(null);
              }}
              disabled={isSubmitting}
              className="mt-0.5 h-5 w-5 border-[#d4d4cf] text-[#0c0f14] focus:ring-[#0c0f14] focus:ring-offset-0 shrink-0 accent-[#0c0f14]"
            />
            <span className="text-sm leading-relaxed text-[#3a3f49]">
              {t.checkboxLabel}
            </span>
          </label>
        </div>

        {/* Signature pad */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xs font-bold text-[#3a3f49] uppercase tracking-widest">
              {t.yourSignature}
            </h3>
            <div className="flex-1 h-px bg-[#e8e8e3]" />
          </div>
          <div className="bg-white border border-[#e8e8e3]">
            <SignaturePad
              onSignature={(data) => {
                setSignatureData(data);
                if (validationError) setValidationError(null);
              }}
              onTypeChange={setSignatureType}
              height={200}
              clearLabel={t.clear}
              language={language}
            />
          </div>
        </div>

        {/* Validation error */}
        {validationError && (
          <div className="mb-6 border-l-[3px] border-red-500 bg-red-50/60 px-4 py-3">
            <p className="text-sm text-red-700 font-medium">{validationError}</p>
          </div>
        )}

        {/* Submit button — BIG tap target for mobile */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-[#0c0f14] text-white font-bold text-base uppercase tracking-wider py-5 transition-all hover:bg-[#1a1e27] active:bg-[#000] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isSubmitting ? (
            <>
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t.submitting}
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
              {t.submit}
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
