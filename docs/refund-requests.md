# x402 Refund Requests

## Integration Guide for Sellers

### What you're adding
1) A `Link` header advertising your refund contact email
2) A `Link` header advertising your refund request endpoint.
3) Top up refund credits for one-click refunds (optional).

### Step 1 — Add a `Link` header with your refund email

```txt
Link: <mailto:refunds@yourdomain.com>; rel="https://x402refunds.com/rel/refund-contact"
```

Replace `refunds@yourdomain.com` with an email you want to receive refund requests at.

### Step 2 — Add a `Link` header with our Refund Request URL.
Include this header in the 200 (Content) response after payment.

```txt
Link: <https://api.x402refunds.com/v1/refunds>; rel="https://x402refunds.com/rel/refund-request"; type="application/json"
```

### Step 3 — Top up refund credits for one-click refunds
- Top up here: `/topup`

## Submit Refund Requests as a Buyer

### MCP (default)
MCP server URL:

```txt
https://api.x402refunds.com/mcp
```

**Request a refund:**

Call tool `x402_request_refund` with:
- `blockchain`: "base" or "solana"
- `transactionHash`: USDC transfer tx hash
- `recipientAddress`: Merchant wallet address
- `description`: What went wrong (10-500 chars)
- `evidenceUrls`: Optional array of evidence URLs

AI prompt (copy/paste):

```txt
Use the MCP tool x402_request_refund to submit a refund request for an X-402 payment that I just made.
```

**Check status:**

Call tool `x402_check_refund_status` with `caseId` (from refund request response).

AI prompt (copy/paste):

```txt
Use the MCP tool x402_check_refund_status to check the current status of a refund request that I filed.
```

### HTTP

**Endpoint:**

```txt
POST https://api.x402refunds.com/v1/refunds
```

**JSON Schema (machine-readable):**

```txt
GET https://api.x402refunds.com/v1/refunds/schema
```

Always fetch this schema to get the current field requirements. The schema URL returns a JSON Schema (`application/schema+json`) describing the exact request body format.

**Required Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `blockchain` | `"base"` or `"solana"` | Network where the USDC payment occurred |
| `transactionHash` | string | USDC payment tx hash. Base: `0x` + 64 hex. Solana: base58 signature |
| `sellerEndpointUrl` | string | The exact `https://` URL of the paid API endpoint (must include path) |
| `description` | string | What went wrong after payment |

**Optional Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `evidenceUrls` | string[] | Array of URLs pointing to evidence |
| `sourceTransferLogIndex` | number | For transactions with multiple USDC transfers |

**Example Request (Base):**

```bash
curl -X POST https://api.x402refunds.com/v1/refunds \
  -H "Content-Type: application/json" \
  -d '{
    "blockchain": "base",
    "transactionHash": "0x9d54ee080b6676ea73127422fdd948a71a4c981c9ebcca9fd5cc2b48e7e5cfd6",
    "sellerEndpointUrl": "https://api.x402refunds.com/demo-agents/image-generator",
    "description": "API returned 500 error after payment was confirmed"
  }'
```

**Example Request (Solana):**

```bash
curl -X POST https://api.x402refunds.com/v1/refunds \
  -H "Content-Type: application/json" \
  -d '{
    "blockchain": "solana",
    "transactionHash": "5wHu1qwD7q4E3gLBkBxCPJpBJT9wP4MqTJJJHqYvJSYX...",
    "sellerEndpointUrl": "https://api.example.com/paid-service",
    "description": "Service timed out after 30 seconds"
  }'
```

**Success Response:**

```json
{
  "ok": true,
  "caseId": "jh77n4k2x8m9...",
  "blockchain": "base",
  "transactionHash": "0x9d54ee...",
  "merchant": "eip155:8453:0x..."
}
```

**Error Recovery:**

If your request fails with HTTP 400, the response includes:
- `schema`: Full JSON Schema inline (no extra fetch needed)
- `recovery.fixes`: Array of field renames to apply
- `recovery.suggestedBody`: Corrected request body to retry immediately

Common field aliases that get auto-corrected:
- `network` → `blockchain`
- `transaction`, `txHash` → `transactionHash`
- `endpoint`, `url` → `sellerEndpointUrl`
- `reason`, `error` → `description`

**Important:** Do NOT send `amount`, `payer`, or `merchant` fields - these are derived from the on-chain USDC transfer automatically.

**Check status:**

```txt
GET https://api.x402refunds.com/v1/refund?id=<caseId>
```

**Full API Documentation:** [/developers](/developers)
