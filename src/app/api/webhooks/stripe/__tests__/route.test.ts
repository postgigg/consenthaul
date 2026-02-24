import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---- Mocks ----
const mockSingle = vi.fn();
const mockRpc = vi.fn();
const mockConstructEvent = vi.fn();

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => ({ single: mockSingle })),
        })),
      })),
    })),
    insert: vi.fn(),
  })),
  rpc: mockRpc,
};

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockSupabase),
}));

vi.mock('@/lib/stripe/credits', () => ({
  CREDIT_PACKS: [
    { id: 'pack_10', credits: 10, label: '10 Credits' },
    { id: 'pack_50', credits: 50, label: '50 Credits' },
  ],
}));

// Stripe is imported as default: `import Stripe from 'stripe'`
// Then used as `new Stripe(key, opts)` at module top-level.
// We need the default export to be a constructor that returns our mock.
vi.mock('stripe', () => {
  function MockStripe() {
    return { webhooks: { constructEvent: mockConstructEvent } };
  }
  return { default: MockStripe };
});

const { POST } = await import('../route');

function makeReq(body: string, signature = 'sig_test') {
  return new NextRequest('https://app.test.com/api/webhooks/stripe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': signature,
    },
    body,
  });
}

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when stripe-signature header missing', async () => {
    const res = await POST(new NextRequest('https://app.test.com/api/webhooks/stripe', {
      method: 'POST',
      body: '{}',
    }));
    expect(res.status).toBe(400);
  });

  it('returns 401 on invalid signature', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });
    const res = await POST(makeReq('{}'));
    expect(res.status).toBe(401);
  });

  it('handles checkout.session.completed and adds credits', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test',
          payment_intent: 'pi_test',
          metadata: { organization_id: 'org-1', pack_id: 'pack_50', user_id: 'user-1' },
          amount_total: 5000,
          currency: 'usd',
        },
      },
    });

    mockSingle.mockReturnValueOnce({ data: null, error: { message: 'not found' } }); // no duplicate
    mockRpc.mockReturnValueOnce({ data: 50, error: null }); // add_credits

    const res = await POST(makeReq('{}'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('add_credits', expect.objectContaining({
      p_org_id: 'org-1',
      p_amount: 50,
    }));
  });

  it('idempotency: skips duplicate payment', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test',
          payment_intent: 'pi_duplicate',
          metadata: { organization_id: 'org-1', pack_id: 'pack_50' },
        },
      },
    });

    mockSingle.mockReturnValueOnce({ data: { id: 'existing-tx' }, error: null }); // duplicate found

    const res = await POST(makeReq('{}'));
    expect(res.status).toBe(200);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('handles unrecognized event types gracefully', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: { object: {} },
    });

    const res = await POST(makeReq('{}'));
    expect(res.status).toBe(200);
  });
});
