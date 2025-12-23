# CDP API Setup for X-402 Payment Settlement

## Why You Need This

The `image-generator-500` demo agent processes **real mainnet BASE USDC payments**. To settle these payments on-chain, you need Coinbase Developer Platform (CDP) API credentials.

Without these credentials, the demo will fail at the payment settlement step with a 401 Unauthorized error.

## Step 1: Get CDP API Keys

1. Go to [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)
2. Sign in or create an account
3. Create a new project (or select existing)
4. Navigate to **API Keys** section
5. Click **Create API Key** (or **Download** if already created)
6. Save both values:
   - **API Key ID** (e.g., `organizations/{org-id}/apiKeys/{key-id}`)
   - **API Key Secret** (long random string, shown only once)

**Important:** The API key secret is shown ONLY ONCE when you create the key. Save it immediately!

## Step 2: Configure Convex Environment

Set the environment variables in your Convex deployment:

```bash
# Production
pnpm exec convex env set CDP_API_KEY_ID "organizations/your-org/apiKeys/your-key-id"
pnpm exec convex env set CDP_API_KEY_SECRET "your-api-key-secret-here"

# Development (preview)
pnpm exec convex env set CDP_API_KEY_ID "organizations/your-org/apiKeys/your-key-id" --preview
pnpm exec convex env set CDP_API_KEY_SECRET "your-api-key-secret-here" --preview
```

**Security Notes:**
- The CDP_API_KEY_SECRET is NOT the private key
- It's the secret string shown when you create the API key
- The `@coinbase/x402` package handles JWT signing internally

## Step 3: Verify Configuration

Check that the environment variables are set:

```bash
pnpm exec convex env list | grep CDP
```

Should show:
```
CDP_API_KEY_NAME=organizations/...
CDP_PRIVATE_KEY=-----BEGIN EC PRIVATE KEY-----...
```

## Step 4: Test Payment Flow

1. Deploy updated code: `pnpm deploy:dev`
2. Test with Coinbase Payments MCP:
   ```bash
   curl -X POST https://youthful-orca-358.convex.site/demo-agents/image-generator-500 \
     -H "Content-Type: application/json" \
     -d '{"prompt": "test image"}'
   ```
3. You should get a 402 response with payment requirements
4. Coinbase Payments MCP will handle the payment automatically
5. Check logs: `pnpm check-logs`

## Alternative: Deploy Your Own Facilitator

If you don't want to use CDP, you can deploy your own facilitator service:

1. Use the x402 facilitator example: https://github.com/coinbase/x402/tree/main/examples/typescript/facilitator
2. Deploy to a service like Railway, Fly.io, or Vercel
3. Update `FACILITATOR_URL` in `convex/demoAgents.ts` to point to your service
4. No CDP keys needed (but you'll need to manage your own wallet)

## Troubleshooting

### "CDP API credentials not configured"
- Make sure you've set both `CDP_API_KEY_NAME` and `CDP_PRIVATE_KEY`
- Check for typos in environment variable names
- Verify the private key includes BEGIN/END markers

### "401 Unauthorized"
- Verify your CDP API key is active in the portal
- Check that permissions include wallet transaction sending
- Ensure the private key matches the API key

### "JWT signing not fully implemented"
- This means the JWT generation in Convex needs proper ES256 signing
- You may need to use an external JWT signing service or deploy a facilitator

## Production Checklist

- [ ] CDP API keys obtained from portal
- [ ] Environment variables set in Convex production
- [ ] Test payment flow on preview environment
- [ ] Verify settlement transactions on Base blockchain
- [ ] Monitor logs for any errors
- [ ] Set up alerting for failed settlements

## Cost & Limits

- **CDP API**: Free tier available, check current limits at https://docs.cdp.coinbase.com/
- **Base Network Fees**: Minimal (< $0.01 per transaction)
- **USDC Test Amount**: $0.01 per demo agent call

## References

- CDP Portal: https://portal.cdp.coinbase.com/
- CDP Documentation: https://docs.cdp.coinbase.com/
- X-402 Protocol: https://github.com/coinbase/x402
- Base Network: https://base.org/



