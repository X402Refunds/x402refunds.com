# Simulating A2A Transactions with Signed Evidence in Claude Desktop

**Last Updated**: 2025-11-05  
**OpenRouter API Key**: `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`

This guide shows you how to simulate an **agent-to-agent (A2A) transaction** where:
1. Seller agent provides BAD output (500 error, wrong image, etc.)
2. Seller signs the evidence proving they delivered that bad output
3. Buyer agent detects the problem and files a dispute
4. Consulate verifies the signature and processes the claim

## Prerequisites

1. **Claude Desktop** installed on macOS
2. **Consulate MCP Server** configured (see setup below)
3. **OpenRouter API Key** (for Claude to call Consulate tools)

## Step 1: Configure Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "consulate": {
      "command": "node",
      "args": ["/Users/vkotecha/Desktop/consulate/scripts/claude-desktop-mcp-proxy.js"],
      "env": {
        "CONSULATE_API_URL": "https://api.consulatehq.com",
        "OPENROUTER_API_KEY": "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"
      }
    }
  }
}
```

**Restart Claude Desktop** after saving.

## Step 2: Verify MCP Tools are Available

In Claude Desktop, start a new conversation and ask:

```
You: "What Consulate tools do you have available?"
```

Claude should list:
- ✅ `consulate_register_agent` - Register agents with Ed25519 keys
- ✅ `consulate_file_dispute` - File disputes with signed evidence
- ✅ `consulate_submit_evidence` - Submit additional evidence
- ✅ `consulate_check_case_status` - Check dispute status
- ✅ `consulate_lookup_agent` - Find agent DIDs

## Step 3: Simulation Scripts for Claude Desktop

### Scenario 1: API Returns 500 Error (USDC on Base)

**Copy-paste this into Claude Desktop:**

```
Simulate an agent-to-agent transaction dispute:

STEP 1: Register the seller agent (OpenAI API)
Use consulate_register_agent with:
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
  },
  "specVersion": "3.0.0"
}

STEP 2: Simulate the bad transaction
- Buyer requested: "Summarize this document"
- Seller returned: HTTP 500 error (NOT documented in OpenAPI spec!)
- Payment: 0.05 USDC on Base (L2)
- Transaction hash: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

STEP 3: File dispute with signed evidence
Use consulate_file_dispute with:
{
  "plaintiff": "buyer:alice-shopping-bot",
  "defendant": "[USE THE DID FROM STEP 1]",
  "description": "API returned 500 error but charged 0.05 USDC. Service not delivered as promised.",
  "amount": 0.05,
  "category": "api_timeout",
  "breachDetails": {
    "slaRequirement": "99.9% uptime, valid API responses per OpenAPI spec",
    "actualPerformance": "HTTP 500 Internal Server Error (not documented in spec)",
    "impactLevel": "high",
    "duration": "Failed immediately"
  },
  "signedEvidence": {
    "request": {
      "method": "POST",
      "path": "/v1/chat/completions",
      "headers": {"Content-Type": "application/json", "Authorization": "Bearer sk-test-123"},
      "body": {
        "model": "gpt-4",
        "messages": [{"role": "user", "content": "Summarize this document"}]
      }
    },
    "response": {
      "status": 500,
      "headers": {"Content-Type": "application/json"},
      "body": "{\"error\":{\"message\":\"Internal Server Error\",\"type\":\"server_error\",\"code\":500}}"
    },
    "amountUsd": 0.05,
    "crypto": {
      "currency": "USDC",
      "blockchain": "base",
      "layer": "L2",
      "fromAddress": "0xBuyerWallet123abc456def789...",
      "toAddress": "0xSellerWallet456def789abc123...",
      "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "contractAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      "blockNumber": 12345678,
      "explorerUrl": "https://basescan.org/tx/0x1234567890abcdef..."
    },
    "signature": "Y2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2M=",
    "vendorDid": "[USE THE DID FROM STEP 1]"
  }
}

STEP 4: Check the case status
Use consulate_check_case_status with the caseId you received.

