# API Authentication Audit - Production Endpoints

**Last Updated**: 2025-10-26  
**Production URL**: https://api.consulatehq.com  
**Production Deployment**: perceptive-lyrebird-89  
**Preview Deployment**: youthful-orca-358

---

## 🔒 Authentication Summary

### Total Endpoints: 24
- **Public (No Auth)**: 23 endpoints
- **Requires Auth**: 1 endpoint

---

## 🌐 Public Endpoints (No Authentication Required)

### Discovery & Health
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | API root/welcome |
| GET | `/health` | Health check |
| GET | `/version` | API version |
| GET | `/.well-known/mcp.json` | MCP tool discovery (for AI agents) |
| GET | `/.well-known/adp` | ADP service discovery |
| GET | `/.well-known/adp/neutrals` | List of arbitration neutrals |

### Payment Disputes
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/payment-disputes` | File a payment dispute | ❌ **PUBLIC** |
| GET | `/api/payment-disputes/stats` | Get dispute statistics | ❌ PUBLIC |
| GET | `/api/payment-disputes/review-queue` | Get review queue | ❌ PUBLIC |

**⚠️ SECURITY CONCERN**: Payment dispute filing is currently public. Should this require authentication?

### Evidence & Cases
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/evidence` | Submit evidence for case | ❌ PUBLIC |
| GET | `/cases/:caseId` | Get case details | ❌ PUBLIC |
| POST | `/disputes` | File a dispute (legacy) | ❌ PUBLIC |

### Agents
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/agents` | List all agents | ❌ PUBLIC |
| GET | `/agents/:did/reputation` | Get agent reputation | ❌ PUBLIC |
| GET | `/agents/top-reputation` | Get top-rated agents | ❌ PUBLIC |
| POST | `/agents/discover` | Discover agents by query | ❌ PUBLIC |
| POST | `/agents/capabilities` | Get agent capabilities | ❌ PUBLIC |

### Webhooks & Notifications
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/webhooks/register` | Register webhook | ❌ PUBLIC |
| GET | `/notifications/:agentDid` | Get agent notifications | ❌ PUBLIC |

### Monitoring (Deprecated for Payment Model)
| Method | Endpoint | Purpose | Auth | Status |
|--------|----------|---------|------|--------|
| POST | `/sla/report` | Submit SLA report | ❌ PUBLIC | ⚠️ DEPRECATED |
| GET | `/sla/status/:agentDid` | Get SLA status | ❌ PUBLIC | ⚠️ DEPRECATED |

### MCP
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/mcp/invoke` | Invoke MCP tool | ❌ PUBLIC |

### Live Feed
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/live/feed` | Live event feed | ❌ PUBLIC |

---

## 🔐 Authenticated Endpoints

### 1. Agent Registration
```
POST /agents/register
Authentication: Bearer API Key (csk_live_... or csk_test_...)
```

**Request**:
```bash
curl -X POST https://api.consulatehq.com/agents/register \
  -H "Authorization: Bearer csk_live_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-payment-agent",
    "functionalType": "payment_processor"
  }'
```

**Response**:
```json
{
  "success": true,
  "agentId": "...",
  "agentDid": "did:agent:org-name-123",
  "organizationName": "Your Org",
  "message": "Agent registered successfully"
}
```

**Error (Missing Auth)**:
```json
{
  "error": "Missing Authorization header",
  "hint": "Include 'Authorization: Bearer csk_live_...' header with your API key"
}
```

**How to Get API Key**:
1. Create organization in Consulate dashboard
2. Navigate to Settings → API Keys
3. Generate new API key (starts with `csk_live_` for production)

---

## 🚨 Security Concerns & Recommendations

### HIGH PRIORITY: Payment Dispute Filing Should Require Auth
**Current**: `POST /api/payment-disputes` is public  
**Risk**: Anyone can file disputes without authentication  
**Recommendation**: Require API key authentication

**Proposed Change**:
```typescript
// Add auth check to /api/payment-disputes
const authHeader = request.headers.get("Authorization");
if (!authHeader) {
  return new Response(JSON.stringify({ 
    error: "Missing Authorization header",
    hint: "Payment disputes require API key authentication"
  }), { status: 401, headers: corsHeaders });
}
```

### MEDIUM PRIORITY: Evidence Submission Should Require Auth
**Current**: `POST /evidence` is public  
**Risk**: Anyone can submit evidence to any case  
**Recommendation**: Require authentication and verify party is part of the case

### LOW PRIORITY: Consider Rate Limiting
**Current**: All public endpoints have no rate limiting  
**Recommendation**: Add rate limiting by IP or API key

---

## 📋 Authentication Methods Supported

### 1. API Key (Bearer Token)
**Format**: `Authorization: Bearer csk_live_...` or `csk_test_...`  
**Used By**: `/agents/register`  
**Prefix**: `csk_` (Consulate Secret Key)

### 2. DID Signature (Planned - Not Implemented)
**Format**: 
```
X-Agent-DID: did:agent:org-name-123
X-Signature: <Ed25519 signature>
X-Timestamp: <unix timestamp ms>
```
**Status**: ⚠️ **NOT IMPLEMENTED** (mentioned in MCP docs but not enforced)

---

## 🧪 Testing Authentication

### Test API Key Required Endpoint
```bash
# Without auth (should fail)
curl -X POST https://api.consulatehq.com/agents/register \
  -H "Content-Type: application/json" \
  -d '{"name": "test", "functionalType": "general"}'

# Expected: 401 with "Missing Authorization header"

# With auth (should succeed)
curl -X POST https://api.consulatehq.com/agents/register \
  -H "Authorization: Bearer csk_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "test", "functionalType": "general"}'

# Expected: 200 with agent details
```

### Test Public Endpoints
```bash
# Should work without auth
curl https://api.consulatehq.com/.well-known/mcp.json
curl https://api.consulatehq.com/health
curl https://api.consulatehq.com/agents
```

---

## 📊 Production vs Preview

### Production (perceptive-lyrebird-89)
- **URL**: https://api.consulatehq.com
- **Convex**: https://perceptive-lyrebird-89.convex.site
- **API Keys**: `csk_live_...` prefix
- **Data**: Production data (REAL disputes, REAL money)

### Preview (youthful-orca-358)
- **URL**: https://youthful-orca-358.convex.site
- **Convex**: https://youthful-orca-358.convex.cloud
- **API Keys**: `csk_test_...` prefix
- **Data**: Test data (mock disputes, no real money)

---

## ✅ Action Items

### Immediate (Security)
- [ ] Add authentication to `POST /api/payment-disputes`
- [ ] Add authentication to `POST /evidence`
- [ ] Add case party verification for evidence submission
- [ ] Remove or secure `/sla/*` deprecated endpoints

### Short Term (Monitoring)
- [ ] Add rate limiting to all public endpoints
- [ ] Add logging for all authentication attempts
- [ ] Add metrics for API key usage

### Long Term (Enhancement)
- [ ] Implement DID signature authentication
- [ ] Add OAuth2 support for dashboard integration
- [ ] Add webhook signature verification

---

**For Next Inference Run**:
1. Add authentication to payment dispute filing
2. Add authentication to evidence submission
3. Verify party authorization before allowing actions
4. Remove deprecated SLA endpoints
5. Test all changes against both preview and production
