import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { generalLimiter } from '@/lib/rate-limiters';
import { z } from 'zod';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type DriverRow = Database['public']['Tables']['drivers']['Row'];

const ANONYMIZED_VALUE = '[REDACTED]';

const deleteDriverSchema = z.object({
  confirmation: z.literal('DELETE DRIVER DATA'),
});

// ---------------------------------------------------------------------------
// Helper: auth + profile with org_id and role
// ---------------------------------------------------------------------------
async function authenticateWithOrg(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data: profileData } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  const profile = profileData as Pick<ProfileRow, 'organization_id' | 'role'> | null;
  if (!profile) return null;

  return { user, orgId: profile.organization_id, role: profile.role };
}

// ---------------------------------------------------------------------------
// POST /api/drivers/[id]/delete — GDPR erasure for an individual driver
//
// Anonymizes PII fields on the driver record and associated consents while
// preserving audit trail integrity. The driver record is retained with
// redacted fields so consent records remain linkable for compliance audits.
// ---------------------------------------------------------------------------
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const blocked = await checkRateLimit(request, generalLimiter);
    if (blocked) return blocked;

    const supabase = createClient();
    const admin = createAdminClient();
    const { id } = params;

    // 1. Authenticate
    const auth = await authenticateWithOrg(supabase);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in.' },
        { status: 401 },
      );
    }

    // 2. Only owner or admin can perform GDPR deletion
    if (!['owner', 'admin'].includes(auth.role)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only organization owners or admins can perform GDPR data deletion.' },
        { status: 403 },
      );
    }

    // 3. Validate request body
    const body = await request.json();
    const parsed = deleteDriverSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Confirmation text "DELETE DRIVER DATA" is required.',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }

    // 4. Verify the driver exists and belongs to this organization
    const { data: driverData, error: fetchError } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', id)
      .eq('organization_id', auth.orgId)
      .single();

    const driver = driverData as DriverRow | null;

    if (fetchError || !driver) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Driver not found.' },
        { status: 404 },
      );
    }

    // 5. Audit log (before anonymization)
    await admin.from('audit_log').insert({
      organization_id: auth.orgId,
      actor_id: auth.user.id,
      actor_type: 'user',
      action: 'driver.gdpr_erased',
      resource_type: 'driver',
      resource_id: id,
      details: {
        reason: 'GDPR erasure request',
        initiated_by: auth.user.email,
        driver_name_hash: `${driver.first_name.charAt(0)}***${driver.last_name.charAt(0)}***`,
      },
    });

    // 6. Anonymize the driver record — preserve structure but redact PII
    const { error: updateDriverError } = await admin
      .from('drivers')
      .update({
        first_name: ANONYMIZED_VALUE,
        last_name: ANONYMIZED_VALUE,
        email: null,
        phone: null,
        cdl_number: null,
        cdl_state: null,
        date_of_birth: null,
        is_active: false,
        metadata: { gdpr_erased: true, erased_at: new Date().toISOString() },
      })
      .eq('id', id)
      .eq('organization_id', auth.orgId);

    if (updateDriverError) {
      console.error('[POST /api/drivers/[id]/delete] driver anonymization error:', updateDriverError);
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to anonymize driver record.' },
        { status: 500 },
      );
    }

    // 7. Anonymize PII in associated consent records
    // Nullify snapshot data and signature data while preserving the consent record
    const { data: consents } = await admin
      .from('consents')
      .select('id')
      .eq('driver_id', id)
      .eq('organization_id', auth.orgId);

    if (consents && consents.length > 0) {
      for (const consent of consents) {
        await admin
          .from('consents')
          .update({
            driver_snapshot: null,
            signature_data: null,
            signer_ip: null,
            signer_user_agent: null,
            delivery_address: ANONYMIZED_VALUE,
            metadata: { gdpr_erased: true, erased_at: new Date().toISOString() },
          })
          .eq('id', consent.id)
          .eq('organization_id', auth.orgId);
      }
    }

    // 8. Delete consent PDFs for this driver from storage
    if (consents && consents.length > 0) {
      const { data: consentsWithPdfs } = await admin
        .from('consents')
        .select('id, pdf_storage_path')
        .eq('driver_id', id)
        .eq('organization_id', auth.orgId);

      const pdfPaths = (consentsWithPdfs ?? [])
        .map((c) => c.pdf_storage_path)
        .filter((path): path is string => path !== null);

      if (pdfPaths.length > 0) {
        await admin.storage.from('consent-pdfs').remove(pdfPaths);
      }

      // Nullify PDF references after storage deletion
      for (const consent of consentsWithPdfs ?? []) {
        if (consent.pdf_storage_path) {
          await admin
            .from('consents')
            .update({
              pdf_storage_path: null,
              pdf_hash: null,
            })
            .eq('id', consent.id)
            .eq('organization_id', auth.orgId);
        }
      }
    }

    // 9. Anonymize query records for this driver
    await admin
      .from('query_records')
      .update({
        result_notes: null,
      })
      .eq('driver_id', id)
      .eq('organization_id', auth.orgId);

    return NextResponse.json({
      data: {
        erased: true,
        driver_id: id,
        consents_anonymized: consents?.length ?? 0,
      },
    });
  } catch (err) {
    console.error('[POST /api/drivers/[id]/delete]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred during driver data erasure.' },
      { status: 500 },
    );
  }
}
