import type { ConsentStatus } from '@/types/database';

// ---------------------------------------------------------------------------
// Credit & billing
// ---------------------------------------------------------------------------

/** Number of credits consumed per consent request */
export const CREDIT_COST_PER_CONSENT = 1;

/** Bonus credits granted to every new organization on sign-up */
export const SIGNUP_BONUS_CREDITS = 3;

// ---------------------------------------------------------------------------
// Signing tokens
// ---------------------------------------------------------------------------

/** Default time-to-live for signing tokens (7 days) */
export const SIGNING_TOKEN_DEFAULT_TTL_HOURS = 168;

// ---------------------------------------------------------------------------
// Retention & compliance
// ---------------------------------------------------------------------------

/** FMCSA-required minimum retention period for consent records */
export const RETENTION_YEARS = 3;

// ---------------------------------------------------------------------------
// Localisation
// ---------------------------------------------------------------------------

export const SUPPORTED_LANGUAGES = ['en', 'es'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// ---------------------------------------------------------------------------
// Consent statuses (mirrors the ConsentStatus enum in database.ts)
// ---------------------------------------------------------------------------

export const CONSENT_STATUSES: ConsentStatus[] = [
  'pending',
  'sent',
  'delivered',
  'opened',
  'signed',
  'expired',
  'revoked',
  'failed',
];

// ---------------------------------------------------------------------------
// CSV import
// ---------------------------------------------------------------------------

/** Maximum rows allowed in a single CSV driver import */
export const MAX_CSV_ROWS = 5000;

// ---------------------------------------------------------------------------
// API rate limiting
// ---------------------------------------------------------------------------

/** Maximum API requests allowed per minute per key */
export const API_RATE_LIMIT = 100;

// ---------------------------------------------------------------------------
// FMCSA-compliant consent text
// ---------------------------------------------------------------------------

interface ConsentTextBlock {
  /** Title displayed at the top of the consent form */
  title: string;
  /**
   * Full body text of the consent.
   *
   * Must contain the FMCSA-required language per 49 CFR Part 40 / 382 and
   * the FMCSA Drug & Alcohol Clearinghouse final rule.
   */
  body: (
    driverName: string,
    companyName: string,
    startDate: string,
    endDate: string,
    frequency: string,
  ) => string;
  /** Short acknowledgment statement the driver checks / signs */
  acknowledgment: string;
}

export const CONSENT_TEXT_EN: ConsentTextBlock = {
  title: 'FMCSA Drug & Alcohol Clearinghouse Consent',
  body: (
    driverName: string,
    companyName: string,
    startDate: string,
    endDate: string,
    frequency: string,
  ) =>
    `I, ${driverName}, hereby provide my consent to ${companyName} to conduct ` +
    `a query of the Federal Motor Carrier Safety Administration (FMCSA) ` +
    `Commercial Driver's License Drug and Alcohol Clearinghouse ` +
    `(the "Clearinghouse") to obtain information about me pertaining to ` +
    `drug and alcohol violations, as defined in 49 CFR Part 40, in ` +
    `accordance with the requirements of 49 CFR 382.701(a) and 382.702.\n\n` +
    `This consent authorizes ${companyName} to query the Clearinghouse on a ` +
    `${frequency} basis beginning on ${startDate}` +
    `${endDate ? ` and ending on ${endDate}` : ''}.\n\n` +
    `I understand that:\n\n` +
    `1. The information obtained from the Clearinghouse may include records ` +
    `of drug and alcohol program violations, including positive drug tests, ` +
    `refusals to test, alcohol confirmation tests at or above 0.04, and ` +
    `other violations of 49 CFR Part 40.\n\n` +
    `2. ${companyName} will use the information received from the ` +
    `Clearinghouse only for the purposes permitted by the FMCSA ` +
    `Clearinghouse regulations.\n\n` +
    `3. I may revoke this consent at any time by providing written notice ` +
    `to ${companyName}. Revocation of consent will not affect queries ` +
    `already conducted under this authorization.\n\n` +
    `4. The FMCSA Clearinghouse retains records for five (5) years from the ` +
    `date of the violation determination, or until the violation is resolved ` +
    `through the return-to-duty process, whichever is later.`,
  acknowledgment:
    'I acknowledge that I have read and understand the above consent, and I ' +
    'voluntarily agree to allow the query of my records in the FMCSA Drug & ' +
    'Alcohol Clearinghouse as described herein.',
};

export const CONSENT_TEXT_ES: ConsentTextBlock = {
  title: 'Consentimiento del FMCSA Drug & Alcohol Clearinghouse',
  body: (
    driverName: string,
    companyName: string,
    startDate: string,
    endDate: string,
    frequency: string,
  ) =>
    `Yo, ${driverName}, por la presente otorgo mi consentimiento a ` +
    `${companyName} para realizar una consulta en el Clearinghouse de ` +
    `Drogas y Alcohol de Licencias de Conducir Comerciales de la ` +
    `Administracion Federal de Seguridad de Autotransportes (FMCSA) ` +
    `(el "Clearinghouse") para obtener informacion sobre mi persona ` +
    `relacionada con violaciones de drogas y alcohol, segun se define en ` +
    `49 CFR Parte 40, de conformidad con los requisitos de ` +
    `49 CFR 382.701(a) y 382.702.\n\n` +
    `Este consentimiento autoriza a ${companyName} a consultar el ` +
    `Clearinghouse de forma ${frequency} a partir del ${startDate}` +
    `${endDate ? ` y hasta el ${endDate}` : ''}.\n\n` +
    `Entiendo que:\n\n` +
    `1. La informacion obtenida del Clearinghouse puede incluir registros ` +
    `de violaciones del programa de drogas y alcohol, incluyendo pruebas ` +
    `de drogas positivas, negativas a someterse a pruebas, pruebas de ` +
    `confirmacion de alcohol en o por encima de 0.04, y otras violaciones ` +
    `del 49 CFR Parte 40.\n\n` +
    `2. ${companyName} utilizara la informacion recibida del Clearinghouse ` +
    `unicamente para los fines permitidos por las regulaciones del ` +
    `Clearinghouse de la FMCSA.\n\n` +
    `3. Puedo revocar este consentimiento en cualquier momento mediante ` +
    `notificacion escrita a ${companyName}. La revocacion del ` +
    `consentimiento no afectara las consultas ya realizadas bajo esta ` +
    `autorizacion.\n\n` +
    `4. El Clearinghouse de la FMCSA conserva los registros durante cinco ` +
    `(5) anos a partir de la fecha de la determinacion de la violacion, ` +
    `o hasta que la violacion se resuelva a traves del proceso de regreso ` +
    `al servicio, lo que ocurra mas tarde.`,
  acknowledgment:
    'Reconozco que he leido y entiendo el consentimiento anterior, y acepto ' +
    'voluntariamente permitir la consulta de mis registros en el FMCSA Drug & ' +
    'Alcohol Clearinghouse como se describe en este documento.',
};
