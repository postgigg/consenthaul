import type { ConsentStatus } from '@/types/database';

// ---------------------------------------------------------------------------
// Credit & billing
// ---------------------------------------------------------------------------

/** Number of credits consumed per consent request */
export const CREDIT_COST_PER_CONSENT = 1;

/** Bonus credits granted to every new organization on sign-up */
export const SIGNUP_BONUS_CREDITS = 3;

// ---------------------------------------------------------------------------
// Automated reminders
// ---------------------------------------------------------------------------

/** How many days between automatic consent reminders */
export const REMINDER_INTERVAL_DAYS = 2;

/** Credits deducted per reminder sent */
export const CREDIT_COST_PER_REMINDER = 1;

/** Max consents to process per cron invocation */
export const REMINDER_BATCH_SIZE = 50;

/** Max re-consent requests to create per cron invocation */
export const RECONSENT_BATCH_SIZE = 50;

/** Consent statuses eligible for automated reminders */
export const REMINDER_ELIGIBLE_STATUSES: ConsentStatus[] = ['pending', 'sent', 'delivered', 'opened'];

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

/** Maximum rows allowed in a single free CSV driver import */
export const MAX_CSV_ROWS = 50;

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

// ---------------------------------------------------------------------------
// E-Sign Act / UETA Disclosures (15 U.S.C. § 7001(c))
// ---------------------------------------------------------------------------

interface ESignDisclosure {
  title: string;
  disclosures: {
    heading: string;
    body: string;
  }[];
}

export const ESIGN_DISCLOSURE_EN: ESignDisclosure = {
  title: 'Electronic Transaction Disclosure',
  disclosures: [
    {
      heading: 'Right to Paper Records',
      body: 'You have the right to receive this consent document and all related records on paper. You may request a paper copy at any time at no charge by contacting your employer.',
    },
    {
      heading: 'Right to Withdraw Consent to Electronic Transactions',
      body: 'You may withdraw your consent to conduct this transaction electronically at any time. To withdraw, use the withdrawal link provided on your confirmation page or in your receipt email. Withdrawal of your consent to electronic transactions does not revoke any consent already signed.',
    },
    {
      heading: 'Scope of Consent',
      body: 'Your consent to transact electronically applies only to this specific FMCSA Drug & Alcohol Clearinghouse consent transaction. It does not apply to any other transactions or future transactions.',
    },
    {
      heading: 'How to Update Your Contact Information',
      body: 'If your email address or other contact information changes, please notify your employer directly so they can update your records and ensure you continue to receive important documents.',
    },
    {
      heading: 'Paper Copy Request Process',
      body: 'You may request a paper copy of your signed consent document at any time by contacting your employer. There is no fee for requesting a paper copy. Your employer will provide the paper copy within a reasonable time.',
    },
    {
      heading: 'Hardware and Software Requirements',
      body: 'To complete this electronic transaction, you need: a modern web browser (Chrome, Safari, Firefox, or Edge), an internet connection, and the ability to view and save PDF documents. Your device must be able to display the consent form and capture your electronic signature.',
    },
    {
      heading: 'Consequences of Withdrawal',
      body: 'If you withdraw your consent to electronic transactions, your employer will be required to provide you with the consent form on paper. This may delay the consent process. You will still be required to provide consent for FMCSA Clearinghouse queries as mandated by federal law.',
    },
  ],
};

