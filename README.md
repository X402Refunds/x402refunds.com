# 🚀 x402disputes.com - Permissionless Dispute Resolution for X-402 Payments

**Agents file payment disputes directly with optional cryptographic proof. Refund and reputation data written on-chain.**

[![MCP Server](https://img.shields.io/badge/MCP-Server-blue)](https://modelcontextprotocol.io) [![Status](https://img.shields.io/badge/Status-Active-success)](https://registry.modelcontextprotocol.io/v0/servers?search=x402disputes)

🌐 **Production**: [x402disputes.com](https://x402disputes.com)  
🔧 **API Base**: `https://api.x402disputes.com` (HTTP Routes/Actions)  
🗄️ **Convex API**: `https://youthful-orca-358.convex.cloud` (SDK Only)  
📄 **Protocol Spec**: [X-402 Dispute Protocol](https://github.com/x402disputes/x402-dispute-protocol)  
🤖 **MCP Server**: `com.x402disputes/x402-disputes` - [Registry API](https://registry.modelcontextprotocol.io/v0/servers?search=x402disputes)

### 🔗 Key Endpoints
- **MCP Discovery**: [`https://api.x402disputes.com/.well-known/mcp.json`](https://api.x402disputes.com/.well-known/mcp.json) - [Registry API](https://registry.modelcontextprotocol.io/v0/servers?search=x402disputes)
- **ADP Discovery**: [`https://api.x402disputes.com/.well-known/adp`](https://api.x402disputes.com/.well-known/adp)
- **Payment Disputes**: `https://api.x402disputes.com/api/disputes/payment`
- **Agent Registration**: `https://api.x402disputes.com/api/agents/register`

### 🤖 MCP Integration
x402disputes.com is available as an **MCP (Model Context Protocol) server** in the official directory. AI agents can file disputes directly with zero-code integration.

- **Server Name**: `com.x402disputes/x402-disputes`
- **Registry API**: https://registry.modelcontextprotocol.io/v0/servers?search=x402disputes
- **Quick Start**: https://docs.x402disputes.com/mcp-quickstart
- **8 Tools Available**: Agent registration, dispute filing, evidence submission, case tracking, and more

---

## 💰 The X-402 Payment Problem

**AI agents transact millions of times daily, but there's no accountability when services fail:**

- Service timeout after payment: **No recourse**
- API returns 500 error: **Payment still processed**
- Wrong response schema: **Agent paid for nothing**
- **Result**: Merchants have zero accountability for failures

**X-402 (Payment Required)** enables machine-to-machine payments, but disputes were missing from the protocol.

---

## 🎯 Our Solution: Permissionless Dispute Filing

**Any AI agent can file a dispute against any merchant with optional cryptographic proof. No permission required.**

### **The X-402 Dispute Flow**

```
┌─────────────────────────────────────────────────────────┐
│  AI Agent (Buyer)                                       │
│  • Pays merchant via X-402                             │
│  • Service fails (timeout, error, wrong response)      │
│  • Optionally collects cryptographic proof (TLS logs, hashes)    │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  x402disputes.com (Permissionless)                      │
│  • Agent files dispute directly (proof optional)       │
│  • Evidence verified if provided (transaction hash, TLS proofs)    │
│  • AI analyzes dispute, merchant makes final decision │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Resolution Written On-Chain                            │
│  • Refund data written to blockchain                   │
│  • Reputation updated on-chain                         │
│  • Dispute record publicly visible                     │
│  • Merchants with bad reputation marked                │
└─────────────────────────────────────────────────────────┘
```

### **Why This Model Works**

✅ **Permissionless** - Any agent can file dispute against any merchant
✅ **Direct Filing** - Agents file disputes directly, no intermediaries
✅ **On-Chain Data** - Dispute and refund data written on-chain
✅ **On-Chain Reputation** - Merchant track records visible to all
✅ **Transparent** - All dispute records publicly visible

---

## 🏛️ Dual-Sided Platform: Registry + Resolution Service

x402disputes.com operates as **BOTH** a public dispute registry and a resolution platform:

### **1. Public Dispute Registry (Permissionless)**
- **ANY agent can file disputes** against ANY merchant (no permission needed)
- All disputes publicly recorded in the registry
- Refund data written on-chain
- Reputation scores tracked on-chain
- Transparent, public dispute records

### **2. Dispute Resolution Platform (For Merchant Customers)**
- **Merchants become customers** to manage disputes efficiently
- Platform provides dispute management dashboard
- AI analyzes disputes and makes recommendations
- Merchants resolve by refunding users automatically through platform
- Platform handles refund execution and on-chain recording

**Your customers = Merchants/agents who have disputes filed against them**
They use your platform to view, manage, and resolve disputes efficiently.

---

## 📊 X-402 Dispute Examples

### **Case #1: API Timeout (Buyer Wins)**
- **Payment**: 0.25 USDC to OpenAI API
- **Issue**: Request timed out after 30s, payment processed
- **Evidence**: TLS proof of timeout, X-402 transaction hash (optional)
- **AI Analysis**: High confidence recommendation for buyer refund
- **Resolution**: Merchant reviews and approves refund, buyer refunded, merchant reputation -100
- **Time**: 24 hours from filing to resolution

### **Case #2: HTTP 500 Error (Buyer Wins)**
- **Payment**: 0.50 USDC for AI inference
- **Issue**: Server returned 500 error, no service delivered
- **Evidence**: HTTP response logs, blockchain transaction proof (optional)
- **AI Analysis**: High confidence recommendation for buyer refund
- **Resolution**: Merchant reviews and approves refund, buyer refunded, merchant reputation -100
- **Time**: 24 hours from filing to resolution

### **Case #3: Fraudulent Claim (Seller Wins)**
- **Payment**: 0.75 USDC for API call
- **Issue**: Buyer claims no response, but merchant has proof
- **Evidence**: Buyer's TLS proof incomplete, merchant's proof valid
- **AI Analysis**: Low confidence, recommends merchant review
- **Resolution**: Merchant reviews evidence, denies refund, merchant keeps payment, buyer reputation -100
- **Time**: 24 hours from filing to resolution

---

## 🌐 Economics: On-Chain Reputation System

### **Reputation Scoring**
```
Starting Score:  500 (neutral)
Win Dispute:     +50 (max 1000)
Lose Dispute:    -100 (min 0)
Blacklist:       < 200 reputation
Voluntary Refund: +50 (shows good faith)
```

### **Merchant Benefits**
```
High Reputation (700+):
✅ Instant settlement (payment received immediately)
✅ Lower dispute filing threshold against you
✅ Better visibility in agent marketplaces
✅ Faster dispute resolution (AI trusts your evidence)

Low Reputation (< 200):
❌ Blacklisted from instant settlement
❌ Held payments (escrow for 7 days)
❌ Higher stake required to defend disputes
❌ Excluded from premium agent marketplaces
```

---

## 🛠️ Technical Architecture

### **Live API Endpoints**
**Base URL**: `https://api.x402disputes.com/`

```bash
# X-402 Dispute Filing
POST /api/disputes/payment              # File payment dispute (permissionless)
GET  /cases/:caseId                     # Check dispute status
POST /disputes/claim                    # Merchant claims dispute URL

# Agent Identity (ERC-8004 / Ethereum Wallet)
POST /agents/register                   # Register agent wallet
GET  /agents/:walletAddress             # Get agent reputation
POST /agents/claim                      # Claim agent identity

# Evidence & Cryptographic Proof
POST /evidence                          # Submit TLS proofs, logs
GET  /cases/:caseId/evidence            # View all evidence

# System Health
GET  /health                            # System status
GET  /version                           # Version info
GET  /.well-known/mcp.json              # MCP tool discovery
```

### **Production Infrastructure**
- **Backend**: Convex (Serverless database and functions)
- **Frontend**: Vercel (Next.js dashboard at x402disputes.com)
- **AI Analysis**: OpenRouter LLM for dispute analysis and recommendations
- **Authentication**: Wallet signatures (ERC-8004 identity), API keys for merchants
- **Compliance**: Regulation E, X-402 protocol, on-chain transparency

---

## 🚀 Integration Guide - File Dispute via MCP

### **X-402 Payment Dispute (Permissionless)**

#### **Ultra-Minimal Example (7 Required Fields)**

```javascript
// Agent files dispute directly (no permission needed)
const response = await fetch('https://api.x402disputes.com/mcp/invoke', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tool: 'x402_file_dispute',
    parameters: {
      // 1-2. Party identifiers (Ethereum addresses for X-402)
      plaintiff: '0xBuyerWalletAddress123...',
      defendant: '0xSellerWalletAddress456...',
      
      // 3. Transaction proof (optional blockchain hash)
      transactionHash: '0xabcdef1234567890...',  // Optional
      
      // 4-5. What went wrong
      disputeReason: 'api_timeout',
      description: 'Paid 0.25 USDC for API call, request timed out after 30s',
      
      // 6. Cryptographic evidence (optional TLS proof, logs)
      evidenceUrl: 'https://ipfs.io/ipfs/QmProofHash...',  // Optional
      
      // 7. Optional: Seller's signature (if you have it)
      sellerSignature: '0x...' // If seller signed response
    }
  })
});

// Response (instant filing confirmation)
{
  "success": true,
  "caseId": "case_k11234567890",
  "paymentDisputeId": "case_k11234567890",
  "status": "received",
  "disputeFee": 0.05,
  "estimatedResolutionTime": "24 hours",
  "humanReviewRequired": true,
  "trackingUrl": "https://x402disputes.com/cases/case_k11234567890"
}
```

#### **With Request/Response Objects (X-402 Full)**

```javascript
// File dispute with full X-402 request/response context
const response = await fetch('https://api.x402disputes.com/mcp/invoke', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tool: 'x402_file_dispute',
    parameters: {
      plaintiff: '0xBuyerAddress...',
      defendant: '0xSellerAddress...',
      transactionHash: '0xabcdef...',
      disputeReason: 'api_timeout',
      description: 'API call timed out, no response received',
      evidenceUrl: 'https://ipfs.io/ipfs/QmProof...',
      
      // X-402 Request Object (what agent sent)
      request: {
  method: 'POST',
        url: 'https://api.openai.com/v1/chat/completions',
  headers: {
    'Content-Type': 'application/json',
          'X-402-Transaction-Hash': '0xabcdef...'
  },
        body: {
          model: 'gpt-4',
          messages: [{ role: 'user', content: 'Hello' }]
        },
        timestamp: '2025-01-15T10:30:00Z'
      },
      
      // X-402 Response Object (what merchant returned, if anything)
      response: {
        status: 0, // 0 = timeout (no response)
        statusText: 'Timeout',
        headers: {},
        body: null,
        timestamp: '2025-01-15T10:30:30Z',
        duration: 30000 // 30 seconds
      },
      
      // Blockchain proof
      amount: 0.25,
      currency: 'USDC',
      blockchain: 'ethereum',
      contractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
    }
  })
});
```

---

## 🎓 Dispute Resolution Process

x402disputes.com uses **AI-powered analysis with merchant final decision**:

### **How Disputes Are Resolved**

1. **Agent files dispute** with transaction details and optional evidence
2. **AI analyzes dispute** using LLM to understand context and evidence
3. **AI provides recommendation** with confidence score (CONSUMER_WINS, MERCHANT_WINS, PARTIAL_REFUND, NEED_REVIEW)
4. **Merchant reviews** in dashboard and makes final decision
5. **Platform executes resolution** - refunds processed automatically if approved
6. **Results recorded** - Dispute and resolution data written on-chain

### **Resolution Flow**

- **High Confidence (>95%)**: AI recommendation provided, merchant can auto-approve
- **Low Confidence (<95%)**: Flagged for merchant review, merchant makes final call
- **All Disputes**: Merchant has final decision authority
- **Regulation E Compliance**: Resolution within 10 business days

---

## 💼 Target Market

### **Primary: AI Agents (Direct Users)**
- **Autonomous Agents** - File disputes when services fail
- **Agent Operators** - Protect their agents from bad merchants
- **Agent Marketplaces** - Integrate dispute filing into wallets

### **Secondary: Merchants (Defensive)**
- **API Providers** - Maintain reputation to avoid blacklisting
- **SaaS Services** - Provide accountability for X-402 payments
- **Agent Service Providers** - Build trust with verifiable uptime

### **Tertiary: X-402 Infrastructure**
- **Payment Processors** - Integrate dispute resolution into payment flow
- **Wallet Providers** - Add "File Dispute" button for failed payments
- **Agent Operating Systems** - Automatic dispute filing on failures

---

## 📈 Success Metrics

### **Protocol Performance**
- **Resolution Speed**: < 24 hours (vs. 4-8 weeks traditional)
- **AI Accuracy**: 95%+ disputes have high-confidence AI recommendations
- **False Claim Rate**: < 5% (merchant review prevents frivolous disputes)
- **On-Chain Transparency**: 100% disputes publicly verifiable

### **Merchant Impact**
- **Reputation Incentive**: 80%+ merchants settle disputes voluntarily (saves reputation)
- **Blacklist Rate**: < 1% merchants fall below 200 reputation
- **Payment Speed**: High-reputation merchants get instant settlement (vs. escrow)
- **Marketplace Access**: Good reputation = premium listing in agent marketplaces

---

## 🔧 Quick API Test

```bash
# 1. Check system health
curl https://api.x402disputes.com/health

# 2. File a test dispute (permissionless - no API key needed)
curl -X POST -H "Content-Type: application/json" \
  -d '{
    "plaintiff":"0xYourWalletAddress",
    "defendant":"0xMerchantAddress",
    "transactionHash":"0xPaymentTxHash",
    "disputeReason":"api_timeout",
    "description":"API call timed out after 30s",
    "evidenceUrl":"https://ipfs.io/ipfs/QmProofHash",
    "amount":0.25,
    "currency":"USDC"
  }' \
  https://api.x402disputes.com/api/disputes/payment

# 3. Check dispute status
curl https://api.x402disputes.com/cases/case_k12345

# 4. Check merchant reputation
curl https://api.x402disputes.com/agents/0xMerchantAddress
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
git clone https://github.com/x402disputes/dispute-resolution

# Install dependencies
pnpm install

# Deploy backend to Convex
pnpm deploy:dev

# Deploy frontend to Vercel
vercel deploy --prod

# Run tests
pnpm test:run
```

### **Project Structure**
```
📁 x402disputes/
├── 🎯 convex/              # Convex backend (dispute engine)
│   ├── paymentDisputes.ts  # X-402 dispute processing
│   ├── schema.ts           # Database schema
│   ├── http.ts             # REST API endpoints
│   └── mcp.ts              # MCP tool definitions
├── 🎨 dashboard/           # Vercel frontend
├── 🧪 test/               # Comprehensive test suites
└── 📚 internal/           # Internal documentation
```

---

## 🎯 Pricing Model

**Permissionless Protocol Fees**:

```
Dispute Filing:
- Flat Fee: $0.05 USDC per dispute
- No stake required
- No blockchain gas fees (handled by platform)
- Total Cost: $0.05 USDC to file dispute

Merchant Defense:
- No fee to defend (evidence submission free)
- Win dispute: Keep payment
- Lose dispute: Refund + reputation penalty
- Settle early: Return payment + reputation bonus
```

---

## 🏆 The Regulatory Capture Opportunity

**X-402 protocol needs dispute resolution to be complete:**

1. **Protocol Gap** - X-402 enables payments but has no dispute mechanism
2. **Agent Economy** - Millions of micro-transactions daily need accountability
3. **Permissionless Design** - Any agent can file without platform permission
4. **On-Chain Reputation** - Network effects make bad merchants unemployable
5. **First-Mover Advantage** - Be the standard dispute protocol before others realize opportunity

**Market Size**:
- 100M+ X-402 transactions daily (growing 300% YoY)
- 5% dispute rate = 5M disputes/day
- $0.05-0.10 per dispute = **$250K-500K daily revenue potential**
- **Total Addressable Market: $100M+ annually**

---

## 🔍 Technical Differentiators

### **1. Permissionless Filing**
- No API keys required to file disputes
- Wallet signature authenticates identity (ERC-8004)
- Any agent can dispute any merchant
- Open protocol, not platform-controlled

### **2. AI-Powered Analysis**
- LLM analyzes dispute context and evidence
- Provides recommendations with confidence scores
- Learns from merchant decisions over time
- Merchant makes final decision on all disputes

### **3. On-Chain Reputation**
- Reputation stored on Ethereum (can't be manipulated)
- Merchants with unpaid judgments get blacklisted
- Instant settlement for high-reputation merchants
- Network effects: bad merchants lose all business

### **4. X-402 Native**
- Purpose-built for X-402 payment protocol
- TLS proof verification built-in
- Transaction hash validation
- Request/response schema verification

---

## 📞 Contact & Support

**Production**: [x402disputes.com](https://x402disputes.com)
**API Documentation**: [docs.x402disputes.com](https://docs.x402disputes.com)
**GitHub**: [github.com/x402disputes](https://github.com/x402disputes)
**Support**: support@x402disputes.com

---

*Built for the AI agent economy - where permissionless dispute resolution ensures merchant accountability in the X-402 payment protocol.*

**🚀 Ready to file your first dispute?**
**No permission required. Optional cryptographic proof.**
