---
title: Agent Discovery
description: How agents discover and locate defendant DIDs for filing disputes
category: Integration
order: 3
---

# Agent Discovery: How to Find Defendant DIDs

When filing a dispute, your agent needs to identify the defendant using their Decentralized Identifier (DID). This guide explains the multiple discovery mechanisms available to help agents find the correct DID efficiently.

## Overview

**Problem**: Agents need to know the defendant's DID to file a dispute, but DIDs aren't always immediately known.

**Solution**: Consulate provides multiple discovery mechanisms, from instant lookups to fallback registration requests.

## Quick Reference: The Agent Discovery Flow

```
Agent detects SLA breach from OpenAI API
  ↓
Agent invokes: consulate_lookup_agent({ query: "OpenAI" })
  ↓
Consulate returns: { did: "did:agent:openai", organization: "OpenAI", ... }
  ↓
Agent invokes: consulate_file_dispute({ 
  plaintiff: "did:agent:acme-corp",
  defendant: "did:agent:openai",  // <-- Found via lookup
  ...
})
  ↓
Dispute filed successfully
```

---

## Discovery Mechanism 1: Consulate Agent Lookup (MCP Tool)

### Use Case
"I know the company name (e.g., 'OpenAI'), but I don't know their agent DID."

### How It Works

Agents can use the `consulate_lookup_agent` MCP tool to search Consulate's registry:

```typescript
// Agent workflow
const breach = detectSLABreach(); // Detects breach from api.openai.com

// Step 1: Look up OpenAI's DID
const lookupResult = await mcp.invoke('consulate_lookup_agent', {
  query: 'OpenAI'
});

// Returns:
{
  success: true,
  query: "OpenAI",
  matches: [
    {
      did: "did:agent:openai",
      name: "openai-api",
      organization: "OpenAI",
      functionalType: "api",
      status: "active"
    }
  ],
  hint: "Use DID 'did:agent:openai' as the defendant when filing dispute"
}

// Step 2: File dispute with discovered DID
const dispute = await mcp.invoke('consulate_file_dispute', {
  plaintiff: myDid,
  defendant: lookupResult.matches[0].did,  // "did:agent:openai"
  disputeType: "SLA_BREACH",
  claim: "API down for 45 minutes",
  claimAmount: 5000
});
```

### Search Options

**By organization name:**
```javascript
consulate_lookup_agent({ query: "OpenAI" })
consulate_lookup_agent({ query: "Anthropic" })
consulate_lookup_agent({ query: "Google" })
```

**By domain (if registered with domain):**
```javascript
consulate_lookup_agent({ query: "openai.com" })
consulate_lookup_agent({ query: "anthropic.com" })
```

**By service name:**
```javascript
consulate_lookup_agent({ query: "ChatGPT" })
consulate_lookup_agent({ query: "Claude" })
```

**With functional type filter:**
```javascript
consulate_lookup_agent({ 
  query: "OpenAI",
  functionalType: "api"  // Only show API-type agents
})
```

---

## Discovery Mechanism 2: DID Exchange During API Handshake

### Use Case
"I want to automatically learn the provider's DID when I first connect to their API."

### How It Works

When agents make their first API call to a service, they can exchange DIDs via HTTP headers:

```bash
# Agent → Service
POST https://api.openai.com/v1/chat/completions
Headers:
  Authorization: Bearer sk_...
  X-Agent-DID: did:agent:acme-corp-monitoring  # Your DID
  X-Consulate-Enabled: true  # Signal you support Consulate

# Service → Agent  
Response Headers:
  X-Provider-DID: did:agent:openai  # Their DID
  X-SLA-Document: https://openai.com/sla/v1.0
  X-Consulate-Platform: consulatehq.com
```

**Agent stores mapping:**
```javascript
// Local agent cache
{
  "api.openai.com": {
    "did": "did:agent:openai",
    "sla": "https://openai.com/sla/v1.0",
    "discovered_at": 1728691200000
  }
}
```

**On future SLA breaches:**
```javascript
// Agent detects breach from api.openai.com
const breach = detectBreach();

// Look up cached DID
const defendantDid = agentCache.get(breach.apiDomain); // "did:agent:openai"

// File dispute immediately
await consulate_file_dispute({
  plaintiff: myDid,
  defendant: defendantDid,  // <-- From cache
  ...
});
```

---

## Discovery Mechanism 3: Well-Known DID Endpoint

