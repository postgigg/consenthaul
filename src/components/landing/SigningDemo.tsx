'use client';

import { useState, useCallback, useRef } from 'react';
import { ConsentDocument } from '@/components/signing/ConsentDocument';
import { SignaturePad } from '@/components/signing/SignaturePad';
import { LanguageToggle } from '@/components/signing/LanguageToggle';
import { LogoFull } from '@/components/brand/Logo';
import { IPhoneFrame } from './IPhoneFrame';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DemoState = 'idle' | 'signing' | 'generating' | 'complete';

// ---------------------------------------------------------------------------
// i18n labels (matching the real signing page)
// ---------------------------------------------------------------------------

const labels = {
  en: {
    cta: 'Try the Signing Experience',
    ctaSub: 'Go through the exact same flow a CDL driver sees — draw your signature and generate a real PDF.',
    checkboxLabel: 'I have read and understand the above consent',
    submit: 'SIGN & SUBMIT',
    submitting: 'GENERATING PDF',
    signatureRequired: 'Please provide your signature above',
    checkboxRequired: 'You must acknowledge the consent before signing',
    yourSignature: 'YOUR SIGNATURE',
    clear: 'Clear',
    consentFor: 'Consent for',
    requestedBy: 'Requested by',
    pdfReady: 'Your consent PDF is ready',
    pdfReadySub: 'This is a real FMCSA consent PDF generated with your drawn signature — the exact same document a carrier receives.',
    download: 'Download PDF',
    tryAgain: 'Try Again',
    poweredBy: 'Powered by',
    demoLabel: 'INTERACTIVE DEMO',
  },
  es: {
    cta: 'Pruebe la Experiencia de Firma',
    ctaSub: 'Pase por el mismo proceso que ve un conductor CDL — dibuje su firma y genere un PDF real.',
    checkboxLabel: 'He leido y entiendo el consentimiento anterior',
    submit: 'FIRMAR Y ENVIAR',
    submitting: 'GENERANDO PDF',
    signatureRequired: 'Por favor proporcione su firma arriba',
    checkboxRequired: 'Debe reconocer el consentimiento antes de firmar',
    yourSignature: 'SU FIRMA',
    clear: 'Borrar',
    consentFor: 'Consentimiento para',
    requestedBy: 'Solicitado por',
    pdfReady: 'Su PDF de consentimiento esta listo',
    pdfReadySub: 'Este es un PDF de consentimiento FMCSA real generado con su firma — el mismo documento que recibe un transportista.',
    download: 'Descargar PDF',
    tryAgain: 'Intentar de Nuevo',
    poweredBy: 'Desarrollado por',
    demoLabel: 'DEMO INTERACTIVA',
  },
} as const;

