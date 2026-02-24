// supabase/functions/generate-pdf/index.ts
//
// Deno Edge Function — generates a PDF for a signed consent.
// Fetches consent + driver + org data, builds a PDF document,
// uploads to Supabase Storage bucket 'consent-pdfs', and updates
// the consent record with pdf_storage_path, pdf_hash, pdf_generated_at.
//
// Invoke: POST /functions/v1/generate-pdf { consent_id: "..." }
// ---------------------------------------------------------------------------

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts';
import { encode as hexEncode } from 'https://deno.land/std@0.177.0/encoding/hex.ts';

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ---------------------------------------------------------------------------
// FMCSA consent text (embedded to avoid cross-function imports in Deno)
// ---------------------------------------------------------------------------

function getConsentBodyEN(
  driverName: string,
  companyName: string,
  startDate: string,
  endDate: string,
  frequency: string,
): string {
  return (
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
    `through the return-to-duty process, whichever is later.`
  );
}

function getConsentBodyES(
  driverName: string,
  companyName: string,
  startDate: string,
  endDate: string,
  frequency: string,
): string {
  return (
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
    `de violaciones del programa de drogas y alcohol.\n\n` +
    `2. ${companyName} utilizara la informacion recibida del Clearinghouse ` +
    `unicamente para los fines permitidos por las regulaciones del ` +
    `Clearinghouse de la FMCSA.\n\n` +
    `3. Puedo revocar este consentimiento en cualquier momento mediante ` +
    `notificacion escrita a ${companyName}.\n\n` +
    `4. El Clearinghouse de la FMCSA conserva los registros durante cinco ` +
    `(5) anos a partir de la fecha de la determinacion de la violacion.`
  );
}

// ---------------------------------------------------------------------------
// Minimal PDF builder (no external libraries required in Deno edge functions)
//
// Produces a text-based PDF. For production use with signature images,
// this would be swapped for a full PDF library (e.g. pdf-lib loaded via esm.sh).
// ---------------------------------------------------------------------------