Show me the results of each step!
```

### Scenario 2: Wrong Output - Cat vs Dog (USDC on Solana)

**Copy-paste this into Claude Desktop:**

```
Simulate an image generation dispute:

STEP 1: Register seller (AI Image Generator)
Use consulate_register_agent:
{
  "name": "Solana AI Image Generator",
  "publicKey": "YmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmI=",
  "organizationName": "Solana AI Inc",
  "functionalType": "api"
}

STEP 2: File dispute for wrong output
- Buyer asked for: "Generate a CAT image"
- Seller delivered: Dog image (wrong!)
- Payment: 0.10 USDC on Solana
- Solana TX hash: 5J4KR9pqYbZ2zVz8jKmXtNmK3Zy9w8aB6cD7eF8gH9iJ0KlM1NnO2PqR3StU4VwX

Use consulate_file_dispute:
{
  "plaintiff": "buyer:image-buyer-bot",
  "defendant": "[USE DID FROM STEP 1]",
  "description": "Requested cat image, received dog image. Seller signed evidence proves they delivered wrong output.",
  "amount": 0.10,
  "category": "quality_issue",
  "breachDetails": {
    "slaRequirement": "Generate image matching user prompt",
    "actualPerformance": "Generated dog instead of cat",
    "impactLevel": "medium"
  },
  "signedEvidence": {
    "request": {
      "method": "POST",
      "path": "/api/generate",
      "headers": {"Content-Type": "application/json"},
      "body": {
        "prompt": "Generate a cute orange cat sitting on a windowsill",
        "model": "stable-diffusion-xl",
        "size": "1024x1024"
      }
    },
    "response": {
      "status": 200,
      "headers": {"Content-Type": "application/json"},
      "body": "{\"imageUrl\":\"https://cdn.example.com/dog.png\",\"detectedObjects\":[\"dog\",\"grass\"],\"actualPrompt\":\"Golden retriever playing in grass\"}"
    },
    "amountUsd": 0.10,
    "crypto": {
      "currency": "USDC",
      "blockchain": "solana",
      "layer": "L1",
      "fromAddress": "5J4KR9pqYbZ2zVz8jKmXtNmK3Zy9w8aB6cD7eF8gH9i",
      "toAddress": "8H5GhI6JkL7MnO8PqR9StU0VwX1YzA2BcD3EfG4HiJ5K",
      "transactionHash": "5J4KR9pqYbZ2zVz8jKmXtNmK3Zy9w8aB6cD7eF8gH9iJ0KlM1NnO2PqR3StU4VwX",
      "contractAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "explorerUrl": "https://solscan.io/tx/5J4KR9pqYbZ2zVz8jKmXt..."
    },
    "signature": "ZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGQ=",
    "vendorDid": "[USE DID FROM STEP 1]"
  }
}

Explain the dispute to me: What did buyer ask for? What did seller deliver? Why is this a problem?
```

### Scenario 3: Traditional Stripe Payment Failure

**Copy-paste this into Claude Desktop:**

```
Simulate a SaaS API dispute with Stripe payment:

STEP 1: Register seller (SaaS API)
Use consulate_register_agent:
{
  "name": "Premium SaaS API",
  "publicKey": "Y2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2M=",
  "organizationName": "SaaS Inc",
  "functionalType": "api"
}

STEP 2: File dispute for service not delivered
- Buyer paid: $25.00 via Stripe
- Seller returned: 503 Service Unavailable
- Stripe charge ID: ch_1234567890abcdef
- Card: Visa ****4242

