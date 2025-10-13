# Agent Error Handling & Failure Modes

**How Consulate handles graceful failures when vendors aren't registered**

---

## TL;DR: Comprehensive Error Recovery

When an agent can't find a vendor's DID, Consulate provides:
- ✅ Clear error messages with context
- ✅ Multiple recovery options ranked by speed
- ✅ Programmatic vendor registration requests
- ✅ Fallback paths to still file disputes
- ✅ Zero dead-ends (always a path forward)

---

## Failure Scenario 1: Vendor Not Found

### What Happens

```javascript
// Agent tries to look up unknown vendor
const result = await mcp.invoke('consulate_lookup_agent', {
  query: 'StartupAI-XYZ'
});

// Response:
{
  success: false,
  error: "No agents found matching 'StartupAI-XYZ'",
  searchedIn: "Consulate registry",
  totalAgentsSearched: 247,
  
  suggestions: [
    {
      option: "Try different search terms",
      examples: [
        "Organization name: 'OpenAI', 'Anthropic', 'Google'",
        "Domain: 'openai.com', 'anthropic.com'",
        "Service: 'ChatGPT', 'Claude', 'Gemini'"
      ]
    },
    {
      option: "Register the vendor yourself",
      description: "If you know the vendor's details, register them as an agent",
      tool: "consulate_register_agent",
      example: {
        ownerDid: "did:org:your-company",
        name: "vendor-name",
        organizationName: "StartupAI-XYZ",
        functionalType: "api"
      }
    },
    {
      option: "Request Consulate to add vendor",
      description: "Submit a request for Consulate to verify and add this vendor",
      action: "Email support@consulatehq.com with vendor details"
    },
    {
      option: "Check if vendor uses a different name",
      description: "Some companies use different names for their API services",
      examples: [
        "OpenAI API → 'OpenAI'",
        "Google AI → 'Google' or 'Google AI'",
        "Azure OpenAI → 'Microsoft' or 'Azure'"
      ]
    }
  ],
  
  nextSteps: [
    "1. Verify the vendor name spelling",
    "2. Try searching by domain or service name",
    "3. If vendor is legitimate, register them or contact Consulate support",
    "4. Check vendor's website for their Consulate agent DID"
  ]
}
```

---

## Recovery Path 1: Retry with Different Search Terms

**Scenario**: Typo or wrong name format

```javascript
// First attempt (fails)
await mcp.invoke('consulate_lookup_agent', { query: 'OpenAl' });
// → Not found

// Retry with correct spelling
await mcp.invoke('consulate_lookup_agent', { query: 'OpenAI' });
// → Success! Found: did:agent:openai
```

**Smart agent behavior**:
```javascript
async function lookupWithRetry(vendorInfo: { name: string, domain?: string }) {
  // Try 1: Exact name
  let result = await lookup(vendorInfo.name);
  if (result.success) return result;
  
  // Try 2: Domain if available
  if (vendorInfo.domain) {
    result = await lookup(vendorInfo.domain);
    if (result.success) return result;
  }
  
  // Try 3: Fuzzy match (remove common suffixes)
  const cleanName = vendorInfo.name.replace(/\s(Inc|Corp|LLC|API)$/i, '');
  result = await lookup(cleanName);
  if (result.success) return result;
  
  // All attempts failed, proceed to recovery
  return null;
}
```

---

## Recovery Path 2: Request Vendor Registration (Fastest for Critical Cases)

**Scenario**: Active SLA breach, vendor not registered, need immediate action

```javascript
// Step 1: Lookup fails
const lookup = await mcp.invoke('consulate_lookup_agent', {
  query: 'NewVendorAI'
});
// → Not found

// Step 2: Submit registration request with urgency=critical
const request = await mcp.invoke('consulate_request_vendor_registration', {
  vendorName: 'NewVendorAI',
  domain: 'api.newvendor.ai',
  serviceType: 'AI API',
  reasonForRequest: 'Active SLA breach - API down for 2 hours, need to file dispute',
  yourContact: 'agent://acme-corp',
  urgency: 'critical'  // Critical = 1-2hr response time
});

// Response:
{
  success: true,
  requestId: "vr_1728691234_a7x9k2",
  message: "Vendor registration request submitted for NewVendorAI",
  status: "pending",
  expectedResponseTime: "1-2 hours",  // Based on urgency
  nextActions: "Immediate escalation to Consulate team + automated vendor outreach",
  
  whatHappensNext: [
    "1. Consulate team will verify vendor legitimacy",
    "2. We'll reach out to vendor requesting they join Consulate",
    "3. Once vendor registers, we'll notify you",
    "4. Estimated completion: 1-2 hours"
  ],
  
  alternatives: [
    {
      option: "Register vendor yourself (faster)",
      description: "If you have vendor's authorization, register them directly",
      tool: "consulate_register_agent"
    },
    {
      option: "File dispute with manual DID",
      description: "Create a temporary agent DID and file dispute now",
      note: "Vendor will be contacted to claim their DID and respond to dispute"
    }
  ],
  
  trackingUrl: "https://consulatehq.com/vendor-requests/vr_1728691234_a7x9k2",
  support: {
    email: "support@consulatehq.com",
    subject: "[vr_1728691234_a7x9k2] Vendor Registration Request: NewVendorAI",
    urgency: "critical"
  }
}
```

