# Dispute Filing Methods - Agent UX Guide

**Last Updated**: 2025-11-05  
**Status**: ✅ Deployed to Production

This document explains the **three ways** agents can file disputes with Consulate, optimized for different use cases.

---

## ✅ Method 1: Using disputeUrl (SIMPLEST - Recommended for A2A)

**When to use**: Agent has seller's signed response with `X-Dispute-URL` header

**Agent Code** (minimal parsing required):
```javascript
// Step 1: Call seller API
const response = await fetch('https://seller-api.com/endpoint', {...});

// Step 2: Check if output is bad
if (isBadOutput(response)) {
  // Step 3: Extract dispute URL from seller's signed headers
  const disputeUrl = response.headers.get('X-Dispute-URL');
  // Example: "https://api.consulatehq.com/disputes/claim?vendor=did:agent:seller-123"
  
  // Step 4: File dispute - JUST PASS THE URL!
  await consulate_file_dispute({
    plaintiff: "buyer:my-agent",
    disputeUrl: disputeUrl,  // ← No parsing needed!
    description: "Got 500 error instead of result",
    amount: 0.05,
    category: "api_timeout",
    signedEvidence: {
      request: {...},
      response: {...},
      crypto: {...},
      signature: response.headers.get('X-Signature')
    }
  });
  
  // Done! Backend auto-extracts vendor DID from URL
}
```

**Benefits**:
- ✅ **Simplest agent UX** - just pass the URL, no parsing
- ✅ **No vendor DID extraction** needed (backend does it)
- ✅ **Works with signed evidence** (cryptographic proof)
- ✅ **One-liner**: Grab header, pass to tool

**Schema**:
```json
{
  "plaintiff": "REQUIRED",
  "disputeUrl": "OPTIONAL - Auto-extracts defendant",
  "defendant": "NOT NEEDED if disputeUrl provided",
  "signedEvidence": "OPTIONAL - Cryptographic proof",
  "description": "REQUIRED",
  "amount": "REQUIRED"
}
```

---

## ✅ Method 2: Using defendant (Traditional - Flexible)

**When to use**: Agent knows/discovers seller's DID directly (no signed evidence)

**Agent Code**:
```javascript
// Agent discovers or knows seller's DID
const sellerDid = await lookupAgent("OpenAI");
// Or: const sellerDid = "did:agent:openai-inc-123";

// File dispute directly
await consulate_file_dispute({
  plaintiff: "buyer:my-agent",
  defendant: sellerDid,  // ← Direct DID
  description: "API was down for 3 hours, violated SLA",
  amount: 1000,
  category: "sla_violation",
  breachDetails: {
    slaRequirement: "99.9% uptime",
    actualPerformance: "97.5% uptime"
  },
  evidenceUrls: [
    "https://monitoring.example.com/downtime-report.json"
  ]
});
```

**Benefits**:
- ✅ **Works without signed evidence** (for any dispute type)
- ✅ **Historical disputes** (filing about past incidents)
- ✅ **Non-agent defendants** (merchants, companies)
- ✅ **Flexible evidence** (URLs, documents, logs)

**Schema**:
```json
{
  "plaintiff": "REQUIRED",
  "defendant": "REQUIRED if no disputeUrl",
  "disputeUrl": "NOT NEEDED",
  "signedEvidence": "OPTIONAL",
  "description": "REQUIRED",
  "amount": "REQUIRED"
}
```

---

## ✅ Method 3: Direct HTTP POST to disputeUrl

**When to use**: Agent not using MCP, wants pure REST API

**Agent Code**:
```bash
# Extract URL from seller's response headers
DISPUTE_URL=$(curl ... | jq -r '.headers["X-Dispute-URL"]')

# POST directly to that URL
curl -X POST "$DISPUTE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "tx_123",
    "amount": 0.05,
    "complaint": "Got 500 error",
    "request": {...},
    "response": {...},
    "crypto": {...},
    "signature": "..."
  }'
```

**Benefits**:
- ✅ **No MCP needed** (pure HTTP)
- ✅ **Works with any HTTP client** (curl, fetch, axios)
- ✅ **Vendor auto-extracted** from URL query param
- ✅ **REST API standard**

---

## 🎯 Which Method Should You Use?

### Use **disputeUrl** (Method 1) when:
- ✅ You have seller's signed evidence with dispute URL in headers
- ✅ Real-time A2A transaction (seller just responded)
- ✅ Want simplest agent UX (no URL parsing)
- ✅ Using MCP tools

### Use **defendant** (Method 2) when:
- ✅ No signed evidence available
- ✅ Filing about historical/past incidents
- ✅ Defendant is not an agent (merchant, company)
- ✅ You know the defendant DID directly

### Use **HTTP POST** (Method 3) when:
- ✅ Not using MCP protocol
- ✅ Want pure REST API
- ✅ Already have HTTP client setup
- ✅ Need maximum compatibility

---

## 📊 Comparison Table

| Feature | disputeUrl | defendant | HTTP POST |
|---------|-----------|-----------|-----------|
| **Requires URL parsing** | ❌ No | ✅ Yes (to discover DID) | ❌ No |
| **Works with signed evidence** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Works without signed evidence** | ❌ No | ✅ Yes | ✅ Yes |
| **Vendor auto-extraction** | ✅ Yes | ❌ No | ✅ Yes |
| **Requires MCP** | ✅ Yes | ✅ Yes | ❌ No |
| **Simplest agent code** | ✅ Yes | ⚠️ Medium | ⚠️ Medium |

---

## 🔧 Implementation Details

### MCP Tool Handler Logic

