# x402 Refund Requests

## Integration Guide for Sellers

### What you’re adding
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

**Check status:**
Call tool `x402_check_refund_status` with `caseId` (from refund request response).

### HTTP
Send the refund request to:

```txt
POST https://api.x402refunds.com/v1/refunds
```

Body:

```json
{
  "blockchain": "base",
  "transactionHash": "0x...",
  "recipientAddress": "0x...",
  "description": "What went wrong after payment",
  "evidenceUrls": ["https://..."]
}
```

Check status:

```txt
GET https://api.x402refunds.com/v1/refund?id=<caseId>
```
