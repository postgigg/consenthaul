import { CONSENT_TEXT_EN, CONSENT_TEXT_ES, PRE_EMPLOYMENT_NOTE_EN, PRE_EMPLOYMENT_NOTE_ES } from '@/lib/constants';
import type { ConsentType } from '@/types/database';

interface ConsentDocumentProps {
  driverName: string;
  companyName: string;
  consentType: ConsentType;
  startDate: string;
  endDate?: string | null;
  frequency: string;
  language: 'en' | 'es';
}

const consentTypeLabels: Record<ConsentType, { en: string; es: string }> = {
  limited_query: { en: 'Limited Query', es: 'Consulta Limitada' },
  pre_employment: { en: 'Pre-Employment Limited Query', es: 'Consulta Limitada Pre-Empleo' },
  blanket: { en: 'General Consent for Limited Queries (Duration of Employment)', es: 'Consentimiento General para Consultas Limitadas (Duracion del Empleo)' },
};

/**
 * Renders the FMCSA consent text for reading before signing.
 *
 * This component can be used as either a server component or a client component.
 * It renders static text with no interactivity.
 */
export function ConsentDocument({
  driverName,
  companyName,
  consentType,
  startDate,
  endDate,
  frequency,
  language,
}: ConsentDocumentProps) {
  const text = language === 'es' ? CONSENT_TEXT_ES : CONSENT_TEXT_EN;
  const typeLabel = consentTypeLabels[consentType]?.[language] ?? consentType;

  let bodyText = text.body(
    driverName,
    companyName,
    startDate,
    endDate ?? '',
    frequency,
  );

  if (consentType === 'pre_employment') {
    const note = language === 'es' ? PRE_EMPLOYMENT_NOTE_ES : PRE_EMPLOYMENT_NOTE_EN;
    bodyText += '\n\n' + note;
  }

  // Split the body text into paragraphs on double newlines
  const paragraphs = bodyText.split('\n\n');

  return (
    <article
      className="max-w-3xl mx-auto"
      lang={language}
      aria-label={language === 'es' ? 'Documento de consentimiento' : 'Consent document'}
    >
      {/* Header */}
      <header className="mb-8 text-center border-b border-gray-200 pb-6">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
          {text.title}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {language === 'es' ? 'Tipo de consentimiento' : 'Consent Type'}: {typeLabel}
        </p>
      </header>

      {/* Body text */}
      <div className="space-y-4 text-base leading-relaxed text-gray-800">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="text-sm sm:text-base">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Acknowledgment */}
      <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-blue-900 mb-2">
          {language === 'es' ? 'Reconocimiento' : 'Acknowledgment'}
        </h2>
        <p className="text-sm leading-relaxed text-blue-800">
          {text.acknowledgment}
        </p>
      </div>

      {/* Consent details summary */}
      <div className="mt-6 grid grid-cols-2 gap-4 text-sm border-t border-gray-200 pt-6">
        <div>
          <span className="font-medium text-gray-500 block">
            {language === 'es' ? 'Conductor' : 'Driver'}
          </span>
          <span className="text-gray-900">{driverName}</span>
        </div>
        <div>
          <span className="font-medium text-gray-500 block">
            {language === 'es' ? 'Empresa' : 'Company'}
          </span>
          <span className="text-gray-900">{companyName}</span>
        </div>
        <div>
          <span className="font-medium text-gray-500 block">
            {language === 'es' ? 'Fecha de inicio' : 'Start Date'}
          </span>
          <span className="text-gray-900">{startDate}</span>
        </div>
        <div>
          <span className="font-medium text-gray-500 block">
            {language === 'es' ? 'Fecha de fin' : 'End Date'}
          </span>
          <span className="text-gray-900">
            {endDate || (language === 'es' ? 'Duracion del empleo' : 'Duration of Employment')}
          </span>
        </div>
      </div>
    </article>
  );
}
