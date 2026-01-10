# x402 Refund Requests

## Integration Guide for Merchants

### What you’re adding
1) A `/.well-known/x402.json` file (public, on your domain)
2) (Optional) Refund credits (for one-click refunds from email)
3) (Optional) A `Link` header (for discoverability)

After that, refund requests can reach you by email.

### Step 1 — Publish `/.well-known/x402.json`
Put this at: `https://YOUR_DOMAIN/.well-known/x402.json`

Example (live):
- [`https://api.x402refunds.com/.well-known/x402.json`](https://api.x402refunds.com/.well-known/x402.json)

Minimal example:

```json
{
  "x402refunds": {
    "supportEmail": "refunds@yourdomain.com",
    "refundRequestUrl": "https://api.x402refunds.com/v1/refunds?merchant=eip155:8453:0xYOUR_WALLET_HERE"
  }
}
```

What matters:
- `supportEmail`: where refund requests should be delivered
- `refundRequestUrl`: exchange endpoint for refund requests

### Step 2 — Add a Link header
This is optional. It helps AI agents automatically discover that your API supports refund requests. Refund requests will still work without it.

Include this header in your normal successful response (the `200 OK` you return after a paid request):

```txt
Link: <https://api.x402refunds.com/v1/refunds?merchant=eip155:8453:0xYourMerchantWallet>; rel="payment-refund"; type="application/json"
```

### Step 3 — Add refund credits (optional)
If you want one-click refunds from the refund request email, add refund credits:
- Top up here: [`/topup`](/topup)

## Submit Refund Requests as a Buyer Agent

If you paid a merchant via X-402 and something went wrong, you can submit a refund request.

Quick reminder:
- **Filing is free for the filer** (merchant pays the processing fee).
- We verify the payment **on-chain** (USDC transfer).

### Timing (typical)
- Processing: fast for micro payments; varies by merchant and request type.

### MCP (default for agents / LLMs)

If you’re an LLM agent, connect via MCP:
- MCP server: `https://api.x402refunds.com/mcp`

Then submit a refund request using the tool `x402_request_refund`.

Copy/paste prompt:

```txt
Use X402Refunds MCP to submit a payment refund request after a paid X-402 request had a bad or unsatisfactory result.

Call tool: x402_request_refund
Include:
- description: what happened (short and specific)
- transactionHash: 0x...
- blockchain: base
- recipientAddress: 0x... (the merchant wallet that received the payment)
```

Tip: the MCP tool supports Base and Solana. The manual form is Base-only.

Check status (copy/paste prompt):

```txt
Use X402Refunds MCP to check refund request status for caseId: ...
```

### Manual (humans)
- Open: `/file-dispute`

### HTTP (alternative)

Send a JSON body to `POST /v1/refunds`:

```bash
curl -sS https://api.x402refunds.com/v1/refunds \
  -H "Content-Type: application/json" \
  -d '{
    "merchant": "eip155:8453:0xYourMerchantWallet",
    "merchantApiUrl": "https://api.merchant.com/v1/endpoint-you-called",
    "txHash": "0xYourBaseTxHash",
    "description": "Payment succeeded, then the output was wrong / unsatisfactory.",
    "evidenceUrls": ["https://example.com/screenshot.png"]
  }'
```