export const ESIGN_DISCLOSURE_ES: ESignDisclosure = {
  title: 'Divulgación de Transacción Electrónica',
  disclosures: [
    {
      heading: 'Derecho a Registros en Papel',
      body: 'Usted tiene derecho a recibir este documento de consentimiento y todos los registros relacionados en papel. Puede solicitar una copia en papel en cualquier momento sin cargo comunicándose con su empleador.',
    },
    {
      heading: 'Derecho a Retirar el Consentimiento para Transacciones Electrónicas',
      body: 'Puede retirar su consentimiento para realizar esta transacción electrónicamente en cualquier momento. Para retirarlo, use el enlace de retiro proporcionado en su página de confirmación o en su correo de recibo. El retiro de su consentimiento para transacciones electrónicas no revoca ningún consentimiento ya firmado.',
    },
    {
      heading: 'Alcance del Consentimiento',
      body: 'Su consentimiento para realizar transacciones electrónicamente se aplica únicamente a esta transacción específica de consentimiento del FMCSA Drug & Alcohol Clearinghouse. No se aplica a otras transacciones ni a transacciones futuras.',
    },
    {
      heading: 'Cómo Actualizar Su Información de Contacto',
      body: 'Si su dirección de correo electrónico u otra información de contacto cambia, notifique directamente a su empleador para que pueda actualizar sus registros y asegurar que continúe recibiendo documentos importantes.',
    },
    {
      heading: 'Proceso de Solicitud de Copia en Papel',
      body: 'Puede solicitar una copia en papel de su documento de consentimiento firmado en cualquier momento comunicándose con su empleador. No hay cargo por solicitar una copia en papel. Su empleador proporcionará la copia en papel dentro de un tiempo razonable.',
    },
    {
      heading: 'Requisitos de Hardware y Software',
      body: 'Para completar esta transacción electrónica, necesita: un navegador web moderno (Chrome, Safari, Firefox o Edge), una conexión a internet y la capacidad de ver y guardar documentos PDF. Su dispositivo debe poder mostrar el formulario de consentimiento y capturar su firma electrónica.',
    },
    {
      heading: 'Consecuencias del Retiro',
      body: 'Si retira su consentimiento para transacciones electrónicas, su empleador deberá proporcionarle el formulario de consentimiento en papel. Esto puede retrasar el proceso de consentimiento. Aún se le requerirá proporcionar consentimiento para consultas del FMCSA Clearinghouse según lo exige la ley federal.',
    },
  ],
};

export const CONSENT_TEXT_EN: ConsentTextBlock = {
  title: 'FMCSA Drug & Alcohol Clearinghouse — Limited Query Consent',
  body: (
    driverName: string,
    companyName: string,
    startDate: string,
    endDate: string,
    frequency: string,
  ) =>
    `I, ${driverName}, hereby provide my written consent to ${companyName} ` +
    `to conduct limited queries of the Federal Motor Carrier Safety ` +
    `Administration (FMCSA) Commercial Driver's License Drug and Alcohol ` +
    `Clearinghouse (the "Clearinghouse") to determine whether drug or ` +
    `alcohol violation information about me exists in the Clearinghouse, ` +
    `in accordance with 49 CFR 382.701(b) and 49 CFR 382.703(a).\n\n` +
    `A limited query allows ${companyName} to learn whether a record exists ` +
    `in the Clearinghouse for me. A limited query does not release the ` +
    `details of any such record to ${companyName}.\n\n` +
    `This consent authorizes ${companyName} to conduct limited queries of ` +
    `the Clearinghouse on a ${frequency} basis beginning on ${startDate}` +
    `${endDate ? ` and ending on ${endDate}` : `, and continuing for the duration of my employment with ${companyName}`}.\n\n` +
    `I understand that:\n\n` +
    `1. This consent applies to limited queries only. If a limited query ` +
    `indicates that a record exists in the Clearinghouse about me, ` +
    `${companyName} will be required to conduct a full query within 24 hours ` +
    `per 49 CFR 382.701(b)(3). A full query requires my separate, specific ` +
    `electronic consent provided directly through the FMCSA Clearinghouse ` +
    `portal per 49 CFR 382.703(b).\n\n` +
    `2. The information obtained from the Clearinghouse may pertain to ` +
    `records of drug and alcohol program violations as defined in ` +
    `49 CFR Part 40, including positive drug tests, refusals to test, ` +
    `alcohol confirmation tests at or above 0.04, and other violations.\n\n` +
    `3. ${companyName} will use the information received from the ` +
    `Clearinghouse only for the purposes permitted by the FMCSA ` +
    `Clearinghouse regulations (49 CFR Part 382, Subpart G).\n\n` +
    `4. I may revoke this consent at any time by providing written notice ` +
    `to ${companyName}. Revocation of consent will not affect queries ` +
    `already conducted under this authorization.\n\n` +
    `5. The FMCSA Clearinghouse retains records for five (5) years from the ` +
    `date of the violation determination, or until the violation is resolved ` +
    `through the return-to-duty process, whichever is later.`,
  acknowledgment:
    'I acknowledge that I have read and understand the above consent, and I ' +
    'voluntarily agree to allow limited queries of my records in the FMCSA ' +
    'Drug & Alcohol Clearinghouse as described herein.',
};

