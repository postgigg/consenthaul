import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { submitSignatureSchema } from '@/lib/validators';
import { hashSignature } from '@/lib/tokens';
import { generateConsentPDF } from '@/lib/pdf/generate-consent-pdf';
import { createHash } from 'crypto';
import type { Database } from '@/types/database';

type ConsentRow = Database['public']['Tables']['consents']['Row'];
type DriverRow = Database['public']['Tables']['drivers']['Row'];
type OrganizationRow = Database['public']['Tables']['organizations']['Row'];

// ---------------------------------------------------------------------------
// GET /api/sign/[token] — Public: get consent info for the signing page
// ---------------------------------------------------------------------------
export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } },
) {
  try {
    const supabase = createAdminClient();
    const { token } = params;

    // 1. Look up consent by signing token
    const { data: consentData, error } = await supabase
      .from('consents')
      .select(
        `
        id,
        status,
        consent_type,
        language,
        consent_start_date,
        consent_end_date,
        query_frequency,
        signing_token_expires_at,
        created_at,
        driver:drivers(first_name, last_name),
        organization:organizations(name)
      `,
      )
      .eq('signing_token', token)
      .single();

    const consent = consentData as (Pick<ConsentRow, 'id' | 'status' | 'consent_type' | 'language' | 'consent_start_date' | 'consent_end_date' | 'query_frequency' | 'signing_token_expires_at' | 'created_at'> & { driver: unknown; organization: unknown }) | null;

    if (error || !consent) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Invalid or unknown signing link.' },
        { status: 404 },
      );
    }

    // 2. Check expiry
    if (
      consent.signing_token_expires_at &&
      new Date(consent.signing_token_expires_at) < new Date()
    ) {
      return NextResponse.json(
        { error: 'Gone', message: 'This signing link has expired.' },
        { status: 410 },
      );
    }

    // 3. Check status
    if (consent.status === 'signed') {
      return NextResponse.json(
        { error: 'Conflict', message: 'This consent has already been signed.' },
        { status: 409 },
      );
    }

    if (consent.status === 'revoked') {
      return NextResponse.json(
        { error: 'Gone', message: 'This consent has been revoked.' },
        { status: 410 },
      );
    }

    // 4. Build safe response (no sensitive data)
    const driver = consent.driver as { first_name: string; last_name: string } | null;
    const organization = consent.organization as { name: string } | null;

    return NextResponse.json({
      data: {
        consent_id: consent.id,
        consent_type: consent.consent_type,
        status: consent.status,
        language: consent.language,
        consent_start_date: consent.consent_start_date,
        consent_end_date: consent.consent_end_date,
        query_frequency: consent.query_frequency,
        expires_at: consent.signing_token_expires_at,
        created_at: consent.created_at,
        driver_name: driver
          ? `${driver.first_name} ${driver.last_name}`
          : 'Unknown Driver',
        organization_name: organization?.name ?? 'Unknown Organization',
      },
    });
  } catch (err) {
    console.error('[GET /api/sign/[token]]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/sign/[token] — Public: submit signature
// ---------------------------------------------------------------------------
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  try {
    const supabase = createAdminClient();
    const { token } = params;

    // 1. Look up consent by signing token
    const { data: consentData2, error } = await supabase
      .from('consents')
      .select(
        `
        *,
        driver:drivers(*),
        organization:organizations(*)
      `,
      )
      .eq('signing_token', token)
      .single();

    const consent = consentData2 as (ConsentRow & { driver: unknown; organization: unknown }) | null;

    if (error || !consent) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Invalid or unknown signing link.' },
        { status: 404 },
      );
    }

    // 2. Check expiry
    if (
      consent.signing_token_expires_at &&
      new Date(consent.signing_token_expires_at) < new Date()
    ) {
      return NextResponse.json(
        { error: 'Gone', message: 'This signing link has expired.' },
        { status: 410 },
      );
    }

    // 3. Check not already signed
    if (consent.status === 'signed') {
      return NextResponse.json(
        { error: 'Conflict', message: 'This consent has already been signed.' },
        { status: 409 },
      );
    }

    if (consent.status === 'revoked') {
      return NextResponse.json(
        { error: 'Gone', message: 'This consent has been revoked.' },
        { status: 410 },
      );
    }

    // 4. Parse & validate body
    const body = await request.json();
    const parsed = submitSignatureSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid signature data.',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }

    const { signature_data } = parsed.data;

    // 5. Collect signer metadata
    const signerIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';
    const signerUserAgent = request.headers.get('user-agent') ?? 'unknown';
    const signedAt = new Date().toISOString();
    const sigHash = hashSignature(signature_data);

    // 6. Create point-in-time snapshots
    const driver = consent.driver as DriverRow;
    const organization = consent.organization as OrganizationRow;

    const driverSnapshot: Record<string, string | null> = {
      id: driver.id,
      first_name: driver.first_name,
      last_name: driver.last_name,
      email: driver.email,
      phone: driver.phone,
      cdl_number: driver.cdl_number,
      cdl_state: driver.cdl_state,
      date_of_birth: driver.date_of_birth,
    };

    const organizationSnapshot: Record<string, string | null> = {
      id: organization.id,
      name: organization.name,
      dot_number: organization.dot_number,
      mc_number: organization.mc_number,
      address_line1: organization.address_line1,
      city: organization.city,
      state: organization.state,
      zip: organization.zip,
      phone: organization.phone,
    };

    // 7. Update consent with signature data
    const { error: updateError } = await supabase
      .from('consents')
      .update({
        status: 'signed',
        signed_at: signedAt,
        signature_data,
        signature_hash: sigHash,
        signer_ip: signerIp,
        signer_user_agent: signerUserAgent,
        driver_snapshot: driverSnapshot,
        organization_snapshot: organizationSnapshot,
      })
      .eq('id', consent.id);

    if (updateError) {
      console.error('[POST /api/sign/[token]] update error:', updateError);
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to record signature.' },
        { status: 500 },
      );
    }

    // 8. Generate PDF
    let pdfStoragePath: string | null = null;
    let pdfHash: string | null = null;

    try {
      const pdfBuffer = await generateConsentPDF({
        consent: {
          ...consent,
          signed_at: signedAt,
          signature_data,
          signature_hash: sigHash,
          driver_snapshot: driverSnapshot,
          organization_snapshot: organizationSnapshot,
        },
        driver: driver as unknown as Record<string, string>,
        organization: organization as unknown as Record<string, string>,
      });

      // Compute hash of the PDF for integrity verification
      pdfHash = createHash('sha256').update(pdfBuffer).digest('hex');

      // Upload to Supabase storage
      const storagePath = `${consent.organization_id}/${consent.id}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('consent-pdfs')
        .upload(storagePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        console.error('[POST /api/sign/[token]] upload error:', uploadError);
        // Non-fatal — consent is still signed, PDF can be regenerated
      } else {
        pdfStoragePath = storagePath;
      }

      // 9. Update consent with PDF metadata
      if (pdfStoragePath) {
        await supabase
          .from('consents')
          .update({
            pdf_storage_path: pdfStoragePath,
            pdf_hash: pdfHash,
            pdf_generated_at: new Date().toISOString(),
          })
          .eq('id', consent.id);
      }
    } catch (pdfError) {
      // PDF generation failure is non-fatal — log but don't fail the signing
      console.error('[POST /api/sign/[token]] PDF generation error:', pdfError);
    }

    // 10. Mark consent as opened if it was previously in a pre-open state
    // (Already handled by setting status to 'signed' above)

    // 11. Audit log
    await supabase.from('audit_log').insert({
      organization_id: consent.organization_id,
      actor_id: null,
      actor_type: 'driver',
      action: 'consent.signed',
      resource_type: 'consent',
      resource_id: consent.id,
      details: {
        signature_hash: sigHash,
        signer_ip: signerIp,
        pdf_generated: !!pdfStoragePath,
      },
      ip_address: signerIp,
      user_agent: signerUserAgent,
    });

    return NextResponse.json({
      data: {
        consent_id: consent.id,
        status: 'signed' as const,
        signed_at: signedAt,
        signature_hash: sigHash,
        pdf_storage_path: pdfStoragePath,
      },
    });
  } catch (err) {
    console.error('[POST /api/sign/[token]]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
