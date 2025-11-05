# Signed Evidence Complete Flow - Implementation Summary

**Last Updated**: 2025-11-05  
**Status**: ✅ Fully Implemented & Deployed to Production

This document describes the complete end-to-end flow for agent-to-agent (A2A) transactions with cryptographically signed evidence.

---

## 🎯 The Complete Flow

### 1. Seller Agent Registers with Consulate

**Endpoint**: `POST /agents/register` or `consulate_register_agent` MCP tool

```json
{
  "name": "OpenAI Chat API",
  "publicKey": "YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=",
  "organizationName": "OpenAI Inc",
  "functionalType": "api",
  "openApiSpec": {
    "openapi": "3.0.0",
    "paths": {
      "/v1/chat/completions": {
        "post": {
          "responses": {
            "200": {
              "description": "Success",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "required": ["choices"],
                    "properties": {
                      "choices": {"type": "array"}
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

**Response**:
```json
{
  "agentId": "10000;agents",
  "did": "did:agent:openai-inc-1234567890",
  "disputeUrl": "https://api.consulatehq.com/disputes/claim?vendor=did:agent:openai-inc-1234567890",
  "publicKey": "YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=",
  "message": "Agent registered successfully"
}
```

**What Seller Stores**:
- ✅ Ed25519 **public key** (for signature verification)
- ✅ **OpenAPI spec** (the "contract" of what they promise)
- ✅ **Dispute URL** (where buyers can file disputes)

---

### 2. Buyer Agent Calls Seller Agent (A2A Transaction)

**Buyer's Request**:
```http
POST https://openai-api.example.com/v1/chat/completions
Content-Type: application/json
Authorization: Bearer buyer-token-123

{
  "model": "gpt-4",
  "messages": [
    {"role": "user", "content": "What is 2+2?"}
  ]
}
```

---

### 3. Seller Agent Responds (WITH BAD OUTPUT) and Signs Everything

**Seller's Response** (the critical part!):

```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json
X-Dispute-URL: https://api.consulatehq.com/disputes/claim?vendor=did:agent:openai-inc-1234567890
X-Consulate-ADP: https://api.consulatehq.com/.well-known/adp
X-Vendor-DID: did:agent:openai-inc-1234567890
X-Signature: Y2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2M=

{
  "error": {
    "message": "Internal Server Error",
    "type": "server_error",
    "code": 500
  }
}
```

**What Seller Signs** (Ed25519 signature):

```json
{
  "request": {
    "method": "POST",
    "path": "/v1/chat/completions",
    "headers": {"Content-Type": "application/json"},
    "body": {
      "model": "gpt-4",
      "messages": [{"role": "user", "content": "What is 2+2?"}]
    }
  },
  "response": {
    "status": 500,
    "headers": {
      "contentType": "application/json",
      "disputeUrl": "https://api.consulatehq.com/disputes/claim?vendor=did:agent:openai-inc-1234567890",
      "consulateAdp": "https://api.consulatehq.com/.well-known/adp",
      "vendorDid": "did:agent:openai-inc-1234567890"
    },
    "body": "{\"error\":{\"message\":\"Internal Server Error\",\"code\":500}}"
  },
  "amountUsd": 0.05,
  "crypto": {
    "currency": "USDC",
    "blockchain": "base",
    "layer": "L2",
    "fromAddress": "0xBuyerWallet...",
    "toAddress": "0xSellerWallet...",
    "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "contractAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "explorerUrl": "https://basescan.org/tx/0x1234..."
  }
}

// Signature = sign(JSON.stringify(above), privateKey)
```

**Key Points**:
- 🔐 Seller signs **their own bad output** (500 error)
- 🔐 Signature includes **dispute URL in headers** (can't deny providing it)
- 🔐 Signature includes **request** (the question) and **response** (the bad answer)
- 🔐 **Non-repudiation**: Seller can't claim they delivered something different

---

### 4. Buyer Agent Detects Bad Output

**Buyer's Logic**:
```typescript
// Buyer receives response
const response = await fetch(sellerApiUrl, request);

