import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  TEST_USER_ID,
  TEST_CONSENT_ID,
  TEST_CONSENT,
} from '@/__tests__/helpers/fixtures';

// ---- Mocks ----
const mockSingle = vi.fn();
const mockGetUser = vi.fn();

const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: mockSingle,
        eq: vi.fn(() => ({
          single: mockSingle,
          order: vi.fn(() => ({ limit: vi.fn(() => ({ single: mockSingle })) })),
        })),
      })),
    })),
    update: vi.fn(() => ({ eq: vi.fn() })),
    insert: vi.fn(),
  })),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ getAll: vi.fn(() => []), set: vi.fn() })),
}));

const mockSendSMS = vi.fn().mockResolvedValue({ sid: 'SM_resend' });
const mockSendWhatsApp = vi.fn().mockResolvedValue({ sid: 'WA_resend' });
const mockSendEmail = vi.fn().mockResolvedValue({ messageId: 'msg_resend' });

vi.mock('@/lib/messaging/sms', () => ({ sendConsentSMS: (...args: unknown[]) => mockSendSMS(...args) }));
vi.mock('@/lib/messaging/whatsapp', () => ({ sendConsentWhatsApp: (...args: unknown[]) => mockSendWhatsApp(...args) }));
vi.mock('@/lib/messaging/email', () => ({ sendConsentEmail: (...args: unknown[]) => mockSendEmail(...args) }));

const { POST } = await import('../route');

const params = { params: { id: TEST_CONSENT_ID } };

function makeReq() {
  return new NextRequest('https://app.test.com/api/consents/' + TEST_CONSENT_ID + '/resend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
}

const consentWithDriver = {
  ...TEST_CONSENT,
  driver: { id: TEST_CONSENT.driver_id, first_name: 'John', last_name: 'Doe', phone: '+15551234567', email: 'john@test.com' },
};

describe('POST /api/consents/[id]/resend', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no' } });
    const res = await POST(makeReq(), params);
    expect(res.status).toBe(401);
  });

  it('returns 409 when consent already signed', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle.mockReturnValueOnce({
      data: { ...consentWithDriver, status: 'signed' },
      error: null,
    });
    const res = await POST(makeReq(), params);
    expect(res.status).toBe(409);
  });

  it('returns 409 when consent revoked', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle.mockReturnValueOnce({
      data: { ...consentWithDriver, status: 'revoked' },
      error: null,
    });
    const res = await POST(makeReq(), params);
    expect(res.status).toBe(409);
  });

  it('returns 410 when token expired', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle.mockReturnValueOnce({
      data: { ...consentWithDriver, signing_token_expires_at: '2020-01-01T00:00:00Z' },
      error: null,
    });
    const res = await POST(makeReq(), params);
    expect(res.status).toBe(410);
  });

  it('resends via SMS and returns success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle
      .mockReturnValueOnce({ data: consentWithDriver, error: null }) // consent lookup
      .mockReturnValueOnce({ data: { id: 'notif-1', attempts: 1 }, error: null }); // existing notification
    const res = await POST(makeReq(), params);
    expect(res.status).toBe(200);
    expect(mockSendSMS).toHaveBeenCalled();
  });

  it('resends via email for email consents', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle
      .mockReturnValueOnce({
        data: { ...consentWithDriver, delivery_method: 'email', delivery_address: 'john@test.com' },
        error: null,
      })
      .mockReturnValueOnce({ data: null, error: { message: 'not found' } }); // no existing notification
    const res = await POST(makeReq(), params);
    expect(res.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalled();
  });

  it('returns 502 on delivery failure', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    mockSingle.mockReturnValueOnce({ data: consentWithDriver, error: null });
    mockSendSMS.mockRejectedValueOnce(new Error('Twilio down'));
    const res = await POST(makeReq(), params);
    expect(res.status).toBe(502);
  });
});