function buildPdfBuffer(sections: {
  title: string;
  body: string;
  driverName: string;
  companyName: string;
  consentId: string;
  signedAt: string;
  signerIp: string;
  signatureHash: string;
  generatedAt: string;
}): Uint8Array {
  const {
    title,
    body,
    driverName,
    companyName,
    consentId,
    signedAt,
    signerIp,
    signatureHash,
    generatedAt,
  } = sections;

  // Build a simple text-based PDF using the PDF specification directly.
  // This is intentionally minimal; in production, pdf-lib or @react-pdf would
  // be used for richer formatting and embedded signature images.

  const lines: string[] = [];
  lines.push(`${title}`);
  lines.push('');
  lines.push(`Consent ID: ${consentId}`);
  lines.push(`Driver: ${driverName}`);
  lines.push(`Company: ${companyName}`);
  lines.push('');
  lines.push('--- CONSENT TEXT ---');
  lines.push('');
  lines.push(body);
  lines.push('');
  lines.push('--- SIGNATURE RECORD ---');
  lines.push('');
  lines.push(`Signed at: ${signedAt}`);
  lines.push(`Signer IP: ${signerIp}`);
  lines.push(`Signature Hash (SHA-256): ${signatureHash}`);
  lines.push(`PDF Generated at: ${generatedAt}`);

  const textContent = lines.join('\n');

  // Encode a minimal valid PDF with the text content embedded as a text stream.
  // This is a simplification; real PDFs would use proper font resources.
  const streamContent = `BT /F1 10 Tf 50 750 Td (${escPdfString(title)}) Tj ET\n` +
    `BT /F1 8 Tf 50 730 Td (Consent ID: ${escPdfString(consentId)}) Tj ET\n` +
    `BT /F1 8 Tf 50 715 Td (Driver: ${escPdfString(driverName)}) Tj ET\n` +
    `BT /F1 8 Tf 50 700 Td (Company: ${escPdfString(companyName)}) Tj ET\n` +
    `BT /F1 8 Tf 50 680 Td (Signed: ${escPdfString(signedAt)}) Tj ET\n` +
    `BT /F1 8 Tf 50 665 Td (Signer IP: ${escPdfString(signerIp)}) Tj ET\n` +
    `BT /F1 8 Tf 50 650 Td (Signature Hash: ${escPdfString(signatureHash)}) Tj ET\n` +
    `BT /F1 8 Tf 50 630 Td (Generated: ${escPdfString(generatedAt)}) Tj ET\n`;

  // Build minimal PDF structure
  const objects: string[] = [];

  // Object 1: Catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  // Object 2: Pages
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  // Object 3: Page
  objects.push(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ' +
    '/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj'
  );
  // Object 4: Content stream
  objects.push(
    `4 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj`
  );
  // Object 5: Font
  objects.push(
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj'
  );

  // Build the full PDF
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];

  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj + '\n';
  }

  const xrefOffset = pdf.length;
  pdf += 'xref\n';
  pdf += `0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += 'trailer\n';
  pdf += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += 'startxref\n';
  pdf += `${xrefOffset}\n`;
  pdf += '%%EOF\n';

  return new TextEncoder().encode(pdf);
}

function escPdfString(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\n/g, ' ');
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Parse input
    const { consent_id } = await req.json();

    if (!consent_id || typeof consent_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'consent_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 2. Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Fetch consent + driver + organization
    const { data: consent, error: fetchError } = await supabase
      .from('consents')
      .select('*, driver:drivers(*), organization:organizations(*)')
      .eq('id', consent_id)
      .single();

    if (fetchError || !consent) {
      return new Response(
        JSON.stringify({ error: 'Consent not found', details: fetchError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Use snapshots if available, fall back to live data
    const driverData = (consent.driver_snapshot ?? consent.driver) as Record<string, string>;
    const orgData = (consent.organization_snapshot ?? consent.organization) as Record<string, string>;

    const driverName = [driverData.first_name, driverData.last_name].filter(Boolean).join(' ');
    const companyName = orgData.name ?? 'Unknown Organization';
    const language = consent.language ?? 'en';
    const frequency = consent.query_frequency ?? 'annual';

    // 4. Build consent text
    const getBody = language === 'es' ? getConsentBodyES : getConsentBodyEN;
    const title =
      language === 'es'
        ? 'Consentimiento del FMCSA Drug & Alcohol Clearinghouse'
        : 'FMCSA Drug & Alcohol Clearinghouse Consent';

    const bodyText = getBody(
      driverName,
      companyName,
      consent.consent_start_date,
      consent.consent_end_date ?? '',
      frequency,
    );

    const generatedAt = new Date().toISOString();

    // 5. Generate PDF buffer
    const pdfBuffer = buildPdfBuffer({
      title,
      body: bodyText,
      driverName,
      companyName,
      consentId: consent.id,
      signedAt: consent.signed_at ?? '',
      signerIp: consent.signer_ip ?? 'unknown',
      signatureHash: consent.signature_hash ?? '',
      generatedAt,
    });

    // 6. Compute SHA-256 hash of the PDF
    const hashBuffer = await crypto.subtle.digest('SHA-256', pdfBuffer);
    const pdfHash = new TextDecoder().decode(hexEncode(new Uint8Array(hashBuffer)));

    // 7. Upload to Supabase Storage bucket 'consent-pdfs'
    const storagePath = `${consent.organization_id}/${consent.id}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('consent-pdfs')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('[generate-pdf] upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload PDF', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 8. Update consent record with PDF metadata
    const { error: updateError } = await supabase
      .from('consents')
      .update({
        pdf_storage_path: storagePath,
        pdf_hash: pdfHash,
        pdf_generated_at: generatedAt,
      })
      .eq('id', consent_id);

    if (updateError) {
      console.error('[generate-pdf] update error:', updateError);
      // PDF was uploaded successfully; the metadata update failure is logged
      // but we still return the path so the caller knows the PDF exists.
    }

    return new Response(
      JSON.stringify({
        success: true,
        consent_id,
        pdf_storage_path: storagePath,
        pdf_hash: pdfHash,
        pdf_generated_at: generatedAt,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[generate-pdf] unhandled error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