export const CONSENT_TEXT_ES: ConsentTextBlock = {
  title: 'FMCSA Drug & Alcohol Clearinghouse — Consentimiento para Consulta Limitada',
  body: (
    driverName: string,
    companyName: string,
    startDate: string,
    endDate: string,
    frequency: string,
  ) =>
    `Yo, ${driverName}, por la presente otorgo mi consentimiento escrito a ` +
    `${companyName} para realizar consultas limitadas en el Clearinghouse de ` +
    `Drogas y Alcohol de Licencias de Conducir Comerciales de la ` +
    `Administracion Federal de Seguridad de Autotransportes (FMCSA) ` +
    `(el "Clearinghouse") para determinar si existe informacion sobre ` +
    `violaciones de drogas o alcohol sobre mi persona en el Clearinghouse, ` +
    `de conformidad con 49 CFR 382.701(b) y 49 CFR 382.703(a).\n\n` +
    `Una consulta limitada permite a ${companyName} saber si existe un ` +
    `registro en el Clearinghouse sobre mi persona. Una consulta limitada ` +
    `no divulga los detalles de dicho registro a ${companyName}.\n\n` +
    `Este consentimiento autoriza a ${companyName} a realizar consultas ` +
    `limitadas en el Clearinghouse de forma ${frequency} a partir del ` +
    `${startDate}${endDate ? ` y hasta el ${endDate}` : `, y continuando durante la duracion de mi empleo con ${companyName}`}.\n\n` +
    `Entiendo que:\n\n` +
    `1. Este consentimiento aplica unicamente a consultas limitadas. Si una ` +
    `consulta limitada indica que existe un registro en el Clearinghouse ` +
    `sobre mi persona, ${companyName} estara obligado a realizar una ` +
    `consulta completa dentro de 24 horas segun 49 CFR 382.701(b)(3). ` +
    `Una consulta completa requiere mi consentimiento electronico separado ` +
    `y especifico proporcionado directamente a traves del portal del ` +
    `Clearinghouse de la FMCSA segun 49 CFR 382.703(b).\n\n` +
    `2. La informacion obtenida del Clearinghouse puede estar relacionada ` +
    `con registros de violaciones del programa de drogas y alcohol segun ` +
    `se define en 49 CFR Parte 40, incluyendo pruebas de drogas positivas, ` +
    `negativas a someterse a pruebas, pruebas de confirmacion de alcohol ` +
    `en o por encima de 0.04, y otras violaciones.\n\n` +
    `3. ${companyName} utilizara la informacion recibida del Clearinghouse ` +
    `unicamente para los fines permitidos por las regulaciones del ` +
    `Clearinghouse de la FMCSA (49 CFR Parte 382, Subparte G).\n\n` +
    `4. Puedo revocar este consentimiento en cualquier momento mediante ` +
    `notificacion escrita a ${companyName}. La revocacion del ` +
    `consentimiento no afectara las consultas ya realizadas bajo esta ` +
    `autorizacion.\n\n` +
    `5. El Clearinghouse de la FMCSA conserva los registros durante cinco ` +
    `(5) anos a partir de la fecha de la determinacion de la violacion, ` +
    `o hasta que la violacion se resuelva a traves del proceso de regreso ` +
    `al servicio, lo que ocurra mas tarde.`,
  acknowledgment:
    'Reconozco que he leido y entiendo el consentimiento anterior, y acepto ' +
    'voluntariamente permitir las consultas limitadas de mis registros en el ' +
    'FMCSA Drug & Alcohol Clearinghouse como se describe en este documento.',
};

