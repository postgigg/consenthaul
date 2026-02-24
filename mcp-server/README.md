# ConsentHaul MCP Server

MCP (Model Context Protocol) server that lets AI agents manage drivers, consents, and billing through ConsentHaul's REST API. Built for carriers who want to automate FMCSA Clearinghouse consent collection via AI-powered TMS integrations or workflow automation.

## Installation

```bash
npm install @consenthaul/mcp-server
```

Or clone and build locally:

```bash
cd mcp-server
npm install
npm run build
```

## Configuration

You need a ConsentHaul API key. Generate one from **Settings → API** in your [ConsentHaul dashboard](https://app.consenthaul.com/api-docs).

| Environment Variable | Required | Default | Description |
|---|---|---|---|
| `CONSENTHAUL_API_KEY` | Yes | — | Your `ch_` prefixed API key |
| `CONSENTHAUL_BASE_URL` | No | `https://app.consenthaul.com` | API base URL (for self-hosted or dev) |

## Claude Desktop Setup

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "consenthaul": {
      "command": "npx",
      "args": ["@consenthaul/mcp-server"],
      "env": {
        "CONSENTHAUL_API_KEY": "ch_your_key_here"
      }
    }
  }
}
```

For local development:

```json
{
  "mcpServers": {
    "consenthaul": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "CONSENTHAUL_API_KEY": "ch_your_key_here",
        "CONSENTHAUL_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

## Available Tools

### Drivers

| Tool | Description |
|---|---|
| `list_drivers` | List drivers with search and pagination |
| `get_driver` | Get a single driver by ID |
| `create_driver` | Create a new driver |
| `update_driver` | Update driver fields |
| `deactivate_driver` | Soft-delete a driver |

### Consents

| Tool | Description | Cost |
|---|---|---|
| `list_consents` | List consents with filters | Free |
| `get_consent` | Get consent details by ID | Free |
| `create_consent` | Create and send a consent request | **1 credit** |
| `revoke_consent` | Revoke an active consent | Free |
| `resend_consent` | Resend signing link | Free |
| `get_consent_pdf_url` | Get download URL for signed PDF | Free |

### Billing

| Tool | Description |
|---|---|
| `get_credit_balance` | Check current credit balance |
| `list_credit_packs` | Show available packs and pricing |

## Example Usage (via Claude)

> "List all my drivers"
> "Create a driver named John Smith with CDL number TX12345 and phone +15551234567"
> "Send a consent request to driver John Smith via SMS"
> "How many credits do I have left?"
> "Show me all pending consents from last week"
> "Download the signed PDF for consent abc-123"

## Development

```bash
npm install
npm run build
CONSENTHAUL_API_KEY=ch_test CONSENTHAUL_BASE_URL=http://localhost:3000 npm start
```

## License

MIT
