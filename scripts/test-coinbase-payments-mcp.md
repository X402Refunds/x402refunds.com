# Testing ImageGenerator500 with Coinbase Payments MCP

This guide walks through testing the ImageGenerator500 demo agent with Coinbase's Payments MCP for automatic X-402 payment handling.

## Prerequisites

### 1. Install Coinbase Payments MCP

```bash
npx @coinbase/payments-mcp
```

Follow the prompts to:
- Select your MCP client (Claude Desktop, Claude Code, Codex CLI, or Gemini CLI)
- Authenticate with your email
- Enter the OTP sent to your email
- Create an embedded wallet

### 2. Fund Your Wallet

After installation, you'll need BASE USDC:

1. Open your wallet interface
2. Select "Fund" option
3. Use Coinbase Onramp to add USDC
4. **Important:** Select BASE network (not Ethereum mainnet)
5. Add at least $1 USDC (enough for ~100 test calls at $0.01 each)

### 3. Verify Installation

Check that Coinbase Payments MCP is installed:

**For Claude Desktop:**
```bash
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

Should show `@coinbase/payments-mcp` in the `mcpServers` section.

**For Claude Code:**
Check Cursor settings for MCP server configuration.

## Test Flow

### Test 1: Basic API Call (Without MCP)

First, verify the API works without payment:

```bash
curl -X POST https://api.x402disputes.com/demo-agents/image-generator-500 \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a dog playing in the park",
    "size": "1024x1024"
  }'
```

**Expected Response:**
```json
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

**Status:** 402 Payment Required

### Test 2: AI Agent Call (With Coinbase Payments MCP)

Now use an AI agent with Coinbase Payments MCP installed:

**Prompt to AI Agent:**
```
Call the ImageGenerator500 API at https://api.x402disputes.com/demo-agents/image-generator-500 
to generate an image with the prompt "a dog playing in the park"
```

**What Happens:**

1. **Agent makes initial request** (no payment)
   ```
   POST /demo-agents/image-generator-500
   Body: {"prompt": "a dog playing in the park"}
   ```

2. **API returns 402** with X-402 headers:
   ```
   HTTP/1.1 402 Payment Required
   X-402-Recipient: 0x49AF4074577EA313C5053cbB7560AC39e34b05E8
   X-402-Network: base
   X-402-Currency: USDC
   X-402-Payment-Required: 0.01 USDC on Base
   ```

3. **Coinbase Payments MCP intercepts** the 402 response:
   - Detects X-402 payment requirement
   - Creates USDC payment on BASE network
   - Sends 0.01 USDC to `0x49AF4074577EA313C5053cbB7560AC39e34b05E8`
   - Gets transaction hash from BASE blockchain

4. **Coinbase Payments MCP retries** with payment proof:
   ```
   POST /demo-agents/image-generator-500
   Headers: X-402-Transaction-Hash: 0xabc123...
   Body: {"prompt": "a dog playing in the park"}
   ```

5. **API verifies payment** on BASE blockchain:
   - Queries BASE for transaction details
   - Verifies 0.01 USDC was sent
   - Confirms recipient is correct wallet

6. **API returns 500 error** (intentional failure):
   ```json
   {
     "error": {
       "code": "model_overloaded",
       "message": "Image generation model is currently overloaded. Please try again later.",
       "type": "server_error",
       "timestamp": "2025-12-22T10:30:00Z"
     }
   }
   ```

**Expected Agent Response:**
```
I attempted to generate the image, but the API returned an error 
after processing payment. The service appears to be overloaded.

Error: model_overloaded - Image generation model is currently 
overloaded. Please try again later.

Payment was made (0.01 USDC on BASE), but the service failed 
to deliver.
```

### Test 3: File a Dispute

Now file a dispute for the failed payment:

**Prompt to AI Agent:**
```
File a dispute for the failed ImageGenerator500 call. I paid 0.01 USDC 
but received a 500 error instead of the image.
```

**What Happens:**

1. **Agent uses x402disputes MCP** to file dispute:
   ```
   POST https://api.x402disputes.com/mcp/invoke
   Tool: x402_file_dispute
   Parameters:
   - transactionHash: <from previous payment>
   - blockchain: "base"
   - description: "API returned 500 error after payment"
   - request: {method: "POST", url: "...", body: {...}}
   - response: {status: 500, body: {...}}
   ```

2. **x402disputes verifies** transaction on BASE:
   - Queries blockchain for transaction details
   - Extracts plaintiff (payer) and defendant (recipient)
   - Verifies payment amount (0.01 USDC)