// ---------------------------------------------------------------------------
// Pre-employment notice (appended when consent_type === 'pre_employment')
// ---------------------------------------------------------------------------

export const PRE_EMPLOYMENT_NOTE_EN =
  'IMPORTANT — PRE-EMPLOYMENT NOTICE: This consent authorizes a limited query only. ' +
  'Per 49 CFR 382.701(a), employers are also required to conduct a full query of the ' +
  'FMCSA Clearinghouse as part of the pre-employment process. A full query requires ' +
  'your separate, specific electronic consent provided directly through the FMCSA ' +
  'Clearinghouse portal (https://clearinghouse.fmcsa.dot.gov). This limited-query ' +
  'consent does not substitute for that requirement.';

export const PRE_EMPLOYMENT_NOTE_ES =
  'IMPORTANTE — AVISO DE PRE-EMPLEO: Este consentimiento autoriza unicamente una ' +
  'consulta limitada. Segun 49 CFR 382.701(a), los empleadores tambien estan obligados ' +
  'a realizar una consulta completa del Clearinghouse de la FMCSA como parte del proceso ' +
  'de pre-empleo. Una consulta completa requiere su consentimiento electronico separado ' +
  'y especifico proporcionado directamente a traves del portal del Clearinghouse de la ' +
  'FMCSA (https://clearinghouse.fmcsa.dot.gov). Este consentimiento de consulta limitada ' +
  'no sustituye ese requisito.';

// ---------------------------------------------------------------------------
// Blanket / Full-query consent text (49 CFR 382.701(a))
// ---------------------------------------------------------------------------

export const BLANKET_CONSENT_TEXT_EN: ConsentTextBlock = {
  title: 'FMCSA Drug & Alcohol Clearinghouse — Full Query (Blanket) Consent',
  body: (
    driverName: string,
    companyName: string,
    startDate: string,
    endDate: string,
    frequency: string,
  ) =>
    `I, ${driverName}, hereby provide my written consent to ${companyName} ` +
    `to conduct full queries of the Federal Motor Carrier Safety ` +
    `Administration (FMCSA) Commercial Driver's License Drug and Alcohol ` +
    `Clearinghouse (the "Clearinghouse") to obtain detailed information ` +
    `regarding any drug or alcohol violations associated with me in the ` +
    `Clearinghouse, in accordance with 49 CFR 382.701(a).\n\n` +
    `A full query allows ${companyName} to view the complete details of ` +
    `any violation records in the Clearinghouse associated with me, ` +
    `including the type of violation, the date of the violation ` +
    `determination, and information about the substance-abuse professional ` +
    `(SAP) evaluation and return-to-duty process, if applicable.\n\n` +
    `This consent authorizes ${companyName} to conduct full queries of ` +
    `the Clearinghouse on a ${frequency} basis beginning on ${startDate}` +
    `${endDate ? ` and ending on ${endDate}` : `, and continuing for the duration of my employment with ${companyName}`}.\n\n` +
    `I understand that:\n\n` +
    `1. This consent authorizes full queries as defined by ` +
    `49 CFR 382.701(a). A full query will release the complete details ` +
    `of any drug and alcohol violation records in the Clearinghouse ` +
    `associated with me, not merely whether a record exists.\n\n` +
    `2. The information obtained from the Clearinghouse may include ` +
    `records of drug and alcohol program violations as defined in ` +
    `49 CFR Part 40, including positive drug tests, refusals to test, ` +
    `alcohol confirmation tests at or above 0.04, actual knowledge ` +
    `violations by the employer, and information about any return-to-duty ` +
    `(RTD) process and follow-up testing plan.\n\n` +
    `3. ${companyName} will use the information received from the ` +
    `Clearinghouse only for the purposes permitted by the FMCSA ` +
    `Clearinghouse regulations (49 CFR Part 382, Subpart G).\n\n` +
    `4. I may revoke this consent at any time by providing written notice ` +
    `to ${companyName}. Revocation of consent will not affect queries ` +
    `already conducted under this authorization.\n\n` +
    `5. The FMCSA Clearinghouse retains records for five (5) years from the ` +
    `date of the violation determination, or until the violation is resolved ` +
    `through the return-to-duty process, whichever is later.`,
  acknowledgment:
    'I acknowledge that I have read and understand the above consent, and I ' +
    'voluntarily agree to allow full queries of my records in the FMCSA ' +
    'Drug & Alcohol Clearinghouse as described herein. I understand that a ' +
    'full query will reveal complete violation details, not merely whether a ' +
    'record exists.',
};

