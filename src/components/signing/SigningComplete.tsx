'use client';

import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { formatDate } from '@/lib/utils';
import { CheckCircle2, Download, ShieldX } from 'lucide-react';

interface SigningCompleteProps {
  /** ISO date string when the consent was signed. */
  signedAt: string;
  /** Display language. */
  language?: 'en' | 'es';
  /** URL to download the signed PDF, if available. */
  pdfDownloadUrl?: string | null;
  /** Signing token used for revocation link. */
  revokeToken?: string;
}

const content = {
  en: {
    title: 'Your consent has been recorded',
    subtitle: 'Thank you for completing the FMCSA Clearinghouse consent process.',
    signedOn: 'Signed on',
    close: 'You can safely close this page.',
    downloadPdf: 'Download Signed Consent (PDF)',
    downloadAvailable: 'A copy of your signed consent is available for download below. This link expires in 30 days.',
    withdrawConsent: 'Need to withdraw your consent to electronic transactions?',
    withdrawLink: 'Withdraw consent',
  },
  es: {
    title: 'Su consentimiento ha sido registrado',
    subtitle: 'Gracias por completar el proceso de consentimiento del FMCSA Clearinghouse.',
    signedOn: 'Firmado el',
    close: 'Puede cerrar esta pagina de forma segura.',
    downloadPdf: 'Descargar Consentimiento Firmado (PDF)',
    downloadAvailable: 'Una copia de su consentimiento firmado esta disponible para descargar a continuacion. Este enlace expira en 30 dias.',
    withdrawConsent: 'Necesita retirar su consentimiento para transacciones electronicas?',
    withdrawLink: 'Retirar consentimiento',
  },
};

export function SigningComplete({
  signedAt,
  language = 'en',
  pdfDownloadUrl,
  revokeToken,
}: SigningCompleteProps) {
  const [visible, setVisible] = useState(false);
  const t = content[language] ?? content.en;

  // Animate in on mount + confetti burst
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="flex min-h-[60vh] items-center justify-center px-4"
      lang={language}
    >
      <div
        className={`max-w-md w-full text-center transition-all duration-700 ease-out ${
          visible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-4 opacity-0'
        }`}
      >
        {/* Animated checkmark */}
        <div
          className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 transition-all duration-500 ease-out ${
            visible ? 'scale-100' : 'scale-50'
          }`}
        >
          <CheckCircle2
            className={`h-10 w-10 text-green-600 transition-all duration-700 delay-200 ease-out ${
              visible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            }`}
            strokeWidth={2}
          />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {t.title}
        </h1>

        {/* Subtitle */}
        <p className="mt-3 text-gray-600">
          {t.subtitle}
        </p>

        {/* Signed date */}
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          {t.signedOn} {formatDate(signedAt)}
        </div>

        {/* PDF Download */}
        {pdfDownloadUrl && (
          <div className="mt-6">
            <p className="text-sm text-gray-500 mb-3">{t.downloadAvailable}</p>
            <a
              href={pdfDownloadUrl}
              download
              className="inline-flex items-center gap-2 bg-[#0c0f14] text-white font-semibold text-sm uppercase tracking-wider px-6 py-3 hover:bg-[#1a1e27] transition-colors"
            >
              <Download className="h-4 w-4" />
              {t.downloadPdf}
            </a>
          </div>
        )}

        {/* Withdrawal link */}
        {revokeToken && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-400 mb-1">{t.withdrawConsent}</p>
            <a
              href={`/revoke/${revokeToken}`}
              className="inline-flex items-center gap-1.5 text-xs text-[#C8A75E] hover:text-[#b08f3e] font-medium transition-colors"
            >
              <ShieldX className="h-3.5 w-3.5" />
              {t.withdrawLink}
            </a>
          </div>
        )}

        {/* Close instruction */}
        <p className="mt-8 text-sm text-gray-400">
          {t.close}
        </p>
      </div>
    </div>
  );
}