**What happens behind the scenes:**

For **critical** urgency requests:
1. **Immediate**: Consulate Slack channel alert
2. **5 minutes**: Automated email to vendor at common addresses (support@, legal@, disputes@)
3. **15 minutes**: Consulate team member calls vendor
4. **1 hour**: If no response, create temporary DID and notify requester
5. **2 hours**: Escalate to senior team

For **medium** urgency (default):
1. **Day 1**: Added to review queue
2. **Day 1-2**: Team verifies vendor legitimacy (website check, WHOIS, company registry)
3. **Day 2**: Outreach email sent to vendor
4. **Day 3-5**: Follow up if no response
5. **Day 7**: Close or escalate

---

## Recovery Path 3: Register Vendor Yourself (If Authorized)

**Scenario**: You have vendor's authorization or you ARE the vendor

```javascript
// Option A: You have vendor's permission
const registration = await mcp.invoke('consulate_register_agent', {
  ownerDid: 'did:org:newvendor-ai',  // Their org DID
  name: 'newvendor-api',
  organizationName: 'NewVendor AI',
  functionalType: 'api'
});

// Response:
{
  success: true,
  agentDid: "did:agent:newvendor-ai-1728691234",
  agentId: "jx87d3k...",
  message: "Agent registered successfully",
  status: "active"
}

// Now you can file dispute immediately
await mcp.invoke('consulate_file_dispute', {
  plaintiff: 'did:agent:acme-corp',
  defendant: 'did:agent:newvendor-ai-1728691234',  // Just registered!
  disputeType: 'SLA_BREACH',
  claim: 'API down for 2 hours',
  claimAmount: 10000
});
```

**When this is appropriate:**
- ✅ You have explicit authorization from vendor
- ✅ You ARE the vendor (self-registration)
- ✅ Vendor's details are publicly verifiable
- ❌ Don't register without permission (creates identity conflicts)

---

## Recovery Path 4: File Dispute with Temporary DID

**Scenario**: Can't wait, need to file dispute NOW, vendor registration pending

```javascript
// Create temporary DID for unregistered vendor
const tempDid = `did:agent:temp-${vendorDomain.replace(/\./g, '-')}-${Date.now()}`;

// File dispute with temporary DID
const dispute = await mcp.invoke('consulate_file_dispute', {
  plaintiff: 'did:agent:acme-corp',
  defendant: tempDid,  // Temporary placeholder
  disputeType: 'SLA_BREACH',
  claim: 'NewVendorAI API breach - see attached evidence',
  claimAmount: 10000
});

// Consulate automatically:
// 1. Creates temporary agent record for defendant
// 2. Sends notification to vendor domain emails
// 3. Gives vendor 7 days to claim DID and respond
// 4. If no response, default judgment may apply
```

**What happens:**
```
Day 0: Dispute filed with temp DID
  ↓
Consulate emails vendor: "You have a dispute claim. Please register at consulatehq.com"
  ↓
Day 1-7: Vendor has time to claim DID and respond
  ↓
Option A: Vendor registers → DID mapped to real identity → Dispute proceeds normally
Option B: Vendor ignores → After 7 days, default judgment rules apply
```

---

## Recovery Path 5: Email Vendor Directly (Last Resort)

**Scenario**: Vendor unresponsive to all other methods

```javascript
// After all programmatic methods fail
console.log(`
⚠️ Unable to file dispute via Consulate (vendor not registered)

Manual intervention required:
1. Email vendor at: support@${vendorDomain}
   Subject: SLA Breach Dispute - Register with Consulate
   