export const BLANKET_CONSENT_TEXT_ES: ConsentTextBlock = {
  title: 'FMCSA Drug & Alcohol Clearinghouse — Consentimiento para Consulta Completa (General)',
  body: (
    driverName: string,
    companyName: string,
    startDate: string,
    endDate: string,
    frequency: string,
  ) =>
    `Yo, ${driverName}, por la presente otorgo mi consentimiento escrito a ` +
    `${companyName} para realizar consultas completas en el Clearinghouse de ` +
    `Drogas y Alcohol de Licencias de Conducir Comerciales de la ` +
    `Administracion Federal de Seguridad de Autotransportes (FMCSA) ` +
    `(el "Clearinghouse") para obtener informacion detallada sobre ` +
    `cualquier violacion de drogas o alcohol asociada a mi persona en el ` +
    `Clearinghouse, de conformidad con 49 CFR 382.701(a).\n\n` +
    `Una consulta completa permite a ${companyName} ver los detalles ` +
    `completos de cualquier registro de violacion en el Clearinghouse ` +
    `asociado a mi persona, incluyendo el tipo de violacion, la fecha de ` +
    `la determinacion de la violacion e informacion sobre la evaluacion ` +
    `del profesional de abuso de sustancias (SAP) y el proceso de regreso ` +
    `al servicio, si corresponde.\n\n` +
    `Este consentimiento autoriza a ${companyName} a realizar consultas ` +
    `completas en el Clearinghouse de forma ${frequency} a partir del ` +
    `${startDate}${endDate ? ` y hasta el ${endDate}` : `, y continuando durante la duracion de mi empleo con ${companyName}`}.\n\n` +
    `Entiendo que:\n\n` +
    `1. Este consentimiento autoriza consultas completas segun lo definido ` +
    `por 49 CFR 382.701(a). Una consulta completa divulgara los detalles ` +
    `completos de cualquier registro de violacion de drogas y alcohol en ` +
    `el Clearinghouse asociado a mi persona, no simplemente si existe un ` +
    `registro.\n\n` +
    `2. La informacion obtenida del Clearinghouse puede incluir registros ` +
    `de violaciones del programa de drogas y alcohol segun se define en ` +
    `49 CFR Parte 40, incluyendo pruebas de drogas positivas, negativas ` +
    `a someterse a pruebas, pruebas de confirmacion de alcohol en o por ` +
    `encima de 0.04, violaciones por conocimiento real del empleador e ` +
    `informacion sobre cualquier proceso de regreso al servicio (RTD) y ` +
    `plan de pruebas de seguimiento.\n\n` +
    `3. ${companyName} utilizara la informacion recibida del Clearinghouse ` +
    `unicamente para los fines permitidos por las regulaciones del ` +
    `Clearinghouse de la FMCSA (49 CFR Parte 382, Subparte G).\n\n` +
    `4. Puedo revocar este consentimiento en cualquier momento mediante ` +
    `notificacion escrita a ${companyName}. La revocacion del ` +
    `consentimiento no afectara las consultas ya realizadas bajo esta ` +
    `autorizacion.\n\n` +
    `5. El Clearinghouse de la FMCSA conserva los registros durante cinco ` +
    `(5) anos a partir de la fecha de la determinacion de la violacion, ` +
    `o hasta que la violacion se resuelva a traves del proceso de regreso ` +
    `al servicio, lo que ocurra mas tarde.`,
  acknowledgment:
    'Reconozco que he leido y entiendo el consentimiento anterior, y acepto ' +
    'voluntariamente permitir las consultas completas de mis registros en el ' +
    'FMCSA Drug & Alcohol Clearinghouse como se describe en este documento. ' +
    'Entiendo que una consulta completa revelara los detalles completos de ' +
    'las violaciones, no simplemente si existe un registro.',
};