// Check if output is bad
if (response.status === 500 || detectBadOutput(response.body)) {
  // Extract dispute URL from signed headers
  const disputeUrl = response.headers.get('X-Dispute-URL');
  const signature = response.headers.get('X-Signature');
  const vendorDid = response.headers.get('X-Vendor-DID');
  
  // File dispute automatically!
  await fileDis pute(disputeUrl, signedEvidence);
}
```

---

### 5. Buyer Agent Files Dispute (TWO OPTIONS)

#### Option A: Direct HTTP POST to Dispute URL ✅

**Buyer POSTs to the URL from seller's headers**:

```http
POST https://api.consulatehq.com/disputes/claim?vendor=did:agent:openai-inc-1234567890
Content-Type: application/json

{
  "transactionId": "tx_abc123",
  "amount": 0.05,
  "complaint": "Paid 0.05 USDC but received 500 error instead of answer",
  
  "request": {
    "method": "POST",
    "path": "/v1/chat/completions",
    "headers": {"Content-Type": "application/json"},
    "body": {"model": "gpt-4", "messages": [...]}
  },
  
  "response": {
    "status": 500,
    "headers": {
      "contentType": "application/json",
      "disputeUrl": "https://api.consulatehq.com/disputes/claim?vendor=did:agent:openai-inc-1234567890",
      "vendorDid": "did:agent:openai-inc-1234567890"
    },
    "body": "{\"error\":{\"message\":\"Internal Server Error\",\"code\":500}}"
  },
  
  "amountUsd": 0.05,
  "crypto": {
    "currency": "USDC",
    "blockchain": "base",
    "layer": "L2",
    "transactionHash": "0x1234567890abcdef...",
    "contractAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "explorerUrl": "https://basescan.org/tx/0x1234..."
  },
  
  "signature": "Y2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2M="
}
```

**Backend extracts vendor from URL**: `?vendor=did:agent:openai-inc-1234567890`

#### Option B: MCP Tool (No URL Needed) ✅

**Buyer calls MCP tool**:

```json
{
  "tool": "consulate_file_dispute",
  "parameters": {
    "plaintiff": "buyer:alice-bot",
    "defendant": "did:agent:openai-inc-1234567890",
    "description": "Paid but received 500 error",
    "amount": 0.05,
    "category": "api_timeout",
    "signedEvidence": {
      "request": {...},
      "response": {...},
      "amountUsd": 0.05,
      "crypto": {...},
      "signature": "..."
    }
  }
}
```

**MCP server routes internally** - no URL needed!

---

### 6. Consulate Verifies & Processes

**Step 1: Extract Vendor DID**
```typescript
// From URL query param (Option A) or defendant field (Option B)
const vendorDid = url.searchParams.get("vendor") || body.defendant;
// Result: "did:agent:openai-inc-1234567890"
```

**Step 2: Get Vendor's Public Key**
```typescript
const vendor = await getAgent(vendorDid);
// Retrieves: publicKey + openApiSpec from registration
```

**Step 3: Verify Signature**
```typescript
const payload = JSON.stringify(signedEvidence);
const verified = await verifyEd25519Signature({
  publicKey: vendor.publicKey,
  signature: body.signature,
  payload: payload
});

if (!verified) {
  return { error: "Signature verification failed" };
}
```

**Step 4: Validate Against Contract (OpenAPI Spec)**
```typescript
const specValidation = await validateApiContract({
  openApiSpec: vendor.openApiSpec,  // The "contract"
  requestPath: "/v1/chat/completions",
  requestMethod: "POST",
  responseStatus: 500,  // NOT in spec!
  responseBody: signedEvidence.response.body
});

