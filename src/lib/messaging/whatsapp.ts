import twilio from 'twilio';

// ---------------------------------------------------------------------------
// Twilio WhatsApp service for consent delivery
// ---------------------------------------------------------------------------

function getClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!,
  );
}

interface SendConsentWhatsAppParams {
  /** E.164 formatted phone number (without whatsapp: prefix) */
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

interface SendConsentWhatsAppResult {
  sid: string;
  status: string;
}

/**
 * Send a WhatsApp message to a driver with their consent-signing link.
 *
 * Uses pre-approved Twilio Content Templates (required by WhatsApp Business API).
 * Template content variables are injected for the company name and signing URL.
 */
export async function sendConsentWhatsApp({
  to,
  signingUrl,
  driverName,
  companyName = 'your employer',
  language = 'en',
}: SendConsentWhatsAppParams): Promise<SendConsentWhatsAppResult> {
  // Select the appropriate approved template based on language
  const contentSid =
    language === 'es'
      ? process.env.TWILIO_WA_TEMPLATE_ES!
      : process.env.TWILIO_WA_TEMPLATE_EN!;

  // Content variables are positional — they map to {{1}}, {{2}}, {{3}} in the
  // template registered in the Twilio console.
  const contentVariables = JSON.stringify({
    '1': driverName,
    '2': companyName,
    '3': signingUrl,
  });

  const message = await getClient().messages.create({
    to: `whatsapp:${to}`,
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER!}`,
    contentSid,
    contentVariables,
    statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`,
  });

  return {
    sid: message.sid,
    status: message.status,
  };
}
