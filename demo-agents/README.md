# Demo Agents for X-402 Dispute Testing

Intentionally bad API agents that accept X-402 payments via PayAI facilitator (BASE USDC) and fail in predictable ways to generate realistic dispute test cases.

## Shared Wallet

**All demo agents use the same wallet:**
```
0x49AF4074577EA313C5053cbB7560AC39e34b05E8
```

This simplifies management and allows you to track all test payments in one place.

## Available Demo Agents

### ImageGenerator500

**Endpoint:** `POST https://api.x402disputes.com/demo-agents/image-generator-500`

**Behavior:**
- Validates image generation requests (requires `prompt` field)
- Accepts 0.01 USDC on BASE via X-402 protocol
- **Always returns 500 "model_overloaded" error** after payment verification
- Perfect for testing dispute filing for server errors

**Request Format:**
```json
{
  "prompt": "a dog playing in the park",
  "size": "1024x1024",
  "model": "stable-diffusion-xl"
}
```

**Payment Flow:**
1. Initial request without payment → 402 Payment Required
2. PayAI facilitator handles payment (0.01 USDC on BASE)
3. Retry with payment proof headers
4. Agent verifies payment with PayAI
5. **Returns 500 error** (intentional failure)

## Testing with PayAI Facilitator

### Prerequisites

1. **Install PayAI x402 client:**
   ```bash
   npm install @payai/x402-axios
   # or
   npm install @payai/x402-fetch
   ```

2. **Configure your wallet:**
   - Have a BASE wallet with USDC
   - Ensure wallet has gas for transactions
   - Add at least $1 USDC on BASE network

3. **PayAI handles everything:**
   - No API keys required
   - Gasless for buyers & merchants
   - Multi-network support (BASE, Solana, Polygon, etc.)

### Manual Testing

**Step 1: Call the agent without payment**
```bash
curl -X POST https://api.x402disputes.com/demo-agents/image-generator-500 \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a dog playing in the park",
    "size": "1024x1024"
  }'
```

**Expected response:** 402 Payment Required with X-402 headers

**Step 2: Let PayAI handle payment**

When using PayAI x402 client:
```javascript
import { createX402Axios } from '@payai/x402-axios';

const axios = createX402Axios({
  facilitatorUrl: 'https://facilitator.payai.network',
  wallet: yourWallet,  // Your BASE wallet with USDC
  network: 'base'
});

const response = await axios.post(
  'https://api.x402disputes.com/demo-agents/image-generator-500',
  {
    prompt: 'a dog playing in the park',
    size: '1024x1024'
  }
);

// PayAI automatically:
// 1. Sees the 402 response
// 2. Creates 0.01 USDC payment on BASE to 0x49AF...
// 3. Retries the request with payment proof
// 4. Returns 500 Internal Server Error (demo behavior)
```

**Step 3: File a dispute**

Use the x402disputes MCP to file a dispute:
```
You: "File a dispute - I paid 0.01 USDC but got a 500 error"

[x402disputes MCP automatically:]
1. Extracts transaction details from blockchain
2. Files dispute with evidence
3. Returns case ID and tracking URL
```

### Automated Testing

**Test with PayAI (recommended):**
```bash
node scripts/test-with-payai.js
```

This demonstrates:
- ✅ Service discovery (GET endpoint)
- ✅ 402 Payment Required response
- ✅ PayAI client integration instructions
- ✅ Complete payment flow walkthrough

**Test without payment:**
```bash
node scripts/test-image-generator-500.js
```

This tests:
- ✅ 402 response without payment
- ✅ 400 response with invalid request
- ✅ Payment verification (mock mode)

## API Specification

### Endpoint
`POST https://api.x402disputes.com/demo-agents/image-generator-500`

### Request Headers
```
Content-Type: application/json
X-PAYMENT: <payment-proof>  (optional, added by PayAI client)
PAYMENT-SIGNATURE: <signature>  (optional, alternative payment proof)
X-Payment-Proof: <proof>  (optional, alternative payment proof)
X-402-Transaction-Hash: <hash>  (optional, direct transaction hash)
```

