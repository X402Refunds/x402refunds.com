# x402 Disputes & Refunds

## Overview

**What this does**: post-transaction disputes + refunds for x402 payments.

**The problem**: AI agents pay for APIs and digital goods. Sometimes the result is wrong, low-quality, or never arrives.

If someone pays you and your x402 API fails (timeout, 500, bad output), they can file a dispute.

It’s also for “the API worked, but the output/product was bad or unsatisfactory.”

You do **not** need to build:
- chargebacks
- a dispute inbox
- dispute tracking pages
- “did you refund?” status pages

**What you get**: disputes sent straight to your email, plus the ability to **refund / deny / partial refund**.

This is intentionally simple:
- disputes are permissionless
- the payment is verified on-chain
- you decide the outcome (optional: add refund credits to automate refunds)

## Integration Guide for Merchants

### What you’re adding (2 copy/pastes)
1) A `/.well-known/x402.json` file (public, on your domain)
2) A `Link` header (points to your disputes feed)

After that, disputes can reach you by email and in your dashboard.

### Step 1 — Publish `/.well-known/x402.json`
Put this at: `https://YOUR_DOMAIN/.well-known/x402.json`

Minimal example:

```json
{
  "x402disputes": {
    "merchant": "eip155:8453:0xYourMerchantWallet",
    "supportEmail": "disputes@yourdomain.com",
    "paymentDisputeUrl": "https://api.x402disputes.com/v1/disputes?merchant=eip155:8453:0xYourMerchantWallet"
  }
}
```

What matters:
- `merchant`: your Base wallet in CAIP-10
- `supportEmail`: where disputes should be delivered
- `paymentDisputeUrl`: points to your disputes feed

### Step 2 — Add a Link header
In your paid API responses (or in your x402 402 responses), include a link to your dispute feed:

```txt
Link: <https://api.x402disputes.com/v1/disputes?merchant=eip155:8453:0xYourMerchantWallet>; rel="payment-dispute"; type="application/json"
```

That’s it. Now anyone can discover your disputes endpoint and you can receive disputes.

### Optional — Add refund credits (for automatic refunds)
If you want one-click refunds from the dashboard, add refund credits:
- Top up here: `/topup`
- Check balance here: `/topup`

### Where to view disputes
- Check your disputes: `/disputes`
- Public registry view: `/registry`

## File Disputes as a Buyer Agent

If you paid a merchant via x402 and something went wrong, you can file a dispute.

Quick reminder:
- **Filing is free for the filer** (merchant pays the processing fee).
- We verify the payment **on-chain** (USDC transfer).

### Timing (typical)
- Resolution: fast for micro disputes; up to 10 business days max (Reg E).

### HTTP (default)

There are two ways to file:
- Manual: use the web form
- Programmatic: call the HTTP API

Manual (humans):
- Open: `/file-dispute`

Programmatic (HTTP):
Send a JSON body to `POST /v1/disputes`:

```bash
curl -sS https://api.x402disputes.com/v1/disputes \
  -H "Content-Type: application/json" \
  -d '{
    "merchant": "eip155:8453:0xYourMerchantWallet",
    "merchantApiUrl": "https://api.merchant.com/v1/endpoint-you-called",
    "txHash": "0xYourBaseTxHash",
    "description": "Payment succeeded, then the API returned 500.",
    "evidenceUrls": ["https://example.com/logs/timeout.json"]
  }'
```

Response includes `caseId` and `trackingUrl`.

Check status:

```bash
curl -sS https://api.x402disputes.com/cases/<caseId>
```

### MCP (for LLMs)

If you’re an LLM agent, connect via MCP:
- MCP server: `https://api.x402disputes.com/mcp`

File a dispute using the tool `x402_file_dispute`.

Copy/paste prompt:

```txt
Use x402Disputes MCP to file an X-402 payment dispute:
- description: API timed out after payment
- request: POST https://merchant.com/v1/resource
- response: 504 {"error":"timeout"}
- transactionHash: 0x...
- blockchain: base
```

Tip: the MCP tool supports Base and Solana. The manual form is Base-only.

Check status (copy/paste prompt):

```txt
Use x402Disputes MCP to check dispute status for caseId: ...
```


