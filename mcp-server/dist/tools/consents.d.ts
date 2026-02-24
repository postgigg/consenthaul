import { z } from "zod";
import type { ConsentHaulClient } from "../client.js";
declare const listConsentsSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["pending", "sent", "delivered", "opened", "signed", "expired", "revoked", "failed"]>>;
    driver_id: z.ZodOptional<z.ZodString>;
    page: z.ZodOptional<z.ZodNumber>;
    per_page: z.ZodOptional<z.ZodNumber>;
    created_after: z.ZodOptional<z.ZodString>;
    created_before: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page?: number | undefined;
    per_page?: number | undefined;
    status?: "pending" | "sent" | "delivered" | "opened" | "signed" | "expired" | "revoked" | "failed" | undefined;
    driver_id?: string | undefined;
    created_after?: string | undefined;
    created_before?: string | undefined;
}, {
    page?: number | undefined;
    per_page?: number | undefined;
    status?: "pending" | "sent" | "delivered" | "opened" | "signed" | "expired" | "revoked" | "failed" | undefined;
    driver_id?: string | undefined;
    created_after?: string | undefined;
    created_before?: string | undefined;
}>;
declare const getConsentSchema: z.ZodObject<{
    consent_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    consent_id: string;
}, {
    consent_id: string;
}>;
declare const createConsentSchema: z.ZodObject<{
    driver_id: z.ZodString;
    consent_type: z.ZodOptional<z.ZodEnum<["limited_query", "pre_employment", "blanket"]>>;
    delivery_method: z.ZodEnum<["sms", "whatsapp", "email", "manual"]>;
    delivery_address: z.ZodOptional<z.ZodString>;
    language: z.ZodOptional<z.ZodEnum<["en", "es"]>>;
    consent_start_date: z.ZodOptional<z.ZodString>;
    consent_end_date: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    driver_id: string;
    delivery_method: "email" | "sms" | "whatsapp" | "manual";
    consent_type?: "limited_query" | "pre_employment" | "blanket" | undefined;
    delivery_address?: string | undefined;
    language?: "en" | "es" | undefined;
    consent_start_date?: string | undefined;
    consent_end_date?: string | undefined;
}, {
    driver_id: string;
    delivery_method: "email" | "sms" | "whatsapp" | "manual";
    consent_type?: "limited_query" | "pre_employment" | "blanket" | undefined;
    delivery_address?: string | undefined;
    language?: "en" | "es" | undefined;
    consent_start_date?: string | undefined;
    consent_end_date?: string | undefined;
}>;
declare const consentIdSchema: z.ZodObject<{
    consent_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    consent_id: string;
}, {
    consent_id: string;
}>;
export declare const consentTools: {
    list_consents: {
        description: string;
        inputSchema: z.ZodObject<{
            status: z.ZodOptional<z.ZodEnum<["pending", "sent", "delivered", "opened", "signed", "expired", "revoked", "failed"]>>;
            driver_id: z.ZodOptional<z.ZodString>;
            page: z.ZodOptional<z.ZodNumber>;
            per_page: z.ZodOptional<z.ZodNumber>;
            created_after: z.ZodOptional<z.ZodString>;
            created_before: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            page?: number | undefined;
            per_page?: number | undefined;
            status?: "pending" | "sent" | "delivered" | "opened" | "signed" | "expired" | "revoked" | "failed" | undefined;
            driver_id?: string | undefined;
            created_after?: string | undefined;
            created_before?: string | undefined;
        }, {
            page?: number | undefined;
            per_page?: number | undefined;
            status?: "pending" | "sent" | "delivered" | "opened" | "signed" | "expired" | "revoked" | "failed" | undefined;
            driver_id?: string | undefined;
            created_after?: string | undefined;
            created_before?: string | undefined;
        }>;
        handler: (client: ConsentHaulClient, input: z.infer<typeof listConsentsSchema>) => Promise<unknown>;
    };
    get_consent: {
        description: string;
        inputSchema: z.ZodObject<{
            consent_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            consent_id: string;
        }, {
            consent_id: string;
        }>;
        handler: (client: ConsentHaulClient, input: z.infer<typeof getConsentSchema>) => Promise<unknown>;
    };
    create_consent: {
        description: string;
        inputSchema: z.ZodObject<{
            driver_id: z.ZodString;
            consent_type: z.ZodOptional<z.ZodEnum<["limited_query", "pre_employment", "blanket"]>>;
            delivery_method: z.ZodEnum<["sms", "whatsapp", "email", "manual"]>;
            delivery_address: z.ZodOptional<z.ZodString>;
            language: z.ZodOptional<z.ZodEnum<["en", "es"]>>;
            consent_start_date: z.ZodOptional<z.ZodString>;
            consent_end_date: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            driver_id: string;
            delivery_method: "email" | "sms" | "whatsapp" | "manual";
            consent_type?: "limited_query" | "pre_employment" | "blanket" | undefined;
            delivery_address?: string | undefined;
            language?: "en" | "es" | undefined;
            consent_start_date?: string | undefined;
            consent_end_date?: string | undefined;
        }, {
            driver_id: string;
            delivery_method: "email" | "sms" | "whatsapp" | "manual";
            consent_type?: "limited_query" | "pre_employment" | "blanket" | undefined;
            delivery_address?: string | undefined;
            language?: "en" | "es" | undefined;
            consent_start_date?: string | undefined;
            consent_end_date?: string | undefined;
        }>;
        handler: (client: ConsentHaulClient, input: z.infer<typeof createConsentSchema>) => Promise<unknown>;
    };
    revoke_consent: {
        description: string;
        inputSchema: z.ZodObject<{
            consent_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            consent_id: string;
        }, {
            consent_id: string;
        }>;
        handler: (client: ConsentHaulClient, input: z.infer<typeof consentIdSchema>) => Promise<unknown>;
    };
    resend_consent: {
        description: string;
        inputSchema: z.ZodObject<{
            consent_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            consent_id: string;
        }, {
            consent_id: string;
        }>;
        handler: (client: ConsentHaulClient, input: z.infer<typeof consentIdSchema>) => Promise<unknown>;
    };
    get_consent_pdf_url: {
        description: string;
        inputSchema: z.ZodObject<{
            consent_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            consent_id: string;
        }, {
            consent_id: string;
        }>;
        handler: (client: ConsentHaulClient, input: z.infer<typeof consentIdSchema>) => Promise<unknown>;
    };
};
export {};