// ---------------------------------------------------------------------------
// Pre-employment consent text (49 CFR 382.701(a))
// ---------------------------------------------------------------------------

export const PRE_EMPLOYMENT_CONSENT_TEXT_EN: ConsentTextBlock = {
  title: 'FMCSA Drug & Alcohol Clearinghouse — Pre-Employment Query Consent',
  body: (
    driverName: string,
    companyName: string,
    startDate: string,
    endDate: string,
    _frequency: string,
  ) =>
    `I, ${driverName}, hereby provide my written consent to ${companyName} ` +
    `to conduct a pre-employment query of the Federal Motor Carrier Safety ` +
    `Administration (FMCSA) Commercial Driver's License Drug and Alcohol ` +
    `Clearinghouse (the "Clearinghouse") to determine whether drug or ` +
    `alcohol violation information about me exists in the Clearinghouse, ` +
    `in accordance with 49 CFR 382.701(a) and 49 CFR 382.701(b).\n\n` +
    `As part of the pre-employment process, ${companyName} is required by ` +
    `49 CFR 382.701(a) to query the Clearinghouse before permitting me to ` +
    `perform safety-sensitive functions, including operating a commercial ` +
    `motor vehicle (CMV). This consent authorizes ${companyName} to conduct ` +
    `a pre-employment limited query beginning on ${startDate}` +
    `${endDate ? ` and valid through ${endDate}` : ''}.\n\n` +
    `I understand that:\n\n` +
    `1. This consent authorizes a pre-employment limited query of the ` +
    `Clearinghouse. A limited query will reveal only whether a record ` +
    `exists in the Clearinghouse about me, not the details of any such ` +
    `record.\n\n` +
    `2. If a limited query indicates that a record exists in the ` +
    `Clearinghouse about me, ${companyName} will be required to conduct a ` +
    `full query within 24 hours per 49 CFR 382.701(b)(3). A full query ` +
    `requires my separate, specific electronic consent provided directly ` +
    `through the FMCSA Clearinghouse portal per 49 CFR 382.703(b).\n\n` +
    `3. Per 49 CFR 382.701(a), ${companyName} must also conduct a full ` +
    `pre-employment query of the Clearinghouse. A full query requires my ` +
    `separate electronic consent provided through the FMCSA Clearinghouse ` +
    `portal (https://clearinghouse.fmcsa.dot.gov).\n\n` +
    `4. The information obtained from the Clearinghouse may pertain to ` +
    `records of drug and alcohol program violations as defined in ` +
    `49 CFR Part 40, including positive drug tests, refusals to test, ` +
    `alcohol confirmation tests at or above 0.04, and other violations.\n\n` +
    `5. ${companyName} will use the information received from the ` +
    `Clearinghouse only for the purposes permitted by the FMCSA ` +
    `Clearinghouse regulations (49 CFR Part 382, Subpart G), specifically ` +
    `for making a pre-employment determination.\n\n` +
    `6. The FMCSA Clearinghouse retains records for five (5) years from the ` +
    `date of the violation determination, or until the violation is resolved ` +
    `through the return-to-duty process, whichever is later.`,
  acknowledgment:
    'I acknowledge that I have read and understand the above consent, and I ' +
    'voluntarily agree to allow a pre-employment query of my records in the ' +
    'FMCSA Drug & Alcohol Clearinghouse as described herein. I understand ' +
    'that a separate full query consent must be provided through the FMCSA ' +
    'Clearinghouse portal.',
};

