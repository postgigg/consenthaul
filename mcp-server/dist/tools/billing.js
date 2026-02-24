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
                        price_usd: 15,
                        per_consent_usd: 1.5,
                    },
                    {
                        credits: 50,
                        price_usd: 50,
                        per_consent_usd: 1.0,
                        popular: true,
                    },
                    {
                        credits: 200,
                        price_usd: 150,
                        per_consent_usd: 0.75,
                    },
                    {
                        credits: 1000,
                        price_usd: 500,
                        per_consent_usd: 0.5,
                    },
                ],
                purchase_url: "https://app.consenthaul.com/billing",
                note: "Credits never expire. Every new account gets 3 free credits.",
            };
        },
    },
};
