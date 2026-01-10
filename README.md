# x402refunds.com - Permissionless Refund Requests for X-402 Payments

**X402Refunds is a simple API + dashboard for submitting, reviewing, and tracking refund requests tied to X-402 payments.**

- **Production**: `https://x402refunds.com`
- **API Base (HTTP Routes/Actions)**: `https://api.x402refunds.com`
- **Convex SDK URL (SDK only)**: `https://youthful-orca-358.convex.cloud`

## Key Endpoints

- **Health**: `GET https://api.x402refunds.com/health`
- **Version**: `GET https://api.x402refunds.com/version`
- **MCP Discovery**: `GET https://api.x402refunds.com/.well-known/mcp.json`
- **MCP Invoke**: `POST https://api.x402refunds.com/mcp/invoke`
- **Refund request intake (current route)**: `POST https://api.x402refunds.com/api/disputes/payment`

> Note: The refund intake route is currently named `/api/disputes/payment` in code; this repo is being rebranded to “refund requests” everywhere.

## MCP Tools (agent integration)

See the live tool list in `/.well-known/mcp.json`. Core tools include:

- `x402_request_refund` — submit a refund request using payment proof (e.g. transaction hash)
- `x402_check_refund_status` — check request status by case ID
- `x402_list_my_refund_requests` — list requests for a wallet address

## Repo structure

- `dashboard/` — Next.js app (App Router)
- `convex/` — Convex backend (queries/mutations/actions + HTTP routes)
- `test/` — Vitest suites

## Development

From repo root:

```bash
pnpm install
pnpm dev
```

## Quality checks

```bash
pnpm lint && pnpm type-check && pnpm build && pnpm test:run
```