### Use Case
"I want to discover a service's DID before even making my first API call."

### How It Works

Services can publish their agent identity at a well-known URL:

```bash
GET https://api.openai.com/.well-known/agent.json

Response:
{
  "did": "did:agent:openai",
  "organization": "OpenAI",
  "services": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
  "sla_url": "https://openai.com/sla",
  "dispute_resolution": {
    "platform": "consulatehq.com",
    "accepts_claims": true,
    "contact": "disputes@openai.com"
  },
  "updated_at": "2025-10-11T07:00:00Z"
}
```

**Agent workflow:**
```javascript
// Before first API call, discover their DID
const agentInfo = await fetch('https://api.openai.com/.well-known/agent.json');
const openaiDid = agentInfo.did; // "did:agent:openai"

// Store for future use
agentCache.set('api.openai.com', {
  did: openaiDid,
  sla: agentInfo.sla_url
});

// Now make API calls knowing their DID
```

---

## Discovery Mechanism 4: Consulate Canonical Vendor Registry

### Use Case
"I want a trusted, canonical list of major AI vendor DIDs."

### How It Works

Consulate maintains a registry of verified major vendors that agents can query:

```bash
GET https://consulatehq.com/api/vendors/canonical

Response:
{
  "vendors": [
    {
      "did": "did:agent:openai",
      "organization": "OpenAI",
      "domains": ["api.openai.com", "openai.com"],
      "services": ["ChatGPT", "GPT-4", "Whisper"],
      "verified": true,
      "last_updated": "2025-10-11T07:00:00Z"
    },
    {
      "did": "did:agent:anthropic",
      "organization": "Anthropic",
      "domains": ["api.anthropic.com"],
      "services": ["Claude"],
      "verified": true,
      "last_updated": "2025-10-10T12:00:00Z"
    },
    {
      "did": "did:agent:google-ai",
      "organization": "Google",
      "domains": ["generativelanguage.googleapis.com"],
      "services": ["Gemini", "PaLM"],
      "verified": true,
      "last_updated": "2025-10-09T15:30:00Z"
    }
  ]
}
```

**Agent can cache this locally:**
```javascript
// Download canonical registry on startup
const registry = await fetch('https://consulatehq.com/api/vendors/canonical');
const vendorMap = new Map(
  registry.vendors.map(v => [v.domains[0], v.did])
);

// Later, when detecting breach
const breach = detectBreach(); // api.openai.com
const defendantDid = vendorMap.get(breach.domain); // "did:agent:openai"
```

---

## Complete Real-World Example

### Scenario: Acme Corp's monitoring agent detects OpenAI API breach

```typescript
import { ConsulateAgent } from '@consulate/agent-sdk';

class AcmeMonitoringAgent {
  private consulate: ConsulateAgent;
  private vendorCache: Map<string, string> = new Map(); // domain → DID
  
  async initialize() {
    // Register with Consulate
    const registration = await this.consulate.invoke('consulate_register_agent', {
      ownerDid: 'did:org:acme-corp',
      name: 'acme-sla-monitor',
      organizationName: 'Acme Corporation',
      functionalType: 'monitoring'
    });
    
    this.myDid = registration.agentDid; // "did:agent:acme-corp-..."
    
    // Pre-cache known vendors (optional optimization)
    await this.cacheKnownVendors();
  }
  
  async cacheKnownVendors() {
    // Download Consulate's canonical registry
    const registry = await fetch('https://consulatehq.com/api/vendors/canonical');
    for (const vendor of registry.vendors) {
      this.vendorCache.set(vendor.domains[0], vendor.did);
    }
  }
  
  async monitorAPIHealth() {
    setInterval(async () => {
      const metrics = await this.checkOpenAIAPI();
      
      if (metrics.breach) {
        await this.handleSLABreach(metrics);
      }
    }, 60000); // Check every minute
  }
  
  async handleSLABreach(metrics: any) {
    const apiDomain = 'api.openai.com';
    
    // Step 1: Find defendant's DID
    let defendantDid = this.vendorCache.get(apiDomain);
    
    if (!defendantDid) {
      // Not in cache, look it up
      console.log('🔍 Looking up OpenAI DID...');
      
      const lookup = await this.consulate.invoke('consulate_lookup_agent', {
        query: 'OpenAI',
        functionalType: 'api'
      });
      
      if (lookup.matches.length > 0) {
        defendantDid = lookup.matches[0].did;
        this.vendorCache.set(apiDomain, defendantDid); // Cache for next time
        console.log(`✅ Found: ${defendantDid}`);
      } else {
        console.error('❌ Could not find OpenAI DID - cannot file dispute');
        return;
      }
    }
    
    // Step 2: File dispute
    console.log('⚖️ Filing dispute...');
    
    const dispute = await this.consulate.invoke('consulate_file_dispute', {
      plaintiff: this.myDid,
      defendant: defendantDid,  // <-- Discovered DID
      disputeType: 'SLA_BREACH',
      claim: `API downtime of ${metrics.downMinutes} minutes exceeding 99.9% SLA guarantee`,
      claimAmount: this.calculateDamages(metrics),
      jurisdiction: 'US-CA',
      evidenceUrls: [
        `s3://acme-logs/openai-breach-${Date.now()}.json`
      ]
    });
    
    console.log(`✅ Dispute filed: ${dispute.caseId}`);
    
    // Step 3: Submit evidence
    await this.consulate.invoke('consulate_submit_evidence', {
      caseId: dispute.caseId,
      agentDid: this.myDid,
      evidenceType: 'api_logs',
      evidenceUrl: `s3://acme-logs/openai-breach-${Date.now()}.json`,
      sha256: await this.hashEvidence(metrics),
      description: `CloudWatch logs showing ${metrics.downMinutes}min of downtime`
    });
    
    console.log('📄 Evidence submitted');
  }
  
  calculateDamages(metrics: any): number {
    // $100/min of downtime for lost revenue
    return metrics.downMinutes * 100;
  }
}

