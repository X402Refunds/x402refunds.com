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

### What you’re adding
1) A `/.well-known/x402.json` file (public, on your domain)
2) (Optional) A `Link` header (for discoverability)
3) (Optional) Refund credits (for one-click refunds from email)

After that, disputes can reach you by email.

### Step 1 — Publish `/.well-known/x402.json`
Put this at: `https://YOUR_DOMAIN/.well-known/x402.json`

Example (live):
- [`https://api.x402disputes.com/.well-known/x402.json`](https://api.x402disputes.com/.well-known/x402.json)

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
- `merchant`: your wallet address in CAIP-10 format
- `supportEmail`: where disputes should be delivered
- `paymentDisputeUrl`: points to your disputes feed

### Step 2 — Add a Link header
This is optional. It helps AI agents automatically discover that your API supports disputes. Disputes will still work without it.

If you skip it, disputes still work (buyers can still file; you’ll still receive disputes by email).

Include this header in your normal successful response (the `200 OK` you return after a paid request):

```txt
Link: <https://api.x402disputes.com/v1/disputes?merchant=eip155:8453:0xYourMerchantWallet>; rel="payment-dispute"; type="application/json"
```

### Step 3 — Add refund credits (optional)
If you want one-click refunds from the dispute email, add refund credits:
- Top up here: [`/topup`](/topup)
- Check balance here: [`/topup`](/topup)

## File Disputes as a Buyer Agent

If you paid a merchant via x402 and something went wrong, you can file a dispute.

Quick reminder:
- **Filing is free for the filer** (merchant pays the processing fee).
- We verify the payment **on-chain** (USDC transfer).

### Timing (typical)
- Resolution: fast for micro disputes; up to 10 business days max (Reg E).

### MCP (default for agents / LLMs)

If you’re an LLM agent, connect via MCP:
- MCP server: `https://api.x402disputes.com/mcp`

Then file a dispute using the tool `x402_file_dispute`.

Copy/paste prompt:

```txt
Use x402Disputes MCP to file a payment dispute after a paid x402 request had a bad or unsatisfactory result.

Call tool: x402_file_dispute
Include:
- description: what happened (short and specific)
- transactionHash: 0x...
- blockchain: base
- recipientAddress: 0x... (the merchant wallet that received the payment)
```

Tip: the MCP tool supports Base and Solana. The manual form is Base-only.

Check status (copy/paste prompt):

```txt
Use x402Disputes MCP to check dispute status for caseId: ...
```

### Manual (humans)
- Open: `/file-dispute`

### HTTP (alternative)

Send a JSON body to `POST /v1/disputes`:

```bash
curl -sS https://api.x402disputes.com/v1/disputes \
  -H "Content-Type: application/json" \
  -d '{
    "merchant": "eip155:8453:0xYourMerchantWallet",
    "merchantApiUrl": "https://api.merchant.com/v1/endpoint-you-called",
    "txHash": "0xYourBaseTxHash",
    "description": "Payment succeeded, then the output was wrong / unsatisfactory.",
    "evidenceUrls": ["https://example.com/screenshot.png"]
  }'
```


