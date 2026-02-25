import { NextResponse } from 'next/server';
import {
  sendConsentEmail,
  sendDriverReceiptEmail,
  sendCarrierNotificationEmail,
  sendWelcomeEmail,
  sendServiceRequestNotificationEmail,
} from '@/lib/messaging/email';
import { generateConsentPDF } from '@/lib/pdf/generate-consent-pdf';

// ---------------------------------------------------------------------------
// GET /api/test-email — Send test emails with PDF attachment (remove after testing)
// ---------------------------------------------------------------------------
export async function GET() {
  const testEmail = 'exontract@gmail.com';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://consenthaul.com';
  const results: Record<string, string> = {};
  const consentId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const signedAt = new Date().toISOString();

  // Generate a sample PDF for attachment
  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await generateConsentPDF({
      consent: {
        id: consentId,
        consent_type: 'limited_query',
        language: 'en',
        consent_start_date: new Date().toISOString().split('T')[0],
        consent_end_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        query_frequency: 'annual',
        signed_at: signedAt,
        signature_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
        signature_hash: 'test-hash-123',
        driver_snapshot: {
          first_name: 'John',
          last_name: 'Doe',
          cdl_number: 'D1234567',
          cdl_state: 'TX',
          date_of_birth: '1985-06-15',
        },
        organization_snapshot: {
          name: 'Acme Trucking LLC',
          dot_number: '1234567',
          mc_number: 'MC-987654',
          address_line1: '123 Main St',
          city: 'Houston',
          state: 'TX',
          zip: '77001',
        },
        signer_ip: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      driver: {
        first_name: 'John',
        last_name: 'Doe',
        cdl_number: 'D1234567',
        cdl_state: 'TX',
        date_of_birth: '1985-06-15',
      },
      organization: {
        name: 'Acme Trucking LLC',
        dot_number: '1234567',
        mc_number: 'MC-987654',
        address_line1: '123 Main St',
        city: 'Houston',
        state: 'TX',
        zip: '77001',
      },
    });
    results.pdfGeneration = `success (${pdfBuffer.length} bytes)`;
  } catch (err) {
    results.pdfGeneration = `failed: ${err instanceof Error ? err.message : String(err)}`;
  }

  // 1. Consent request email (driver signing link — no PDF needed)
  try {
    const { messageId } = await sendConsentEmail({
      to: testEmail,
      signingUrl: `${baseUrl}/sign/test-token-123`,
      driverName: 'John Doe',
      companyName: 'Acme Trucking LLC',
      language: 'en',
    });
    results.consentEmail = `sent (${messageId})`;
  } catch (err) {
    results.consentEmail = `failed: ${err instanceof Error ? err.message : String(err)}`;
  }

  // 2. Driver receipt email (with signed PDF attached)
  try {
    await sendDriverReceiptEmail({
      to: testEmail,
      driverName: 'John Doe',
      companyName: 'Acme Trucking LLC',
      consentType: 'limited_query',
      signedAt,
      consentId,
      language: 'en',
      ...(pdfBuffer ? { pdfBuffer } : {}),
    });
    results.driverReceipt = `sent${pdfBuffer ? ' (with PDF)' : ' (no PDF)'}`;
  } catch (err) {
    results.driverReceipt = `failed: ${err instanceof Error ? err.message : String(err)}`;
  }

  // 3. Carrier notification email (with signed PDF attached)
  try {
    await sendCarrierNotificationEmail({
      to: testEmail,
      driverName: 'John Doe',
      companyName: 'Acme Trucking LLC',
      consentType: 'limited_query',
      signedAt,
      consentId,
      dashboardUrl: `${baseUrl}/consents`,
      ...(pdfBuffer ? { pdfBuffer } : {}),
    });
    results.carrierNotification = `sent${pdfBuffer ? ' (with PDF)' : ' (no PDF)'}`;
  } catch (err) {
    results.carrierNotification = `failed: ${err instanceof Error ? err.message : String(err)}`;
  }

  // 4. Welcome email — delay to avoid Resend rate limit
  await new Promise((r) => setTimeout(r, 1500));
  try {
    const welcomeResult = await sendWelcomeEmail({
      to: testEmail,
      userName: 'John Doe',
    });
    results.welcomeEmail = `sent (${welcomeResult.messageId})`;
  } catch (err) {
    results.welcomeEmail = `failed: ${err instanceof Error ? err.message : String(err)}`;
  }

  // 5. Service request notification email — delay to avoid Resend rate limit
  await new Promise((r) => setTimeout(r, 1500));
  try {
    await sendServiceRequestNotificationEmail({
      category: 'custom_integration',
      description:
        'We need a custom integration with Samsara TMS to automatically trigger FMCSA consent requests when new drivers are onboarded. Should support webhook callbacks and status sync.',
      urgency: 'high',
      tmsSystem: 'Samsara',
      orgName: 'Acme Trucking LLC',
      userEmail: 'john@acmetrucking.com',
      userName: 'John Doe',
      toOverride: testEmail,
    });
    results.serviceRequestNotification = 'sent';
  } catch (err) {
    results.serviceRequestNotification = `failed: ${err instanceof Error ? err.message : String(err)}`;
  }

  return NextResponse.json({ results });
}
