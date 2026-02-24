import { randomBytes, createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

const VALID_SCOPES = [
  'drivers:read',
  'drivers:write',
  'consents:read',
  'consents:write',
  'billing:read',
];

// ---------------------------------------------------------------------------
// POST /api/v1/api-keys — Create a new API key (authenticated via session)
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const supabase = createClient();

    // 1. Verify the user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in.' },
        { status: 401 },
      );
    }

    // 2. Get user profile and check role
    const { data: profileData } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    const profile = profileData as Pick<ProfileRow, 'organization_id' | 'role'> | null;

    if (!profile) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Profile not found.' },
        { status: 404 },
      );
    }

    if (profile.role !== 'owner' && profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only owners and admins can create API keys.' },
        { status: 403 },
      );
    }

    // 3. Parse body
    const body = await request.json();
    const { name, scopes } = body as { name?: string; scopes?: string[] };

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Key name is required.' },
        { status: 422 },
      );
    }

    if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'At least one scope is required.' },
        { status: 422 },
      );
    }

    // Validate scopes
    const invalidScopes = scopes.filter((s) => !VALID_SCOPES.includes(s));
    if (invalidScopes.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: `Invalid scopes: ${invalidScopes.join(', ')}`,
        },
        { status: 422 },
      );
    }

    // 4. Generate API key
    const rawKey = `ch_${randomBytes(32).toString('hex')}`;
    const keyPrefix = rawKey.slice(0, 16);
    const keyHash = createHash('sha256').update(rawKey).digest('hex');

    // 5. Insert using admin client (to bypass RLS)
    const admin = createAdminClient();

    const { error: insertError } = await admin.from('api_keys').insert({
      organization_id: profile.organization_id,
      name: name.trim(),
      key_prefix: keyPrefix,
      key_hash: keyHash,
      scopes,
      is_active: true,
      created_by: user.id,
      last_used_at: null,
      expires_at: null,
    });

    if (insertError) {
      console.error('[POST /api/v1/api-keys] insert error:', insertError);
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to create API key.' },
        { status: 500 },
      );
    }

    // 6. Return the raw key (only shown once)
    return NextResponse.json({ key: rawKey }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/v1/api-keys]', err);
    return NextResponse.json(
      { error: 'Internal Error', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
