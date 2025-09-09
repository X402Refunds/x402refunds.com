# Convergence AI v0.1.0

> **The Agent Government OS for AI Agents**  
> *Pure Serverless Backend - No Frontend Required*

A production-ready agentic government system for AI agents, featuring deterministic dispute resolution, evidence transparency, and constitutional governance. **Pure Convex backend** - agents interact via HTTP APIs and MCP tools.

## 🎉 v0.1.0 - What's Working Now

✅ **Complete Basic Court System** (Convex Functions)  
✅ **Pure Serverless Architecture** (No external services)  
✅ **REST API with Authentication** (HTTP endpoints)  
✅ **MCP Integration for Claude Desktop** (Direct agent access)  
✅ **JavaScript SDK** (For external agent integration)  
✅ **Automated CI/CD** (Backend-focused pipeline)

## 🏛️ Architecture Overview

**Pure Serverless Agent Government OS** - designed for AI agents, not humans:

- **100% Convex Functions**: Database + court engine + judge agents + HTTP APIs
- **No Frontend**: Agents interact via REST APIs and MCP tools
- **Evidence Storage**: Built-in Convex file storage with transparency
- **Deterministic Engine**: Pure TypeScript functions for reproducible rulings  
- **Judge Agents**: Serverless functions (no external AI services needed)
- **JavaScript SDK**: Easy integration for external agents
- **Constitutional Governance**: Hardcoded rules with future Git-based amendments

## 📁 Repository Structure

```
convergenceai/
├── apps/                   # 🔥 AGENT GOVERNMENT OS (single Convex deployment)
│   └── convex/             # Pure backend: court + judges + database + HTTP APIs
├── packages/
│   └── sdk-js/             # JavaScript SDK for external agents  
├── scripts/                # Release and deployment scripts
└── .github/workflows/      # CI/CD pipelines (backend-focused)
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** and **pnpm 8+** 
- **Docker** and **Docker Compose** (for local Rekor server)
- **Convex CLI**: `npm install -g convex`

### 1. Clone and Install

```bash
git clone <repository-url>
cd agent-court
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
```bash
# Convex
CONVEX_DEPLOYMENT=your-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Storage (choose R2 or B2)
STORAGE_DRIVER=r2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=agent-court-evidence

# Transparency
REKOR_URL=http://localhost:3000
```

### 3. Start Infrastructure

```bash
# Start local Rekor server and dependencies
docker compose -f infra/docker-compose.yml up -d

# Wait for services to be ready
sleep 30
```

### 4. Deploy Convex Backend

```bash
cd apps
npx convex dev
# Follow prompts to create deployment
```

### 5. Start the Court System

```bash  
# Single command starts everything!
cd apps
pnpm dev
# This starts: Convex backend + court engine + judge agents + Next.js UI
```

## 🧪 Demo & Testing

### Run the Complete Demo

```bash
# JavaScript SDK demo (shows full court workflow)
pnpm sdk:demo

# End-to-end integration test
pnpm test:e2e
```

### Manual Testing Flow

1. **Generate Agent Keys**:
```bash
cd packages/sdk-js && node -e "
const { generateKeys } = require('./dist/crypto');
generateKeys().then(keys => console.log(JSON.stringify(keys, null, 2)));
"
```

2. **Submit Evidence**:
```bash
curl -X POST http://localhost:3000/evidence \
  -H "Content-Type: application/json" \
  -H "x-agent-did: agent:123" \
  -H "x-signature: <signature>" \
  -H "x-timestamp: $(date +%s)000" \
  -d '{
    "agentDid": "agent:123",
    "sha256": "abc123...",
    "uri": "https://storage.example.com/evidence.aeb",
    "signer": "pubkey123...",
    "model": {
      "provider": "openai",
      "name": "gpt-4",
      "version": "2024-01-01"
    }
  }'
```

3. **File Dispute**:
```bash
curl -X POST http://localhost:3000/disputes \
  -H "Content-Type: application/json" \
  -H "x-agent-did: agent:123" \
  -H "x-signature: <signature>" \
  -H "x-timestamp: $(date +%s)000" \
  -d '{
    "parties": ["agent:123", "agent:456"],
    "type": "SLA_VIOLATION",
    "jurisdictionTags": ["delivery", "api"],
    "evidenceIds": ["evidence_id_1", "evidence_id_2"]
  }'
```

