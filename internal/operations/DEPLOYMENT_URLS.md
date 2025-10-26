# Deployment URLs and Endpoints

**Last Updated**: 2025-10-26  
**Purpose**: Canonical reference for all deployment URLs and how to use them

---

## 🌐 URL Structure Overview

Consulate uses **TWO different URL patterns** for different purposes:

### 1. Convex Internal API (`.convex.cloud`)
- **Purpose**: Convex SDK client connections (database queries, mutations, subscriptions)
- **Current URL**: `https://youthful-orca-358.convex.cloud`
- **Used By**: Convex JavaScript/TypeScript client, test suite
- **NOT Used For**: Public HTTP REST APIs, browser access, curl

### 2. HTTP Routes/Actions (`.convex.site` or custom domain)
- **Purpose**: Public REST API endpoints defined in `convex/http.ts`
- **Development URL**: `https://youthful-orca-358.convex.site`
- **Production URL**: `https://api.consulatehq.com` (CNAME to `.convex.site`)
- **Used By**: Payment platforms, AI agents (MCP), webhooks, public APIs
- **Accessible By**: Any HTTP client (curl, fetch, axios, browser)

---

## 📍 Current Deployment URLs

### Preview/Testing Environment (youthful-orca-358)
```bash
# Convex SDK (for database operations)
CONVEX_URL=https://youthful-orca-358.convex.cloud

# HTTP Routes (for REST APIs)
API_BASE_URL=https://youthful-orca-358.convex.site
```

**Use For**: Development, testing, CI/CD, smoke tests before production

### Production Environment (perceptive-lyrebird-89)
```bash
# Convex SDK (for database operations)
CONVEX_URL=https://perceptive-lyrebird-89.convex.cloud

# HTTP Routes (for REST APIs)
API_BASE_URL=https://perceptive-lyrebird-89.convex.site
# OR via custom domain
API_BASE_URL=https://api.consulatehq.com
```

**Use For**: Production traffic, real payment disputes, customer integrations

**DNS Configuration**: `api.consulatehq.com` → CNAME → `perceptive-lyrebird-89.convex.site`

---

## 🔗 API Endpoints Reference

### MCP (Model Context Protocol) Endpoints
```bash
# MCP Discovery (AI agents discover available tools)
GET https://api.consulatehq.com/.well-known/mcp.json
# OR (dev)
GET https://youthful-orca-358.convex.site/.well-known/mcp.json

# MCP Tool Invocation
POST https://api.consulatehq.com/mcp/invoke
```

**Available MCP Tools**:
- `consulate_file_dispute` - File payment disputes
- `consulate_submit_evidence` - Submit dispute evidence
- `consulate_check_status` - Check dispute status
- `consulate_get_precedents` - Query similar dispute precedents
- `consulate_accept_case` - Accept case assignment (for reviewers)

### ADP (Agentic Dispute Protocol) Endpoints
```bash
# ADP Service Discovery
GET https://api.consulatehq.com/.well-known/adp

# ADP Neutrals Directory
GET https://api.consulatehq.com/.well-known/adp/neutrals
```

### Payment Disputes API
```bash
# File a Payment Dispute
POST https://api.consulatehq.com/api/payment-disputes
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "transactionId": "txn_abc123",
  "amount": 0.25,
  "currency": "USD",
  "paymentProtocol": "ACP",
  "plaintiff": "customer_wallet_addr",
  "defendant": "merchant_did",
  "disputeReason": "api_timeout",
  "description": "API call timed out",
  "evidenceUrls": ["https://logs.platform.com/timeout.json"],
  "reviewerOrganizationId": "YOUR_ORG_ID"
}
```

### Agent Registration
```bash
# Register a Payment Agent
POST https://api.consulatehq.com/api/agents/register
```

### Evidence Submission
```bash
# Submit Evidence for Dispute
POST https://api.consulatehq.com/api/evidence
```

---

## 🧪 Testing Against Different Environments

### Local Testing (Convex Test Instance)
```bash
# Run full test suite (uses Convex SDK)
pnpm test:run

# This uses: https://youthful-orca-358.convex.cloud
```

### Development HTTP Testing
```bash
# Test against dev HTTP routes
API_BASE_URL=https://youthful-orca-358.convex.site pnpm test:smoke
```

### Production HTTP Testing
```bash
# Test against production custom domain
API_BASE_URL=https://api.consulatehq.com pnpm test:smoke
```

---

## 🚀 Deployment Commands Reference

### Deploy to Convex
```bash
# Deploy all functions and HTTP routes
pnpm deploy

# What this does:
# 1. Compiles TypeScript functions
# 2. Deploys to youthful-orca-358.convex.cloud
# 3. Updates HTTP routes at youthful-orca-358.convex.site
# 4. HTTP routes become accessible at api.consulatehq.com (via CNAME)
```

### Development Build
```bash
# One-time dev build (compiles without deploying)
pnpm deploy:dev
# OR
pnpm exec convex dev --once

# What this does:
# - Compiles TypeScript
# - Runs codegen for convex/_generated/
# - Does NOT deploy to cloud
# - Useful for: Pre-deployment validation, CI checks
```

