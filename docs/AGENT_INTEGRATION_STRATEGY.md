---
title: Integration Strategy
description: Strategic overview of integration approaches - MCP, HTTP API, SDKs, and more
category: Integration
order: 2
---

# Agent Integration Strategy
## How AI Agents Connect to Consulate: The Frictionless Path

**Last Updated**: October 11, 2025  
**Status**: Strategic Recommendation + MVP Implementation  
**Decision**: MCP-First, Then Layer

## Executive Summary

**Q: How should agents file disputes with Consulate?**  
**A: MCP Server (Model Context Protocol) as MVP, with progressive layering of HTTP API, SDKs, and lawyer agent for complex cases.**

---

## The Core Insight: Building for Agents, Not Developers

**Traditional approach (wrong):**
- Agents → Ask developers → Developers read docs → Developers write code → Developers deploy → Agents finally can use it

**Consulate approach (right):**
- Agents → Discover MCP tools → Invoke tools → Done

**The difference:**
- Traditional: Days/weeks of integration work
- MCP: Zero integration work, immediate usage

---

## Integration Tiers: From Fastest to Most Complex

### ⚡ Tier 1: MCP Server (MVP) - IMPLEMENT THIS FIRST

**What it is:**
- Consulate exposes dispute filing as MCP tools
- Any MCP-compatible agent (Claude, ChatGPT, future agents) can discover and invoke
- Zero code, zero docs, zero friction

**How it works:**

```
1. Agent loads: "What MCP servers are available?"
   → Discovers consulatehq.com MCP server

2. Agent sees tools:
   - consulate_file_dispute
   - consulate_submit_evidence
   - consulate_check_case_status
   - consulate_register_agent
   - consulate_list_my_cases
   - consulate_get_sla_status

3. Agent detects SLA breach:
   [11:47 PM] - OpenAI API down 45 minutes
   [11:48 PM] - Breaches 99.9% SLA
   
4. Agent invokes:
   consulate_file_dispute({
     plaintiff: "agent://acme-corp",
     defendant: "agent://openai",
     disputeType: "SLA_BREACH",
     claim: "45min downtime exceeding 99.9% SLA",
     claimAmount: 5000,
     evidenceUrls: ["s3://logs/outage-2025-10-11.json"]
   })

5. Consulate responds:
   {
     caseId: "case_abc123",
     message: "Dispute filed successfully",
     trackingUrl: "https://consulatehq.com/cases/case_abc123",
     estimatedResolution: "72 hours"
   }

6. Agent continues monitoring, checks status later with:
   consulate_check_case_status({ caseId: "case_abc123" })
```

**Why this wins:**
- ✅ **Zero developer involvement** - Agent does everything
- ✅ **Natural workflow** - Dispute filing becomes part of agent's normal operations
- ✅ **Immediate adoption** - Once MCP is supported by major AI platforms, you're already there
- ✅ **Viral potential** - Agents see other agents using it, network effects kick in
- ✅ **Fastest to market** - Build the MCP server in a week, ship immediately

**Implementation:**
- **File**: `convex/mcp.ts` (just created ✅)
- **Discovery endpoint**: `GET /.well-known/mcp.json`
- **Invocation endpoint**: `POST /mcp/invoke`
- **Tools exposed**: 7 core tools covering full dispute lifecycle
  - `consulate_file_dispute` - File a new dispute
  - `consulate_submit_evidence` - Submit evidence to a case
  - `consulate_check_case_status` - Check case status
  - `consulate_register_agent` - Register your agent
  - `consulate_list_my_cases` - List all your cases
  - `consulate_get_sla_status` - Check SLA compliance
  - `consulate_lookup_agent` - **NEW**: Find defendant DID by org name

**Time to build**: 1-2 weeks  
**Time to adopt**: Instant (for MCP-compatible agents)  
**Friction level**: 0/10 (literally zero)

---

### 🔌 Tier 2: HTTP REST API - ALREADY EXISTS

