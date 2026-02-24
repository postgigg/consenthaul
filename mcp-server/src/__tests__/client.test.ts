import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConsentHaulClient } from '../client.js';

describe('ConsentHaulClient', () => {
  let client: ConsentHaulClient;

  beforeEach(() => {
    client = new ConsentHaulClient('ch_test_key123', 'https://app.test.com');
    vi.restoreAllMocks();
  });

  it('injects Bearer auth header', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    await client.get('/drivers');

    expect(spy).toHaveBeenCalledOnce();
    const req = spy.mock.calls[0];
    expect(req[1]?.headers).toEqual(
      expect.objectContaining({ Authorization: 'Bearer ch_test_key123' }),
    );
  });

  it('prefixes paths with /api/v1', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    await client.get('/drivers');

    const url = spy.mock.calls[0][0] as string;
    expect(url).toContain('/api/v1/drivers');
  });

  it('strips trailing slashes from base URL', async () => {
    const c = new ConsentHaulClient('key', 'https://app.test.com///');
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    await c.get('/test');

    const url = spy.mock.calls[0][0] as string;
    expect(url).toMatch(/^https:\/\/app\.test\.com\/api\/v1\/test/);
  });

  it('serializes query params and skips undefined', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    await client.get('/drivers', { page: '1', search: undefined, is_active: 'true' });

    const url = new URL(spy.mock.calls[0][0] as string);
    expect(url.searchParams.get('page')).toBe('1');
    expect(url.searchParams.get('is_active')).toBe('true');
    expect(url.searchParams.has('search')).toBe(false);
  });

  it('serializes JSON body for POST', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    await client.post('/drivers', { first_name: 'Test' });

    const body = spy.mock.calls[0][1]?.body as string;
    expect(JSON.parse(body)).toEqual({ first_name: 'Test' });
  });

  it('extracts .error from error response body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Not Found', message: 'Driver not found.' }), { status: 404 }),
    );

    await expect(client.get('/drivers/bad-id')).rejects.toMatchObject({
      status: 404,
      message: 'Not Found',
    });
  });

  it('falls back to generic message for non-JSON error', async () => {
    // The client tries .json() first then .text() — but a plain-text Response
    // can only be read once. Provide a mock Response whose .json() rejects
    // and .text() resolves so the fallback path is exercised.
    const fakeResponse = {
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
      text: vi.fn().mockResolvedValue('Internal Server Error'),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(fakeResponse as unknown as Response);

    await expect(client.get('/boom')).rejects.toMatchObject({
      status: 500,
      message: 'API request failed with status 500',
    });
  });

  it('PATCH delegates to request with correct method', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    await client.patch('/drivers/123', { first_name: 'Updated' });

    expect(spy.mock.calls[0][1]?.method).toBe('PATCH');
  });

  it('DELETE delegates to request with correct method', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    await client.delete('/drivers/123');

    expect(spy.mock.calls[0][1]?.method).toBe('DELETE');
    expect(spy.mock.calls[0][1]?.body).toBeUndefined();
  });
});
