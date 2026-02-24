import { z } from "zod";
import type { ConsentHaulClient } from "../client.js";
declare const listDriversSchema: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
    page: z.ZodOptional<z.ZodNumber>;
    per_page: z.ZodOptional<z.ZodNumber>;
    is_active: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    search?: string | undefined;
    page?: number | undefined;
    per_page?: number | undefined;
    is_active?: boolean | undefined;
}, {
    search?: string | undefined;
    page?: number | undefined;
    per_page?: number | undefined;
    is_active?: boolean | undefined;
}>;
declare const getDriverSchema: z.ZodObject<{
    driver_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    driver_id: string;
}, {
    driver_id: string;
}>;
declare const createDriverSchema: z.ZodObject<{
    first_name: z.ZodString;
    last_name: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    cdl_number: z.ZodOptional<z.ZodString>;
    cdl_state: z.ZodOptional<z.ZodString>;
    date_of_birth: z.ZodOptional<z.ZodString>;
    hire_date: z.ZodOptional<z.ZodString>;
    preferred_language: z.ZodOptional<z.ZodEnum<["en", "es"]>>;
}, "strip", z.ZodTypeAny, {
    first_name: string;
    last_name: string;
    phone?: string | undefined;
    email?: string | undefined;
    cdl_number?: string | undefined;
    cdl_state?: string | undefined;
    date_of_birth?: string | undefined;
    hire_date?: string | undefined;
    preferred_language?: "en" | "es" | undefined;
}, {
    first_name: string;
    last_name: string;
    phone?: string | undefined;
    email?: string | undefined;
    cdl_number?: string | undefined;
    cdl_state?: string | undefined;
    date_of_birth?: string | undefined;
    hire_date?: string | undefined;
    preferred_language?: "en" | "es" | undefined;
}>;
declare const updateDriverSchema: z.ZodObject<{
    driver_id: z.ZodString;
    first_name: z.ZodOptional<z.ZodString>;
    last_name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    cdl_number: z.ZodOptional<z.ZodString>;
    cdl_state: z.ZodOptional<z.ZodString>;
    date_of_birth: z.ZodOptional<z.ZodString>;
    hire_date: z.ZodOptional<z.ZodString>;
    preferred_language: z.ZodOptional<z.ZodEnum<["en", "es"]>>;
}, "strip", z.ZodTypeAny, {
    driver_id: string;
    first_name?: string | undefined;
    last_name?: string | undefined;
    phone?: string | undefined;
    email?: string | undefined;
    cdl_number?: string | undefined;
    cdl_state?: string | undefined;
    date_of_birth?: string | undefined;
    hire_date?: string | undefined;
    preferred_language?: "en" | "es" | undefined;
}, {
    driver_id: string;
    first_name?: string | undefined;
    last_name?: string | undefined;
    phone?: string | undefined;
    email?: string | undefined;
    cdl_number?: string | undefined;
    cdl_state?: string | undefined;
    date_of_birth?: string | undefined;
    hire_date?: string | undefined;
    preferred_language?: "en" | "es" | undefined;
}>;
declare const deactivateDriverSchema: z.ZodObject<{
    driver_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    driver_id: string;
}, {
    driver_id: string;
}>;
export declare const driverTools: {
    list_drivers: {
        description: string;
        inputSchema: z.ZodObject<{
            search: z.ZodOptional<z.ZodString>;
            page: z.ZodOptional<z.ZodNumber>;
            per_page: z.ZodOptional<z.ZodNumber>;
            is_active: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            search?: string | undefined;
            page?: number | undefined;
            per_page?: number | undefined;
            is_active?: boolean | undefined;
        }, {
            search?: string | undefined;
            page?: number | undefined;
            per_page?: number | undefined;
            is_active?: boolean | undefined;
        }>;
        handler: (client: ConsentHaulClient, input: z.infer<typeof listDriversSchema>) => Promise<unknown>;
    };
    get_driver: {
        description: string;
        inputSchema: z.ZodObject<{
            driver_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            driver_id: string;
        }, {
            driver_id: string;
        }>;
        handler: (client: ConsentHaulClient, input: z.infer<typeof getDriverSchema>) => Promise<unknown>;
    };
    create_driver: {
        description: string;
        inputSchema: z.ZodObject<{
            first_name: z.ZodString;
            last_name: z.ZodString;
            phone: z.ZodOptional<z.ZodString>;
            email: z.ZodOptional<z.ZodString>;
            cdl_number: z.ZodOptional<z.ZodString>;
            cdl_state: z.ZodOptional<z.ZodString>;
            date_of_birth: z.ZodOptional<z.ZodString>;
            hire_date: z.ZodOptional<z.ZodString>;
            preferred_language: z.ZodOptional<z.ZodEnum<["en", "es"]>>;
        }, "strip", z.ZodTypeAny, {
            first_name: string;
            last_name: string;
            phone?: string | undefined;
            email?: string | undefined;
            cdl_number?: string | undefined;
            cdl_state?: string | undefined;
            date_of_birth?: string | undefined;
            hire_date?: string | undefined;
            preferred_language?: "en" | "es" | undefined;
        }, {
            first_name: string;
            last_name: string;
            phone?: string | undefined;
            email?: string | undefined;
            cdl_number?: string | undefined;
            cdl_state?: string | undefined;
            date_of_birth?: string | undefined;
            hire_date?: string | undefined;
            preferred_language?: "en" | "es" | undefined;
        }>;
        handler: (client: ConsentHaulClient, input: z.infer<typeof createDriverSchema>) => Promise<unknown>;
    };
    update_driver: {
        description: string;
        inputSchema: z.ZodObject<{
            driver_id: z.ZodString;
            first_name: z.ZodOptional<z.ZodString>;
            last_name: z.ZodOptional<z.ZodString>;
            phone: z.ZodOptional<z.ZodString>;
            email: z.ZodOptional<z.ZodString>;
            cdl_number: z.ZodOptional<z.ZodString>;
            cdl_state: z.ZodOptional<z.ZodString>;
            date_of_birth: z.ZodOptional<z.ZodString>;
            hire_date: z.ZodOptional<z.ZodString>;
            preferred_language: z.ZodOptional<z.ZodEnum<["en", "es"]>>;
        }, "strip", z.ZodTypeAny, {
            driver_id: string;
            first_name?: string | undefined;
            last_name?: string | undefined;
            phone?: string | undefined;
            email?: string | undefined;
            cdl_number?: string | undefined;
            cdl_state?: string | undefined;
            date_of_birth?: string | undefined;
            hire_date?: string | undefined;
            preferred_language?: "en" | "es" | undefined;
        }, {
            driver_id: string;
            first_name?: string | undefined;
            last_name?: string | undefined;
            phone?: string | undefined;
            email?: string | undefined;
            cdl_number?: string | undefined;
            cdl_state?: string | undefined;
            date_of_birth?: string | undefined;
            hire_date?: string | undefined;
            preferred_language?: "en" | "es" | undefined;
        }>;
        handler: (client: ConsentHaulClient, input: z.infer<typeof updateDriverSchema>) => Promise<unknown>;
    };
    deactivate_driver: {
        description: string;
        inputSchema: z.ZodObject<{
            driver_id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            driver_id: string;
        }, {
            driver_id: string;
        }>;
        handler: (client: ConsentHaulClient, input: z.infer<typeof deactivateDriverSchema>) => Promise<unknown>;
    };
};
export {};
