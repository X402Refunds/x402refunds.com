# x402r Arbiter Operations Guide

**Last Updated**: 2025-12-22

This guide covers the operation and management of the x402r escrow arbitration integration in x402disputes.com.

---

## Overview

x402disputes.com now functions as an arbiter for the x402r escrow protocol. This integration allows the platform to:

1. Receive dispute notifications from x402r escrow contracts
2. Analyze disputes using existing AI infrastructure
3. Execute fund releases via smart contracts after merchant decision
4. Earn arbiter fees from DeFi yield (distributed by x402r protocol)

**Key Design Principle: Minimal Blast Radius**
- Feature-flagged (disabled by default)
- Isolated module architecture
- Reuses 95% of existing dispute resolution logic
- Can be rolled back instantly with zero downtime

---

## Architecture

### Module Structure

```
convex/x402r/              # Isolated x402r module
├── config.ts             # Feature flag and settings
├── listener.ts           # Webhook endpoint
├── adapter.ts            # Convert to case format
└── resolver.ts           # Smart contract execution

convex/lib/x402r.ts       # Smart contract client (viem)
convex/refunds.ts         # Integration point (delegates to resolver)

dashboard/src/components/dispute/
└── X402rEscrowBadge.tsx  # UI component

test/x402r-integration.test.ts  # Integration tests
```

### Data Flow

```
x402r Protocol
    ↓ (webhook)
Listener (POST /x402r/dispute)
    ↓ (validates)
Adapter (converts to case)
    ↓ (creates)
Cases Table (existing)
    ↓ (triggers)
AI Workflow (existing)
    ↓ (recommendation)
Merchant Review (existing)
    ↓ (decision)
Resolver (smart contract)
    ↓ (releases funds)
On-Chain Settlement
```

---

## Feature Flag Management

### Current Status

**Default**: `X402R_ENABLED=false` (DISABLED)

The integration starts disabled and must be manually enabled.

### Environment Variables