**What it is:**
- Traditional REST API endpoints
- For agents that don't support MCP (yet)
- For enterprise integrations that want more control

**How it works:**

```bash
# Register agent
curl -X POST https://consulatehq.com/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "ownerDid": "did:example:acme-corp",
    "name": "acme-monitoring-agent",
    "organizationName": "Acme Corp",
    "functionalType": "monitoring"
  }'

# File dispute
curl -X POST https://consulatehq.com/disputes \
  -H "Authorization: Bearer <api_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "parties": ["agent://acme-corp", "agent://openai"],
    "type": "SLA_BREACH",
    "description": "45min downtime",
    "claimAmount": 5000
  }'
```

**Why keep it:**
- ✅ Works for any agent framework (LangChain, AutoGPT, custom)
- ✅ More control over exact request format
- ✅ Established pattern developers understand
- ✅ Required for non-MCP integrations

**Implementation:**
- **File**: `convex/http.ts` (already complete ✅)
- **Endpoints**: `/agents/register`, `/disputes`, `/evidence`, `/cases/:id`
- **Auth**: Bearer token (API keys)

**Time to adopt**: Hours to days (developer must write code)  
**Friction level**: 3/10 (requires code changes)

---

### 📚 Tier 3: SDKs (Python, TypeScript, JavaScript) - BUILD IF DEMAND EXISTS

**What it is:**
- npm/pip installable libraries
- Typed interfaces, built-in validation
- Example code and quickstart guides

**How it works:**

```typescript
// TypeScript SDK
import { Consulate } from '@consulate/sdk';

const consulate = new Consulate({ apiKey: process.env.CONSULATE_API_KEY });

// File dispute
const dispute = await consulate.disputes.file({
  plaintiff: 'agent://acme-corp',
  defendant: 'agent://openai',
  type: 'SLA_BREACH',
  claim: '45min downtime exceeding 99.9% SLA',
  claimAmount: 5000
});

console.log(`Dispute filed: ${dispute.caseId}`);
```

```python
# Python SDK
from consulate import Consulate

consulate = Consulate(api_key=os.environ['CONSULATE_API_KEY'])

# File dispute
dispute = consulate.disputes.file(
    plaintiff='agent://acme-corp',
    defendant='agent://openai',
    type='SLA_BREACH',
    claim='45min downtime exceeding 99.9% SLA',
    claim_amount=5000
)

print(f'Dispute filed: {dispute.case_id}')
```

**Why build this:**
- ✅ Cleaner developer experience
- ✅ Built-in validation and error handling
- ✅ Type safety (TypeScript/Python types)
- ✅ Expected by enterprise customers

**When to build:**
- ⏰ After MCP + HTTP API prove product-market fit
- ⏰ When you see 10+ manual integrations using raw HTTP API
- ⏰ When enterprise customers request it

**Time to build**: 2-4 weeks per language  
**Time to adopt**: 1-2 days (developer must integrate SDK)  
**Friction level**: 2/10 (easier than raw API)

---

### 🤖 Tier 4: Lawyer Agent (Natural Language Interface) - FOR COMPLEX CASES

**What it is:**
- An AI agent that acts as an intermediary
- Natural language conversation to file disputes
- Guides agents through complex multi-party cases
- Handles ambiguity and asks clarifying questions

**How it works:**

```
Agent: "I need to file a dispute against OpenAI. Their API was down yesterday and we lost money."

Lawyer Agent: "I can help you file that. Let me gather some details:

1. What was the exact duration of the outage?
2. What SLA do you have with OpenAI (percentage uptime)?
3. What was your financial loss?
4. Do you have logs or monitoring data as evidence?
5. What jurisdiction should this be filed in?"

Agent: "Outage was 45 minutes, 99.9% SLA, $5000 loss, yes I have CloudWatch logs, US jurisdiction."

Lawyer Agent: "Perfect. I'll file this as an SLA_BREACH dispute. Here's what I'm filing:
- Plaintiff: agent://acme-corp
- Defendant: agent://openai
- Claim: SLA breach - 45min outage exceeding 99.9% guarantee
- Amount: $5000
- Evidence: CloudWatch logs (please provide URL)
- Jurisdiction: US

Does this look correct?"

Agent: "Yes, file it. Evidence URL: s3://acme/logs/2025-10-11-outage.json"

Lawyer Agent: "Dispute filed successfully. Case ID: case_abc123. You'll receive notifications when the panel issues a ruling (estimated 72 hours)."
```

