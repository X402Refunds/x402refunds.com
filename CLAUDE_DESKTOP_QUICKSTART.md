# Test Signed Evidence in Claude Desktop (30 seconds)

**For**: Agents already transacting who want to add automatic dispute resolution  
**Time**: 30 seconds to test end-to-end

---

## Step 1: Register Seller (Copy-Paste to Claude)

```
Use consulate_register_agent:
{
  "name": "OpenAI API",
  "publicKey": "YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=",
  "organizationName": "OpenAI Inc",
  "functionalType": "api"
}

Save the returned DID.
```

---

## Step 2: Simulate Bad Output & File Dispute (Copy-Paste to Claude)

```
Use consulate_file_dispute with ONLY the dispute URL (replace [SELLER_DID]):

{
  "plaintiff": "buyer:alice-bot",
  "disputeUrl": "https://api.consulatehq.com/disputes/claim?vendor=[SELLER_DID]",
  "description": "API returned 500 error but charged 0.05 USDC",
  "amount": 0.05,
  "category": "api_timeout",
  "signedEvidence": {
    "request": {
      "method": "POST",
      "path": "/v1/chat",
      "body": {"model": "gpt-4", "messages": [{"role": "user", "content": "test"}]}
    },
    "response": {
      "status": 500,
      "headers": {
        "contentType": "application/json",
        "disputeUrl": "https://api.consulatehq.com/disputes/claim?vendor=[SELLER_DID]",
        "vendorDid": "[SELLER_DID]"
      },
      "body": "{\"error\":\"Internal Server Error\"}"
    },
    "amountUsd": 0.05,
    "crypto": {
      "currency": "USDC",
      "blockchain": "base",
      "layer": "L2",
      "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "contractAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
    },
    "signature": "Y2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2M="
  }
}
```

---

## That's It!

**You'll see**:
- ✅ Dispute filed with case ID
- ✅ Vendor auto-extracted from URL (no parsing needed!)
- ✅ Fee: $0.10 (MICRO tier)
- ✅ Expected verdict: BUYER_WINS

---

## Other Test Scenarios

### Solana USDC - Wrong Output (Cat vs Dog)

```
Use consulate_file_dispute:
{
  "plaintiff": "buyer:image-bot",
  "disputeUrl": "https://api.consulatehq.com/disputes/claim?vendor=[SELLER_DID]",
  "description": "Asked for cat, got dog",
  "amount": 0.10,
  "category": "quality_issue",
  "signedEvidence": {
    "request": {
      "method": "POST",
      "path": "/api/generate",
      "body": {"prompt": "cute orange cat"}
    },
    "response": {
      "status": 200,
      "headers": {
        "disputeUrl": "https://api.consulatehq.com/disputes/claim?vendor=[SELLER_DID]",
        "vendorDid": "[SELLER_DID]"
      },
      "body": "{\"imageUrl\":\"dog.png\",\"detectedObjects\":[\"dog\"]}"
    },
    "amountUsd": 0.10,
    "crypto": {
      "currency": "USDC",
      "blockchain": "solana",
      "layer": "L1",
      "transactionHash": "5J4KR9pqYbZ2zVz8jKmXtNmK3Zy9w8aB6cD7eF8gH9iJ0KlM1NnO2PqR3StU4VwX",
      "contractAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
    },
    "signature": "ZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGQ="
  }
}
```

### Stripe - Service Unavailable

```
Use consulate_file_dispute:
{
  "plaintiff": "buyer:enterprise",
  "disputeUrl": "https://api.consulatehq.com/disputes/claim?vendor=[SELLER_DID]",
  "description": "Paid $25 via Stripe, got 503",
  "amount": 25.00,
  "category": "service_not_rendered",
  "signedEvidence": {
    "request": {"method": "POST", "path": "/api/premium", "body": {}},
    "response": {
      "status": 503,
      "headers": {
        "disputeUrl": "https://api.consulatehq.com/disputes/claim?vendor=[SELLER_DID]",
        "vendorDid": "[SELLER_DID]"
      },
      "body": "{\"error\":\"Service Unavailable\"}"
    },
    "amountUsd": 25.00,
    "traditional": {
      "paymentMethod": "stripe",
      "processorTransactionId": "ch_1234567890abcdef",
      "cardBrand": "visa",
      "lastFourDigits": "4242"
    },
    "signature": "ZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWU="
  }
}
```

---

## Blockchain-Specific Details

| Chain | Currency | TX Hash Format | Contract Example |
|-------|----------|----------------|------------------|
| **Base** | USDC | `0x...` (66 chars) | `0x833589fCD...` |
| **Solana** | USDC | Base58 (87 chars) | `EPjFWdd5Au...` |
| **Ethereum** | ETH | `0x...` (66 chars) | Native ETH |
| **Stripe** | USD | `ch_...` | N/A |

---

## Key Points

<CardGroup cols={2}>
  <Card title="Just Pass disputeUrl" icon="link">
    No URL parsing. Backend extracts vendor DID.
  </Card>
  
  <Card title="Seller Signs Everything" icon="shield">
    Request + Response + Headers all signed. Non-repudiation!
  </Card>
  
  <Card title="95% Auto-Resolved" icon="robot">
    AI analyzes in < 5 min. Human review only if needed.
  </Card>
  
  <Card title="$0.10 - $25 Fees" icon="dollar-sign">
    Based on dispute amount. No monthly fees.
  </Card>
</CardGroup>

---

**Need help?** support@consulatehq.com | [consulatehq.com](https://consulatehq.com)
