# Demo Agents for X-402 Dispute Testing

Intentionally bad API agents that accept Coinbase Payments MCP (BASE USDC) and fail in predictable ways to generate realistic dispute test cases.

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
2. Coinbase Payments MCP automatically pays 0.01 USDC on BASE
3. Retry with X-402-Transaction-Hash header
4. Agent verifies payment on BASE blockchain
5. **Returns 500 error** (intentional failure)

## Testing with Coinbase Payments MCP

### Prerequisites

1. **Install Coinbase Payments MCP:**
   ```bash
   npx @coinbase/payments-mcp
   ```

2. **Configure with Claude Desktop or Claude Code:**
   - Follow the installation prompts
   - Select your MCP client
   - Authenticate with email + OTP

3. **Fund your wallet with BASE USDC:**
   - Use Coinbase Onramp feature
   - Add at least $1 USDC on BASE network

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

**Step 2: Let Coinbase Payments MCP handle payment**

When using an AI agent with Coinbase Payments MCP installed:
```
You: "Call the ImageGenerator500 API to generate an image of a dog"

[Coinbase Payments MCP automatically:]
1. Sees the 402 response
2. Creates 0.01 USDC payment on BASE to 0x49AF4074577EA313C5053cbB7560AC39e34b05E8
3. Retries the request with X-402-Transaction-Hash header

Agent receives: 500 Internal Server Error
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

Run the test script:
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
X-402-Transaction-Hash: <transaction-hash>  (optional, added by Coinbase Payments MCP)
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

### Using AI Agent with Coinbase Payments MCP

```
User: "Generate an image of a dog using ImageGenerator500"

Agent: [Calls API without payment]
API: 402 Payment Required (0.01 USDC on BASE to 0x49AF...)

Coinbase Payments MCP: [Automatically pays 0.01 USDC on BASE]
Coinbase Payments MCP: [Retries with X-402-Transaction-Hash]

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

