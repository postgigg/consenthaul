import { NextRequest } from 'next/server';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  searchParams?: Record<string, string>;
}

/**
 * Build a NextRequest for testing route handlers.
 */
export function buildRequest(path: string, options: RequestOptions = {}): NextRequest {
  const { method = 'GET', body, headers = {}, searchParams = {} } = options;

  const url = new URL(path, 'https://app.test.com');
  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value);
  }

  const init: RequestInit & { headers: Record<string, string> } = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    init.body = JSON.stringify(body);
  }

  return new NextRequest(url, init);
}

/**
 * Build a NextRequest with a Bearer API key header.
 */
export function buildApiRequest(path: string, options: RequestOptions & { apiKey?: string } = {}): NextRequest {
  const { apiKey = 'ch_test_1234567890abcdef', ...rest } = options;
  return buildRequest(path, {
    ...rest,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...rest.headers,
    },
  });
}