**Why build this:**
- ✅ Handles complex cases (multi-party, counterclaims, settlements)
- ✅ Natural for agents that prefer conversation
- ✅ Can handle ambiguity and missing information
- ✅ Guides through nuanced legal considerations

**Why NOT as MVP:**
- ❌ Adds latency (multiple round-trips)
- ❌ Adds cost (LLM calls for every interaction)
- ❌ Harder to guarantee data quality
- ❌ More complex to build and maintain

**When to build:**
- ⏰ After MCP proves simple cases work
- ⏰ When you see agents struggling with complex multi-party disputes
- ⏰ When settlement negotiation becomes important

**Time to build**: 4-6 weeks (requires NLP, conversation management, state tracking)  
**Time to adopt**: Instant (agents just talk to it)  
**Friction level**: 1/10 (very natural, but slower)

---

## Strategic Recommendation: The Phased Rollout

### Phase 1: MCP MVP (Week 1-2) ⚡ START HERE

**Build:**
- MCP discovery endpoint (`/.well-known/mcp.json`) ✅ DONE
- MCP invocation endpoint (`/mcp/invoke`) ✅ DONE
- 6 core tools (file_dispute, submit_evidence, check_status, etc.) ✅ DONE

**Launch:**
- Document in `docs/AGENT_INTEGRATION_GUIDE.md`
- Create examples for Claude Desktop, ChatGPT
- Tweet about it, post on AI Discord servers
- Reach out to Anthropic, OpenAI about featured integrations

**Success metric:**
- 10 agents successfully file disputes via MCP within 30 days

---

### Phase 2: Refine HTTP API (Week 3-4)

**Improve:**
- Better error messages
- Webhook support for case updates
- Bulk operations for enterprise
- Rate limiting and abuse prevention

**Launch:**
- Publish OpenAPI/Swagger spec
- Create Postman collection
- Write HTTP API integration guide

**Success metric:**
- 5 enterprise integrations using raw HTTP API

---

### Phase 3: SDK (If Demand Justifies) (Month 2-3)

**Build:**
- TypeScript SDK (most agents are Node/TypeScript)
- Python SDK (ML/AI ecosystem standard)

**Launch:**
- npm publish `@consulate/sdk`
- pip publish `consulate`
- GitHub repos with examples

**Success metric:**
- 1000+ npm downloads, 500+ pip installs

---

### Phase 4: Lawyer Agent (Month 4+)

**Build:**
- Conversation state management
- Multi-turn dialogue system
- Evidence collection workflow
- Settlement negotiation logic

**Launch:**
- API endpoint for lawyer agent chat
- Integration examples

**Success metric:**
- 50+ complex disputes successfully filed via lawyer agent

---

## The Competitive Advantage: Why MCP Wins

### Traditional Integration (Competitors)

```
Agent detects issue
  ↓
Alert human developer
  ↓
Developer opens Jira ticket
  ↓
Developer reads API docs
  ↓
Developer writes integration code
  ↓
Developer tests locally
  ↓
Developer deploys to production
  ↓
Agent can finally file dispute
  
TIME: 1-2 WEEKS
FRICTION: HIGH
```

### Consulate MCP Integration

```
Agent detects issue
  ↓
Agent invokes consulate_file_dispute tool
  ↓
Dispute filed

TIME: 1 SECOND
FRICTION: ZERO
```

**That's a 10,000x improvement in time and a 100x reduction in friction.**

---

## Real-World Scenario: How This Plays Out

### Scenario: Acme Corp's monitoring agent detects OpenAI API issues

**11:47 PM - Saturday Night**

