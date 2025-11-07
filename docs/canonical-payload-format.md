# Canonical Payload Format for Signed Evidence

**Version:** 1.0  
**Last Updated:** 2025-11-07  
**Status:** Production

---

## Overview

This document defines the **exact payload format** that seller agents MUST use when signing transaction evidence for dispute resolution.

**Why this matters:** The payload string must be **byte-for-byte identical** between what seller signs and what buyer forwards. Any formatting differences will cause signature verification to fail.

---

## The Canonical Format

```javascript
const payload = JSON.stringify({
  request: {
    method: string,        // HTTP method: "POST", "GET", "PUT", etc.
    path: string,          // API endpoint path: "/v1/chat/completions"
    headers: object,       // Request headers (optional, can be {})
    body: object           // Request body (optional, can be {})
  },
  response: {
    status: number,        // HTTP status code: 200, 500, 503, etc.
    body: string           // Response body as string (not object!)
  },
  amountUsd: number,       // Transaction amount in USD (e.g., 0.05)
  x402paymentDetails: {
    // === REQUIRED FIELDS ===
    currency: string,           // Cryptocurrency: "USDC", "ETH", "SOL", "BTC", etc.
    blockchain: string,         // Blockchain: "base", "ethereum", "solana", "polygon", etc.
    transactionHash: string,    // Blockchain transaction hash (proof of payment)
    fromAddress: string,        // Buyer's wallet address (who paid)
    toAddress: string,          // Seller's wallet address (who received)
    
    // === OPTIONAL FIELDS ===
    timestamp: string,          // ISO 8601: "2025-11-07T15:30:00Z"
    blockNumber: number,        // Block number: 12345678
    contractAddress: string,    // Token contract: "0x833589fCD6eDb6..."
    layer: string,              // "L1" or "L2"
    explorerUrl: string         // "https://basescan.org/tx/0x..."
  }
});
```

---

## Critical Rules

### 1. Use Compact JSON (NO formatting)
```javascript
// ✅ CORRECT (compact)
const payload = JSON.stringify(data);
// Result: {"request":{"method":"POST"},"response":{...}}

// ❌ WRONG (formatted)
const payload = JSON.stringify(data, null, 2);
// Result: {
//   "request": {
//     "method": "POST"
//   },
//   ...
// }
```

### 2. Field Order MUST Match Above
The order of fields matters for deterministic JSON.stringify behavior. Always use the order shown above.

### 3. Response Body is STRING (not object)
```javascript
// ✅ CORRECT
response: {
  status: 500,
  body: JSON.stringify({ error: "Internal Server Error" })  // ← String
}

// ❌ WRONG
response: {
  status: 500,
  body: { error: "Internal Server Error" }  // ← Object
}
```

### 4. Required vs Optional x402paymentDetails Fields

**REQUIRED (must be present):**
- currency
- blockchain
- transactionHash (proof payment happened)
- fromAddress (who paid)
- toAddress (who received)

**OPTIONAL (include if available):**
- timestamp, blockNumber, contractAddress, layer, explorerUrl

---

## Implementation Example

```javascript
// Seller agent code
function createSignedEvidence(request, response, paymentInfo) {
  // 1. Build canonical payload
  const payload = JSON.stringify({
    request: {
      method: request.method,
      path: request.path,
      headers: request.headers || {},
      body: request.body || {}
    },
    response: {
      status: response.status,
      body: typeof response.body === 'string' 
        ? response.body 
        : JSON.stringify(response.body)
    },
    amountUsd: paymentInfo.amountUsd,
    x402paymentDetails: {
      currency: paymentInfo.currency,
      blockchain: paymentInfo.blockchain,
      transactionHash: paymentInfo.transactionHash,
      fromAddress: paymentInfo.fromAddress,
      toAddress: paymentInfo.toAddress,
      timestamp: paymentInfo.timestamp || new Date().toISOString(),
      blockNumber: paymentInfo.blockNumber,
      contractAddress: paymentInfo.contractAddress,
      layer: paymentInfo.layer,
      explorerUrl: paymentInfo.explorerUrl
    }
  });
  
  // 2. Sign the payload
  const signature = ed25519.sign(payload, privateKey);
  
  // 3. Return headers
  return {
    'X-Payload': base64Encode(payload),
    'X-Signature': base64Encode(signature),
    'X-Dispute-URL': `https://api.consulatehq.com/disputes/claim?vendor=${sellerDid}`
  };
}
```

---

## Verification Process

**Consulate's verification:**
```javascript
// 1. Decode evidencePayload (base64 → string)
const payloadString = base64Decode(evidencePayload);

// 2. Verify signature
const valid = ed25519.verify(payloadString, signature, sellerPublicKey);

// 3. If valid → Parse payload
const evidence = JSON.parse(payloadString);

// 4. Use evidence to judge dispute
```

---

## Common Mistakes

### ❌ Mistake 1: Pretty-printing JSON
```javascript
// WRONG - adds formatting
JSON.stringify(data, null, 2)
```

### ❌ Mistake 2: Response body as object
```javascript
// WRONG
response: { status: 500, body: { error: "..." } }

// CORRECT
response: { status: 500, body: JSON.stringify({ error: "..." }) }
```

### ❌ Mistake 3: Missing required x402 fields
```javascript
// WRONG - missing fromAddress
x402paymentDetails: {
  currency: "USDC",
  blockchain: "base",
  transactionHash: "0x123..."
  // Missing: fromAddress, toAddress ❌
}
```

### ❌ Mistake 4: Buyer reconstructs payload
```javascript
// WRONG - buyer rebuilds payload
const payload = JSON.stringify({ request, response, amount, payment });
// → Will have different formatting than seller's payload
// → Signature verification FAILS

// CORRECT - buyer forwards seller's exact payload
const payload = sellerResponse.headers.get('X-Payload');
// → Exact same bytes seller signed
// → Signature verification SUCCEEDS
```

---

## Testing Your Implementation

```bash
# 1. Create test payload
const payload = JSON.stringify({ request, response, amountUsd, x402paymentDetails });

# 2. Sign it
const signature = ed25519.sign(payload, privateKey);

# 3. Verify you can re-verify
const valid = ed25519.verify(payload, signature, publicKey);
# Should be TRUE

# 4. Test tampering detection
const tampered = payload + " ";  // Add one space
const stillValid = ed25519.verify(tampered, signature, publicKey);
# Should be FALSE (signature breaks!)
```

---

## Support

Questions about this format? Contact: support@consulatehq.com

**Protocol:** Agentic Dispute Protocol (ADP)  
**Repository:** https://github.com/consulatehq/agentic-dispute-protocol

