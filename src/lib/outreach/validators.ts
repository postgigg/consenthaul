import { z } from 'zod';

// ---------------------------------------------------------------------------
// Lead schemas
// ---------------------------------------------------------------------------

export const createLeadSchema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(200),
  dot_number: z.string().optional(),
  mc_number: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
  contact_name: z.string().max(200).optional(),
  contact_title: z.string().max(100).optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2).optional(),
  zip: z.string().optional(),
  fleet_size: z.number().int().min(0).optional(),
  driver_count: z.number().int().min(0).optional(),
  carrier_operation: z.string().optional(),
  operating_status: z.string().optional(),
  pipeline_stage: z
    .enum(['lead', 'contacted', 'replied', 'demo', 'trial', 'customer', 'lost'])
    .optional(),
  lead_source: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const updateLeadSchema = createLeadSchema.partial().extend({
  do_not_contact: z.boolean().optional(),
  ai_summary: z.string().optional(),
  lead_score: z.number().int().min(0).max(100).optional(),
});

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

export const csvLeadRowSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  dot_number: z.string().optional(),
  mc_number: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
  contact_name: z.string().optional(),
  contact_title: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  fleet_size: z.coerce.number().int().min(0).optional(),
  driver_count: z.coerce.number().int().min(0).optional(),
});

export type CSVLeadRowInput = z.infer<typeof csvLeadRowSchema>;

// ---------------------------------------------------------------------------
// Campaign schemas
// ---------------------------------------------------------------------------

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(200),
  description: z.string().max(1000).optional(),
  target_filters: z
    .object({
      states: z.array(z.string()).optional(),
      fleet_min: z.number().int().min(0).optional(),
      fleet_max: z.number().int().min(0).optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
  send_settings: z
    .object({
      daily_limit: z.number().int().min(1).max(500).optional().default(50),
      send_window_start: z.string().optional().default('09:00'),
      send_window_end: z.string().optional().default('17:00'),
      timezone: z.string().optional().default('America/Chicago'),
      from_name: z.string().optional().default('ConsentHaul'),
      from_email: z.string().email().optional().default('outreach@consenthaul.com'),
    })
    .optional(),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

export const updateCampaignSchema = createCampaignSchema.partial().extend({
  status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
});

export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;

// ---------------------------------------------------------------------------
// Sequence step schemas
// ---------------------------------------------------------------------------

export const createStepSchema = z.object({
  step_order: z.number().int().min(1),
  delay_days: z.number().int().min(0).default(0),
  subject: z.string().max(500).optional(),
  body_html: z.string().optional(),
  body_text: z.string().optional(),
  use_ai_generation: z.boolean().default(false),
  ai_prompt: z.string().max(2000).optional(),
  skip_if_replied: z.boolean().default(true),
  skip_if_opened: z.boolean().default(false),
});

export type CreateStepInput = z.infer<typeof createStepSchema>;

export const updateStepSchema = createStepSchema.partial();
export type UpdateStepInput = z.infer<typeof updateStepSchema>;

// ---------------------------------------------------------------------------
// Bulk action schemas
// ---------------------------------------------------------------------------

export const bulkActionSchema = z.object({
  lead_ids: z.array(z.string().uuid()).min(1, 'At least one lead required'),
  action: z.enum(['change_stage', 'add_tag', 'remove_tag', 'enroll_campaign', 'score']),
  stage: z
    .enum(['lead', 'contacted', 'replied', 'demo', 'trial', 'customer', 'lost'])
    .optional(),
  tag: z.string().optional(),
  campaign_id: z.string().uuid().optional(),
});

export type BulkActionInput = z.infer<typeof bulkActionSchema>;