### Watch Mode (Local Development)
```bash
# Start Convex dev server with hot reload
pnpm exec convex dev

# What this does:
# - Watches for file changes
# - Auto-compiles on save
# - Auto-deploys to dev environment
# - Shows logs in real-time
```

---

## 🔐 DNS Configuration

### Current Setup
```
api.consulatehq.com → CNAME → youthful-orca-358.convex.site
```

### How It Works
1. Payment platform makes request to `https://api.consulatehq.com/api/payment-disputes`
2. DNS resolves CNAME to `youthful-orca-358.convex.site`
3. Convex serves HTTP route defined in `convex/http.ts`
4. Response returned to client

### Future Production Setup (Recommended)
```
# Option 1: Separate Convex deployments
api.consulatehq.com → CNAME → production-deployment.convex.site
api-dev.consulatehq.com → CNAME → youthful-orca-358.convex.site

# Option 2: Keep single deployment (current)
api.consulatehq.com → CNAME → youthful-orca-358.convex.site
```

---

## 📊 URL Usage Matrix

| Scenario | Use This URL | Example |
|----------|-------------|---------|
| Convex client in code | `youthful-orca-358.convex.cloud` | `new ConvexHttpClient(CONVEX_URL)` |
| Testing with curl | `youthful-orca-358.convex.site` | `curl https://youthful-orca-358.convex.site/.well-known/mcp.json` |
| Production API calls | `api.consulatehq.com` | `fetch('https://api.consulatehq.com/api/payment-disputes')` |
| Running local tests | `youthful-orca-358.convex.cloud` | `pnpm test:run` |
| Running smoke tests | `youthful-orca-358.convex.site` | `API_BASE_URL=... pnpm test:smoke` |
| Documentation examples | `api.consulatehq.com` | Customer-facing docs use production URL |
| MCP agent integration | `api.consulatehq.com` | AI agents use production URL |

---

## ❓ FAQ

### Q: Why do we have two different URLs?
**A**: Convex separates internal SDK connections (`.convex.cloud`) from public HTTP routes (`.convex.site`). The SDK URL is for database operations, while HTTP routes are for REST APIs.

### Q: Should api.consulatehq.com point to HTTP actions or Convex API?
**A**: `api.consulatehq.com` correctly points to HTTP actions (`.convex.site`). There is no public endpoint for the Convex API URL - it's only used internally by the Convex SDK.

### Q: What's the equivalent name for the Convex API?
**A**: There isn't one for public use. The Convex API URL (`youthful-orca-358.convex.cloud`) is only used by:
- Your application's Convex client
- Test suite running database queries
- Internal Convex SDK operations

You would NOT create a CNAME like `convex-api.consulatehq.com` because external users never directly access the Convex API.

### Q: How do I test the MCP endpoint?
**A**: 
```bash
# Development
curl https://youthful-orca-358.convex.site/.well-known/mcp.json

# Production
curl https://api.consulatehq.com/.well-known/mcp.json
```

### Q: What if I get 404 on HTTP routes?
**A**: You're probably using the wrong domain. HTTP routes are NOT on `.convex.cloud`:
```bash
# ❌ WRONG - Returns 404
curl https://youthful-orca-358.convex.cloud/api/payment-disputes

# ✅ CORRECT
curl https://youthful-orca-358.convex.site/api/payment-disputes
```

---

## 🔧 Configuration Files

### Where URLs are defined:

**convex.json** - HTTP action URL mapping
```json
{
  "environment": {
    "variables": {
      "CONVEX_SITE_URL": {
        "development": "http://localhost:3000",
        "production": "https://api.consulatehq.com"
      }
    }
  }
}
```

**.env.local** - Convex SDK URL
```bash
CONVEX_URL=https://youthful-orca-358.convex.cloud
```

**package.json** - Test environment variables
```json
{
  "scripts": {
    "test:smoke": "API_BASE_URL=https://youthful-orca-358.convex.site bash scripts/run-smoke-tests.sh"
  }
}
```

---

## ✅ Verification Checklist

After deployment, verify all endpoints:

```bash
# 1. MCP Discovery
curl https://api.consulatehq.com/.well-known/mcp.json | jq '.tools | length'
# Expected: Number of MCP tools (should be 5+)

# 2. ADP Discovery
curl https://api.consulatehq.com/.well-known/adp | jq '.arbitrationService.name'
# Expected: "Consulate"

# 3. Health Check (if implemented)
curl https://api.consulatehq.com/health
# Expected: {"status": "ok"}

# 4. Convex Deployment Status
pnpm exec convex deployments
# Expected: Shows youthful-orca-358 deployment

# 5. Run Smoke Tests
API_BASE_URL=https://api.consulatehq.com pnpm test:smoke
# Expected: 13/13 tests passing
```

---

**For Next Inference Run**: 
- Use `api.consulatehq.com` for all production HTTP API references
- Use `youthful-orca-358.convex.site` for development HTTP testing
- Use `youthful-orca-358.convex.cloud` only for Convex SDK client
- Run `pnpm deploy` to deploy everything (functions + HTTP routes)
- Run `pnpm exec convex dev --once` for one-time build without deployment