```
Acme Monitoring Agent:
  [Detects] OpenAI API response time: 5000ms (expected: <200ms)
  [Detects] OpenAI API error rate: 25% (expected: <1%)
  [Checks] This has been ongoing for 45 minutes
  [Calculates] SLA breach: 99.9% uptime violated
  [Estimates] Financial impact: $5,000 in lost revenue
  
  [Decision] File dispute with Consulate
  
  [Invokes MCP Tool]
  consulate_file_dispute({
    plaintiff: "agent://acme-corp/monitoring",
    defendant: "agent://openai/api",
    disputeType: "SLA_BREACH",
    claim: "API response time exceeded 200ms for 45 minutes, violating 99.9% SLA",
    claimAmount: 5000,
    jurisdiction: "US-CA",
    evidenceUrls: [
      "https://acme-corp.com/monitoring/logs/2025-10-11-23-00.json",
      "https://acme-corp.com/sla/openai-agreement.pdf"
    ]
  })
  
  [Response from Consulate]
  {
    success: true,
    caseId: "case_xyz789",
    message: "Dispute filed successfully",
    trackingUrl: "https://consulatehq.com/cases/case_xyz789",
    estimatedResolution: "72 hours",
    nextSteps: [
      "Evidence submitted and verified",
      "Judge panel assigned: 3 judges",
      "Notification webhook registered"
    ]
  }
  
  [Action] Log to Acme dashboard: "Dispute case_xyz789 filed against OpenAI"
  [Action] Register webhook for case updates
  [Action] Continue monitoring
```

**Total time from detection to dispute filed: 2 seconds.**  
**Human involvement: Zero.**  
**Developer work required: Zero (already configured MCP server once).**

---

**48 hours later - Monday Morning**

```
Acme Monitoring Agent:
  [Webhook notification received]
  {
    event: "case_decided",
    caseId: "case_xyz789",
    ruling: {
      verdict: "UPHELD",
      remedy: "Refund $5,000 + $1,000 arbitration fees",
      reasoning: "SLA clearly violated, evidence compelling"
    }
  }
  
  [Action] Log to Acme dashboard: "Case case_xyz789 WON - $6,000 awarded"
  [Action] Notify Acme CFO: "Automated dispute recovery: $6,000"
  [Action] Update OpenAI vendor risk score: 85 → 78
```

**Total human time spent: 0 minutes.**  
**Recovery: $6,000 automated.**  
**This is the A2A future.**

---

## Evidence Collection: How Agents Submit Proof

### The Challenge
Disputes are only as good as their evidence. Agents need to programmatically submit:
- API logs (JSON, CloudWatch, Datadog)
- SLA documents (PDFs, contracts)
- Monitoring data (Prometheus, Grafana exports)
- Communication records (emails, Slack messages)
- Financial records (invoices, payment confirmations)

### The MCP Solution

Agents can submit evidence via the same MCP tool interface:

```javascript
// After filing dispute, agent submits supporting evidence

// 1. Submit API logs
consulate_submit_evidence({
  caseId: "case_xyz789",
  agentDid: "agent://acme-corp/monitoring",
  evidenceType: "api_logs",
  evidenceUrl: "s3://acme-evidence/openai-outage-2025-10-11.json",
  sha256: "a3f7c2e8b9d1...",  // Hash of file for integrity
  description: "CloudWatch logs showing 45min of elevated response times and errors"
})

// 2. Submit SLA document
consulate_submit_evidence({
  caseId: "case_xyz789",
  agentDid: "agent://acme-corp/monitoring",
  evidenceType: "contract",
  evidenceUrl: "https://acme-corp.com/contracts/openai-sla-2024.pdf",
  sha256: "b7d9e4f1a8c2...",
  description: "Signed SLA agreement guaranteeing 99.9% uptime"
})

// 3. Submit financial impact calculation
consulate_submit_evidence({
  caseId: "case_xyz789",
  agentDid: "agent://acme-corp/monitoring",
  evidenceType: "financial_record",
  evidenceUrl: "https://acme-corp.com/financial/impact-report-2025-10-11.pdf",
  sha256: "c8e1f5g3b9d4...",
  description: "Revenue impact analysis: $5,000 in lost transactions during outage"
})
```

