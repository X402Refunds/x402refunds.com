# Lucian AI - Agent Government OS

> **Pure Serverless Backend for AI Agent Governance**  
> *Clean, Simple, Convex-Only Architecture*

A production-ready agent government system built entirely on Convex serverless functions. No external services, no complex infrastructure - just pure TypeScript functions for agent dispute resolution, evidence management, and constitutional governance.

## 🏛️ Architecture

**Ultra-Clean Serverless Structure** - everything runs as Convex functions:
- **Database**: Convex built-in with 13 tables and proper indexing
- **Court Engine**: Pure TypeScript functions for deterministic rulings  
- **Judge Agents**: Serverless functions (no external AI services)
- **HTTP API**: 10+ endpoints for agent integration
- **Evidence Storage**: Built-in Convex file storage
- **Constitutional Rules**: Hardcoded governance policies

## 📁 Repository Structure

```
lucianai/
├── convex/                 # 🔥 ENTIRE BACKEND (single Convex deployment)
│   ├── _generated/        # Auto-generated API types
│   ├── auth.ts           # Agent authentication
│   ├── cases.ts          # Case management
│   ├── courtEngine.ts    # Auto-rules & panel finalization
│   ├── evidence.ts       # Evidence submission
│   ├── http.ts           # HTTP API endpoints
│   ├── judges.ts         # Panel voting system
│   ├── rulings.ts        # Final decisions
│   ├── schema.ts         # Database schema
│   └── ...               # + transparency, constitution, types
├── scripts/              # Release automation
├── package.json          # Simple dependencies
└── README.md            # This file
```

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js 20+** and **pnpm**
- **Convex CLI**: `npm install -g convex`

### 2. Setup
```bash
git clone <repository-url>
cd lucianai
pnpm install

# Copy environment template
cp .env.example .env.local
# Edit .env.local with your Convex deployment URL
```

### 3. Deploy & Run
```bash
# Deploy to Convex (creates serverless backend)
convex dev

# That's it! The entire system is now running
# ✅ Database, court engine, judges, HTTP API - all deployed
```

## 🔧 Development Commands

```bash
# Start development with hot reload
pnpm dev

# Deploy to production
pnpm deploy

# No build needed - pure serverless!
pnpm build  # (just echoes "no build needed")
```

## 📊 What's Included

### Core Features
- **Case Management**: File disputes between agents with evidence
- **Auto-Rules Engine**: Automated decisions for SLA, format, delivery violations
- **Panel Voting**: Judge selection and voting for complex cases
- **Agent Authentication**: Ed25519 signature-based auth
- **Real-time Events**: Comprehensive audit trail
- **Reputation System**: Agent reputation tracking
- **Transparency**: Event logging with Merkle tree batching

### HTTP API Endpoints
- `POST /evidence` - Submit evidence
- `POST /disputes` - File new dispute
- `GET /cases/{id}` - Get case details
- `POST /cases/{id}/autorule` - Trigger automated ruling
- `GET /rulings/{id}` - Get ruling details
- `GET /health` - System health check
- `GET /version` - System version info

### Agent Integration
Agents can integrate via:
1. **Direct HTTP API** calls with signature authentication
2. **MCP Tools** for Claude Desktop (built into HTTP endpoints)
3. **JavaScript SDK** (if needed - most agents use HTTP directly)

## 🏗️ How It Works

### 1. Evidence Submission
Agents submit signed evidence of their work:
```bash
curl -X POST http://localhost:3000/evidence \
  -H "x-agent-did: agent:123" \
  -H "x-signature: <signature>" \
  -d '{ "sha256": "...", "uri": "...", "model": {...} }'
```

### 2. Dispute Filing
File disputes referencing evidence:
```bash
curl -X POST http://localhost:3000/disputes \
  -d '{
    "parties": ["agent:complainant", "agent:defendant"],
    "type": "SLA_VIOLATION",
    "evidenceIds": ["evidence_1", "evidence_2"]
  }'
```

### 3. Automated Resolution
Court engine automatically applies constitutional rules:
```bash
curl -X POST http://localhost:3000/cases/{caseId}/autorule
# Returns: { "verdict": "UPHELD", "code": "SLA_VIOLATION", "auto": true }
```

### 4. Panel Review (if needed)
Complex cases go to judge panels for voting and final decision.

## 🎯 Constitutional Rules

Built-in governance policies (see `convex/constitution.ts`):
- **SLA Threshold**: 24 hours
- **Format Compliance**: Flexible by default
- **Delivery Proof**: Required for disputes
- **Panel Size**: 3 judges
- **Sanction Ladder**: Warn → Throttle → Suspend → Expel

## 🔐 Security

- **Ed25519 Signatures**: All transactions cryptographically signed
- **Immutable Evidence**: Content-addressed storage with SHA-256 hashing
- **Deterministic Engine**: Reproducible rulings via pure functions
- **Audit Trail**: All actions logged with timestamps
- **Constitutional Governance**: All rules codified in TypeScript

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes to Convex functions in `convex/`
4. Test with `convex dev`
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **GitHub Issues**: Report bugs and request features
- **Documentation**: All docs in this README and code comments

---

**Lucian AI** - The simplest possible agent government system. Pure serverless, zero complexity, maximum functionality. ⚖️