export const PRE_EMPLOYMENT_CONSENT_TEXT_ES: ConsentTextBlock = {
  title: 'FMCSA Drug & Alcohol Clearinghouse — Consentimiento para Consulta Pre-Empleo',
  body: (
    driverName: string,
    companyName: string,
    startDate: string,
    endDate: string,
    _frequency: string,
  ) =>
    `Yo, ${driverName}, por la presente otorgo mi consentimiento escrito a ` +
    `${companyName} para realizar una consulta pre-empleo en el Clearinghouse ` +
    `de Drogas y Alcohol de Licencias de Conducir Comerciales de la ` +
    `Administracion Federal de Seguridad de Autotransportes (FMCSA) ` +
    `(el "Clearinghouse") para determinar si existe informacion sobre ` +
    `violaciones de drogas o alcohol sobre mi persona en el Clearinghouse, ` +
    `de conformidad con 49 CFR 382.701(a) y 49 CFR 382.701(b).\n\n` +
    `Como parte del proceso de pre-empleo, ${companyName} esta obligado por ` +
    `49 CFR 382.701(a) a consultar el Clearinghouse antes de permitirme ` +
    `realizar funciones sensibles de seguridad, incluyendo la operacion de ` +
    `un vehiculo motorizado comercial (CMV). Este consentimiento autoriza a ` +
    `${companyName} a realizar una consulta limitada pre-empleo a partir del ` +
    `${startDate}${endDate ? ` y valida hasta el ${endDate}` : ''}.\n\n` +
    `Entiendo que:\n\n` +
    `1. Este consentimiento autoriza una consulta limitada pre-empleo del ` +
    `Clearinghouse. Una consulta limitada revelara unicamente si existe un ` +
    `registro en el Clearinghouse sobre mi persona, no los detalles de ` +
    `dicho registro.\n\n` +
    `2. Si una consulta limitada indica que existe un registro en el ` +
    `Clearinghouse sobre mi persona, ${companyName} estara obligado a ` +
    `realizar una consulta completa dentro de 24 horas segun ` +
    `49 CFR 382.701(b)(3). Una consulta completa requiere mi ` +
    `consentimiento electronico separado y especifico proporcionado ` +
    `directamente a traves del portal del Clearinghouse de la FMCSA ` +
    `segun 49 CFR 382.703(b).\n\n` +
    `3. Segun 49 CFR 382.701(a), ${companyName} tambien debe realizar una ` +
    `consulta completa pre-empleo del Clearinghouse. Una consulta completa ` +
    `requiere mi consentimiento electronico separado proporcionado a traves ` +
    `del portal del Clearinghouse de la FMCSA ` +
    `(https://clearinghouse.fmcsa.dot.gov).\n\n` +
    `4. La informacion obtenida del Clearinghouse puede estar relacionada ` +
    `con registros de violaciones del programa de drogas y alcohol segun ` +
    `se define en 49 CFR Parte 40, incluyendo pruebas de drogas positivas, ` +
    `negativas a someterse a pruebas, pruebas de confirmacion de alcohol ` +
    `en o por encima de 0.04, y otras violaciones.\n\n` +
    `5. ${companyName} utilizara la informacion recibida del Clearinghouse ` +
    `unicamente para los fines permitidos por las regulaciones del ` +
    `Clearinghouse de la FMCSA (49 CFR Parte 382, Subparte G), ` +
    `especificamente para tomar una determinacion pre-empleo.\n\n` +
    `6. El Clearinghouse de la FMCSA conserva los registros durante cinco ` +
    `(5) anos a partir de la fecha de la determinacion de la violacion, ` +
    `o hasta que la violacion se resuelva a traves del proceso de regreso ` +
    `al servicio, lo que ocurra mas tarde.`,
  acknowledgment:
    'Reconozco que he leido y entiendo el consentimiento anterior, y acepto ' +
    'voluntariamente permitir una consulta pre-empleo de mis registros en el ' +
    'FMCSA Drug & Alcohol Clearinghouse como se describe en este documento. ' +
    'Entiendo que se debe proporcionar un consentimiento separado para consulta ' +
    'completa a traves del portal del Clearinghouse de la FMCSA.',
};
