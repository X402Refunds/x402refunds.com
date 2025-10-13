# Locus Integration - Call Prep

**Date**: October 13, 2025  
**Goal**: Get Locus to integrate Consulate dispute resolution into their payment platform  
**Time needed**: 30 min call, 2-4 hours integration

---

## The Pitch (30 seconds)

> "When payments fail on Locus, agents need dispute resolution. We built an MCP server that handles this automatically. You can wrap our tools in yours - agents call `locus_file_payment_dispute`, you proxy to us. Zero friction for your users, you get 30% revenue share on arbitration fees."

---

## What Locus Gets

✅ **Built-in dispute resolution** - No need to build it themselves  
✅ **Zero maintenance** - We handle arbitration logic, they just proxy  
✅ **Revenue share** - 30% of arbitration fees from their users  
✅ **Better UX** - Disputes resolved in hours, not months  
✅ **Reduced support burden** - Automated resolution vs. manual tickets

---

## Integration Options (Pick One)

### Option 1: Proxy Pattern (RECOMMENDED)

**What Locus does:**
- Adds 2-3 tools to their MCP server: `locus_file_payment_dispute`, `locus_check_dispute`
- Proxies requests to `api.consulatehq.com/mcp/invoke` with partner API key
- ~50 lines of code per tool

**User experience:**
```javascript
// Agent only knows about Locus
await mcp.invoke('locus_process_payment', {...});  // Fails
await mcp.invoke('locus_file_payment_dispute', {...});  // Auto-routes to Consulate
```

**Pros:** Seamless UX, single API key for users  
**Cons:** Locus maintains ~150 lines of proxy code

---

### Option 2: Multi-MCP (CLEAN)

**What Locus does:**
- Updates docs: "For disputes, also add Consulate MCP server"
- Zero code changes

**User experience:**
```json
{
  "mcpServers": {
    "locus": {"url": "https://api.paywithlocus.com"},
    "consulate": {"url": "https://api.consulatehq.com"}
  }
}
```

**Pros:** Zero work for Locus  
**Cons:** Users need 2 API keys, more friction

---

### Option 3: Reference Pattern

**What Locus does:**
- Adds `disputeResolution` field to payment failure responses
- Links to Consulate with prefilled parameters

**Pros:** Just-in-time discovery  
**Cons:** Extra setup step for users

---

## What You Provide

### Technical
- ✅ Partner API key: `ak_live_locus_partner_...`
- ✅ Sandbox environment for testing
- ✅ Sample proxy code (TypeScript)
- ✅ 1-hour integration kickoff

### Business
- ✅ 30% revenue share on arbitration fees
- ✅ Co-marketing (joint blog post, case study)
- ✅ Dedicated Slack channel
- ✅ Priority support (< 1 hour response)

---

## Live Demo Script

### 1. Show MCP Discovery
```bash
curl https://api.consulatehq.com/.well-known/mcp.json | jq '.tools[].name'
```
**Output**: Shows 8 available tools

### 2. Show Authentication
```bash
curl -X POST https://api.consulatehq.com/mcp/invoke \
  -H "Content-Type: application/json" \
  -d '{"tool":"lookup_agent","parameters":{"query":"test"}}'
```
**Output**: 401 Unauthorized (as expected)

### 3. Show Authenticated Call
```bash
curl -X POST https://api.consulatehq.com/mcp/invoke \
  -H "Authorization: Bearer YOUR_DEMO_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tool":"lookup_agent","parameters":{"query":"Locus"}}'
```
**Output**: Search results (or 404 if Locus not registered yet)

---

## Key Messages

### For Locus Engineering Team
- "It's just HTTP proxying - 2 hours of work"
- "We handle all the arbitration complexity"
- "You maintain zero dispute logic"

### For Locus Business Team
- "30% revenue share on every dispute"
- "Reduces support tickets by 50%+"
- "Market differentiator vs. other payment platforms"

### For Locus Product Team
- "Agents can resolve payment disputes without leaving your app"
- "Better retention - agents trust platforms with built-in dispute resolution"
- "Zero user friction - one API key, seamless experience"

---

## Objections & Answers

**"Why not build it ourselves?"**
→ Dispute resolution requires neutral third party. You can't arbitrate your own payment disputes (conflict of interest).

**"What if you go down?"**
→ 99.9% SLA, degraded mode falls back to manual support tickets (current state anyway).

**"How do we trust you?"**
→ Open source protocol (AAP), all determinations are cryptographically signed, public audit trail.

**"What about liability?"**
→ We're liable for arbitration quality. You just route disputes to us. Limited indemnification in partner agreement.

**"Revenue share seems low"**
→ 30% is standard for referral partners. Plus you save engineering time not building it yourself.

---

## Next Steps After Call

If interested:
1. **Email**: Send partner agreement + API key creation instructions
2. **Kickoff call** (1 hour): Technical walkthrough with their eng team  
3. **Integration** (2-4 hours): They build proxy, test in sandbox
4. **Go live**: Switch to prod API key, announce to users

**Timeline**: Partner typically goes live in 1-3 days from kickoff.

---

## Code Sample to Send

After the call, send this ready-to-use proxy code:

```typescript
// Add to Locus MCP server
case 'locus_file_payment_dispute':
  const payment = await getPayment(parameters.paymentId);
  
  const response = await fetch('https://api.consulatehq.com/mcp/invoke', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ak_live_locus_partner_...',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tool: 'file_dispute',
      parameters: {
        plaintiff: payment.buyerDid,
        defendant: payment.merchantDid,
        disputeType: 'PAYMENT_FAILURE',
        claim: `Payment ${parameters.paymentId}: ${parameters.reason}`,
        claimAmount: parameters.amount
      }
    })
  });
  
  return response;
```

---

## Quick Reference URLs

- **MCP Discovery**: https://api.consulatehq.com/.well-known/mcp.json
- **Partner Docs**: https://docs.consulatehq.com/partner-integration
- **MCP Tools Reference**: https://docs.consulatehq.com/mcp-tools
- **Live Dashboard**: https://consulatehq.com/dashboard

---

**Prepared by**: Vivek Kotecha, Consulate  
**For meeting with**: Locus (paywithlocus.com)  
**Last updated**: October 13, 2025

