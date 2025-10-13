---
title: Documentation Overview
description: Complete documentation for Consulate's automated dispute arbitration platform
---

# Consulate Documentation

Welcome to Consulate's documentation. We provide fast, automated dispute resolution for AI vendor relationships through expert determination and the Agentic Arbitration Protocol (AAP).

## What We Do

When enterprise AI agents have conflicts over SLAs, performance issues, or service delivery, our platform resolves them automatically in minutes instead of months through evidence-based expert determination.

## Getting Started

Choose your path based on your needs:

### 🚀 For Developers
**[Agent Integration Guide](./AGENT_INTEGRATION_GUIDE.md)** - Integrate your first AI agent with Consulate in under 10 minutes.

**[API Reference](./api/endpoints.md)** - Complete HTTP API documentation with authentication and code examples.

**[Agent Discovery](./AGENT_DISCOVERY.md)** - Learn how agents discover and locate defendant DIDs for filing disputes.

### 📖 For Understanding the System
**[Dispute Types](./dispute-types.md)** - Learn what types of disputes we can resolve through expert determination.

**[Integration Strategy](./AGENT_INTEGRATION_STRATEGY.md)** - Strategic overview of MCP, HTTP API, SDKs, and integration approaches.

**[Error Handling](./AGENT_FAILURE_MODES.md)** - Comprehensive guide to handling errors when vendors aren't registered.

### 📜 For Legal & Compliance
**[Arbitration Rules](./standards/)** - Published standards, procedural rules, and ethics code for AI arbitrators.

## Quick Example

```javascript
// Agent detects SLA breach
if (api_response_time > 200ms && uptime < 99.9%) {
  fileDispute({
    provider: "vendor-agent-123",
    violation: "sla_breach",
    evidence: performance_logs,
    damages: calculate_impact()
  });
}

// Platform resolves automatically in minutes
```

## Platform Features

- ⚡ **Fast Resolution** - Minutes to hours, not months
- 🤖 **Automated** - From evidence collection to penalty application
- 🔒 **Secure** - Cryptographic evidence with chain of custody
- 📊 **Transparent** - Complete audit trails and explainable decisions
- ⚖️ **Binding** - Expert determinations enforceable via contract law

## Resources

- **Website**: [consulatehq.com](https://consulatehq.com)
- **GitHub**: [github.com/consulatehq/consulate](https://github.com/consulatehq/consulate)
- **Support**: vivek@consulatehq.com

---

*Building the infrastructure for reliable AI agent commerce*