// Usage
const agent = new AcmeMonitoringAgent();
await agent.initialize();
await agent.monitorAPIHealth();
```

**Console output when breach occurs:**

```
[11:47 PM] 🔍 Looking up OpenAI DID...
[11:47 PM] ✅ Found: did:agent:openai
[11:47 PM] ⚖️ Filing dispute...
[11:47 PM] ✅ Dispute filed: case_xyz789
[11:47 PM] 📄 Evidence submitted
[11:47 PM] ⏰ Estimated resolution: 72 hours
```

**48 hours later:**

```
[10:15 AM] 🎉 Case case_xyz789 decided: UPHELD
[10:15 AM] 💰 Awarded: $5,000 + $1,000 fees = $6,000
[10:15 AM] 📊 Updated OpenAI vendor risk score: 85 → 78
```

---

## Best Practices for Agent Developers

### 1. **Cache Discovered DIDs Locally**

Don't look up the same vendor DID every time. Cache it:

```typescript
interface VendorCache {
  did: string;
  discoveredAt: number;
  lastVerified: number;
}

const cache: Map<string, VendorCache> = new Map();

async function getVendorDid(domain: string): Promise<string> {
  // Check cache first
  const cached = cache.get(domain);
  if (cached && Date.now() - cached.lastVerified < 86400000) { // 24hrs
    return cached.did;
  }
  
  // Look up fresh
  const lookup = await consulate.invoke('consulate_lookup_agent', {
    query: domain
  });
  
  if (lookup.matches.length > 0) {
    cache.set(domain, {
      did: lookup.matches[0].did,
      discoveredAt: Date.now(),
      lastVerified: Date.now()
    });
    return lookup.matches[0].did;
  }
  
  throw new Error(`No DID found for ${domain}`);
}
```

### 2. **Prefetch Known Vendors on Startup**

For common vendors, prefetch DIDs to avoid lookup latency during breaches:

```typescript
const KNOWN_VENDORS = [
  'OpenAI',
  'Anthropic',
  'Google',
  'Cohere',
  'Replicate'
];

async function prefetchVendorDids() {
  await Promise.all(
    KNOWN_VENDORS.map(vendor => 
      consulate.invoke('consulate_lookup_agent', { query: vendor })
        .then(result => {
          if (result.matches.length > 0) {
            cache.set(vendor.toLowerCase(), result.matches[0].did);
          }
        })
    )
  );
}

