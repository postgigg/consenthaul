import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { decrypt } from '@/lib/encryption';

export async function POST(
  _request: NextRequest,
  { params }: { params: { key: string } }
) {
  const admin = await getAdminUserApi();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('platform_config')
    .select('encrypted_value')
    .eq('key', params.key)
    .single();

  if (error || !data) {
    // Fall back to env var
    const envVal = process.env[params.key];
    if (envVal) {
      return NextResponse.json({ value: envVal });
    }
    return NextResponse.json({ error: 'Config key not found' }, { status: 404 });
  }

  try {
    const value = decrypt(data.encrypted_value);

    // Audit the reveal
    await supabase.from('audit_log').insert({
      organization_id: admin.organization_id,
      actor_id: admin.id,
      actor_type: 'platform_admin',
      action: 'reveal_config',
      resource_type: 'platform_config',
      resource_id: params.key,
      details: { key: params.key },
    });

    return NextResponse.json({ value });
  } catch {
    return NextResponse.json({ error: 'Failed to decrypt value' }, { status: 500 });
  }
}
