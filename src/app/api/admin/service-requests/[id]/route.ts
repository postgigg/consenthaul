import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserApi } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/types/database';

type ServiceRequestRow = Database['public']['Tables']['service_requests']['Row'];
type ServiceRequestStatus = ServiceRequestRow['status'];

const validStatuses: ServiceRequestStatus[] = [
  'pending', 'quoted', 'deposit_paid', 'in_progress', 'completed', 'cancelled', 'refunded',
];

// ---------------------------------------------------------------------------
// PATCH /api/admin/service-requests/[id] — Update a service request (admin)
// ---------------------------------------------------------------------------
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getAdminUserApi();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = createAdminClient();

    // Build update payload
    const update: Record<string, unknown> = {};

    if (body.quoted_amount !== undefined) {
      update.quoted_amount = body.quoted_amount;
      update.quoted_at = new Date().toISOString();
    }

    if (body.admin_notes !== undefined) {
      update.admin_notes = body.admin_notes;
    }

    if (body.status !== undefined) {
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 422 });
      }
      update.status = body.status;

      // Set status-specific timestamps
      if (body.status === 'in_progress') {
        update.started_at = new Date().toISOString();
      } else if (body.status === 'completed') {
        update.completed_at = new Date().toISOString();
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 422 });
    }

    const { data, error } = await supabase
      .from('service_requests')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[PATCH /api/admin/service-requests/[id]]', error);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ data: data as ServiceRequestRow });
  } catch (err) {
    console.error('[PATCH /api/admin/service-requests/[id]]', err);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
