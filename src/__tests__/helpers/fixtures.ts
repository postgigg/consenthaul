export const TEST_ORG_ID = '00000000-0000-4000-a000-000000000001';
export const TEST_USER_ID = '00000000-0000-4000-a000-000000000002';
export const TEST_DRIVER_ID = '00000000-0000-4000-a000-000000000003';
export const TEST_CONSENT_ID = '00000000-0000-4000-a000-000000000004';
export const TEST_KEY_ID = '00000000-0000-4000-a000-000000000005';
export const TEST_NOTIFICATION_ID = '00000000-0000-4000-a000-000000000006';

export const TEST_DRIVER = {
  id: TEST_DRIVER_ID,
  organization_id: TEST_ORG_ID,
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  phone: '+15551234567',
  cdl_number: 'CDL123456',
  cdl_state: 'TX',
  date_of_birth: '1985-06-15',
  hire_date: '2023-01-01',
  termination_date: null,
  preferred_language: 'en',
  metadata: {},
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const TEST_CONSENT = {
  id: TEST_CONSENT_ID,
  organization_id: TEST_ORG_ID,
  driver_id: TEST_DRIVER_ID,
  created_by: TEST_KEY_ID,
  consent_type: 'limited_query' as const,
  status: 'pending' as const,
  language: 'en',
  consent_start_date: '2024-01-01',
  consent_end_date: null,
  query_frequency: null,
  delivery_method: 'sms' as const,
  delivery_address: '+15551234567',
  delivery_sid: null,
  delivered_at: null,
  opened_at: null,
  signing_token: 'ch_sign_abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  signing_token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  signed_at: null,
  signer_ip: null,
  signer_user_agent: null,
  signature_data: null,
  signature_hash: null,
  pdf_storage_path: null,
  pdf_hash: null,
  pdf_generated_at: null,
  driver_snapshot: null,
  organization_snapshot: null,
  retention_expires_at: null,
  is_archived: false,
  metadata: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const TEST_ORGANIZATION = {
  id: TEST_ORG_ID,
  name: 'Test Trucking Co',
  dot_number: '123456',
  mc_number: 'MC789',
  address_line1: '123 Main St',
  address_line2: null,
  city: 'Dallas',
  state: 'TX',
  zip: '75201',
  phone: '+15559999999',
  logo_url: null,
  settings: {},
  stripe_customer_id: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const TEST_PROFILE = {
  id: TEST_USER_ID,
  organization_id: TEST_ORG_ID,
  role: 'owner' as const,
  full_name: 'Admin User',
  email: 'admin@test.com',
  phone: null,
  is_active: true,
  last_login_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const TEST_API_KEY_AUTH = {
  orgId: TEST_ORG_ID,
  keyId: TEST_KEY_ID,
  scopes: ['drivers:read', 'drivers:write', 'consents:read', 'consents:write', 'billing:read'],
};
