# 🚀 Consulate - Micro-Dispute Resolution Infrastructure

**Automated dispute resolution for agentic payments and micro-transactions**

[![MCP Server](https://img.shields.io/badge/MCP-Server-blue)](https://modelcontextprotocol.io) [![Status](https://img.shields.io/badge/Status-Active-success)](https://registry.modelcontextprotocol.io/v0/servers?search=consulate)

🌐 **Production**: [consulatehq.com](https://consulatehq.com)  
🔧 **API Base**: `https://api.consulatehq.com` (HTTP Routes/Actions)  
🗄️ **Convex API**: `https://youthful-orca-358.convex.cloud` (SDK Only)  
📄 **Protocol Spec**: [Agentic Dispute Protocol](https://github.com/consulatehq/agentic-dispute-protocol)  
🤖 **MCP Server**: `com.consulatehq/consulate` - [Registry API](https://registry.modelcontextprotocol.io/v0/servers?search=consulate)

### 🔗 Key Endpoints
- **MCP Discovery**: [`https://api.consulatehq.com/.well-known/mcp.json`](https://api.consulatehq.com/.well-known/mcp.json) - [Registry API](https://registry.modelcontextprotocol.io/v0/servers?search=consulate)
- **ADP Discovery**: [`https://api.consulatehq.com/.well-known/adp`](https://api.consulatehq.com/.well-known/adp)
- **Payment Disputes**: `https://api.consulatehq.com/api/payment-disputes`
- **Agent Registration**: `https://api.consulatehq.com/api/agents/register`

### 🤖 MCP Integration
Consulate is available as an **MCP (Model Context Protocol) server** in the official directory. AI agents can discover and use Consulate's dispute resolution tools automatically with zero-code integration.

- **Server Name**: `com.consulatehq/consulate`
- **Registry API**: https://registry.modelcontextprotocol.io/v0/servers?search=consulate
- **Quick Start**: https://docs.consulatehq.com/mcp-quickstart
- **8 Tools Available**: Agent registration, dispute filing, evidence submission, case tracking, and more

---

## 💰 The Micro-Dispute Problem

**Traditional dispute systems are economically broken for micro-transactions:**

- Manual dispute review costs: **$20-50 per case**
- Micro-transaction value: **$0.25 - $0.99**
- **Result**: Disputes cost 20-200x the transaction value!

**Regulation E requires** all payment providers to offer dispute resolution, but existing systems can't handle micro-disputes profitably.

---

## 🎯 Our Solution: Infrastructure for Payment Platforms

Consulate provides **95% automated dispute resolution infrastructure** that payment platforms integrate to handle micro-disputes at scale.

### **The Infrastructure Model**

**You provide the platform. Your customers make the decisions.**

```
┌─────────────────────────────────────────────────────────┐
│  Payment Platform (ACP, ATXP, Stripe for Agents)       │
│  • Receives dispute from customer                       │
│  • Sends to Consulate API                              │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Consulate Infrastructure (Your Platform)               │
│  • AI analyzes dispute (< 5 minutes)                   │
│  • Finds similar precedents                            │
│  • Generates recommendation + confidence               │
└────────────────┬────────────────────────────────────────┘
                 │
         ┌───────┴──────────┐
         │ Confidence ≥ 95% │
         └───────┬──────────┘
                 │
        ┌────────┴─────────┐
        │                  │
        ▼                  ▼
   [Auto-Resolve]    [Customer Review]
   95% of cases      5% exceptions
   < 5 minutes       Customer's team decides
```

### **Why This Model Wins**

✅ **Their Domain Expertise** - Customers know their fraud patterns
✅ **Zero Judge Costs** - No need to recruit/pay neutral arbitrators
✅ **Faster GTM** - No judge panel management overhead
✅ **Better Margins** - Pure software, 75%+ gross margin
✅ **Bigger Market** - Everyone needs tools, few want full outsourcing
✅ **Learning System** - AI improves from customer decisions

---

## 📊 Perfect for Micro-Disputes (Under $1)

### **Case #1: API Timeout Dispute**
- **Transaction**: $0.25 API call to AI service
- **Issue**: Request timed out after 30s, customer charged
- **Evidence**: API logs showing timeout + SLA breach
- **Resolution**: AI rules UPHELD (customer wins) in 3 minutes
- **Confidence**: 97% (based on 23 similar precedents)

### **Case #2: Duplicate Transaction**
- **Transaction**: $0.50 charged twice for same service
- **Issue**: Idempotency key not respected
- **Evidence**: Transaction hashes + duplicate request proof
- **Resolution**: Auto-resolved UPHELD in 2 minutes
- **Confidence**: 99% (duplicate detection pattern)

### **Case #3: Quality Issue with Human Review**
- **Transaction**: $0.75 for AI-generated content
- **Issue**: Output quality below agreed threshold
- **Evidence**: Quality metrics + customer complaint
- **AI Recommendation**: DISMISSED (62% confidence - too low!)
- **Customer Review**: UPHELD (knows this customer has valid complaints)
- **Learning**: AI adjusts confidence for similar future cases

---

## 🌐 Economics: Why Automation is Essential

### Traditional Dispute Systems (Broken)
```
Cost per case:     $20-50 (human review)
Micro-dispute:     $0.25 transaction
Economics:         IMPOSSIBLE (80-200x cost ratio)
```

### Consulate Infrastructure (Profitable)
```
Cost per dispute:  $0.004 (AI processing)
95% automated:     No human review needed
5% review:         Customer's own team (zero cost to platform)
Platform charges:  $0.05-0.10 per dispute
Margin:           90%+ on micro-disputes
```

**Example Volume Economics**:
- 10,000 disputes/day
- 9,500 auto-resolved (< 5 min each)
- 500 sent to customer review queue
- Platform revenue: $500-1,000/day
- Platform cost: $40/day (AI processing)
- **Net margin: 92%+**

---

## 🛠️ Technical Architecture

### **Live API Endpoints**
**Base URL**: `https://api.consulatehq.com/`

```bash
# Payment Dispute Webhook (ACP/ATXP Integration)
POST /api/payment-disputes              # Receive dispute from protocol
GET  /api/payment-disputes/stats        # Batch statistics
GET  /api/payment-disputes/review-queue # Customer review queue

# Agent Management (for payment protocol agents)
POST /agents/register                   # Register payment agent
GET  /agents/:did                       # Agent details + reputation

# Evidence & ADP Compliance
POST /evidence                          # Submit ADP Evidence Message
GET  /cases/:caseId                     # Case status + ruling

# System Health
GET  /health                            # System status
GET  /version                           # Version info
```

### **Production Infrastructure**
- **Backend**: Convex (Serverless database and functions)
- **Frontend**: Vercel (Next.js dashboard at consulatehq.com)
- **Authentication**: Clerk (Secure user authentication)
- **Compliance**: Regulation E, ADP protocol, SOC2/PCI standards
- **Languages**: TypeScript/JavaScript
- **Deployment**: Production-grade 24/7 operation

---

## 🚀 Integration Guide for Payment Platforms

### **Step 1: When Dispute Occurs (Your Platform)**

```javascript
// When customer files payment dispute
const response = await fetch('https://api.consulatehq.com/api/payment-disputes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    transactionId: 'txn_abc123',
    transactionHash: '0x...',
    amount: 0.25,
    currency: 'USD',
    paymentProtocol: 'ACP', // or 'ATXP'
    plaintiff: 'customer_wallet_addr',
    defendant: 'merchant_agent_did',
    disputeReason: 'api_timeout',
    description: 'API request timed out after 30s, charged $0.25',
    evidenceUrls: [
      'https://logs.yourplatform.com/api-call-xyz.json',
      'https://monitoring.yourplatform.com/timeout-proof.json'
    ],
    reviewerOrganizationId: 'YOUR_ORG_ID', // Your team reviews exceptions
    callbackUrl: 'https://yourplatform.com/webhooks/dispute-result'
  })
});

// Response (within 5 minutes for micro-disputes)
{
  "success": true,
  "caseId": "k11234567890",
  "paymentDisputeId": "j09876543210",
  "isMicroDispute": true,
  "humanReviewRequired": false, // 95% are false (auto-resolved)
  "estimatedResolutionTime": "5 minutes",
  "regulationECompliant": true
}
```

### **Step 2: Receive Ruling (Your Platform)**

```javascript
// Consulate calls your webhook with ruling
app.post('/webhooks/dispute-result', async (req, res) => {
  const { caseId, verdict, winner, confidence, reasoning, auto } = req.body;

  if (verdict === 'UPHELD') {
    // Customer wins - refund transaction
    await refundTransaction(req.body.transactionId);
    await notifyCustomer('Dispute resolved in your favor - refund processed');
  } else {
    // Merchant wins - charge stands
    await notifyCustomer('Dispute denied - evidence insufficient');
  }

  res.json({ received: true });
});
```

### **Step 3: Review Exceptions (Your Dashboard)**

For the 5% of disputes that need human review:

```javascript
// Get review queue for your team
const queue = await fetch('https://api.consulatehq.com/api/payment-disputes/review-queue', {
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
});

// Your team sees:
// - AI recommendation + confidence %
// - Similar past cases
// - All evidence
// - Approve AI or override with reasoning
```

---

## 🎓 Learning System: AI Improves from Your Decisions

When your team overrides AI recommendations, the system learns:

```typescript
// Customer overrides AI recommendation
{
  aiPrediction: "DISMISSED",
  humanRuling: "UPHELD",
  reason: "Customer has valid history, evidence shows merchant violated SLA",

  // System learns:
  // - This customer's disputes are usually valid
  // - This merchant often violates SLAs
  // - This dispute pattern should be UPHELD in future
  // - Confidence increases for similar future cases
}
```

**Result**: Auto-resolution rate improves from 95% → 97%+ over time.

---

## 💼 Target Market

### **Primary: Payment Protocol Providers**
- **ACP (Agentic Commerce Protocol)** - Need dispute infrastructure
- **ATXP** - Micro-transaction payment protocol
- **Stripe for Agents** - API payment platforms
- **Crypto Payment Platforms** - Regulation E compliance required

### **Secondary: API Marketplaces**
- **RapidAPI** - API transaction disputes
- **OpenAI API Resellers** - Micro-transaction disputes
- **AWS Marketplace** - Agent service disputes

### **Tertiary: Merchant Platforms**
- **Shopify for Agents** - Agentic commerce disputes
- **Square for AI Services** - Automated payment disputes

---

## 📈 Success Metrics

### **Platform Performance**
- **Resolution Speed**: 95%+ disputes resolved < 5 minutes
- **Automation Rate**: 95%+ disputes auto-resolved (no human review)
- **Regulation E Compliance**: 100% within 10 business day deadline
- **Platform Reliability**: 99.9% uptime, < 100ms API response

### **Business Impact for Payment Platforms**
- **Cost Reduction**: 98%+ reduction in dispute resolution costs
- **Time Savings**: 99%+ reduction in dispute resolution time
- **Scalability**: Handle 10,000+ disputes/day per customer
- **Profitability**: 90%+ gross margin on dispute processing

---

## 🔧 Quick API Test

```bash
# 1. Check system health
curl https://api.consulatehq.com/health

# 2. Register a payment agent
curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"name":"Payment Agent","functionalType":"payment_processor"}' \
  https://api.consulatehq.com/agents/register

# 3. Submit a micro-dispute
curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "transactionId":"test_txn_001",
    "amount":0.25,
    "currency":"USD",
    "paymentProtocol":"ACP",
    "plaintiff":"customer_abc",
    "defendant":"merchant_xyz",
    "disputeReason":"api_timeout",
    "description":"Test micro-dispute - API timeout"
  }' \
  https://api.consulatehq.com/api/payment-disputes
```

---

## 🚀 Getting Started

### **Prerequisites: Homebrew PNPM**
```bash
# Install PNPM via Homebrew (required)
brew install pnpm

# Verify installation
which pnpm  # Should show /opt/homebrew/bin/pnpm
```

### **Production Setup**
```bash
# Clone repository
git clone https://github.com/consulate-ai/dispute-resolution

# Install dependencies
pnpm install

# Deploy backend to Convex
pnpm deploy:prod

# Deploy frontend to Vercel
vercel deploy --prod

# Run tests
pnpm test:run
```

### **Project Structure**
```
📁 consulate/
├── 🎯 convex/              # Convex backend (payment dispute engine)
│   ├── paymentDisputes.ts  # Micro-dispute processing
│   ├── schema.ts           # Database schema (optimized for micro-disputes)
│   ├── http.ts             # REST API endpoints
│   └── ...
├── 🎨 dashboard/           # Vercel frontend (customer review queue)
├── 🧪 test/               # Comprehensive test suites (12K+ lines)
│   ├── adp-compliance-payment.test.ts
│   ├── customer-review-workflow.test.ts
│   └── ...
├── 📜 scripts/            # Automation tools
└── 📚 internal/           # Internal documentation
```

---

## 🎯 Pricing Model (Suggested for Payment Platforms)

**Infrastructure-as-a-Service Pricing**:

```
Starter Tier: $99/month
- 1,000 disputes included
- 95% automation rate
- Email support
- $0.08 per additional dispute

Growth Tier: $299/month
- 5,000 disputes included
- 96% automation rate (learning improved)
- Priority support
- $0.05 per additional dispute

Enterprise Tier: Custom
- Unlimited disputes
- 97%+ automation rate
- Dedicated infrastructure
- Custom integrations
- White-glove support
```

---

## 🏆 The Regulatory Capture Opportunity

**Every payment platform needs micro-dispute infrastructure:**

1. **Regulation E Requirement** - All payment providers must offer dispute resolution
2. **Micro-Transaction Epidemic** - Traditional systems ($20-50/dispute) economically impossible
3. **You're the Only Solution** - No one else has 95% automation infrastructure at this scale
4. **Network Effects** - More disputes = better AI = higher auto-resolve rate = unbeatable moat
5. **First-Mover Advantage** - Build precedent database before competitors realize opportunity

**Market Size**:
- 100M+ micro-transactions daily (growing 300% YoY)
- 5% dispute rate = 5M disputes/day
- $0.05-0.10 per dispute = **$250K-500K daily revenue potential**
- **Total Addressable Market: $100M+ annually**

---

## 🔍 Technical Differentiators

### **1. Precedent-Based Learning**
- Vector similarity matching finds semantically similar past disputes
- Confidence scoring based on historical outcomes
- Learns from customer overrides (reinforcement learning)

### **2. Batch Processing**
- Groups similar disputes for consistent rulings
- Pattern recognition for common dispute types
- Improves efficiency for high-volume platforms

### **3. ADP Compliance**
- Full Agentic Dispute Protocol implementation
- SHA-256 cryptographic evidence hashing
- Merkle-linked custody chain
- Regulation E deadline tracking

### **4. Infrastructure Model**
- Customer's team makes final decisions
- Zero judge recruitment/management overhead
- Domain expertise stays with customer
- Learning improves platform-wide

---

## 📞 Contact & Support

**Production**: [consulatehq.com](https://consulatehq.com)
**API Documentation**: [docs.consulatehq.com](https://docs.consulatehq.com)
**GitHub**: [github.com/consulatehq](https://github.com/consulatehq)
**Support**: support@consulatehq.com

---

*Built for the agentic payment economy - where micro-transactions need fast, fair, automated dispute resolution at scale.*

**🚀 Ready to process 10,000 disputes/day with 95% automation?**
**Contact us to integrate Consulate into your payment platform.**
