#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ConsentHaulClient } from "./client.js";
import { driverTools } from "./tools/drivers.js";
import { consentTools } from "./tools/consents.js";
import { billingTools } from "./tools/billing.js";

const apiKey = process.env.CONSENTHAUL_API_KEY;
if (!apiKey) {
  console.error(
    "Error: CONSENTHAUL_API_KEY environment variable is required.\n" +
      "Get your API key from https://app.consenthaul.com/api-docs"
  );
  process.exit(1);
}

const baseUrl =
  process.env.CONSENTHAUL_BASE_URL || "https://app.consenthaul.com";

const client = new ConsentHaulClient(apiKey, baseUrl);

const server = new McpServer({
  name: "consenthaul",
  version: "0.1.0",
});

// ---------------------------------------------------------------------------
// Register all tools
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const allTools: Record<string, { description: string; inputSchema: any; handler: (client: ConsentHaulClient, input: any) => Promise<unknown> }> = {
  ...driverTools,
  ...consentTools,
  ...billingTools,
};

for (const [name, tool] of Object.entries(allTools)) {
  server.tool(
    name,
    tool.description,
    tool.inputSchema.shape,
    async (input: Record<string, unknown>) => {
      try {
        const result = await tool.handler(client, input);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err: unknown) {
        const isApiError =
          typeof err === "object" &&
          err !== null &&
          "status" in err &&
          "message" in err;

        const message = isApiError
          ? `API Error (${(err as { status: number }).status}): ${(err as { message: string }).message}`
          : err instanceof Error
            ? err.message
            : "An unknown error occurred";

        return {
          content: [
            {
              type: "text" as const,
              text: message,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