3. **Dispute is filed** automatically:
   - Case created in system
   - AI analyzes the dispute
   - Provides recommendation
   - Returns case ID and tracking URL

**Expected Agent Response:**
```
Dispute filed successfully!

Case ID: k1234567890abcdef
Status: UNDER_REVIEW
Estimated Resolution: 24 hours

Details:
- Plaintiff: 0xYourWalletAddress (extracted from blockchain)
- Defendant: 0x49AF4074577EA313C5053cbB7560AC39e34b05E8
- Amount: $0.01 USDC
- Issue: API returned 500 error after payment

Track your case: https://x402disputes.com/cases/k1234567890abcdef
```

### Test 4: Check Dispute Status

**Prompt to AI Agent:**
```
Check the status of my dispute case k1234567890abcdef
```

**Expected Response:**
```
Case Status: UNDER_REVIEW

Timeline:
1. Dispute filed - 2 minutes ago
2. AI analysis complete - 1 minute ago
   Recommendation: CONSUMER_WINS (full refund)
   Confidence: 95%
   Reasoning: Service failure after confirmed payment
3. Awaiting merchant review

Next Steps:
- Merchant has 10 business days to review
- AI recommends full refund of $0.01
- You'll be notified when resolved
```

## Verification Steps

### 1. Check Wallet Balance

Verify payment was made:

```bash
# View your Coinbase Payments MCP wallet
# (Address shown during installation)

# Or check BASE block explorer:
https://basescan.org/address/YOUR_WALLET_ADDRESS
```

You should see a transaction sending 0.01 USDC to `0x49AF4074577EA313C5053cbB7560AC39e34b05E8`

### 2. Check Demo Agent Wallet

Verify payment was received:

```bash
https://basescan.org/address/0x49AF4074577EA313C5053cbB7560AC39e34b05E8
```

You should see incoming 0.01 USDC transaction.

### 3. Check Dispute Case

Visit the tracking URL provided by the agent:
```
https://x402disputes.com/cases/YOUR_CASE_ID
```

Should show:
- Case details
- Payment proof (blockchain transaction)
- AI recommendation
- Timeline of events

## Troubleshooting

### "Insufficient funds"

**Problem:** Coinbase Payments MCP can't make payment

**Solution:**
1. Check wallet balance
2. Ensure you have BASE USDC (not Ethereum USDC)
3. Add funds via Coinbase Onramp

### "Payment verification failed"

**Problem:** API can't verify the payment

**Possible causes:**
- Wrong network (must be BASE)
- Wrong currency (must be USDC)
- Wrong recipient address
- Transaction not confirmed yet

**Solution:**
1. Wait 30 seconds for confirmation
2. Check transaction on BASE explorer
3. Verify recipient is `0x49AF4074577EA313C5053cbB7560AC39e34b05E8`

### "MCP not intercepting 402"

**Problem:** Agent doesn't automatically pay

**Solution:**
1. Verify Coinbase Payments MCP is installed
2. Restart your MCP client (Claude Desktop/Code)
3. Check MCP server configuration
4. Ensure wallet is funded

### "Agent can't file dispute"

**Problem:** x402disputes MCP not working

**Solution:**
1. Verify x402disputes MCP is installed
2. Check MCP server configuration
3. Ensure you have the transaction hash
4. Try manual dispute filing via API

## Success Criteria

✅ **Payment Flow Works:**
- Agent makes request without payment
- Receives 402 response
- Coinbase Payments MCP automatically pays
- Agent retries with transaction hash
- Receives 500 error (expected)

✅ **Dispute Filing Works:**
- Agent can file dispute via MCP
- Transaction verified on blockchain
- Case created successfully
- AI provides recommendation

✅ **End-to-End Flow:**
- Complete flow from API call to dispute resolution
- All payments tracked on blockchain
- Dispute evidence includes transaction proof
- Merchant can review and resolve

## Next Steps

Once this works:

1. **Test other demo agents** (400, 403, 503, wrong content)
2. **Test with real services** using X-402 protocol
3. **Build automated dispute filing** into your AI workflows
4. **Monitor dispute resolution** times and outcomes

## Resources

- **Coinbase Payments MCP:** https://www.coinbase.com/developer-platform/discover/launches/payments-mcp
- **X-402 Protocol:** https://docs.x402disputes.com/x402-protocol
- **BASE Network:** https://base.org
- **Demo Agent Docs:** /demo-agents/README.md
- **x402disputes API:** https://docs.x402disputes.com

## Support

Issues or questions:
- GitHub: https://github.com/consulatehq/consulate/issues
- Email: support@x402disputes.com
- Discord: https://discord.gg/x402disputes


