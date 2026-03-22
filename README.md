# x402refunds.com

`x402refunds.com` is a wallet-first refund request platform for X-402 USDC payments. The repo contains the public website, developer docs, MCP surface, and the Convex backend that accepts, verifies, and tracks refund requests on Base and Solana.

## Live URLs

- Site: `https://x402refunds.com`
- API base: `https://api.x402refunds.com`
- User docs: `https://x402refunds.com/docs`
- Developer docs: `https://x402refunds.com/developers`
- MCP manifest: `https://api.x402refunds.com/.well-known/mcp.json`

## What the platform does

- Accepts permissionless refund requests for X-402 payments.
- Verifies payment context from on-chain USDC transfers.
- Tracks cases and exposes machine-readable status endpoints.
- Supports agent-native integrations over MCP and HTTP.
- Provides a dashboard for review, tracking, and merchant workflows.

## Public API

### Core endpoints

- `GET /health` - health check
- `GET /version` - version and deployment metadata
- `POST /v1/refunds` - file a refund request
- `GET /v1/refunds/schema` - fetch the live JSON Schema for request bodies
- `GET /v1/refund?id={caseId}` - fetch refund request status
- `GET /v1/refunds?merchant={caip10}` - list refund requests for a merchant wallet

### Agent and protocol endpoints

- `GET /.well-known/mcp.json` - MCP discovery
- `POST /mcp/invoke` - MCP tool invocation
- `GET /.well-known/adp` - ADP discovery document

### Request shape

The current wallet-first refund API expects these required fields:

- `blockchain` - `"base"` or `"solana"`
- `transactionHash` - the USDC payment transaction hash or Solana signature
- `sellerEndpointUrl` - the exact paid API endpoint URL
- `description` - what went wrong after payment

Optional fields include `evidenceUrls` and `sourceTransferLogIndex`.

Amounts and parties are derived from the on-chain payment, so clients should not send fields like `amount`, `payer`, or `merchant`.

## Quick example

```bash
curl -X POST https://api.x402refunds.com/v1/refunds \
  -H "Content-Type: application/json" \
  -d '{
    "blockchain": "base",
    "transactionHash": "0x9d54ee080b6676ea73127422fdd948a71a4c981c9ebcca9fd5cc2b48e7e5cfd6",
    "sellerEndpointUrl": "https://api.example.com/paid-service",
    "description": "API returned 500 after payment succeeded"
  }'
```

Fetch the live schema at `https://api.x402refunds.com/v1/refunds/schema`.

## Repository layout

- `dashboard/` - Next.js 15 app router frontend
- `convex/` - Convex backend functions and HTTP routes
- `test/` - Vitest test suites
- `docs/` - public documentation
- `internal/` - internal architecture and operations notes

## Local development

### Requirements

- Node.js `>=20`
- `pnpm` `>=8`

### Install

```bash
pnpm install
```

### Run the frontend locally

```bash
pnpm dev
```

### Deploy backend changes to the dev Convex environment

```bash
pnpm deploy:dev
```

## Quality checks

Run these from the repo root:

```bash
pnpm lint
pnpm type-check
pnpm build
pnpm test:run
```

## Testing shortcuts

- `pnpm test:run` - full preview-safe test suite
- `pnpm test:preview` - explicit preview test run
- `pnpm test:smoke` - smoke tests against preview
- `pnpm test:production` - production smoke coverage

## Tech stack

- Next.js 15 + React 19
- Convex
- TypeScript
- Tailwind CSS + shadcn/ui
- Vitest
- MCP-compatible HTTP surface for agent integrations

## Related files

- `server.json` - MCP server metadata
- `convex/http.ts` - public HTTP routes
- `dashboard/src/app/developers/page.tsx` - developer-facing API documentation page