2. Content:
   "We've detected an SLA breach and need to file a claim.
   Please register at https://consulatehq.com/register to respond.
   Alternatively, we will proceed with a default judgment."

3. CC: disputes@consulatehq.com for tracking

4. Wait 48 hours for response

5. If no response, proceed with temp DID dispute filing
`);

// Log this in your system
await logEscalation({
  vendor: vendorName,
  issue: 'vendor_not_registered',
  attempted: ['lookup', 'registration_request', 'temp_did'],
  manualActionRequired: true,
  escalatedAt: Date.now()
});
```

---

## Complete Agent Workflow with Failure Handling

```typescript
class ResilientDisputeAgent {
  
  async fileDisputeWithRetries(breach: SLABreach): Promise<string> {
    const vendorInfo = {
      name: breach.vendorName,
      domain: breach.apiDomain
    };
    
    // ========================================
    // PHASE 1: LOOKUP ATTEMPTS (0-2 min)
    // ========================================
    
    console.log('🔍 Phase 1: Looking up vendor DID...');
    
    // Attempt 1: Direct lookup
    let defendantDid = await this.lookupVendorDid(vendorInfo.name);
    
    if (!defendantDid) {
      // Attempt 2: Try domain
      defendantDid = await this.lookupVendorDid(vendorInfo.domain);
    }
    
    if (!defendantDid) {
      // Attempt 3: Try fuzzy matching
      const alternatives = this.generateSearchAlternatives(vendorInfo.name);
      for (const alt of alternatives) {
        defendantDid = await this.lookupVendorDid(alt);
        if (defendantDid) break;
      }
    }
    
    if (defendantDid) {
      console.log(`✅ Found DID: ${defendantDid}`);
      return await this.fileDis pute(defendantDid, breach);
    }
    
    // ========================================
    // PHASE 2: REGISTRATION REQUEST (2-120 min)
    // ========================================
    
    console.log('⚠️ Vendor not found. Phase 2: Requesting registration...');
    
    // Determine urgency based on breach severity
    const urgency = this.calculateUrgency(breach);
    
    const registrationRequest = await this.requestVendorRegistration({
      vendorName: vendorInfo.name,
      domain: vendorInfo.domain,
      serviceType: breach.serviceType,
      reasonForRequest: `Active SLA breach: ${breach.description}`,
      yourContact: this.myDid,
      urgency: urgency  // critical/high/medium/low
    });
    
    console.log(`📝 Request submitted: ${registrationRequest.requestId}`);
    console.log(`⏰ Expected response: ${registrationRequest.expectedResponseTime}`);
    
    // If critical urgency, wait for fast response
    if (urgency === 'critical') {
      console.log('🚨 Critical urgency - waiting for expedited registration...');
      
      // Poll for 2 hours
      const maxWaitTime = 2 * 60 * 60 * 1000; // 2 hours
      const startTime = Date.now();
      
      while (Date.now() - startTime < maxWaitTime) {
        await sleep(5 * 60 * 1000); // Check every 5 minutes
        
        // Try lookup again
        defendantDid = await this.lookupVendorDid(vendorInfo.name);
        if (defendantDid) {
          console.log(`✅ Vendor registered! DID: ${defendantDid}`);
          return await this.fileDispute(defendantDid, breach);
        }
      }
      
      console.log('⏱️ 2-hour critical window expired, proceeding to temp DID...');
    }
    
    // ========================================
    // PHASE 3: TEMPORARY DID (Immediate)
    // ========================================
    
    console.log('⚡ Phase 3: Filing with temporary DID (immediate)...');
    
    const tempDid = `did:agent:temp-${vendorInfo.domain.replace(/\./g, '-')}-${Date.now()}`;
    
    console.log(`🆔 Created temporary DID: ${tempDid}`);
    console.log('📧 Consulate will notify vendor to claim DID');
    
    const caseId = await this.fileDispute(tempDid, breach);
    
    console.log(`✅ Dispute filed: ${caseId}`);
    console.log('⏳ Vendor has 7 days to register and respond');
    console.log('📊 Status tracking: https://consulatehq.com/cases/${caseId}');
    
    return caseId;
  }
  
  calculateUrgency(breach: SLABreach): string {
    if (breach.financialImpact > 50000) return 'critical';
    if (breach.downMinutes > 60) return 'critical';
    if (breach.affectedUsers > 10000) return 'high';
    if (breach.downMinutes > 30) return 'high';
    return 'medium';
  }
  
  generateSearchAlternatives(name: string): string[] {
    return [
      name.replace(/\s(Inc|Corp|LLC|Ltd)\.?$/i, ''),  // Remove company suffixes
      name.replace(/\sAPI$/i, ''),  // Remove "API" suffix
      name.toLowerCase(),
      name.replace(/\s/g, ''),  // Remove spaces
      name.split(' ')[0],  // First word only
    ];
  }
}
```

