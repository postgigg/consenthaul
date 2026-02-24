import { z } from "zod";
import type { ConsentHaulClient } from "../client.js";

const listDriversSchema = z.object({
  search: z
    .string()
    .optional()
    .describe("Search by name, email, phone, or CDL number"),
  page: z.number().int().positive().optional().describe("Page number (default 1)"),
  per_page: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Results per page, 1-100 (default 25)"),
  is_active: z
    .boolean()
    .optional()
    .describe("Filter by active status"),
});

const getDriverSchema = z.object({
  driver_id: z.string().uuid().describe("The driver's unique ID"),
});

const createDriverSchema = z.object({
  first_name: z.string().describe("Driver's first name"),
  last_name: z.string().describe("Driver's last name"),
  phone: z.string().optional().describe("Phone number (E.164 format preferred, e.g. +15551234567)"),
  email: z.string().email().optional().describe("Email address"),
  cdl_number: z.string().optional().describe("Commercial Driver's License number"),
  cdl_state: z
    .string()
    .length(2)
    .optional()
    .describe("CDL issuing state (2-letter code, e.g. TX)"),
  date_of_birth: z
    .string()
    .optional()
    .describe("Date of birth (YYYY-MM-DD)"),
  hire_date: z.string().optional().describe("Hire date (YYYY-MM-DD)"),
  preferred_language: z
    .enum(["en", "es"])
    .optional()
    .describe("Preferred language: 'en' (English) or 'es' (Spanish)"),
});

const updateDriverSchema = z.object({
  driver_id: z.string().uuid().describe("The driver's unique ID"),
  first_name: z.string().optional().describe("Driver's first name"),
  last_name: z.string().optional().describe("Driver's last name"),
  phone: z.string().optional().describe("Phone number"),
  email: z.string().email().optional().describe("Email address"),
  cdl_number: z.string().optional().describe("CDL number"),
  cdl_state: z.string().length(2).optional().describe("CDL issuing state"),
  date_of_birth: z.string().optional().describe("Date of birth (YYYY-MM-DD)"),
  hire_date: z.string().optional().describe("Hire date (YYYY-MM-DD)"),
  preferred_language: z.enum(["en", "es"]).optional().describe("Preferred language"),
});

const deactivateDriverSchema = z.object({
  driver_id: z.string().uuid().describe("The driver's unique ID"),
});

export const driverTools = {
  list_drivers: {
    description:
      "List drivers in your organization. Supports search by name, email, phone, or CDL number. Returns paginated results.",
    inputSchema: listDriversSchema,
    handler: async (client: ConsentHaulClient, input: z.infer<typeof listDriversSchema>) => {
      return client.get("/drivers", {
        search: input.search,
        page: input.page?.toString(),
        per_page: input.per_page?.toString(),
        is_active: input.is_active?.toString(),
      });
    },
  },

  get_driver: {
    description: "Get a single driver by ID. Returns full driver details including CDL info, contact details, and metadata.",
    inputSchema: getDriverSchema,
    handler: async (client: ConsentHaulClient, input: z.infer<typeof getDriverSchema>) => {
      return client.get(`/drivers/${input.driver_id}`);
    },
  },

  create_driver: {
    description:
      "Create a new driver in your organization. At minimum, first_name and last_name are required.",
    inputSchema: createDriverSchema,
    handler: async (client: ConsentHaulClient, input: z.infer<typeof createDriverSchema>) => {
      return client.post("/drivers", input);
    },
  },

  update_driver: {
    description: "Update an existing driver's information. Only provided fields will be updated.",
    inputSchema: updateDriverSchema,
    handler: async (client: ConsentHaulClient, input: z.infer<typeof updateDriverSchema>) => {
      const { driver_id, ...body } = input;
      return client.patch(`/drivers/${driver_id}`, body);
    },
  },

  deactivate_driver: {
    description:
      "Deactivate (soft-delete) a driver. The driver record is retained but marked as inactive. Active consents are not affected.",
    inputSchema: deactivateDriverSchema,
    handler: async (client: ConsentHaulClient, input: z.infer<typeof deactivateDriverSchema>) => {
      return client.patch(`/drivers/${input.driver_id}`, { is_active: false });
    },
  },
};
