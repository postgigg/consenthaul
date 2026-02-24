import twilio from 'twilio';

// ---------------------------------------------------------------------------
// Twilio SMS service for consent delivery
// ---------------------------------------------------------------------------

function getClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!,
  );
}

interface SendConsentSMSParams {
  /** E.164 formatted phone number */
  to: string;
  /** Full signing URL the driver should visit */
  signingUrl: string;
  /** Driver's full name for personalisation */
  driverName: string;
  /** Company / organisation name */
  companyName?: string;
  /** Message language */
  language?: string;
}

interface SendConsentSMSResult {
  sid: string;
  status: string;
}

/**
 * Send an SMS to a driver with their consent-signing link.
 *
 * The message is bilingual (English + Spanish) so the recipient can
 * understand the request regardless of their preferred language.
 */
export async function sendConsentSMS({
  to,
  signingUrl,
  driverName,
  companyName = 'your employer',
  language = 'en',
}: SendConsentSMSParams): Promise<SendConsentSMSResult> {
  const body =
    language === 'es'
      ? `Hola ${driverName}, ${companyName} le solicita que firme su consentimiento ` +
        `para la consulta del FMCSA Drug & Alcohol Clearinghouse. ` +
        `Firme aqui / Sign here: ${signingUrl}\n\n` +
        `Este enlace expira en 7 dias. / This link expires in 7 days.`
      : `Hi ${driverName}, ${companyName} is requesting your consent ` +
        `for an FMCSA Drug & Alcohol Clearinghouse query. ` +
        `Sign here / Firme aqui: ${signingUrl}\n\n` +
        `This link expires in 7 days. / Este enlace expira en 7 dias.`;

  const message = await getClient().messages.create({
    to,
    from: process.env.TWILIO_PHONE_NUMBER!,
    body,
    statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`,
  });

  return {
    sid: message.sid,
    status: message.status,
  };
}