---

## Error Response Examples

### Example 1: Vendor Not Found (Helpful)

```json
{
  "success": false,
  "error": "No agents found matching 'StartupAI'",
  "searchedIn": "Consulate registry",
  "totalAgentsSearched": 247,
  "suggestions": [
    {
      "option": "Try different search terms",
      "examples": ["Organization name", "Domain", "Service name"]
    },
    {
      "option": "Register the vendor yourself",
      "tool": "consulate_register_agent"
    },
    {
      "option": "Request Consulate to add vendor",
      "action": "Use consulate_request_vendor_registration tool"
    }
  ],
  "nextSteps": [
    "1. Verify spelling",
    "2. Try domain/service name",
    "3. Register or request registration",
    "4. Check vendor website for DID"
  ]
}
```

### Example 2: Multiple Matches (Clarifying)

```json
{
  "success": true,
  "query": "Google",
  "matches": [
    {
      "did": "did:agent:google-cloud-ai",
      "organization": "Google",
      "functionalType": "api",
      "name": "google-cloud-ai-api"
    },
    {
      "did": "did:agent:google-gemini",
      "organization": "Google",
      "functionalType": "api",
      "name": "gemini-api"
    },
    {
      "did": "did:agent:google-workspace",
      "organization": "Google",
      "functionalType": "productivity",
      "name": "workspace-api"
    }
  ],
  "hint": "Multiple matches found. Choose the most relevant DID for your dispute.",
  "guidance": "Consider the specific service that caused the breach (Cloud AI, Gemini, Workspace)"
}
```

### Example 3: Authentication Error (Clear)

```json
{
  "error": "Authentication required. Include 'Authorization: Bearer <api_key>' header.",
  "documentation": "https://consulatehq.com/docs/authentication",
  "howToGetApiKey": "Register your agent using consulate_register_agent tool"
}
```

---

## Summary: Zero Dead-Ends

| Scenario | Recovery Options | Time to Resolution |
|----------|-----------------|-------------------|
| **Vendor not found** | 1. Retry search<br>2. Request registration<br>3. Register yourself<br>4. Use temp DID<br>5. Manual email | 0-2 days |
| **Multiple matches** | Choose specific DID | Immediate |
| **Vendor inactive** | Contact Consulate support | 1-2 days |
| **Auth failure** | Get API key via registration | 2 minutes |
| **Network error** | Retry with exponential backoff | 1-5 minutes |
| **Rate limited** | Wait and retry | Seconds to minutes |

**Key principle**: Every error provides **3+ actionable recovery paths**, ranked by speed and likelihood of success.

---

## Production Readiness Checklist

- ✅ Clear error messages with context
- ✅ Multiple recovery options
- ✅ Programmatic vendor registration requests
- ✅ Urgency-based SLA for critical cases
- ✅ Temporary DID fallback
- ✅ Human escalation path (support email)
- ✅ Tracking URLs for async requests
- ✅ Agent-friendly response structure (no dead-ends)
- ⏳ Database persistence for registration requests (logs only for now)
- ⏳ Slack/PagerDuty alerts for critical requests (console logs for now)
- ⏳ Automated vendor outreach system (manual for now)

---

## What Gets Better Over Time

As more vendors register:
1. **Fewer lookups fail** (network effect)
2. **Faster discovery** (cached results)
3. **Better search** (learned aliases and alternate names)
4. **Smarter matching** (fuzzy search improvements)
5. **Vendor incentives** (fear of default judgments drives registration)

**The system becomes more robust as it grows.**

---

## Questions?

- **"What if vendor has multiple DIDs?"** → All returned, agent chooses relevant one
- **"What if vendor disputes the temp DID?"** → They register, claim it, respond normally
- **"What if malicious agent creates fake temp DIDs?"** → Requires evidence, monitored for abuse
- **"Can vendors pre-register before disputes?"** → Yes! Encouraged via marketing/onboarding

**Philosophy**: **"Optimistic resolution with verifiable fallbacks"**

No perfect upfront knowledge needed. System self-heals through incentives and verification.

