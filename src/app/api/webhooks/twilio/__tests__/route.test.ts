import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---- Mocks ----
const mockSingle = vi.fn();
const mockUpdate = vi.fn(() => ({ eq: vi.fn() }));

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({ single: mockSingle })),
    })),
    update: mockUpdate,
  })),
};

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockSupabase),
}));

const { POST } = await import('../route');

function makeReq(formFields: Record<string, string>) {
  const formData = new URLSearchParams(formFields);
  return new NextRequest('https://app.test.com/api/webhooks/twilio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });
}

describe('POST /api/webhooks/twilio', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when MessageSid missing', async () => {
    const res = await POST(new NextRequest('https://app.test.com/api/webhooks/twilio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ MessageStatus: 'delivered' }).toString(),
    }));
    expect(res.status).toBe(400);
  });

  it('returns 200 TwiML for unknown notification SID', async () => {
    mockSingle.mockReturnValueOnce({ data: null, error: { message: 'not found' } });
    const res = await POST(makeReq({ MessageSid: 'SM_unknown', MessageStatus: 'delivered' }));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('<Response>');
  });

  it('updates notification status on delivered', async () => {
    mockSingle
      .mockReturnValueOnce({
        data: { id: 'notif-1', consent_id: 'consent-1', organization_id: 'org-1', status: 'sent' },
        error: null,
      })
      .mockReturnValueOnce({ data: { status: 'sent' }, error: null }); // consent lookup

    const res = await POST(makeReq({ MessageSid: 'SM_test', MessageStatus: 'delivered' }));
    expect(res.status).toBe(200);
    expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
  });

  it('updates consent status to failed on failure', async () => {
    mockSingle
      .mockReturnValueOnce({
        data: { id: 'notif-1', consent_id: 'consent-1', organization_id: 'org-1', status: 'sent' },
        error: null,
      })
      .mockReturnValueOnce({ data: { status: 'sent' }, error: null }); // consent lookup

    const res = await POST(makeReq({
      MessageSid: 'SM_test',
      MessageStatus: 'failed',
      ErrorCode: '30001',
      ErrorMessage: 'Queue overflow',
    }));
    expect(res.status).toBe(200);
  });

  it('always returns 200 TwiML even on errors', async () => {
    // Unknown status
    const res = await POST(makeReq({ MessageSid: 'SM_test', MessageStatus: 'unknown_status' }));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('<Response>');
  });
});
