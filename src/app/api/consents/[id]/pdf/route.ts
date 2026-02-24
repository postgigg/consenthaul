import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type ConsentRow = Database['public']['Tables']['consents']['Row'];

// ---------------------------------------------------------------------------
// GET /api/consents/[id]/pdf — Download the signed consent PDF
// ---------------------------------------------------------------------------
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createClient();
    const { id } = params;

    // 1. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in.' },
        { status: 401 },
      );
    }

    // 2. Get consent — RLS scopes to org
    const { data: consentData, error } = await supabase
      .from('consents')
      .select('id, status, pdf_storage_path, driver:drivers(first_name, last_name)')
      .eq('id', id)
      .single();

    const consent = consentData as (Pick<ConsentRow, 'id' | 'status' | 'pdf_storage_path'> & { driver: unknown }) | null;

    if (error || !consent) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Consent not found.' },
        { status: 404 },
      );
    }

    // 3. Must be signed with a PDF available
    if (consent.status !== 'signed' && consent.status !== 'revoked') {
      return NextResponse.json(
        {
          error: 'Conflict',
          message: 'PDF is only available for signed consents.',
        },
        { status: 409 },
      );
    }

    if (!consent.pdf_storage_path) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: 'PDF has not been generated for this consent yet.',
        },
        { status: 404 },
      );
    }

    // 4. Create a signed download URL (valid for 60 seconds)
    const { data: signedUrl, error: storageError } = await supabase.storage
      .from('consent-pdfs')
      .createSignedUrl(consent.pdf_storage_path, 60);

    if (storageError || !signedUrl?.signedUrl) {
      console.error('[GET /api/consents/[id]/pdf] storage error:', storageError);
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to generate download URL.' },
        { status: 500 },
      );
    }

    // 5. Redirect the client to the signed URL
    return NextResponse.redirect(signedUrl.signedUrl);
  } catch (err) {
    console.error('[GET /api/consents/[id]/pdf]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