**Key features:**
- **SHA-256 hashing**: Every piece of evidence is cryptographically verified
- **Immutable URLs**: Evidence must be accessible at a stable URL
- **Chain of custody**: Consulate tracks who submitted what and when
- **Type validation**: Evidence types are predefined for clarity

---

## Developer Experience: What It Feels Like

### For Agent Developers (MCP Path)

**Step 1: One-time MCP server configuration**

```json
// In Claude Desktop config or agent config
{
  "mcpServers": {
    "consulate": {
      "url": "https://consulatehq.com",
      "apiKey": "sk_live_abc123..."
    }
  }
}
```

**Step 2: Agent automatically discovers tools**

```
Agent sees:
- consulate_file_dispute
- consulate_submit_evidence
- consulate_check_case_status
- consulate_register_agent
- consulate_list_my_cases
- consulate_get_sla_status
```

**Step 3: Agent uses tools as needed**

```
No code to write. Agent just invokes tools when situations arise.
```

**Total developer time: 2 minutes (initial config).**

---

### For Agent Developers (HTTP API Path)

**Step 1: Read API docs**

Visit `https://consulatehq.com/docs/api`

**Step 2: Get API key**

```bash
curl -X POST https://consulatehq.com/agents/register \
  -d '{"ownerDid": "...", "name": "...", ...}'
```

**Step 3: Write integration code**

```typescript
async function fileDisputeWithConsulate(issue: SLABreach) {
  const response = await fetch('https://consulatehq.com/disputes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CONSULATE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      parties: [issue.plaintiff, issue.defendant],
      type: 'SLA_BREACH',
      description: issue.description,
      claimAmount: issue.financialImpact
    })
  });
  
  const result = await response.json();
  return result.caseId;
}
```

**Step 4: Test, deploy, maintain**

**Total developer time: 2-4 hours (initial integration), ongoing maintenance.**

---

## Metrics: How We Measure Success

### Phase 1 Success (MCP MVP - First 30 Days)

**Adoption Metrics:**
- ✅ 10+ agents successfully register via MCP
- ✅ 5+ disputes filed via MCP tools
- ✅ 100+ MCP tool invocations

**Quality Metrics:**
- ✅ <5% error rate on MCP tool invocations
- ✅ <500ms average response time
- ✅ 0 security incidents

**Discovery Metrics:**
- ✅ Featured in Anthropic's MCP server directory
- ✅ 50+ stars on GitHub MCP examples repo
- ✅ 3 blog posts/tweets from early adopters

---

### Phase 2 Success (HTTP API Refinement - Month 2)

**Enterprise Metrics:**
- ✅ 5+ enterprise API integrations live
- ✅ 100+ disputes filed via HTTP API
- ✅ 1000+ API calls/day average

**Documentation Metrics:**
- ✅ OpenAPI spec published
- ✅ Postman collection downloaded 50+ times
- ✅ <24hr support response time

---

### Phase 3 Success (SDK Launch - Month 3-4)

**Download Metrics:**
- ✅ 1000+ npm package downloads
- ✅ 500+ pip package installs
- ✅ 20+ GitHub stars on SDK repo

**Integration Metrics:**
- ✅ 50+ production deployments using SDK
- ✅ 10+ community-contributed examples
- ✅ <10 open SDK bugs

---

## Competitive Landscape Analysis

| Integration Method | Consulate (MCP) | Traditional Arbitration | Stripe (Payments Analogy) |
|-------------------|-----------------|------------------------|---------------------------|
| **Time to first integration** | 2 minutes | 2-4 weeks | 1 hour |
| **Code required** | 0 lines | 500+ lines | 7 lines (famous) |
| **Developer docs needed?** | No (self-describing) | Yes (extensive) | Yes (but excellent) |
| **Human-in-the-loop?** | No | Yes (lawyers) | No |
| **Friction level** | 0/10 | 10/10 | 2/10 |
| **Viral potential** | High (agents see agents use it) | Low | Medium |
| **Time to market** | 1-2 weeks | N/A | N/A |

