import { Resend } from 'resend';

// ---------------------------------------------------------------------------
// Resend email service for consent delivery
// ---------------------------------------------------------------------------

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

interface SendConsentEmailParams {
  /** Recipient email address */
  to: string;
  /** Full signing URL the driver should visit */
  signingUrl: string;
  /** Driver's full name for personalisation */
  driverName: string;
  /** Company / organisation name */
  companyName?: string;
  /** Email language */
  language?: string;
}

interface SendConsentEmailResult {
  /** Resend message ID (used as deliverySid in consents route) */
  messageId: string;
}

/**
 * Send a professional HTML email to a driver with their consent-signing link.
 *
 * The email explains the FMCSA requirement and provides a prominent CTA button.
 * Subject line and body are localised based on the driver's preferred language.
 */
export async function sendConsentEmail({
  to,
  signingUrl,
  driverName,
  companyName = 'your employer',
  language = 'en',
}: SendConsentEmailParams): Promise<SendConsentEmailResult> {
  const isSpanish = language === 'es';

  const subject = isSpanish
    ? `${companyName} solicita su consentimiento — FMCSA Clearinghouse`
    : `${companyName} requests your consent — FMCSA Clearinghouse`;

  const html = buildEmailHtml({
    driverName,
    companyName,
    signingUrl,
    isSpanish,
  });

  const { data, error } = await getResend().emails.send({
    from: 'ConsentHaul <noreply@consenthaul.com>',
    to,
    subject,
    html,
  });

  if (error || !data?.id) {
    throw new Error(
      `Resend email failed: ${error?.message ?? 'No message ID returned'}`,
    );
  }

  return { messageId: data.id };
}

// ---------------------------------------------------------------------------
// HTML template builder
// ---------------------------------------------------------------------------

function buildEmailHtml({
  driverName,
  companyName,
  signingUrl,
  isSpanish,
}: {
  driverName: string;
  companyName: string;
  signingUrl: string;
  isSpanish: boolean;
}): string {
  const t = isSpanish
    ? {
        preheader: `${companyName} necesita su consentimiento para una consulta del FMCSA Clearinghouse.`,
        greeting: `Hola ${driverName},`,
        intro: `<strong>${companyName}</strong> le solicita que proporcione su consentimiento electrónico para una consulta limitada en el <strong>FMCSA Drug &amp; Alcohol Clearinghouse</strong>, según lo requiere la regulación federal (49 CFR 382.701).`,
        cta: 'Firmar Ahora',
        expiryNote: 'Este enlace expira en <strong>7 días</strong>. Después de esa fecha, deberá solicitar un nuevo enlace a su empleador.',
        whatIs: '¿Qué es una consulta limitada?',
        whatIsBody: 'Una consulta limitada verifica si existen registros sobre usted en el Clearinghouse de la FMCSA. No revela detalles específicos de ninguna violación. Su empleador está obligado por ley federal a realizar esta consulta al menos una vez al año para todos los conductores con CDL.',
        noAction: 'Si no reconoce esta solicitud, puede ignorar este correo de manera segura.',
        footer: `Este correo fue enviado por ConsentHaul en nombre de ${companyName}. Si tiene preguntas, comuníquese directamente con su empleador.`,
      }
    : {
        preheader: `${companyName} needs your consent for an FMCSA Clearinghouse query.`,
        greeting: `Hi ${driverName},`,
        intro: `<strong>${companyName}</strong> is requesting your electronic consent for a limited query of the <strong>FMCSA Drug &amp; Alcohol Clearinghouse</strong>, as required by federal regulation (49 CFR 382.701).`,
        cta: 'Sign Now',
        expiryNote: 'This link expires in <strong>7 days</strong>. After that, you will need to request a new link from your employer.',
        whatIs: 'What is a limited query?',
        whatIsBody: 'A limited query checks whether there are any records about you in the FMCSA Clearinghouse. It does not reveal specific details of any violation. Your employer is required by federal law to conduct this query at least once per year for all CDL drivers.',
        noAction: 'If you do not recognise this request, you can safely ignore this email.',
        footer: `This email was sent by ConsentHaul on behalf of ${companyName}. If you have questions, please contact your employer directly.`,
      };

  return `
<!DOCTYPE html>
<html lang="${isSpanish ? 'es' : 'en'}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${isSpanish ? 'Solicitud de Consentimiento' : 'Consent Request'}</title>
  <!--[if mso]>
  <style>table,td{font-family:Arial,sans-serif!important}</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <!-- Preheader (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f4f4f5;">
    ${t.preheader}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color:#1e40af;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">
                ConsentHaul
              </h1>
              <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">
                FMCSA Drug &amp; Alcohol Clearinghouse
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#18181b;">
                ${t.greeting}
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3f3f46;">
                ${t.intro}
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                <tr>
                  <td align="center" style="border-radius:6px;background-color:#2563eb;">
                    <a href="${signingUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">
                      ${t.cta}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry notice -->
              <p style="margin:0 0 24px;font-size:14px;line-height:1.5;color:#71717a;text-align:center;">
                ${t.expiryNote}
              </p>

              <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;" />

              <!-- Explainer -->
              <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#18181b;">
                ${t.whatIs}
              </p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#52525b;">
                ${t.whatIsBody}
              </p>

              <!-- Fallback link -->
              <p style="margin:0 0 8px;font-size:13px;color:#71717a;">
                ${isSpanish ? 'Si el botón no funciona, copie y pegue este enlace:' : 'If the button does not work, copy and paste this link:'}
              </p>
              <p style="margin:0 0 24px;font-size:13px;color:#2563eb;word-break:break-all;">
                <a href="${signingUrl}" style="color:#2563eb;text-decoration:underline;">${signingUrl}</a>
              </p>

              <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;" />

              <p style="margin:0;font-size:13px;line-height:1.5;color:#a1a1aa;">
                ${t.noAction}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#fafafa;padding:20px 32px;border-top:1px solid #e4e4e7;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#a1a1aa;text-align:center;">
                ${t.footer}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