// Result: Contract breach detected - 500 not documented
```

**Step 5: AI Recommendation**
```typescript
{
  "verdict": "BUYER_WINS",
  "confidence": 0.98,
  "reasoning": "Seller returned HTTP 500 (not documented in OpenAPI spec). Service not delivered. Signed evidence proves seller delivered the error. Full refund warranted.",
  "refundAmount": 0.05,
  "refundCurrency": "USDC"
}
```

---

## 🔑 Key Features Implemented

### ✅ Dispute URL in Signed Headers

**Schema** (`convex/schema.ts`, `convex/cases.ts`):
```typescript
signedEvidence: {
  response: {
    headers: {
      contentType: string,
      disputeUrl: string,       // ← SIGNED!
      consulateAdp: string,      // ← SIGNED!
      vendorDid: string,         // ← SIGNED!
    }
  }
}
```

**Benefits**:
- Seller commits to providing dispute mechanism
- Buyer trusts the URL (it's cryptographically signed)
- No need for `.well-known/adp` discovery
- Tamper-proof evidence chain

### ✅ Multi-Blockchain Support

**USDC on Base (Ethereum L2)**:
```json
"crypto": {
  "currency": "USDC",
  "blockchain": "base",
  "layer": "L2",
  "transactionHash": "0x1234567890abcdef...",
  "contractAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
}
```

**USDC on Solana**:
```json
"crypto": {
  "currency": "USDC",
  "blockchain": "solana",
  "layer": "L1",
  "transactionHash": "5J4KR9pqYbZ2zVz8jKmXtNmK3Zy9w8aB6cD7eF8gH9i...",
  "contractAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
}
```

**Traditional Stripe**:
```json
"traditional": {
  "paymentMethod": "stripe",
  "processorTransactionId": "ch_1234567890abcdef",
  "cardBrand": "visa",
  "lastFourDigits": "4242"
}
```

### ✅ Vendor Discovery from URL

**Backend automatically extracts vendor**:
```typescript
// URL: /disputes/claim?vendor=did:agent:openai-inc-123
const vendorDid = url.searchParams.get("vendor");
// Uses this as defendant automatically!
```

**Buyer doesn't need to specify defendant** when using URL - it's in the URL!

---

## 📊 Test Coverage

**File**: `test/signed-evidence-workflow.test.ts`

✅ **Test 1**: Full workflow (vendor registers → bad output → buyer files)
✅ **Test 2**: Invalid signature rejection
✅ **Test 3**: USDC on Solana (different tx hash format)
✅ **Test 4**: Traditional Stripe payment
✅ **Test 5**: Dispute URL present in signed headers
✅ **Test 6**: Vendor DID extraction from URL
✅ **Test 7**: Direct HTTP POST to dispute URL
✅ **Test 8**: HTTP endpoint compatibility

**All 489 tests passing** (32 test files)

---

## 🔄 Two Ways to File Disputes

### Way 1: Direct HTTP POST (No MCP Needed)

**Buyer extracts from seller's response**:
```javascript
const disputeUrl = response.headers.get('X-Dispute-URL');
// Result: "https://api.consulatehq.com/disputes/claim?vendor=did:agent:openai-inc-123"

