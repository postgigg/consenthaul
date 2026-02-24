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
  delivery_address: z.string().optional(),
  language: z.enum(['en', 'es']).optional(),
  consent_start_date: z.string().optional(),
  consent_end_date: z.string().optional(),
  query_frequency: z.string().optional(),
  template_id: z.string().uuid().optional(),
  token_ttl_hours: z.number().positive().optional().default(168),
});

export type CreateConsentInput = z.infer<typeof createConsentSchema>;

// ---------------------------------------------------------------------------
// Signature schemas
// ---------------------------------------------------------------------------

export const submitSignatureSchema = z.object({
  /** Base-64 encoded signature image (data URL). Must be non-trivially long. */
  signature_data: z
    .string()
    .min(100, 'Signature data is too short to be a valid image'),
  /** Driver must explicitly confirm consent — must be `true`. */
  confirmed: z.literal(true, {
    message: 'You must confirm consent before signing',
  }),
});

export type SubmitSignatureInput = z.infer<typeof submitSignatureSchema>;

// ---------------------------------------------------------------------------
// Driver schemas
// ---------------------------------------------------------------------------

export const createDriverSchema = z
  .object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
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
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
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
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
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