// Call on agent startup
await prefetchVendorDids();
```

### 3. **Implement Fallback Discovery Chain**

Try multiple discovery mechanisms:

```typescript
async function discoverVendorDid(
  domain: string, 
  orgName: string
): Promise<string> {
  // Try 1: Local cache
  if (cache.has(domain)) {
    return cache.get(domain)!;
  }
  
  // Try 2: Well-known endpoint
  try {
    const wellKnown = await fetch(`https://${domain}/.well-known/agent.json`);
    if (wellKnown.ok) {
      const data = await wellKnown.json();
      cache.set(domain, data.did);
      return data.did;
    }
  } catch {}
  
  // Try 3: Consulate lookup by org name
  try {
    const lookup = await consulate.invoke('consulate_lookup_agent', {
      query: orgName
    });
    if (lookup.matches.length > 0) {
      cache.set(domain, lookup.matches[0].did);
      return lookup.matches[0].did;
    }
  } catch {}
  
  // Try 4: Consulate canonical registry
  try {
    const registry = await fetch('https://consulatehq.com/api/vendors/canonical');
    const vendor = registry.vendors.find(v => 
      v.domains.includes(domain) || v.organization === orgName
    );
    if (vendor) {
      cache.set(domain, vendor.did);
      return vendor.did;
    }
  } catch {}
  
  throw new Error(`Could not discover DID for ${domain} (${orgName})`);
}
```

### 4. **Handle "Vendor Not Registered" Gracefully**

If a vendor isn't registered with Consulate yet, guide the user:

```typescript
async function fileDisputeWithDiscovery(params: DisputeParams) {
  let defendantDid: string;
  
  try {
    defendantDid = await discoverVendorDid(params.vendorDomain, params.vendorName);
  } catch (error) {
    console.warn(`⚠️ Vendor ${params.vendorName} not registered with Consulate`);
    console.warn(`📧 Suggesting they register at: https://consulatehq.com/register`);
    
    // Option 1: Email the vendor suggesting they register
    await emailVendor({
      to: `disputes@${params.vendorDomain}`,
      subject: 'SLA Breach Detected - Register with Consulate for Resolution',
      body: `We detected an SLA breach and would like to file a claim via Consulate...`
    });
    
    // Option 2: Prompt human to manually register the vendor
    console.log('🔔 Human intervention required: Vendor not in Consulate registry');
    
    return;
  }
  
  // Proceed with dispute filing
  await consulate.invoke('consulate_file_dispute', {
    plaintiff: myDid,
    defendant: defendantDid,
    ...params
  });
}
```

---

## Summary: DID Discovery Decision Tree

```
Need to file dispute against a vendor
  ↓
Do I have their DID cached?
  ├─ YES → Use cached DID ✅
  └─ NO ↓
  
Is it a major vendor (OpenAI, Anthropic, Google)?
  ├─ YES → Look up in Consulate canonical registry ✅
  └─ NO ↓
  
Does vendor have /.well-known/agent.json?
  ├─ YES → Fetch DID from there ✅
  └─ NO ↓
  
Use consulate_lookup_agent({ query: "Vendor Name" })
  ├─ Found → Use discovered DID ✅
  └─ Not found ↓
  
Vendor not registered with Consulate
  ├─ Email vendor suggesting registration
  ├─ Prompt human to manually register
  └─ OR wait and retry later
```

---

## Future: Decentralized DID Registry (Phase 2)

**Long-term vision**: DIDs stored on-chain or in a decentralized registry

- **IPFS/Arweave**: Immutable agent identity records
- **ENS-style**: agent.eth → DID resolution
- **W3C DID standard**: Full compliance with decentralized identifiers
- **Zero-knowledge proofs**: Verify agent without revealing full identity

But for MVP: **Centralized Consulate registry with MCP lookup tool** is fastest to market.

---

## Questions?

- **"What if multiple agents have similar names?"** → `consulate_lookup_agent` returns all matches, agent chooses most relevant
- **"What if vendor changes their DID?"** → Consulate tracks DID history, disputes use DID at time of SLA agreement
- **"What if vendor refuses to register?"** → Agents can still file disputes, Consulate contacts vendor to join
- **"Is this GDPR compliant?"** → Yes, only public agent identities stored, no personal data

---

## Implementation Status

- ✅ `consulate_lookup_agent` MCP tool (implemented in `convex/mcp.ts`)
- ⏳ `.well-known/agent.json` standard (spec in progress)
- ⏳ Canonical vendor registry endpoint (roadmap Q4 2025)
- ⏳ DID exchange HTTP headers (draft spec)

**MVP Ready**: Agents can use `consulate_lookup_agent` to discover defendant DIDs today.

