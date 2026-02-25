import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRequestSchema } from '@/lib/validators';
import { sendServiceRequestNotificationEmail } from '@/lib/messaging/email';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type OrganizationRow = Database['public']['Tables']['organizations']['Row'];
type ServiceRequestRow = Database['public']['Tables']['service_requests']['Row'];

// ---------------------------------------------------------------------------
// GET /api/service-requests — List org's service requests
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/service-requests]', error);
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }

    return NextResponse.json({ data: data as ServiceRequestRow[] });
  } catch (err) {
    console.error('[GET /api/service-requests]', err);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/service-requests — Create a new service request
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createServiceRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation Error', details: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    // Get profile + org
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, organization_id, email, full_name')
      .eq('id', user.id)
      .single();

    const profile = profileData as Pick<ProfileRow, 'id' | 'organization_id' | 'email' | 'full_name'> | null;
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { data: orgData } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', profile.organization_id)
      .single();

    const org = orgData as Pick<OrganizationRow, 'id' | 'name'> | null;

    // Insert service request
    const { data: requestData, error: insertError } = await supabase
      .from('service_requests')
      .insert({
        organization_id: profile.organization_id,
        requested_by: profile.id,
        category: parsed.data.category,
        description: parsed.data.description,
        urgency: parsed.data.urgency,
        tms_system: parsed.data.tms_system || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[POST /api/service-requests]', insertError);
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
    }

    const serviceRequest = requestData as ServiceRequestRow;

    // Fire-and-forget: admin notification
    sendServiceRequestNotificationEmail({
      category: parsed.data.category,
      description: parsed.data.description,
      urgency: parsed.data.urgency,
      tmsSystem: parsed.data.tms_system || null,
      orgName: org?.name || 'Unknown',
      userEmail: profile.email,
      userName: profile.full_name,
    }).catch((err) => console.error('[service-request] Admin notification failed:', err));

    // Audit log
    await supabase.from('audit_log').insert({
      organization_id: profile.organization_id,
      actor_id: user.id,
      actor_type: 'user',
      action: 'service_request.created',
      resource_type: 'service_request',
      resource_id: serviceRequest.id,
      details: {
        category: parsed.data.category,
        urgency: parsed.data.urgency,
      },
    });

    return NextResponse.json({ data: serviceRequest }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/service-requests]', err);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
