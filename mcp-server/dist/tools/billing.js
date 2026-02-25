import { z } from "zod";
export const billingTools = {
    get_credit_balance: {
        description: "Check your organization's current credit balance. Each consent request costs 1 credit.",
        inputSchema: z.object({}),
        handler: async (client) => {
            return client.get("/billing/credits");
        },
    },
    list_credit_packs: {
        description: "Show available credit packs and their pricing. Credits never expire. Buy more at any time from the ConsentHaul dashboard.",
        inputSchema: z.object({}),
        handler: async (_client) => {
            return {
                packs: [
                    {
                        credits: 10,
                        price_usd: 30,
                        per_consent_usd: 3.0,
                    },
                    {
                        credits: 50,
                        price_usd: 125,
                        per_consent_usd: 2.5,
                        popular: true,
                    },
                    {
                        credits: 200,
                        price_usd: 400,
                        per_consent_usd: 2.0,
                    },
                    {
                        credits: 1000,
                        price_usd: 1500,
                        per_consent_usd: 1.5,
                    },
                ],
                purchase_url: "https://app.consenthaul.com/billing",
                note: "Credits never expire. Every new account gets 3 free credits.",
            };
        },
    },
};