```typescript
// MCP handler in convex/mcp.ts
case "consulate_file_dispute":
  // Extract defendant from disputeUrl OR use provided defendant
  let defendant = parameters.defendant;
  
  if (parameters.disputeUrl) {
    const url = new URL(parameters.disputeUrl);
    defendant = url.searchParams.get('vendor');
    console.log(`✅ Extracted vendor from URL: ${defendant}`);
  }
  
  if (!defendant) {
    throw Error("Must provide either disputeUrl OR defendant");
  }
  
  // File dispute with extracted/provided defendant
  await fileDispute({ defendant, ...params });
```

### Signed Headers Structure

**Seller includes in response** (camelCase for Convex compatibility):
```json
{
  "status": 500,
  "headers": {
    "contentType": "application/json",
    "disputeUrl": "https://api.consulatehq.com/disputes/claim?vendor=did:agent:seller-123",
    "consulateAdp": "https://api.consulatehq.com/.well-known/adp",
    "vendorDid": "did:agent:seller-123"
  },
  "body": "{\"error\": \"Internal Server Error\"}"
}
```

**These headers are SIGNED** - part of the Ed25519 signature payload.

---

## 🚀 Real-World Examples

### Example 1: A2A with Signed Evidence (disputeUrl)

```javascript
// Buyer agent receives bad response from seller
const sellerResponse = {
  status: 500,
  headers: {
    'X-Dispute-URL': 'https://api.consulatehq.com/disputes/claim?vendor=did:agent:openai-123',
    'X-Signature': 'Y2NjY2NjY2NjY2...'
  },
  body: '{"error": "Internal Server Error"}'
};

// File dispute - SIMPLEST UX!
consulate_file_dispute({
  plaintiff: "buyer:alice",
  disputeUrl: sellerResponse.headers['X-Dispute-URL'],  // Just pass it!
  description: "Paid but got 500 error",
  amount: 0.05,
  category: "api_timeout",
  signedEvidence: extractFromResponse(sellerResponse)
});
```

### Example 2: Historical SLA Breach (defendant)

```javascript
// Agent notices: "API was down yesterday!"
consulate_file_dispute({
  plaintiff: "did:agent:monitoring-bot",
  defendant: "did:agent:api-vendor",  // Manually specify
  description: "API downtime from 2pm-5pm violated 99.9% SLA",
  amount: 5000,
  category: "sla_violation",
  evidenceUrls: [
    "https://monitoring.example.com/downtime-report.json",
    "https://example.com/sla-contract.pdf"
  ]
});
```

### Example 3: Consumer vs Merchant (defendant)

```javascript
// Human consumer (not an agent) files dispute
consulate_file_dispute({
  plaintiff: "consumer:alice@gmail.com",
  defendant: "merchant:shady-vendor.com",  // Not an agent DID
  description: "Charged $50, never shipped product",
  amount: 50,
  category: "service_not_rendered",
  evidenceUrls: [
    "https://example.com/order-receipt.pdf"
  ]
});
```

---

## 📝 Updated Tool Schema

**consulate_file_dispute** now accepts:

```json
{
  "name": "consulate_file_dispute",
  "input_schema": {
    "properties": {
      "plaintiff": {
        "type": "string",
        "description": "REQUIRED. Who's filing (email, agent DID, company)"
      },
      "defendant": {
        "type": "string",
        "description": "OPTIONAL if disputeUrl provided. Who's being disputed. Provide EITHER disputeUrl OR defendant."
      },
      "disputeUrl": {
        "type": "string",
        "description": "OPTIONAL. Complete URL from X-Dispute-URL header. Auto-extracts defendant. SIMPLEST UX - just pass the URL!"
      },
      "description": {"type": "string", "required": true},
      "amount": {"type": "number", "required": true},
      
      "signedEvidence": {
        "type": "object",
        "description": "OPTIONAL. Cryptographic proof from seller",
        "properties": {
          "request": {...},
          "response": {
            "status": "number",
            "headers": {
              "disputeUrl": "Signed dispute URL",
              "vendorDid": "Signed vendor DID"
            },
            "body": "string"
          },
          "crypto": {...},
          "traditional": {...},
          "custodial": {...},
          "signature": "string"
        }
      }
    },
    "required": ["plaintiff", "description", "amount"]
  }
}
```

**Note**: `defendant` is NOT in `required` array - it's extracted from `disputeUrl` if provided!

---

## ✅ What's Now Supported

1. ✅ **File with disputeUrl only** - Backend extracts defendant
2. ✅ **File with defendant only** - Traditional flow
3. ✅ **File with both** - disputeUrl takes precedence
4. ✅ **Signed headers** - disputeUrl is part of signed payload
5. ✅ **Multi-chain** - USDC on Base/Solana/Ethereum, ETH, BTC
6. ✅ **Multi-payment** - Crypto, custodial, traditional
7. ✅ **Error handling** - Clear validation messages

---

## 🧪 Test Coverage

**File**: `test/signed-evidence-workflow.test.ts`

✅ Test 1: Full workflow with disputeUrl extraction  
✅ Test 2: Solana USDC with signed headers  
✅ Test 3: Stripe payment with signed headers  
✅ Test 4: Verify disputeUrl in signed evidence  
✅ Test 5: Extract vendor DID from URL  
✅ Test 6: Direct HTTP POST support  
✅ Test 7: File with ONLY disputeUrl (no defendant)  

**All 490 tests passing** (32 test files)

---

## 🎯 Key Takeaway

**Agents can sue each other THREE ways**:

1. **With signed evidence + disputeUrl** (simplest, real-time A2A)
2. **With defendant DID** (flexible, works for any dispute)
3. **Direct HTTP POST** (no MCP, pure REST)

**All three work!** Agent chooses based on their use case and available information.

**Production ready!** ✅ Deployed to `api.consulatehq.com`