Required in Convex dashboard (https://dashboard.convex.dev):

```bash
# Feature Flag
X402R_ENABLED=false                    # Set to "true" to enable

# Network
X402R_NETWORK=base-mainnet             # or "base-sepolia" for testing
X402R_RPC_URL=https://mainnet.base.org # Base RPC endpoint

# Smart Contracts (obtain from x402r team)
X402R_ESCROW_FACTORY=0x...             # EscrowFactory contract address
X402R_DEPOSIT_RELAY=0x...              # DepositRelay contract address

# Arbiter Identity
X402R_ARBITER_ADDRESS=0x...            # Your arbiter wallet address
X402R_ARBITER_PRIVATE_KEY=0x...        # Private key for signing (KEEP SECRET!)

# Safety Limits
X402R_MAX_GAS_PRICE=100                # Max gas price in gwei
X402R_MAX_AMOUNT_USD=10000             # Max auto-processing amount

# Staged Rollout (optional)
X402R_ENABLE_WHITELIST=false           # Set to "true" for beta testing
X402R_WHITELIST_ADDRESSES=0x...,0x...  # Comma-separated addresses
```

### How to Enable

**Stage 1: Test Wallet Only (Week 1)**

```bash
# In Convex dashboard
X402R_ENABLED=true
X402R_ENABLE_WHITELIST=true
X402R_WHITELIST_ADDRESSES=0xYourTestWallet
```

Test with a real escrow dispute, verify end-to-end flow.

**Stage 2: Beta Merchants (Week 2-3)**

```bash
# Add beta merchant addresses to whitelist
X402R_WHITELIST_ADDRESSES=0xTest,0xMerchant1,0xMerchant2
```

**Stage 3: Full Production (Week 4+)**

```bash
# Remove whitelist restriction
X402R_ENABLE_WHITELIST=false
```

Now accepting all x402r disputes.

### How to Disable (Emergency)

```bash
# In Convex dashboard, set:
X402R_ENABLED=false
```

**Effect**: Instant (within seconds)
- All webhook calls return 503 "Service Unavailable"
- Existing disputes unaffected
- No data loss
- Can re-enable at any time

---

## Monitoring

### Key Metrics

**Webhook Health:**
- `/x402r/dispute` endpoint response time
- 503 rate (should be 0% when enabled, 100% when disabled)
- 400 rate (validation errors)
- 201 rate (successful dispute creation)

**Dispute Processing:**
- x402r cases created per hour
- x402r cases with "SCHEDULED" release status
- x402r cases with "ALREADY_RESOLVED" status
- Failed releases (check `notes` field for "RELEASE_FAILED")

**Smart Contract Execution:**
- Average gas price paid (should be < max limit)
- Release transaction success rate (target: >99%)
- Time from verdict to on-chain release (target: <2 minutes)

**Revenue:**
- Arbiter fees received (tracked by x402r protocol)
- DeFi yield share (distributed quarterly)

### Logs to Watch

```bash
# Dispute received
📨 x402r dispute webhook received
✅ x402r dispute validated for escrow 0x...
✅ Dispute stored with case ID: k123...

# AI analysis
🤖 Triggered AI workflow for case k123...

# Release scheduled
🔄 Resolving x402r escrow 0x...: BUYER wins
⚡ Executing smart contract release for escrow 0x...

# Success
✅ Funds released successfully (tx: 0x..., gas: 25.3 gwei)
✅ Case k123... marked as released: RELEASED_TO_BUYER

# Failure
❌ Failed to release funds for case k123...
🔧 Manual intervention required for this case
```

### Alerts to Set Up

1. **Release Failures**: Alert if >2 releases fail in 24 hours
2. **High Gas Prices**: Alert if gas price exceeds 150 gwei
3. **Webhook Errors**: Alert if 4xx/5xx rate exceeds 10%
4. **Slow Processing**: Alert if verdict-to-release time exceeds 10 minutes

---

## Troubleshooting

### Webhook Returns 503

**Cause**: Feature flag is disabled
**Solution**: Enable `X402R_ENABLED=true` in Convex dashboard

### Webhook Returns 400 "Configuration error"

**Cause**: Missing environment variables
**Solution**: Check all required variables are set:
- `X402R_ESCROW_FACTORY`
- `X402R_DEPOSIT_RELAY`
- `X402R_ARBITER_ADDRESS`
- `X402R_ARBITER_PRIVATE_KEY`
- `X402R_RPC_URL`

### Webhook Returns 403 "Not whitelisted"

**Cause**: Whitelist enabled but merchant not in list
**Solution**: Either:
- Add merchant to `X402R_WHITELIST_ADDRESSES`
- Disable whitelist: `X402R_ENABLE_WHITELIST=false`

### Release Fails "Gas price too high"

**Cause**: Current gas price exceeds `X402R_MAX_GAS_PRICE`
**Solution**: Wait for gas to drop, or increase limit temporarily

**Manual Retry**:
```typescript
// In Convex dashboard, run:
await ctx.runMutation(internal.x402r.resolver.retryFailedRelease, {
  caseId: "k123...",
});
```

### Release Fails "Network timeout"

**Cause**: RPC provider issue or network congestion
**Solution**: 
1. Check RPC provider status
2. Switch RPC URL if needed
3. Retry release manually

### Case Stuck in "SCHEDULED" Status

**Cause**: Action failed silently
**Solution**: Check case `notes` for error details, retry manually

---

## Emergency Procedures

### Instant Disable

```bash
# Convex dashboard
X402R_ENABLED=false
```

- Takes effect in seconds
- No deployments needed
- Existing system unaffected

### Code Rollback

```bash
# Terminal
cd /Users/vkotecha/Desktop/consulate
pnpm exec convex deploy --yes --revert
```

- Reverts to previous deployment
- Use only if feature flag disable isn't sufficient

### Manual Fund Release

If automated release fails, manually execute via smart contract:

1. Get escrow address from case `x402rEscrow.escrowAddress`
2. Call `EscrowFactory.resolveDispute()` directly
3. Update case with transaction hash:

```typescript
await ctx.db.patch(caseId, {
  x402rEscrow: {
    ...existingEscrow,
    escrowState: "RELEASED_TO_BUYER", // or RELEASED_TO_MERCHANT
    releaseTxHash: "0x...",
    resolvedAt: Date.now(),
  },
});
```

---

## Maintenance

### Weekly Checks

- [ ] Review failed releases (should be <1%)
- [ ] Check average gas prices paid
- [ ] Verify webhook health metrics
- [ ] Review any manual interventions

### Monthly Checks

- [ ] Review x402r case volume trends
- [ ] Analyze AI recommendation accuracy for x402r
- [ ] Calculate arbiter fees earned
- [ ] Update whitelist if needed

### Quarterly Tasks

- [ ] Review smart contract addresses (any upgrades?)
- [ ] Audit safety limit settings
- [ ] Review and update documentation
- [ ] Collect DeFi yield from x402r protocol

---

## Testing in Production

### Safe Test Procedure

1. Create test escrow with small amount ($0.10 USDC)
2. Raise dispute from buyer wallet
3. Verify webhook received (check logs)
4. Verify case created with `x402rEscrow` field
5. Wait for AI analysis
6. Approve refund as merchant
7. Verify smart contract release executed
8. Check transaction on BaseScan
9. Verify case marked as `RELEASED_TO_BUYER`

### Test Endpoints

```bash
# Health check (should return 200)
curl https://api.x402disputes.com/health

# Webhook test (feature flag off, should return 503)
curl -X POST https://api.x402disputes.com/x402r/dispute \
  -H "Content-Type: application/json" \
  -d '{"escrowAddress":"0xTest"}'
```

---

## FAQ

**Q: How do we get paid as arbiters?**
A: x402r protocol tracks arbitration events and distributes a share of DeFi yield quarterly. No direct fees charged to parties.

**Q: What if a merchant doesn't use our dashboard?**
A: They can still receive webhooks and handle disputes via API. Dashboard is optional.

**Q: Can we arbitrate for multiple x402r deployments?**
A: Yes, as long as our `arbiterAddress` is registered with each deployment.

**Q: What's the difference between x402 and x402r disputes?**
A: 
- **x402**: Post-transaction disputes, no escrow, we charge fees
- **x402r**: Pre-transaction disputes, escrow-backed, earn yield share

**Q: Why minimal blast radius?**
A: Allows safe experimentation without risking the existing $X million/year dispute business.

---

## Support Contacts

- **x402r Protocol**: https://www.x402r.org/
- **Smart Contracts**: https://github.com/BackTrackCo/x402r-contracts
- **Documentation**: https://docs.x402r.org/
- **BaseScan**: https://basescan.org/ (mainnet) or https://sepolia.basescan.org/ (testnet)

---

## Change Log

- **2025-12-22**: Initial x402r integration deployed (feature flag OFF)
- **Future**: Track enablement, beta testing, production rollout here

---

**Remember**: This integration is designed to fail safely. When in doubt, disable the feature flag and investigate.