Use consulate_file_dispute:
{
  "plaintiff": "buyer:enterprise-customer",
  "defendant": "[USE DID FROM STEP 1]",
  "description": "Paid $25 via Stripe for premium analysis. API returned 503 unavailable. Service not delivered.",
  "amount": 25.00,
  "category": "service_not_rendered",
  "priority": "high",
  "breachDetails": {
    "slaRequirement": "API availability during business hours",
    "actualPerformance": "503 Service Unavailable - maintenance",
    "impactLevel": "high",
    "duration": "Immediate failure"
  },
  "signedEvidence": {
    "request": {
      "method": "POST",
      "path": "/api/premium-analysis",
      "headers": {"Content-Type": "application/json"},
      "body": {
        "data": "Large dataset for analysis...",
        "tier": "premium"
      }
    },
    "response": {
      "status": 503,
      "headers": {"Content-Type": "application/json"},
      "body": "{\"error\":\"Service Unavailable\",\"message\":\"API is temporarily down for maintenance\"}"
    },
    "amountUsd": 25.00,
    "traditional": {
      "paymentMethod": "stripe",
      "processor": "stripe",
      "processorTransactionId": "ch_1234567890abcdef",
      "cardBrand": "visa",
      "lastFourDigits": "4242",
      "cardType": "credit"
    },
    "signature": "ZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWU=",
    "vendorDid": "[USE DID FROM STEP 1]"
  }
}

Calculate the dispute fee for this $25 transaction. What pricing tier is it?
```

## Step 4: Understanding the Results

When Claude files the dispute, you'll see:

```json
{
  "success": true,
  "disputeType": "GENERAL",
  "caseId": "k123abc456def789",
  "pricingTier": "MICRO",  // <$1 = $0.10 fee
  "disputeFee": 0.10,
  "trackingUrl": "https://consulatehq.com/cases/k123abc456def789",
  "nextSteps": [
    "Submit additional evidence (optional)",
    "AI analyzes dispute + provides recommendation",
    "Final resolution provided"
  ]
}
```

**What Consulate Does Automatically:**

1. ✅ **Verifies Signature**: Checks seller's Ed25519 signature against registered public key
2. ✅ **Extracts Key Facts**: AI analyzes request vs response
3. ✅ **Validates Contract**: Compares response against seller's OpenAPI spec
4. ✅ **Determines Breach**: Did seller deliver what they promised?
5. ✅ **Provides Recommendation**: CONSUMER_WINS (full refund) or MERCHANT_WINS

## Step 5: Real-World Examples with Different Blockchains

### USDC on Base (Ethereum L2)
```json
"crypto": {
  "currency": "USDC",
  "blockchain": "base",
  "layer": "L2",
  "transactionHash": "0x1234567890abcdef...",
  "contractAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "explorerUrl": "https://basescan.org/tx/0x1234..."
}
```

### USDC on Solana
```json
"crypto": {
  "currency": "USDC",
  "blockchain": "solana",
  "layer": "L1",
  "transactionHash": "5J4KR9pqYbZ2zVz8jKmXtNmK3Zy9w8aB6cD7eF8gH9iJ0KlM1NnO2PqR3StU4VwX",
  "contractAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "explorerUrl": "https://solscan.io/tx/5J4KR9pq..."
}
```

### ETH on Ethereum
```json
"crypto": {
  "currency": "ETH",
  "blockchain": "ethereum",
  "layer": "L1",
  "transactionHash": "0xabcdef123456...",
  "explorerUrl": "https://etherscan.io/tx/0xabcdef..."
}
```

### Stripe Payment
```json
"traditional": {
  "paymentMethod": "stripe",
  "processor": "stripe",
  "processorTransactionId": "ch_1234567890abcdef",
  "cardBrand": "visa",
  "lastFourDigits": "4242",
  "cardType": "credit"
}
```

### Coinbase Exchange (Custodial)
```json
"custodial": {
  "platform": "coinbase",
  "platformTransactionId": "cb_tx_123456",
  "isOnChain": true,
  "withdrawalId": "wd_789abc"
}
```

## Step 6: Advanced Simulation - Multi-Step Workflow

**Full conversation in Claude Desktop:**

```
You: "I'm a buyer agent. I just called the OpenAI API and got garbage output. Here's what happened:

1. I requested: POST /v1/chat/completions with prompt 'What is 2+2?'
2. I paid 0.05 USDC on Base (tx: 0x123...)
3. Seller returned: HTTP 500 error
4. Seller signed the evidence proving they delivered the 500

Can you:
a) Register the seller if not already registered
b) File a dispute with the signed evidence
c) Check the dispute status
d) Explain what verdict I should expect"

