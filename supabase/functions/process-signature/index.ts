// supabase/functions/process-signature/index.ts
//
// Deno Edge Function — triggered after a driver submits their signature.
// Receives a consent_id, generates the PDF, uploads it to storage, and
// updates the consent record with PDF metadata.
//
// Invoke: POST /functions/v1/process-signature { consent_id: "..." }
// ---------------------------------------------------------------------------

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts';
import { encode as hexEncode } from 'https://deno.land/std@0.177.0/encoding/hex.ts';

// ---------------------------------------------------------------------------
// CORS headers for edge function invocations
// ---------------------------------------------------------------------------

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
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

    // 2. Create Supabase admin client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Fetch the consent with driver and organization joins
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

    // Only process signed consents
    if (consent.status !== 'signed') {
      return new Response(
        JSON.stringify({ error: 'Consent is not in signed state', status: consent.status }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 4. Call the generate-pdf function to create and upload the PDF
    const generatePdfUrl = `${supabaseUrl}/functions/v1/generate-pdf`;

    const pdfResponse = await fetch(generatePdfUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ consent_id }),
    });

    if (!pdfResponse.ok) {
      const pdfError = await pdfResponse.json().catch(() => ({}));
      console.error('[process-signature] generate-pdf failed:', pdfError);

      // Non-fatal: the consent is still signed. Log the failure and return
      // a partial success so the caller knows the signature was recorded.
      return new Response(
        JSON.stringify({
          success: true,
          consent_id,
          pdf_generated: false,
          message: 'Signature processed but PDF generation failed. PDF can be retried.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const pdfResult = await pdfResponse.json();

    // 5. Log to audit trail
    await supabase.from('audit_log').insert({
      organization_id: consent.organization_id,
      actor_id: null,
      actor_type: 'system',
      action: 'consent.pdf_generated',
      resource_type: 'consent',
      resource_id: consent_id,
      details: {
        pdf_storage_path: pdfResult.pdf_storage_path,
        pdf_hash: pdfResult.pdf_hash,
        triggered_by: 'process-signature',
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        consent_id,
        pdf_generated: true,
        pdf_storage_path: pdfResult.pdf_storage_path,
        pdf_hash: pdfResult.pdf_hash,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[process-signature] unhandled error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
