import { describe, it, expect, beforeEach } from 'vitest';
import { billingTools } from '../../tools/billing.js';
import { createMockClient } from '../helpers/mock-client.js';

describe('billing tools', () => {
  let client: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    client = createMockClient();
  });

  describe('get_credit_balance', () => {
    it('has an empty input schema', () => {
      expect(billingTools.get_credit_balance.inputSchema.safeParse({}).success).toBe(true);
    });

    it('calls client.get with /billing/credits', async () => {
      await billingTools.get_credit_balance.handler(client);
      expect(client.get).toHaveBeenCalledWith('/billing/credits');
    });
  });

  describe('list_credit_packs', () => {
    it('has an empty input schema', () => {
      expect(billingTools.list_credit_packs.inputSchema.safeParse({}).success).toBe(true);
    });

    it('returns static data without calling client', async () => {
      const result = await billingTools.list_credit_packs.handler(client);

      expect(client.get).not.toHaveBeenCalled();
      expect(client.post).not.toHaveBeenCalled();

      const data = result as { packs: unknown[]; purchase_url: string; note: string };
      expect(data.packs).toHaveLength(4);
      expect(data.purchase_url).toBe('https://app.consenthaul.com/billing');
      expect(data.note).toContain('Credits never expire');
    });

    it('returns correct pack pricing', async () => {
      const result = await billingTools.list_credit_packs.handler(client);
      const data = result as { packs: { credits: number; price_usd: number; popular?: boolean }[] };

      expect(data.packs[0]).toMatchObject({ credits: 10, price_usd: 30 });
      expect(data.packs[1]).toMatchObject({ credits: 50, price_usd: 125, popular: true });
      expect(data.packs[2]).toMatchObject({ credits: 200, price_usd: 400 });
      expect(data.packs[3]).toMatchObject({ credits: 1000, price_usd: 1500 });
    });
  });
});
