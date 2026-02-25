import { Resend } from 'resend';

// ---------------------------------------------------------------------------
// Resend email service
// ---------------------------------------------------------------------------

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

// ---------------------------------------------------------------------------
// Shared email shell — brand-consistent wrapper
// ---------------------------------------------------------------------------

function emailShell({
  lang,
  title,
  preheader,
  body,
  footerText,
}: {
  lang: string;
  title: string;
  preheader: string;
  body: string;
  footerText: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <!--[if mso]>
  <style>table,td{font-family:Arial,sans-serif!important}</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f8f8f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <!-- Preheader (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f8f8f6;">
    ${preheader}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f8f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#0c0f14;padding:24px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin:0;color:#C8A75E;font-size:18px;font-weight:700;letter-spacing:0.04em;">
                      CONSENTHAUL
                    </h1>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="color:#6b6f76;font-size:11px;letter-spacing:0.05em;">FMCSA CLEARINGHOUSE</span>
                  </td>
                </tr>
              </table>
              <div style="margin-top:16px;height:2px;background:linear-gradient(90deg,#C8A75E 0%,#C8A75E 30%,#1e2129 100%);"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#fafaf8;padding:20px 32px;border-top:1px solid #e8e8e3;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#8b919a;text-align:center;">
                ${footerText}
              </p>
            </td>
          </tr>

        </table>

        <!-- Sub-footer -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:16px 32px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#b5b5ae;">
                &copy; ${new Date().getFullYear()} ConsentHaul &middot; Operated by Workbird LLC
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

// ---------------------------------------------------------------------------
// 1. Consent request email (sent to driver with signing link)
// ---------------------------------------------------------------------------

interface SendConsentEmailParams {
  to: string;
  signingUrl: string;
  driverName: string;
  companyName?: string;
  language?: string;
}

interface SendConsentEmailResult {
  messageId: string;
}

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
        fallback: 'Si el botón no funciona, copie y pegue este enlace:',
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
        fallback: 'If the button does not work, copy and paste this link:',
        footer: `This email was sent by ConsentHaul on behalf of ${companyName}. If you have questions, please contact your employer directly.`,
      };

  const body = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#0c0f14;">${t.greeting}</p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3a3f49;">${t.intro}</p>

    <!-- CTA Button -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
      <tr>
        <td align="center" style="background-color:#C8A75E;">
          <a href="${signingUrl}" target="_blank" style="display:inline-block;padding:14px 36px;font-size:14px;font-weight:700;color:#0c0f14;text-decoration:none;letter-spacing:0.05em;text-transform:uppercase;">
            ${t.cta}
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 24px;font-size:13px;line-height:1.5;color:#8b919a;text-align:center;">${t.expiryNote}</p>

    <hr style="border:none;border-top:1px solid #e8e8e3;margin:24px 0;" />

    <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#0c0f14;">${t.whatIs}</p>
    <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#6b6f76;">${t.whatIsBody}</p>

    <p style="margin:0 0 8px;font-size:13px;color:#8b919a;">${t.fallback}</p>
    <p style="margin:0 0 24px;font-size:13px;color:#C8A75E;word-break:break-all;">
      <a href="${signingUrl}" style="color:#C8A75E;text-decoration:underline;">${signingUrl}</a>
    </p>

    <hr style="border:none;border-top:1px solid #e8e8e3;margin:24px 0;" />
    <p style="margin:0;font-size:13px;line-height:1.5;color:#b5b5ae;">${t.noAction}</p>
  `;

  const html = emailShell({
    lang: isSpanish ? 'es' : 'en',
    title: isSpanish ? 'Solicitud de Consentimiento' : 'Consent Request',
    preheader: t.preheader,
    body,
    footerText: t.footer,
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
// 2. Driver receipt email (sent to driver after signing)
// ---------------------------------------------------------------------------

interface SendDriverReceiptParams {
  to: string;
  driverName: string;
  companyName: string;
  consentType: string;
  signedAt: string;
  consentId: string;
  language?: string;
  pdfBuffer?: Buffer;
}

export async function sendDriverReceiptEmail({
  to,
  driverName,
  companyName,
  consentType,
  signedAt,
  consentId,
  language = 'en',
  pdfBuffer,
}: SendDriverReceiptParams): Promise<void> {
  const isSpanish = language === 'es';
  const signedDate = new Date(signedAt).toLocaleDateString(isSpanish ? 'es-US' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const typeLabel = consentType === 'limited_query'
    ? (isSpanish ? 'Consulta Limitada' : 'Limited Query')
    : (isSpanish ? 'Consulta Completa' : 'Full Query');

  const subject = isSpanish
    ? `Confirmación — Su consentimiento FMCSA fue firmado`
    : `Confirmation — Your FMCSA consent has been signed`;

  const t = isSpanish
    ? {
        preheader: `Su consentimiento FMCSA para ${companyName} fue firmado exitosamente.`,
        greeting: `Hola ${driverName},`,
        confirmation: 'Su consentimiento ha sido registrado exitosamente.',
        details: 'Detalles del consentimiento',
        labelDriver: 'Conductor',
        labelCompany: 'Empresa',
        labelType: 'Tipo de consentimiento',
        labelSigned: 'Firmado',
        labelId: 'ID de consentimiento',
        retention: 'Su documento de consentimiento firmado será retenido por <strong>3 años</strong> según lo requiere 49 CFR Part 40.',
        attachedNote: 'Una copia de su documento de consentimiento firmado está adjunta a este correo para sus registros.',
        questions: 'Si tiene alguna pregunta sobre este consentimiento, comuníquese directamente con su empleador.',
        footer: `Este correo fue enviado por ConsentHaul en nombre de ${companyName}.`,
      }
    : {
        preheader: `Your FMCSA consent for ${companyName} was signed successfully.`,
        greeting: `Hi ${driverName},`,
        confirmation: 'Your consent has been successfully recorded.',
        details: 'Consent details',
        labelDriver: 'Driver',
        labelCompany: 'Company',
        labelType: 'Consent type',
        labelSigned: 'Signed',
        labelId: 'Consent ID',
        retention: 'Your signed consent document will be retained for <strong>3 years</strong> as required by 49 CFR Part 40.',
        attachedNote: 'A copy of your signed consent document is attached to this email for your records.',
        questions: 'If you have any questions about this consent, please contact your employer directly.',
        footer: `This email was sent by ConsentHaul on behalf of ${companyName}.`,
      };

  const body = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#0c0f14;">${t.greeting}</p>

    <!-- Success badge -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background-color:#f0fdf4;border-left:3px solid #22c55e;padding:12px 16px;">
          <p style="margin:0;font-size:15px;font-weight:600;color:#166534;">${t.confirmation}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#8b919a;letter-spacing:0.08em;text-transform:uppercase;">${t.details}</p>

    <!-- Details table -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid #e8e8e3;">
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:#8b919a;border-bottom:1px solid #e8e8e3;width:140px;">${t.labelDriver}</td>
        <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#0c0f14;border-bottom:1px solid #e8e8e3;">${driverName}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:#8b919a;border-bottom:1px solid #e8e8e3;background-color:#fafaf8;">${t.labelCompany}</td>
        <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#0c0f14;border-bottom:1px solid #e8e8e3;background-color:#fafaf8;">${companyName}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:#8b919a;border-bottom:1px solid #e8e8e3;">${t.labelType}</td>
        <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#0c0f14;border-bottom:1px solid #e8e8e3;">${typeLabel}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:#8b919a;border-bottom:1px solid #e8e8e3;background-color:#fafaf8;">${t.labelSigned}</td>
        <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#0c0f14;border-bottom:1px solid #e8e8e3;background-color:#fafaf8;">${signedDate}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:#8b919a;">${t.labelId}</td>
        <td style="padding:10px 16px;font-size:12px;font-family:monospace;color:#6b6f76;">${consentId.slice(0, 8)}...</td>
      </tr>
    </table>

    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#6b6f76;">${t.retention}</p>
    ${pdfBuffer ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#3a3f49;font-weight:600;">&#128206; ${t.attachedNote}</p>` : ''}
    <p style="margin:0;font-size:14px;line-height:1.6;color:#6b6f76;">${t.questions}</p>
  `;

  const html = emailShell({
    lang: isSpanish ? 'es' : 'en',
    title: isSpanish ? 'Consentimiento Firmado' : 'Consent Signed',
    preheader: t.preheader,
    body,
    footerText: t.footer,
  });

  await getResend().emails.send({
    from: 'ConsentHaul <noreply@consenthaul.com>',
    to,
    subject,
    html,
    ...(pdfBuffer
      ? {
          attachments: [
            {
              content: pdfBuffer,
              filename: `fmcsa-consent-${consentId.slice(0, 8)}.pdf`,
              contentType: 'application/pdf',
            },
          ],
        }
      : {}),
  });
}

// ---------------------------------------------------------------------------
// 3. Carrier notification email (sent to org members after driver signs)
// ---------------------------------------------------------------------------

interface SendCarrierNotificationParams {
  to: string | string[];
  driverName: string;
  companyName: string;
  consentType: string;
  signedAt: string;
  consentId: string;
  dashboardUrl: string;
  pdfBuffer?: Buffer;
}

export async function sendCarrierNotificationEmail({
  to,
  driverName,
  companyName,
  consentType,
  signedAt,
  consentId,
  dashboardUrl,
  pdfBuffer,
}: SendCarrierNotificationParams): Promise<void> {
  const signedDate = new Date(signedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const typeLabel = consentType === 'limited_query' ? 'Limited Query' : 'Full Query';

  const subject = `Consent signed — ${driverName} (${typeLabel})`;

  const body = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#0c0f14;">A driver has signed their FMCSA consent.</p>

    <!-- Success badge -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;width:100%;">
      <tr>
        <td style="background-color:#f0fdf4;border-left:3px solid #22c55e;padding:12px 16px;">
          <p style="margin:0;font-size:15px;font-weight:600;color:#166534;">
            ${driverName} signed their ${typeLabel.toLowerCase()} consent
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#8b919a;letter-spacing:0.08em;text-transform:uppercase;">Details</p>

    <!-- Details table -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid #e8e8e3;">
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:#8b919a;border-bottom:1px solid #e8e8e3;width:140px;">Driver</td>
        <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#0c0f14;border-bottom:1px solid #e8e8e3;">${driverName}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:#8b919a;border-bottom:1px solid #e8e8e3;background-color:#fafaf8;">Consent type</td>
        <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#0c0f14;border-bottom:1px solid #e8e8e3;background-color:#fafaf8;">${typeLabel}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:#8b919a;border-bottom:1px solid #e8e8e3;">Signed at</td>
        <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#0c0f14;border-bottom:1px solid #e8e8e3;">${signedDate}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:#8b919a;background-color:#fafaf8;">Consent ID</td>
        <td style="padding:10px 16px;font-size:12px;font-family:monospace;color:#6b6f76;background-color:#fafaf8;">${consentId.slice(0, 8)}...</td>
      </tr>
    </table>

    <p style="margin:0 0 ${pdfBuffer ? '16px' : '24px'};font-size:14px;line-height:1.6;color:#6b6f76;">
      The signed PDF has been generated and is available in your dashboard. You can now run your FMCSA Clearinghouse query.
    </p>
    ${pdfBuffer ? '<p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#3a3f49;font-weight:600;">&#128206; The signed consent PDF is attached to this email.</p>' : ''}

    <!-- CTA Button -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
      <tr>
        <td align="center" style="background-color:#0c0f14;">
          <a href="${dashboardUrl}" target="_blank" style="display:inline-block;padding:14px 36px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.05em;text-transform:uppercase;">
            VIEW IN DASHBOARD
          </a>
        </td>
      </tr>
    </table>
  `;

  const html = emailShell({
    lang: 'en',
    title: 'Consent Signed',
    preheader: `${driverName} signed their FMCSA ${typeLabel.toLowerCase()} consent.`,
    body,
    footerText: `This notification was sent to ${companyName} by ConsentHaul.`,
  });

  const recipients = Array.isArray(to) ? to : [to];

  await getResend().emails.send({
    from: 'ConsentHaul <noreply@consenthaul.com>',
    to: recipients,
    subject,
    html,
    ...(pdfBuffer
      ? {
          attachments: [
            {
              content: pdfBuffer,
              filename: `fmcsa-consent-${driverName.replace(/\s+/g, '-').toLowerCase()}-${consentId.slice(0, 8)}.pdf`,
              contentType: 'application/pdf',
            },
          ],
        }
      : {}),
  });
}