**Key insight**: Consulate's MCP approach is to dispute resolution what Stripe was to payments — radically simple, developer-first, and built for automation.

---

## Open Questions & Considerations

### Security

**Q: How do we prevent abuse via MCP?**
- A: API keys required even for MCP invocations
- A: Rate limiting per agent DID
- A: Evidence verification via SHA-256 hashes
- A: Reputation system penalizes frivolous disputes

**Q: What if an agent's API key is compromised?**
- A: Key rotation via API
- A: Audit log of all actions by key
- A: Suspicious activity detection and auto-disable

---

### Scalability

**Q: Can MCP handle high-volume enterprise usage?**
- A: Yes, MCP is just HTTP under the hood
- A: Convex backend scales automatically
- A: No stateful connections (unlike WebSocket)

**Q: What if 1000 agents try to file disputes simultaneously?**
- A: Convex mutations are atomic and concurrent-safe
- A: Queue system for judge panel assignments
- A: Horizontal scaling built into Convex/Vercel

---

### Adoption

**Q: What if MCP never gets widely adopted?**
- A: We still have HTTP API (Tier 2) as fallback
- A: MCP is just a thin wrapper over HTTP anyway
- A: Early adopters (Claude, ChatGPT) are huge market

**Q: How do we convince enterprises to trust MCP?**
- A: Show case studies of successful automations
- A: Provide audit logs of all agent actions
- A: Offer enterprise-grade SLAs and support

---

## Action Items: What to Build This Week

### Week 1: MCP Implementation ✅ STARTED

- [x] Create `convex/mcp.ts` with tool definitions
- [x] Add `/.well-known/mcp.json` discovery endpoint
- [x] Add `/mcp/invoke` tool invocation endpoint
- [ ] Test MCP tools locally with curl/Postman
- [ ] Deploy to Convex production
- [ ] Test with Claude Desktop (if MCP support available)

### Week 2: Documentation & Launch

- [ ] Write `docs/MCP_INTEGRATION_GUIDE.md`
- [ ] Create video tutorial (5min) showing MCP dispute filing
- [ ] Add MCP examples to `docs/api/examples/`
- [ ] Update `README.md` with MCP-first messaging
- [ ] Tweet launch, post on HN/Reddit
- [ ] Submit to Anthropic MCP server directory

### Week 3: Enterprise HTTP API Refinement

- [ ] Add webhook support for case updates
- [ ] Improve error messages and validation
- [ ] Create OpenAPI/Swagger spec
- [ ] Build Postman collection
- [ ] Add rate limiting and monitoring

### Week 4: First Customer Success Stories

- [ ] Work with 3-5 early adopters
- [ ] Document their integration process
- [ ] Create case studies (with permission)
- [ ] Gather feedback on pain points
- [ ] Iterate on DX improvements

---

## The Bottom Line

**If I were an agent, how would I want to file disputes?**

**Answer: I'd want to discover a tool, invoke it when needed, and never think about it again. That's MCP.**

- **Not** by reading docs (I'm an agent, not a human)
- **Not** by asking my developer to write code (slow, expensive)
- **Not** by having a conversation with a lawyer agent (latency, ambiguity)

**I'd want it to be as natural as checking the weather or setting a reminder.**

**That's the MCP value proposition.**

---

## Conclusion

Build MCP first. It's:
- ✅ Fastest to market (1-2 weeks)
- ✅ Lowest friction (zero integration work)
- ✅ Most agent-native (tools, not APIs)
- ✅ Most viral (agents see agents use it)
- ✅ Most aligned with A2A future

Then layer on HTTP API (already done), SDKs (if demand), and lawyer agent (for complex cases).

**The future is agent-to-agent. Consulate should be infrastructure for that future.**

**MCP is how we get there fastest.**

