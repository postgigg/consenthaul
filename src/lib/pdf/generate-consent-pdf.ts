import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { createHash } from 'crypto';
import { LimitedQueryEn } from './templates/limited-query-en';
import { LimitedQueryEs } from './templates/limited-query-es';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConsentData {
  id: string;
  consent_type: string;
  language?: string;
  consent_start_date: string;
  consent_end_date: string | null;
  query_frequency: string | null;
  signed_at: string | null;
  signer_ip: string | null;
  signature_data: string | null;
  signature_hash: string | null;
  driver_snapshot: Record<string, unknown> | null;
  organization_snapshot: Record<string, unknown> | null;
}

interface DriverData {
  first_name?: string;
  last_name?: string;
  cdl_number?: string | null;
  cdl_state?: string | null;
  date_of_birth?: string | null;
  [key: string]: unknown;
}

interface OrganizationData {
  name?: string;
  dot_number?: string | null;
  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  [key: string]: unknown;
}

export interface GenerateConsentPDFParams {
  consent: ConsentData;
  driver: DriverData;
  organization: OrganizationData;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Generate a PDF for a signed consent record.
 *
 * Uses the point-in-time snapshots stored on the consent record when available,
 * falling back to the live driver/organization data passed in. Returns the raw
 * PDF buffer — the caller is responsible for uploading it to storage.
 */
export async function generateConsentPDF({
  consent,
  driver,
  organization,
}: GenerateConsentPDFParams): Promise<Buffer> {
  const generatedAt = new Date().toISOString();

  // Prefer snapshot data (immutable at time of signing) over live data
  const driverSnap = (consent.driver_snapshot ?? driver) as DriverData;
  const orgSnap = (consent.organization_snapshot ?? organization) as OrganizationData;

  // Build the address string from component parts
  const addressParts = [
    orgSnap.address_line1,
    orgSnap.city,
    orgSnap.state,
    orgSnap.zip,
  ].filter(Boolean);
  const address = addressParts.length > 0 ? addressParts.join(', ') : null;

  const driverName = [driverSnap.first_name, driverSnap.last_name]
    .filter(Boolean)
    .join(' ');

  // Shared props for both language templates
  const templateProps = {
    consent: {
      id: consent.id,
      consent_type: consent.consent_type,
      consent_start_date: consent.consent_start_date,
      consent_end_date: consent.consent_end_date,
      query_frequency: consent.query_frequency,
      signed_at: consent.signed_at,
      signer_ip: consent.signer_ip,
    },
    driver: {
      name: driverName,
      cdl_number: (driverSnap.cdl_number as string) ?? null,
      cdl_state: (driverSnap.cdl_state as string) ?? null,
      date_of_birth: (driverSnap.date_of_birth as string) ?? null,
    },
    organization: {
      name: (orgSnap.name as string) ?? 'Unknown Organization',
      dot_number: (orgSnap.dot_number as string) ?? null,
      address,
    },
    signatureDataUrl: consent.signature_data,
    generatedAt,
  };

  // Select the correct language template
  const language = consent.language ?? 'en';
  const doc =
    language === 'es'
      ? React.createElement(LimitedQueryEs, templateProps)
      : React.createElement(LimitedQueryEn, templateProps);

  const buffer = await renderToBuffer(doc as React.ReactElement);

  // Return a Node.js Buffer (renderToBuffer may return a Uint8Array in some versions)
  return Buffer.from(buffer);
}

/**
 * Generate the consent PDF and compute its SHA-256 hash in one step.
 *
 * Convenience wrapper used when both the buffer and hash are needed (e.g.
 * immediately after signing).
 */
export async function generateConsentPDFWithHash(
  params: GenerateConsentPDFParams,
): Promise<{ buffer: Buffer; hash: string }> {
  const buffer = await generateConsentPDF(params);
  const hash = createHash('sha256').update(buffer).digest('hex');
  return { buffer, hash };
}