// Demo data
const DEMO_DRIVER = 'Carlos Mendez';
const DEMO_ORG = 'Acme Freight LLC';
const DEMO_START_DATE = new Date().toISOString().split('T')[0];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SigningDemo() {
  const [demoState, setDemoState] = useState<DemoState>('idle');
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [acknowledged, setAcknowledged] = useState(false);
  const [signatureData, setSignatureData] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submittingRef = useRef(false);

  const t = labels[language];

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------

  const resetDemo = useCallback(() => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setDemoState('idle');
    setAcknowledged(false);
    setSignatureData('');
    setValidationError(null);
    setPdfUrl(null);
    setSubmitError(null);
    submittingRef.current = false;
  }, [pdfUrl]);

  // ---------------------------------------------------------------------------
  // Submit handler
  // ---------------------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return;

    if (!acknowledged) {
      setValidationError(t.checkboxRequired);
      return;
    }
    if (!signatureData) {
      setValidationError(t.signatureRequired);
      return;
    }

    setValidationError(null);
    setSubmitError(null);
    submittingRef.current = true;
    setDemoState('generating');

    try {
      const res = await fetch('/api/demo-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature_data: signatureData,
          language,
        }),
      });

      if (!res.ok) {
        throw new Error('PDF generation failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setDemoState('complete');
    } catch {
      setSubmitError('Failed to generate PDF. Please try again.');
      setDemoState('signing');
      submittingRef.current = false;
    }
  }, [acknowledged, signatureData, language, t]);

  // ---------------------------------------------------------------------------
  // Render: Idle (CTA button)
  // ---------------------------------------------------------------------------

  if (demoState === 'idle') {
    return (
      <div className="text-center">
        <button
          type="button"
          onClick={() => setDemoState('signing')}
          className="group relative inline-flex items-center gap-3 bg-[#C8A75E] text-[#0c0f14] font-bold text-sm uppercase tracking-wider px-10 py-5 transition-all hover:bg-[#d4b56a] active:bg-[#b89648]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          {t.cta}
          <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
        <p className="mt-4 text-sm text-[#8b919a] max-w-md mx-auto">
          {t.ctaSub}
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Complete (PDF preview + download)
  // ---------------------------------------------------------------------------

  if (demoState === 'complete' && pdfUrl) {
    return (
      <div className="flex justify-center">
        <div>
          <IPhoneFrame screenBg="#f8f8f6" statusBarVariant="light">
            <div className="flex flex-col items-center justify-center px-4 py-8">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <svg className="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-[#0c0f14] tracking-tight text-center" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
                {t.pdfReady}
              </h3>
              <p className="mt-1 text-[10px] text-[#6b6f76] text-center leading-relaxed px-2">
                {t.pdfReadySub}
              </p>

              <div className="w-full mt-4 border border-[#e8e8e3] bg-white">
                <iframe
                  src={pdfUrl}
                  className="w-full h-[280px]"
                  title="Generated Consent PDF"
                />
              </div>

              <div className="flex flex-col gap-2 w-full mt-4">
                <a
                  href={pdfUrl}
                  download="demo-consent.pdf"
                  className="inline-flex items-center justify-center gap-1.5 bg-[#0c0f14] text-white font-bold text-[10px] uppercase tracking-wider px-4 py-2.5 transition-all hover:bg-[#1a1e27]"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  {t.download}
                </a>
                <button
                  type="button"
                  onClick={resetDemo}
                  className="inline-flex items-center justify-center gap-1.5 border border-[#d4d4cf] text-[#3a3f49] font-bold text-[10px] uppercase tracking-wider px-4 py-2.5 transition-all hover:bg-[#f0f0ed]"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 4v6h6M23 20v-6h-6" />
                    <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                  </svg>
                  {t.tryAgain}
                </button>
              </div>
            </div>
          </IPhoneFrame>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Generating (loading state)
  // ---------------------------------------------------------------------------

  if (demoState === 'generating') {
    return (
      <div className="flex justify-center">
        <div>
          <IPhoneFrame screenBg="#f8f8f6" statusBarVariant="light">
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="flex items-center gap-1 mb-3">
                <div className="w-1.5 h-6 bg-[#C8A75E] animate-pulse" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-6 bg-[#0c0f14] animate-pulse" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-6 bg-[#C8A75E] animate-pulse" style={{ animationDelay: '300ms' }} />
                <div className="w-1.5 h-6 bg-[#0c0f14] animate-pulse" style={{ animationDelay: '450ms' }} />
              </div>
              <p className="text-[10px] uppercase tracking-widest text-[#8b919a] font-semibold">
                {t.submitting}...
              </p>
            </div>
          </IPhoneFrame>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Signing form inside phone frame
  // ---------------------------------------------------------------------------

  return (
    <div className="flex justify-center">
      <div>
        <IPhoneFrame screenBg="#f8f8f6" statusBarVariant="light">
          {/* Top bar */}
          <div className="bg-[#0c0f14]">
            <div className="flex items-center justify-between px-3 py-2">
              <LogoFull mode="dark" className="h-4 w-auto" />
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[7px] font-bold text-[#C8A75E] uppercase tracking-widest border border-[#C8A75E]/30 px-1.5 py-0.5">
                  {t.demoLabel}
                </span>
                <LanguageToggle language={language} onChange={setLanguage} />
              </div>
            </div>
          </div>

          {/* Main form content */}
          <div className="bg-[#f8f8f6]">
            <div className="px-3 py-3">
              {/* Driver identity block */}
              <div className="bg-white border border-[#e8e8e3] p-3 mb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[8px] text-[#8b919a] uppercase tracking-widest font-semibold mb-0.5">{t.consentFor}</p>
                    <p className="text-sm font-bold text-[#0c0f14] tracking-tight" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
                      {DEMO_DRIVER}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[8px] text-[#8b919a] uppercase tracking-widest font-semibold mb-0.5">{t.requestedBy}</p>
                    <p className="text-[10px] font-semibold text-[#0c0f14]">{DEMO_ORG}</p>
                  </div>
                </div>
                <div className="mt-2 h-0.5 bg-[#C8A75E]" />
              </div>

              {/* Consent document */}
              <div className="bg-white border border-[#e8e8e3] mb-3 text-[9px]">
                <ConsentDocument
                  driverName={DEMO_DRIVER}
                  companyName={DEMO_ORG}
                  consentType="limited_query"
                  startDate={DEMO_START_DATE}
                  endDate={null}
                  frequency="annual"
                  language={language}
                />
              </div>

              {/* Acknowledgment */}
              <div className="mb-3">
                <label className="flex items-start gap-2 cursor-pointer bg-white border border-[#e8e8e3] p-2.5 transition-colors hover:bg-[#fafaf8] select-none">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => {
                      setAcknowledged(e.target.checked);
                      if (validationError) setValidationError(null);
                    }}
                    className="mt-0.5 h-4 w-4 border-[#d4d4cf] text-[#0c0f14] focus:ring-[#0c0f14] focus:ring-offset-0 shrink-0 accent-[#0c0f14]"
                  />
                  <span className="text-[10px] leading-relaxed text-[#3a3f49]">
                    {t.checkboxLabel}
                  </span>
                </label>
              </div>

              {/* Signature pad */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-[8px] font-bold text-[#3a3f49] uppercase tracking-widest">
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
                    height={120}
                    clearLabel={t.clear}
                  />
                </div>
              </div>

              {/* Validation error */}
              {validationError && (
                <div className="mb-3 border-l-[3px] border-red-500 bg-red-50/60 px-3 py-2">
                  <p className="text-[10px] text-red-700 font-medium">{validationError}</p>
                </div>
              )}

              {/* Submit error */}
              {submitError && (
                <div className="mb-3 border-l-[3px] border-red-500 bg-red-50/60 px-3 py-2">
                  <p className="text-[10px] text-red-700 font-medium">{submitError}</p>
                </div>
              )}

              {/* Submit button */}
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full bg-[#0c0f14] text-white font-bold text-[11px] uppercase tracking-wider py-3 transition-all hover:bg-[#1a1e27] active:bg-[#000] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
                {t.submit}
              </button>

              {/* Footer */}
              <div className="mt-4 pb-1 flex items-center justify-center gap-1.5">
                <div className="w-3 h-0.5 bg-[#C8A75E]" />
                <p className="text-[8px] text-[#b5b5ae] uppercase tracking-wider">
                  {t.poweredBy} ConsentHaul
                </p>
                <div className="w-3 h-0.5 bg-[#C8A75E]" />
              </div>
            </div>
          </div>
        </IPhoneFrame>
      </div>
    </div>
  );
}