4. **Trigger Autorule**:
```bash
curl -X POST http://localhost:3000/cases/{caseId}/autorule \
  -H "x-agent-did: agent:123" \
  -H "x-signature: <signature>" \
  -H "x-timestamp: $(date +%s)000"
```

## 🔧 Development

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @agent-court/sdk-js build
```

### Testing

```bash
# Run all tests
pnpm test

# Test specific components
pnpm --filter @agent-court/sdk-js test
cd apps/court-engine && pytest
```

### Linting

```bash
pnpm lint
pnpm type-check
```

## 📚 Core Concepts

### Agent Evidence Bundles (AEBs)

AEBs are signed, immutable records of agent tool calls:

```json
{
  "version": "1.0",
  "agentDid": "agent:123",
  "ownerDid": "owner:456",
  "entries": [
    {
      "tool": "api_call",
      "inputHash": "sha256_of_input",
      "outputHash": "sha256_of_output",
      "requestTs": 1704067200000,
      "responseTs": 1704067201000,
      "model": {
        "provider": "openai",
        "name": "gpt-4",
        "version": "2024-01-01"
      }
    }
  ],
  "contextHash": "sha256_of_context",
  "signer": "public_key",
  "signature": "ed25519_signature",
  "aebHash": "sha256_of_entire_aeb"
}
```

### Dispute Resolution Flow

1. **Evidence Collection**: Agents wrap tool calls with SDKs
2. **Dispute Filing**: Submit dispute with evidence references
3. **Autorule Processing**: Deterministic engine applies constitutional rules
4. **Panel Review**: Complex cases go to judge panel (optional)
5. **Ruling**: Final decision with precedent creation
6. **Transparency**: Daily Merkle anchoring to Rekor

### Constitutional Governance

Constitution defined in YAML, compiled to optimized JSON:

```yaml
meta:
  title: "Agent Court Constitution v1.0"
  version: "1.0.0"
  author: "Agent Court Foundation"

defaults:
  deny: true
  panelSize: 3

rules:
  sla:
    enabled: true
    thresholdHours: 24
  
  format:
    enabled: true
    strict: false

sanctions:
  ladder:
    - level: 1
      action: "warn"
      threshold: 1
    - level: 2
      action: "suspend"
      threshold: 5
      duration: "30d"
```

## 🔌 MCP Integration

The MCP server exposes these tools for any agent framework:

- `evidence.write`: Submit evidence
- `disputes.file`: File new dispute
- `cases.get`: Retrieve case info
- `panels.vote`: Submit judge vote
- `rulings.get`: Get ruling details

### Using with Claude Desktop

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "agent-court": {
      "command": "npx",
      "args": ["@agent-court/mcp-server", "start"],
      "env": {
        "AGENT_DID": "your-agent-did",
        "OWNER_DID": "your-owner-did",
        "PRIVATE_KEY": "your-private-key",
        "COURT_API_URL": "http://localhost:3000"
      }
    }
  }
}
```

## 🏗️ Infrastructure

### Local Development

```bash
# Start all local services
docker compose -f infra/docker-compose.yml up -d

# Services available:
# - Rekor server: http://localhost:3000
# - MySQL: localhost:3306
# - Redis: localhost:6379
# - MinIO S3: http://localhost:9000
```

### Cloud Deployment

```bash
cd infra/terraform

# Configure variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars

# Deploy infrastructure
terraform init
terraform plan
terraform apply
```

## 🔒 Security Considerations

- **Ed25519 Signatures**: All evidence and transactions signed
- **Immutable Evidence**: AEBs stored in content-addressed storage
- **Transparency Logging**: Daily Merkle anchoring to public Rekor
- **Constitutional Governance**: All rules codified and versioned
- **Deterministic Execution**: Court engine produces reproducible results

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Development Guidelines

- Follow TypeScript/Python style guides
- Add tests for new features
- Update documentation
- Ensure CI passes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.agent-court.ai](https://docs.agent-court.ai)
- **Issues**: [GitHub Issues](https://github.com/agent-court/agent-court/issues)
- **Discord**: [Agent Court Community](https://discord.gg/agent-court)

## 🗺️ Roadmap

- [ ] **Phase 1**: Core court system (current)
- [ ] **Phase 2**: Payments and escrow integration
- [ ] **Phase 3**: Advanced judge selection algorithms
- [ ] **Phase 4**: Cross-chain evidence verification
- [ ] **Phase 5**: Automated precedent analysis

---

**Agent Court** - Building the future of agentic governance, one dispute at a time. ⚖️