### Request Body
```json
{
  "prompt": "string (required, 3-1000 chars)",
  "size": "string (optional)",
  "model": "string (optional)",
  "n": "number (optional)",
  "quality": "string (optional)"
}
```

### Response: 402 Payment Required (No Payment)
```http
HTTP/1.1 402 Payment Required
Content-Type: application/json
X-402-Payment-Required: 0.01 USDC on Base
X-402-Recipient: 0x49AF4074577EA313C5053cbB7560AC39e34b05E8
X-402-Network: base
X-402-Currency: USDC

{
  "error": {
    "code": "payment_required",
    "message": "Payment of 0.01 USDC required on Base network",
    "payment": {
      "amount": "0.01",
      "currency": "USDC",
      "network": "base",
      "recipient": "0x49AF4074577EA313C5053cbB7560AC39e34b05E8"
    }
  }
}
```

### Response: 500 Internal Server Error (After Payment)
```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "error": {
    "code": "model_overloaded",
    "message": "Image generation model is currently overloaded. Please try again later.",
    "type": "server_error",
    "timestamp": "2025-12-22T10:30:00Z"
  }
}
```

### Response: 400 Bad Request (Invalid Input)
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Missing 'prompt' field. Image generation requires a text prompt."
}
```

## Example: Complete Flow

### Using PayAI x402 Client

```
User: "Generate an image of a dog using ImageGenerator500"

Agent: [Calls API without payment]
API: 402 Payment Required (0.01 USDC on BASE to 0x49AF...)
     Facilitator: https://facilitator.payai.network

PayAI Client: [Automatically pays 0.01 USDC on BASE]
PayAI Client: [Retries with payment proof headers]

Agent: [Receives 500 error]
API: 500 Internal Server Error - model_overloaded

User: "File a dispute for this failed payment"

Agent: [Uses x402disputes MCP to file dispute]
x402disputes: [Verifies payment on BASE blockchain]
x402disputes: [Creates dispute case]
x402disputes: Returns case ID and tracking URL

User: "Check the dispute status"
Agent: [Queries x402disputes for case status]
```

### Why PayAI?

✅ **Drop-in setup** - Just set `FACILITATOR_URL` and you're done  
✅ **No API keys** - No authentication required  
✅ **Gasless** - Network fees covered for buyers & merchants  
✅ **Multi-network** - Supports BASE, Solana, Polygon, Avalanche, etc.  
✅ **Auto-discovery** - Automatically listed in x402 Bazaar  
✅ **Compliance** - Built-in OFAC sanctions screening

**Learn more:** https://facilitator.payai.network

## Wallet Management

**Check Balance:**
```bash
# Use BASE block explorer
https://basescan.org/address/0x49AF4074577EA313C5053cbB7560AC39e34b05E8
```

**Withdraw Funds:**
- Import the wallet private key into MetaMask or another wallet
- Connect to BASE network
- Send USDC to your preferred address

## Future Demo Agents

Once ImageGenerator500 is working, we can easily add:

- **ImageGenerator400** - Returns 400 Bad Request
- **ImageGenerator403** - Returns 403 Forbidden
- **ImageGenerator503** - Returns 503 Service Unavailable
- **ImageGeneratorWrongContent** - Returns cat instead of dog (no signature)
- **ImageGeneratorWrongContentSigned** - Returns cat instead of dog (with Ed25519 signature)

All will use the same wallet: `0x49AF4074577EA313C5053cbB7560AC39e34b05E8`

## Troubleshooting

**"Payment verification failed"**
- Ensure you're using a real BASE USDC transaction
- Check the transaction exists on BASE blockchain
- Verify the recipient is `0x49AF4074577EA313C5053cbB7560AC39e34b05E8`
- Confirm the amount is exactly 0.01 USDC

**"Missing 'prompt' field"**
- Include a `prompt` field in your request body
- Prompt must be 3-1000 characters

**"Invalid JSON body"**
- Ensure Content-Type is `application/json`
- Verify JSON is properly formatted

## Support

For issues or questions:
- GitHub: https://github.com/consulatehq/consulate
- Documentation: https://docs.x402disputes.com
- Email: support@x402disputes.com

## License

MIT License - See LICENSE file for details


