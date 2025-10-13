# 🚀 Consulate - Agentic Dispute Arbitration

**Resolve AI agent disputes in minutes, not months**

🌐 **Production**: [consulatehq.com](https://consulatehq.com)  
🔧 **API Base**: `https://api.consulatehq.com`


### **Pre-Dispute Resolution Ladder**
1. **Automated retry** (agent → agent direct)
2. **Service credit request** (programmatic)  
3. **Manager-level API call** (escalation)
4. **Formal dispute filing** (when above fails)

### **Fast Automated Resolution**
- **Evidence Collection**: Automatic log aggregation and SLA breach proof
- **Arbitration Engine**: Rule-based decisions on standard SLA violations  
- **Payment Execution**: Automated through existing payment rails and service credits

## 💰 Business Model - The Insurance Model

**When you're the VICTIM:**
- Get paid quickly (3 minutes vs 4-8 weeks)
- No management overhead ($500 vs $20K+ time cost)
- Automatic enforcement (no collections hassle)

**When you're the VIOLATOR:**
- Predictable penalties (vs unknown lawsuit exposure)
- Fast resolution (vs dragged-out negotiations)  
- Relationship preservation (vs burned bridges)

**Example:**
```
Salesforce joins because:
✅ When OpenAI fails them → Get paid $23K in 3 minutes
✅ When they fail customers → Pay predictable penalty vs lawsuit

OpenAI joins because:
✅ When Azure fails them → Get paid quickly  
✅ When they fail Salesforce → Pay $23K vs weeks of management overhead
```

## 📊 Perfect Demo Cases

### **Case #1: Salesforce vs OpenAI**
- **Issue**: API downtime caused $23K revenue loss
- **SLA**: 99.9% uptime guaranteed (violated at 99.2%)
- **Resolution**: OpenAI pays $23K + $2.3K penalty
- **Time**: 3 minutes 17 seconds (vs 4-6 weeks management)

### **Case #2: Uber vs Google Maps**
- **Issue**: Route optimization latency caused $38K losses
- **SLA**: <200ms response time (violated at 450ms avg)
- **Resolution**: Google refunds $38K API costs
- **Time**: 4 minutes 45 seconds

### **Case #3: Anthropic vs Microsoft Azure**
- **Issue**: Compute allocation failure cost $45K
- **SLA**: Dedicated GPU access guaranteed
- **Resolution**: Microsoft credits $45K + free month
- **Time**: 4 minutes 23 seconds

## 🌐 Network Effect

**Current**: 47 companies resolving agent disputes
**Scale**: Every AI company has 10+ agent relationships  
**Math**: 1000 AI companies × 10 agents = 10,000 dispute-prone relationships
**Revenue**: $500 base fee + 10% of dispute value

## 🛠️ Technical Architecture

### **Live API Endpoints**
**Base URL**: `https://api.consulatehq.com/`

```bash
# System Health
GET  /health                    # System status
GET  /version                   # Version info
GET  /dashboard                 # HTML dashboard

# Agent Management
POST /agents/simple             # Register monitoring agents
GET  /agents?type=general       # List registered agents

# Dispute Resolution
POST /evidence                  # Submit SLA breach evidence
POST /disputes                  # File formal disputes
GET  /cases/:id                 # Track dispute status
```

### **Production Infrastructure**
- **Backend**: Convex (Serverless database and functions)
- **Frontend**: Vercel (Next.js deployment at consulatehq.com)
- **Authentication**: Clerk (Secure user authentication and session management)
- **Languages**: TypeScript/JavaScript
- **Deployment**: Production-grade 24/7 operation
- **Database**: Real-time dispute tracking and evidence storage

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
pnpm deploy

# Deploy frontend to Vercel
vercel deploy --prod

# Run tests
pnpm test
```

### **Project Structure**
```
📁 consulate/
├── 🎯 convex/           # Convex backend (dispute resolution engine)
├── 🎨 dashboard/        # Vercel frontend (monitoring & case management)
├── 🧪 test/            # Comprehensive API test suites
├── 📜 scripts/         # Automation tools
└── 📚 docs/            # Technical documentation
```

## 📈 Success Metrics

- **Time**: 3-4 minute resolution vs 4-8 week management cycles
- **Cost**: $500-3K fees vs $15K-30K management time  
- **Scale**: Every AI vendor relationship needs this
- **Network**: More companies = better protection for all

## 🔧 Quick API Test

```bash
# 1. Check system health
curl https://api.consulatehq.com/health

# 2. Register a monitoring agent
curl -X POST -H "Content-Type: application/json" \
  -d '{"did":"monitor-1","ownerDid":"your-company"}' \
  https://api.consulatehq.com/agents/simple

# 3. Submit evidence of SLA breach
curl -X POST -H "Content-Type: application/json" \
  -d '{"agentDid":"monitor-1","sha256":"breach-hash","uri":"logs-uri","signer":"your-company","model":{"provider":"monitoring","name":"sla-check","version":"1.0"}}' \
  https://api.consulatehq.com/evidence
```

## 💼 Target Market

- **Primary**: AI companies with vendor dependencies (Salesforce, Uber, Anthropic)
- **Secondary**: API providers who want predictable dispute resolution (OpenAI, Google, Microsoft)
- **Scale**: Every AI vendor relationship in the industry

## 🎯 The One-Liner That Wins

**"We built automated arbitration for agent disputes."**

---

---

*Built for the AI economy - where agent relationships need fast, fair, automated dispute arbitration.*

**Production**: [consulatehq.com](https://consulatehq.com)  
**API**: `https://api.consulatehq.com`