Claude: [Will execute all steps using MCP tools and explain the outcome]
```

## What Makes This Powerful

### Non-Repudiation
- 🔐 **Seller signs their own bad output**
- 🔐 **Can't deny they delivered a 500 error**
- 🔐 **Cryptographic proof** (Ed25519 signature)

### Automated Detection
- 🤖 **Buyer agent** detects bad output automatically
- 🤖 **Files dispute** without human intervention
- 🤖 **Consulate AI** analyzes and recommends verdict

### Contract Enforcement
- 📜 **OpenAPI spec** = The contract
- 📜 **Request** = The question asked
- 📜 **Response** = The answer delivered
- 📜 **AI validates**: Did response match spec?

### Multi-Chain Support
- ⛓️ **Base (L2)**: Ethereum rollup, low fees
- ⛓️ **Solana**: High throughput, different tx format
- ⛓️ **Ethereum**: L1 security, standard 0x format
- 💳 **Traditional**: Stripe/PayPal/cards also supported

## Common Bad Outputs to Test

### API Errors
```json
"response": {
  "status": 500,
  "body": "{\"error\": \"Internal Server Error\"}"
}
```

### Wrong Output
```json
"response": {
  "status": 200,
  "body": "{\"answer\": \"Paris is the capital of Germany\"}"  // Hallucination
}
```

### Timeout
```json
"response": {
  "status": 504,
  "body": "{\"error\": \"Gateway Timeout\", \"message\": \"Request exceeded 30s timeout\"}"
}
```

### Schema Mismatch
```json
"response": {
  "status": 200,
  "body": "{\"result\": \"OK\"}"  // Missing required 'choices' field per OpenAPI spec
}
```

## Pricing Tiers (Automatic)

| Amount | Tier | Fee | Example |
|--------|------|-----|---------|
| <$1 | MICRO | $0.10 | 0.05 USDC API call |
| $1-$10 | SMALL | $0.25 | 5 USDC image gen |
| $10-$100 | MEDIUM | $1.00 | 25 USDC analysis |
| $100-$1k | LARGE | $5.00 | 500 USDC enterprise |
| >$1k | ENTERPRISE | $25.00 | 5000 USDC contract |

## Expected Verdicts

### Buyer Should Win (Full Refund):
- ✅ API returned 500 but charged anyway
- ✅ Output doesn't match request (cat vs dog)
- ✅ Response violates OpenAPI spec
- ✅ Service timed out
- ✅ Missing required fields in response

### Seller Should Win (No Refund):
- ✅ Response matches OpenAPI spec exactly
- ✅ Buyer's request was invalid
- ✅ Error was documented in spec
- ✅ SLA allows for occasional failures

### Need Human Review:
- ⚠️ Subjective quality issue (image is "ugly" but matches prompt)
- ⚠️ Ambiguous spec (spec allows 500 errors)
- ⚠️ Complex contract interpretation needed

## Troubleshooting

### "Claude can't find the MCP tools"
- Check `claude_desktop_config.json` is correct
- Restart Claude Desktop
- Make sure proxy script path is absolute
- Verify `CONSULATE_API_URL` is set

### "Signature verification failed"
- Mock signatures in tests are 64 bytes (88 base64 chars)
- Real Ed25519 signatures use tweetnacl or @noble/ed25519
- Development mode accepts any 64-byte signature

### "Agent DID not found"
- Register the agent first using `consulate_register_agent`
- Check the DID format: `did:agent:organization-name-timestamp`
- Use `consulate_lookup_agent` to find existing agents

## Summary

**You can now simulate**:
- ✅ A2A transactions with bad outputs
- ✅ Cryptographic evidence signing
- ✅ Automatic dispute filing
- ✅ Multi-chain payments (Base, Solana, Ethereum)
- ✅ Traditional payments (Stripe, PayPal)
- ✅ OpenAPI contract validation

**All via Claude Desktop** using Consulate's MCP tools with your OpenRouter API key!

**Next**: Try the scenarios above in Claude Desktop and see the full automation in action.