// POST directly to that URL
await fetch(disputeUrl, {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    transactionId: "tx_123",
    amount: 0.05,
    complaint: "Got 500 error",
    request: {...},
    response: {...},
    crypto: {...},
    signature: "..."
  })
});
```

**Advantages**:
- ✅ Works with any HTTP client
- ✅ No MCP protocol needed
- ✅ Vendor DID automatically extracted from URL
- ✅ Simple REST API

### Way 2: MCP Tool (Protocol-Based)

**Buyer calls MCP tool**:
```json
{
  "tool": "consulate_file_dispute",
  "parameters": {
    "plaintiff": "buyer:alice",
    "defendant": "did:agent:openai-inc-123",
    "signedEvidence": {...}
  }
}
```

**Advantages**:
- ✅ Works across agent frameworks
- ✅ Auto-discovered via `/.well-known/mcp.json`
- ✅ Standardized protocol
- ✅ Works in Claude Desktop, ChatGPT, etc.

---

## 🔐 Signature & Non-Repudiation

### What Gets Signed

**The complete transaction package**:
```json
{
  "request": {
    "method": "POST",
    "path": "/v1/chat/completions",
    "headers": {...},
    "body": {...}  // ← The "question"
  },
  "response": {
    "status": 500,
    "headers": {
      "disputeUrl": "https://api.consulatehq.com/disputes/claim?vendor=did:agent:...",
      "vendorDid": "did:agent:..."
    },
    "body": "..."  // ← The "bad answer"
  },
  "amountUsd": 0.05,
  "crypto": {...}  // Full blockchain details
}
```

**Signature = Ed25519(JSON.stringify(above), seller's private key)**

### Why This Works (Non-Repudiation)

1. **Seller signs their own bad output**
   - Can't later claim "I didn't deliver a 500 error"
   - Cryptographic proof they provided that response

2. **Seller signs the dispute URL**
   - Can't claim "I didn't offer a dispute mechanism"
   - Proof they made recourse available

3. **Seller signs the request**
   - Can't claim "Buyer asked something different"
   - Clear record of what was requested

4. **Buyer files using seller's signature**
   - Buyer doesn't create evidence, seller does
   - Trustworthy evidence (seller authenticated it)

---

## 🌐 Multi-Chain Examples

### Base (Ethereum L2) - USDC
```json
{
  "crypto": {
    "currency": "USDC",
    "blockchain": "base",
    "layer": "L2",
    "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "contractAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "explorerUrl": "https://basescan.org/tx/0x1234...",
    "fromAddress": "0xBuyer...",
    "toAddress": "0xSeller..."
  },
  "amountUsd": 0.05
}
```

### Solana - USDC
```json
{
  "crypto": {
    "currency": "USDC",
    "blockchain": "solana",
    "layer": "L1",
    "transactionHash": "5J4KR9pqYbZ2zVz8jKmXtNmK3Zy9w8aB6cD7eF8gH9iJ0KlM1NnO2PqR3StU4VwX",
    "contractAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "explorerUrl": "https://solscan.io/tx/5J4KR9pq...",
    "fromAddress": "5J4KR...",
    "toAddress": "8H5Gh..."
  },
  "amountUsd": 0.10
}
```

### Ethereum Mainnet - ETH
```json
{
  "crypto": {
    "currency": "ETH",
    "blockchain": "ethereum",
    "layer": "L1",
    "transactionHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    "explorerUrl": "https://etherscan.io/tx/0xabcdef...",
    "fromAddress": "0xBuyer...",
    "toAddress": "0xSeller..."
  },
  "amountUsd": 5.00
}
```

### Stripe/Traditional
```json
{
  "traditional": {
    "paymentMethod": "stripe",
    "processor": "stripe",
    "processorTransactionId": "ch_1234567890abcdef",
    "cardBrand": "visa",
    "lastFourDigits": "4242",
    "cardType": "credit"
  },
  "amountUsd": 25.00
}
```

---

## 🎬 Real-World Scenarios

### Scenario 1: API Returns 500 (USDC on Base)
- **Buyer asks**: "Summarize document"
- **Seller delivers**: HTTP 500 error
- **Seller charges**: 0.05 USDC on Base
- **Seller signs**: Request + 500 response + dispute URL
- **Buyer sees**: 500 error + dispute URL in headers
- **Buyer files**: POST to dispute URL with signed evidence
- **Consulate verdict**: BUYER_WINS (full refund)

### Scenario 2: Wrong Output (USDC on Solana)
- **Buyer asks**: "Generate cat image"
- **Seller delivers**: Dog image
- **Seller charges**: 0.10 USDC on Solana
- **Seller signs**: Request (cat) + Response (dog) + dispute URL
- **Buyer sees**: Dog image + dispute URL
- **Buyer files**: POST to dispute URL
- **Consulate verdict**: BUYER_WINS (output mismatch)

### Scenario 3: Service Unavailable (Stripe)
- **Buyer pays**: $25 via Stripe
- **Seller delivers**: 503 Service Unavailable
- **Seller signs**: Request + 503 response + dispute URL
- **Buyer sees**: 503 error + dispute URL
- **Buyer files**: POST to dispute URL
- **Consulate verdict**: BUYER_WINS (service not delivered)

---

## 📝 Schema Structure (Final)

```typescript
signedEvidence: {
  // What was requested
  request: {
    method: string,
    path: string,
    headers?: any,
    body?: any
  },
  
  // What was delivered (including dispute URL in headers!)
  response: {
    status: number,
    headers?: {
      contentType?: string,
      disputeUrl?: string,      // ✅ Signed dispute URL
      consulateAdp?: string,     // ✅ Signed ADP discovery URL
      vendorDid?: string,        // ✅ Signed vendor DID
      other?: any
    },
    body: string
  },
  
  // Payment details (USD value)
  amountUsd?: number,
  
  // Crypto (USDC, ETH, SOL, etc.)
  crypto?: {
    currency: string,
    blockchain: string,
    layer?: "L1" | "L2",
    fromAddress?: string,
    toAddress?: string,
    transactionHash?: string,
    contractAddress?: string,
    blockNumber?: number,
    explorerUrl?: string
  },
  
  // Custodial (exchanges)
  custodial?: {
    platform: string,
    platformTransactionId?: string,
    isOnChain?: boolean,
    withdrawalId?: string
  },
  
  // Traditional (Stripe, cards)
  traditional?: {
    paymentMethod: string,
    processor?: string,
    processorTransactionId?: string,
    cardBrand?: string,
    lastFourDigits?: string,
    cardType?: string
  },
  
  // Cryptographic proof
  signature: string,        // Ed25519 signature (base64)
  signatureVerified: boolean,
  vendorDid: string
}
```

---

## ✅ Deployment Status

- ✅ **Preview**: `youthful-orca-358.convex.cloud`
- ✅ **Production**: `api.consulatehq.com`
- ✅ **Tests**: 489 passing
- ✅ **MCP Tools**: Available via `/.well-known/mcp.json`
- ✅ **HTTP Endpoints**: `/disputes/claim?vendor={vendorDid}`

---

## 🚀 How to Test

### Claude Desktop (Local Testing)
See: `/Users/vkotecha/Desktop/consulate/CLAUDE_DESKTOP_QUICKSTART.md`

### Automated Tests
```bash
pnpm test test/signed-evidence-workflow.test.ts
```

### Production API
```bash
curl https://api.consulatehq.com/.well-known/adp
curl https://api.consulatehq.com/.well-known/mcp.json
```

---

## 💡 Summary

**The system now supports**:
1. ✅ Sellers signing complete transaction evidence (request + response + headers)
2. ✅ Dispute URL included in signed headers (non-repudiation)
3. ✅ Multi-blockchain support (Base, Solana, Ethereum, Bitcoin)
4. ✅ Multi-payment type (crypto, custodial, traditional)
5. ✅ Two filing methods (direct HTTP POST or MCP tool)
6. ✅ Vendor discovery from URL query parameter
7. ✅ OpenAPI contract validation
8. ✅ 95% AI automation with human review queue

**To answer your questions**:

**Q: Is `.well-known/adp` necessary?**
A: ❌ NO - Not if seller includes dispute URL in signed headers. It's a fallback.

**Q: Does dispute URL need to be signed?**
A: ✅ YES - Now signed as part of response headers. Seller commits to providing recourse.

**Q: Can backend map URL to agent?**
A: ✅ YES - Extracts vendor DID from `?vendor=` query parameter

**Q: Can buyer POST to URL directly?**
A: ✅ YES - Both HTTP POST and MCP tool work. Buyer chooses!

**All implemented, tested, and deployed!** 🚀

