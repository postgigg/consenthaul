import { z } from 'zod';

// ---------------------------------------------------------------------------
// Consent schemas
// ---------------------------------------------------------------------------

export const createConsentSchema = z.object({
  driver_id: z.string().uuid(),
  consent_type: z
    .enum(['limited_query', 'pre_employment', 'blanket'])
    .optional(),
  delivery_method: z.enum(['sms', 'whatsapp', 'email', 'manual']),
  delivery_address: z.string().trim().optional(),
  language: z.enum(['en', 'es']).optional(),
  consent_start_date: z.string().optional(),
  consent_end_date: z.string().nullable().optional(),
  query_frequency: z.string().optional(),
  template_id: z.string().uuid().optional(),
  token_ttl_hours: z.number().positive().max(8760).optional().default(168),
  company_name: z.string().optional(),
  phone: z.string().optional(),
  cdl_number: z.string().optional(),
  cdl_state: z.string().optional(),
  hire_date: z.string().optional(),
  internal_note: z.string().optional(),
  require_cdl_photo: z.boolean().optional().default(false),
});

export type CreateConsentInput = z.infer<typeof createConsentSchema>;

// ---------------------------------------------------------------------------
// Signature schemas
// ---------------------------------------------------------------------------

export const submitSignatureSchema = z.object({
  /** Base-64 encoded signature image (data URL). Must be non-trivially long. */
  signature_data: z
    .string()
    .min(100, 'Signature data is too short to be a valid image')
    .max(500_000, 'Signature data is too large'),
  /** Driver must explicitly confirm consent — must be `true`. */
  confirmed: z.literal(true, {
    message: 'You must confirm consent before signing',
  }),
  /** Driver must separately consent to transact electronically (E-Sign Act). */
  esign_consent: z.literal(true, {
    message: 'You must consent to electronic transactions before signing',
  }),
  /** Signature type — 'drawn' (canvas) or 'typed' (text input). */
  signature_type: z.enum(['drawn', 'typed']).optional().default('drawn'),
});

export type SubmitSignatureInput = z.infer<typeof submitSignatureSchema>;

// ---------------------------------------------------------------------------
// Driver schemas
// ---------------------------------------------------------------------------

export const createDriverSchema = z
  .object({
    first_name: z.string().min(1, 'First name is required').max(100, 'First name is too long'),
    last_name: z.string().min(1, 'Last name is required').max(100, 'Last name is too long'),
    phone: z.string().optional(),
    email: z.string().email('Invalid email address').optional(),
    cdl_number: z.string().optional(),
    cdl_state: z
      .string()
      .length(2, 'CDL state must be a 2-character state code')
      .optional(),
    date_of_birth: z.string().optional(),
    hire_date: z.string().optional(),
    preferred_language: z.enum(['en', 'es']).optional().default('en'),
  })
  .refine((data) => data.phone || data.email, {
    message: 'Either phone or email is required',
    path: ['phone'],
  });

export type CreateDriverInput = z.infer<typeof createDriverSchema>;

export const updateDriverSchema = z.object({
  first_name: z.string().min(1).max(100, 'First name is too long').optional(),
  last_name: z.string().min(1).max(100, 'Last name is too long').optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
  cdl_number: z.string().optional(),
  cdl_state: z
    .string()
    .length(2, 'CDL state must be a 2-character state code')
    .optional(),
  date_of_birth: z.string().optional(),
  hire_date: z.string().optional(),
  preferred_language: z.enum(['en', 'es']).optional(),
  is_active: z.boolean().optional(),
});

export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;

// ---------------------------------------------------------------------------
// CSV import row schema (mirrors createDriverSchema)
// ---------------------------------------------------------------------------

export const csvDriverRowSchema = z
  .object({
    first_name: z.string().min(1, 'First name is required').max(100, 'First name is too long'),
    last_name: z.string().min(1, 'Last name is required').max(100, 'Last name is too long'),
    phone: z.string().optional(),
    email: z.string().email('Invalid email address').optional(),
    cdl_number: z.string().optional(),
    cdl_state: z
      .string()
      .length(2, 'CDL state must be a 2-character state code')
      .optional(),
    date_of_birth: z.string().optional(),
    hire_date: z.string().optional(),
    preferred_language: z.enum(['en', 'es']).optional().default('en'),
  })
  .refine((data) => data.phone || data.email, {
    message: 'Either phone or email is required',
    path: ['phone'],
  });

export type CSVDriverRowInput = z.infer<typeof csvDriverRowSchema>;

