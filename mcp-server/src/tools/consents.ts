import { z } from "zod";
import type { ConsentHaulClient } from "../client.js";

const listConsentsSchema = z.object({
  status: z
    .enum([
      "pending",
      "sent",
      "delivered",
      "opened",
      "signed",
      "expired",
      "revoked",
      "failed",
    ])
    .optional()
    .describe("Filter by consent status"),
  driver_id: z
    .string()
    .uuid()
    .optional()
    .describe("Filter by driver ID"),
  page: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Page number (default 1)"),
  per_page: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Results per page, 1-100 (default 25)"),
  created_after: z
    .string()
    .optional()
    .describe("Only consents created after this date (ISO 8601)"),
  created_before: z
    .string()
    .optional()
    .describe("Only consents created before this date (ISO 8601)"),
});

const getConsentSchema = z.object({
  consent_id: z.string().uuid().describe("The consent's unique ID"),
});

const createConsentSchema = z.object({
  driver_id: z.string().uuid().describe("The driver to send the consent to"),
  consent_type: z
    .enum(["limited_query", "pre_employment", "blanket"])
    .optional()
    .describe(
      "Type of consent (default: limited_query). limited_query = annual Clearinghouse query, pre_employment = pre-hire check, blanket = multi-year"
    ),
  delivery_method: z
    .enum(["sms", "whatsapp", "email", "manual"])
    .describe(
      "How to deliver the signing link. 'manual' creates the consent without sending — you get back a signing_url to share yourself."
    ),
  delivery_address: z
    .string()
    .optional()
    .describe(
      "Phone number or email to deliver to. If omitted, uses the driver's phone or email on file."
    ),
  language: z
    .enum(["en", "es"])
    .optional()
    .describe("Language for the consent form (default: en)"),
  consent_start_date: z
    .string()
    .optional()
    .describe("Start date for the consent period (YYYY-MM-DD)"),
  consent_end_date: z
    .string()
    .optional()
    .describe("End date for the consent period (YYYY-MM-DD)"),
});

const consentIdSchema = z.object({
  consent_id: z.string().uuid().describe("The consent's unique ID"),
});

export const consentTools = {
  list_consents: {
    description:
      "List consent requests with optional filters. Returns paginated results with driver info included.",
    inputSchema: listConsentsSchema,
    handler: async (
      client: ConsentHaulClient,
      input: z.infer<typeof listConsentsSchema>
    ) => {
      return client.get("/consents", {
        status: input.status,
        driver_id: input.driver_id,
        page: input.page?.toString(),
        per_page: input.per_page?.toString(),
        created_after: input.created_after,
        created_before: input.created_before,
      });
    },
  },

  get_consent: {
    description:
      "Get a single consent request by ID. Returns full consent details including status, driver info, delivery info, and signing timestamps.",
    inputSchema: getConsentSchema,
    handler: async (
      client: ConsentHaulClient,
      input: z.infer<typeof getConsentSchema>
    ) => {
      return client.get(`/consents/${input.consent_id}`);
    },
  },

  create_consent: {
    description:
      "Create and send a new consent request to a driver. COSTS 1 CREDIT. The driver will receive a signing link via the specified delivery method. If delivery_method is 'sms' or 'whatsapp', the driver must have a phone number. If 'email', the driver must have an email.",
    inputSchema: createConsentSchema,
    handler: async (
      client: ConsentHaulClient,
      input: z.infer<typeof createConsentSchema>
    ) => {
      return client.post("/consents", input);
    },
  },

  revoke_consent: {
    description:
      "Revoke an active consent. The consent will be marked as revoked and can no longer be used for Clearinghouse queries.",
    inputSchema: consentIdSchema,
    handler: async (
      client: ConsentHaulClient,
      input: z.infer<typeof consentIdSchema>
    ) => {
      return client.post(`/consents/${input.consent_id}/revoke`);
    },
  },

  resend_consent: {
    description:
      "Resend the signing link for a pending or sent consent request. Useful if the driver lost the original link.",
    inputSchema: consentIdSchema,
    handler: async (
      client: ConsentHaulClient,
      input: z.infer<typeof consentIdSchema>
    ) => {
      return client.post(`/consents/${input.consent_id}/resend`);
    },
  },

  get_consent_pdf_url: {
    description:
      "Get a temporary download URL for the signed consent PDF. Only available for consents with status 'signed'.",
    inputSchema: consentIdSchema,
    handler: async (
      client: ConsentHaulClient,
      input: z.infer<typeof consentIdSchema>
    ) => {
      return client.get(`/consents/${input.consent_id}/pdf`);
    },
  },
};
