'use client';

import { useEffect, useState } from 'react';
import { formatDate } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface SigningCompleteProps {
  /** ISO date string when the consent was signed. */
  signedAt: string;
  /** Display language. */
  language?: 'en' | 'es';
}

const content = {
  en: {
    title: 'Your consent has been recorded',
    subtitle: 'Thank you for completing the FMCSA Clearinghouse consent process.',
    signedOn: 'Signed on',
    close: 'You can safely close this page.',
  },
  es: {
    title: 'Su consentimiento ha sido registrado',
    subtitle: 'Gracias por completar el proceso de consentimiento del FMCSA Clearinghouse.',
    signedOn: 'Firmado el',
    close: 'Puede cerrar esta pagina de forma segura.',
  },
};

export function SigningComplete({ signedAt, language = 'en' }: SigningCompleteProps) {
  const [visible, setVisible] = useState(false);
  const t = content[language] ?? content.en;

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
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

        {/* Close instruction */}
        <p className="mt-8 text-sm text-gray-400">
          {t.close}
        </p>
      </div>
    </div>
  );
}
