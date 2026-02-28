import { NextResponse } from 'next/server';

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'ConsentHaul API',
    description: 'FMCSA Clearinghouse consent collection API',
    version: '1.0.0',
    contact: { email: 'support@consenthaul.com' },
  },
  servers: [
    { url: 'https://consenthaul.com/api/v1', description: 'Production' },
  ],
  security: [{ ApiKeyAuth: [] }],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: 'API key prefixed with "Bearer "',
      },
    },
    schemas: {
      Consent: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          organization_id: { type: 'string', format: 'uuid' },
          driver_id: { type: 'string', format: 'uuid' },
          consent_type: { type: 'string', enum: ['limited_query', 'pre_employment', 'blanket'] },
          status: { type: 'string', enum: ['pending', 'sent', 'delivered', 'opened', 'signed', 'expired', 'revoked', 'failed'] },
          language: { type: 'string', enum: ['en', 'es'] },
          delivery_method: { type: 'string', enum: ['sms', 'whatsapp', 'email', 'manual'] },
          signed_at: { type: 'string', format: 'date-time', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Driver: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          email: { type: 'string', nullable: true },
          phone: { type: 'string', nullable: true },
          cdl_number: { type: 'string', nullable: true },
          cdl_state: { type: 'string', nullable: true },
          is_active: { type: 'boolean' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/consents': {
      get: {
        summary: 'List consents',
        tags: ['Consents'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'per_page', in: 'query', schema: { type: 'integer', default: 25 } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'driver_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'List of consents', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { '$ref': '#/components/schemas/Consent' } } } } } } },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        summary: 'Create a consent request',
        tags: ['Consents'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['driver_id', 'delivery_method'],
                properties: {
                  driver_id: { type: 'string', format: 'uuid' },
                  consent_type: { type: 'string', enum: ['limited_query', 'pre_employment', 'blanket'], default: 'limited_query' },
                  delivery_method: { type: 'string', enum: ['sms', 'whatsapp', 'email', 'manual'] },
                  delivery_address: { type: 'string' },
                  language: { type: 'string', enum: ['en', 'es'] },
                  consent_start_date: { type: 'string', format: 'date' },
                  consent_end_date: { type: 'string', format: 'date', nullable: true },
                  query_frequency: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Consent created' },
          401: { description: 'Unauthorized' },
          402: { description: 'Insufficient credits' },
          422: { description: 'Validation error' },
        },
      },
    },
    '/drivers': {
      get: {
        summary: 'List drivers',
        tags: ['Drivers'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'per_page', in: 'query', schema: { type: 'integer', default: 25 } },
        ],
        responses: {
          200: { description: 'List of drivers' },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        summary: 'Create a driver',
        tags: ['Drivers'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['first_name', 'last_name'],
                properties: {
                  first_name: { type: 'string' },
                  last_name: { type: 'string' },
                  phone: { type: 'string' },
                  email: { type: 'string' },
                  cdl_number: { type: 'string' },
                  cdl_state: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Driver created' },
          401: { description: 'Unauthorized' },
          422: { description: 'Validation error' },
        },
      },
    },
    '/webhooks': {
      get: { summary: 'List webhook endpoints', tags: ['Webhooks'], responses: { 200: { description: 'List of webhooks' } } },
      post: { summary: 'Create webhook endpoint', tags: ['Webhooks'], responses: { 201: { description: 'Webhook created' } } },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec, {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
}