// ---------------------------------------------------------------------------
// Pagination schema (shared across list endpoints)
// ---------------------------------------------------------------------------

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1).catch(1),
  per_page: z.coerce.number().int().min(1).max(100).optional().default(25).catch(25),
  sort: z.string().nullable().optional(),
  order: z.enum(['asc', 'desc']).nullable().optional().default('desc').catch('desc'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// ---------------------------------------------------------------------------
// Service request schemas
// ---------------------------------------------------------------------------

export const createServiceRequestSchema = z.object({
  category: z.enum(['api_integration', 'mcp_setup', 'custom_integration', 'other']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  urgency: z.enum(['low', 'medium', 'high']),
  tms_system: z.string().optional(),
});

export type CreateServiceRequestInput = z.infer<typeof createServiceRequestSchema>;

// ---------------------------------------------------------------------------
// Regulatory intelligence schemas
// ---------------------------------------------------------------------------

export const createRegulatorySourceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  url: z.string().url('Must be a valid URL'),
  source_type: z.enum(['rss', 'webpage', 'api']).optional().default('rss'),
  check_frequency_hours: z.number().int().min(1).max(720).optional().default(24),
  is_active: z.boolean().optional().default(true),
});

export type CreateRegulatorySourceInput = z.infer<typeof createRegulatorySourceSchema>;

export const updateRegulatorySourceSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  url: z.string().url().optional(),
  source_type: z.enum(['rss', 'webpage', 'api']).optional(),
  check_frequency_hours: z.number().int().min(1).max(720).optional(),
  is_active: z.boolean().optional(),
});

export type UpdateRegulatorySourceInput = z.infer<typeof updateRegulatorySourceSchema>;

export const updateRegulatoryAlertSchema = z.object({
  status: z.enum(['new', 'reviewing', 'action_required', 'resolved', 'dismissed']).optional(),
  admin_notes: z.string().max(5000).optional(),
});

// ---------------------------------------------------------------------------
// TMS Partner application schemas
// ---------------------------------------------------------------------------

export const partnerCompanyInfoSchema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(200),
  website_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  employee_count_range: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+']),
  contact_name: z.string().min(1, 'Contact name is required').max(200),
  contact_email: z.string().email('Valid email is required'),
  contact_phone: z.string().min(7, 'Valid phone is required').max(20),
  tms_platform_name: z.string().min(1, 'TMS platform name is required').max(200),
  partnership_reason: z.string().min(50, 'Please provide at least 50 characters').max(2000),
});

export type PartnerCompanyInfoInput = z.infer<typeof partnerCompanyInfoSchema>;

export const partnerVolumeSchema = z.object({
  carrier_count_range: z.enum(['1-100', '101-500', '501-2000', '2001-10000', '10000+']),
  consents_per_carrier_month: z.enum(['1-5', '6-15', '16-50', '50+']),
  estimated_annual_consents: z.number().int().min(0),
  recommended_pack_id: z.string().optional(),
});

export type PartnerVolumeInput = z.infer<typeof partnerVolumeSchema>;

export const partnerMigrationSchema = z.object({
  has_migration_data: z.boolean(),
  migration_file_paths: z.array(z.string()).optional().default([]),
  migration_total_bytes: z.number().int().min(0).optional().default(0),
  migration_fee_cents: z.number().int().min(0).optional().default(0),
  auto_create_carriers: z.boolean().optional().default(false),
  auto_create_fee_cents: z.number().int().min(0).optional().default(0),
});

export type PartnerMigrationInput = z.infer<typeof partnerMigrationSchema>;

export const partnerLegalSchema = z.object({
  partner_agreement_accepted: z.literal(true, {
    message: 'You must accept the partner agreement',
  }),
  data_processing_accepted: z.literal(true, {
    message: 'You must accept the data processing agreement',
  }),
  legal_signatory_name: z.string().min(2, 'Legal signatory name is required').max(200),
});

export type PartnerLegalInput = z.infer<typeof partnerLegalSchema>;

export const partnerApplicationSchema = partnerCompanyInfoSchema
  .merge(partnerVolumeSchema)
  .merge(partnerMigrationSchema)
  .merge(partnerLegalSchema)
  .extend({
    selected_pack_id: z.string().min(1, 'Credit pack selection is required'),
    selected_pack_credits: z.number().int().positive(),
    selected_pack_price_cents: z.number().int().min(0),
  });

export type PartnerApplicationInput = z.infer<typeof partnerApplicationSchema>;

// ---------------------------------------------------------------------------
// Migration ingest schemas (for /api/tms/migration/ingest)
// ---------------------------------------------------------------------------

export const migrationIngestCarrierSchema = z.object({
  company_name: z.string().min(1).max(300),
  dot_number: z.string().max(20).optional(),
  mc_number: z.string().max(20).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
  contact_name: z.string().max(200).optional(),
});

export type MigrationIngestCarrier = z.infer<typeof migrationIngestCarrierSchema>;

export const migrationIngestDriverSchema = z.object({
  carrier_company_name: z.string().min(1).max(300),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
  cdl_number: z.string().max(30).optional(),
  cdl_state: z.string().max(2).optional(),
});

export type MigrationIngestDriver = z.infer<typeof migrationIngestDriverSchema>;
