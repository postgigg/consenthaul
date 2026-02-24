import { z } from "zod";
import type { ConsentHaulClient } from "../client.js";
export declare const billingTools: {
    get_credit_balance: {
        description: string;
        inputSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
        handler: (client: ConsentHaulClient) => Promise<unknown>;
    };
    list_credit_packs: {
        description: string;
        inputSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
        handler: (_client: ConsentHaulClient) => Promise<{
            packs: ({
                credits: number;
                price_usd: number;
                per_consent_usd: number;
                popular?: undefined;
            } | {
                credits: number;
                price_usd: number;
                per_consent_usd: number;
                popular: boolean;
            })[];
            purchase_url: string;
            note: string;
        }>;
    };
};
