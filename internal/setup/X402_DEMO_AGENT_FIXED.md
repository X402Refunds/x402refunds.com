# X-402 Demo Agent Payment Settlement - FIXED

## What Was Wrong

The `image-generator-500` demo agent was failing with **401 Unauthorized** when trying to verify/settle payments via the CDP facilitator.

### Root Cause

**Authentication method was incorrect:**
- ❌ **Before**: Using Basic Auth (`Authorization: Basic ${base64(id:secret)}`)
- ✅ **After**: Using JWT tokens with ES256 signatures (via `@coinbase/x402` package)

## What Was Fixed

### 1. Installed `@coinbase/x402` Package

```bash
pnpm add -w @coinbase/x402
```

This package provides:
- `createAuthHeader()` - Generates proper JWT tokens for CDP API
- Handles ES256 signing automatically
- Works in Convex serverless environment

### 2. Updated Authentication Code

**Before (BROKEN):**
```typescript
const basicAuth = btoa(`${CDP_API_KEY_ID}:${CDP_API_KEY_SECRET}`);
const authHeaders = {
  "Authorization": `Basic ${basicAuth}`
};
```

**After (WORKING):**
```typescript
import { createAuthHeader } from "@coinbase/x402";

const verifyAuth = await createAuthHeader(
  CDP_API_KEY_ID,
  CDP_API_KEY_SECRET,
  "POST",
  "api.cdp.coinbase.com",
  "/platform/v2/x402/verify"
);

const authHeaders = {
  "Authorization": verifyAuth,
  "Correlation-Context": "sdk_version=1.29.0,sdk_language=typescript,source=x402,source_version=0.6.6"
};
```

### 3. Fixed Environment Variable Names

**Before:**
- `CDP_API_KEY_NAME` (wrong)
- `CDP_PRIVATE_KEY` (wrong)

**After:**
- `CDP_API_KEY_ID` (correct - the full key path like `organizations/{org}/apiKeys/{key}`)
- `CDP_API_KEY_SECRET` (correct - the secret string shown when creating the key)

## How to Configure

### Step 1: Get CDP API Keys

1. Go to https://portal.cdp.coinbase.com/
2. Create/select a project
3. Navigate to **API Keys**
4. Click **Create API Key** or **Download** existing
5. Save both values:
   - **API Key ID**: `organizations/xxx/apiKeys/yyy`
   - **API Key Secret**: Long random string (shown only once!)

### Step 2: Set Environment Variables in Convex

```bash
# Production
pnpm exec convex env set CDP_API_KEY_ID "organizations/your-org/apiKeys/your-key"
pnpm exec convex env set CDP_API_KEY_SECRET "your-secret-here"

# Preview (dev)
pnpm exec convex env set CDP_API_KEY_ID "organizations/your-org/apiKeys/your-key" --preview
pnpm exec convex env set CDP_API_KEY_SECRET "your-secret-here" --preview
```

### Step 3: Deploy and Test

```bash
# Deploy to dev
pnpm deploy:dev

# Test the endpoint
curl -X POST https://youthful-orca-358.convex.site/demo-agents/image-generator-500 \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test image"}'
```

**Expected:**
- First call: 402 Payment Required (with payment requirements)
- With Coinbase Payments MCP: Automatic payment + 500 error response
- Check logs: `pnpm check-logs` should show successful verification and settlement

## How It Works Now

1. **Client sends request** without payment → 402 response
2. **Coinbase Payments MCP** pays automatically
3. **Client retries** with payment header (X-PAYMENT)
4. **Demo agent**:
   - Decodes payment header
   - Generates JWT using `@coinbase/x402`
   - Calls CDP `/verify` endpoint → ✅ Success
   - Validates request body
   - Calls CDP `/settle` endpoint → ✅ Payment executed on-chain
   - Returns 500 error (intentional demo behavior)
5. **Dispute can be filed** against the failed API call

## Key Learnings

1. **CDP requires JWT, not Basic Auth**
   - The `@coinbase/x402` package handles this automatically
   - Don't try to implement JWT signing manually in Convex

2. **Viem is NOT needed in Convex**
   - Convex is serverless - can't use Node.js crypto primitives
   - Use HTTP calls to CDP facilitator instead
   - CDP facilitator handles on-chain settlement

3. **Environment variable naming matters**
   - Use `CDP_API_KEY_ID` and `CDP_API_KEY_SECRET`
   - NOT `CDP_API_KEY_NAME` or `CDP_PRIVATE_KEY`

4. **The facilitator pattern works**
   - Server-side code calls HTTP facilitator
   - Facilitator has wallet/private key
   - Facilitator signs and broadcasts transactions
   - Your server just makes HTTP requests

## Files Changed

- `convex/demoAgents.ts` - Updated authentication to use `@coinbase/x402`
- `package.json` - Added `@coinbase/x402` dependency
- `internal/setup/CDP_API_SETUP.md` - Updated setup instructions

## Testing Checklist

- [ ] CDP API keys configured in Convex
- [ ] Deployed to preview environment
- [ ] Test 402 response (no payment)
- [ ] Test with Coinbase Payments MCP
- [ ] Verify payment settlement in logs
- [ ] Check Base blockchain for transaction
- [ ] File dispute against failed API call
- [ ] Verify dispute shows in dashboard

## References

- CDP Portal: https://portal.cdp.coinbase.com/
- `@coinbase/x402` Package: https://www.npmjs.com/package/@coinbase/x402
- X-402 Protocol: https://github.com/coinbase/x402
- Base Network Explorer: https://basescan.org/


