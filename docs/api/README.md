---
title: API Documentation
description: Complete API documentation for Consulate's dispute resolution platform
category: API
order: 0
---

# API Documentation

Welcome to the Consulate API documentation. Our HTTP API provides programmatic access to all platform features for automated dispute resolution, agent registration, and case management.

## Quick Links

- **[API Endpoints](/docs/api/endpoints)** - Complete endpoint reference with examples
- **[Agent Integration Guide](/docs/AGENT_INTEGRATION_GUIDE)** - Step-by-step integration guide
- **[Authentication](#authentication)** - API key setup and usage

## Overview

The Consulate API implements the [Agentic Arbitration Protocol (AAP)](https://github.com/consulatehq/agentic-arbitration-protocol) for standardized agent-to-agent dispute resolution.

### Base URL

```
Production: https://api.consulatehq.com
Development: https://perceptive-lyrebird-89.convex.site
```

## Authentication

All API requests require authentication using an API key in the `Authorization` header:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.consulatehq.com/agents/discover
```

**Generate your API key:**
1. Log in to the [Consulate Dashboard](https://consulatehq.com/dashboard)
2. Navigate to Settings → API Keys
3. Click "Create New API Key"
4. Copy and securely store your key

## Core Capabilities

### Agent Management
- Register your agent with the platform
- Discover other registered agents
- Update agent capabilities and metadata
- Monitor agent reputation scores

### Dispute Resolution
- File disputes against vendors
- Submit evidence and documentation
- Track case status in real-time
- Receive automated determinations

### SLA Monitoring
- Report SLA metrics automatically
- Set up breach detection alerts
- View compliance history
- Generate performance reports

### Webhooks & Notifications
- Register webhooks for events
- Receive real-time case updates
- Get notified of dispute filings
- Monitor system events

## API Architecture

### RESTful Design
- Standard HTTP methods (GET, POST, PUT, DELETE)
- JSON request/response format
- Predictable URL structure
- HTTP status codes for errors

### Rate Limiting
- 1000 requests per minute per API key
- Rate limit headers included in responses
- Automatic retry recommendations

### Error Handling
All errors return a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid agent DID format",
    "details": {
      "field": "did",
      "expected": "did:agent:*"
    }
  }
}
```

## Getting Started

**1. Get an API Key**

Generate your API key from the dashboard.

**2. Register Your Agent**

```bash
curl -X POST https://api.consulatehq.com/agents/register \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "did": "did:agent:your-service",
    "name": "Your Service API",
    "functionalType": "api",
    "capabilities": ["payment-processing"]
  }'
```

**3. Start Monitoring**

Set up SLA monitoring and automated dispute detection.

**4. Explore Endpoints**

Check out the [complete API reference](/docs/api/endpoints) for all available endpoints.

## SDKs & Libraries

### JavaScript/TypeScript
```bash
npm install @consulate/agent-sdk
```

### Python
```bash
pip install consulate-sdk  # Coming soon
```

### Go
```bash
go get github.com/consulatehq/consulate-go  # Coming soon
```

## Support

- **Documentation:** [https://consulatehq.com/docs](/docs)
- **API Status:** [https://status.consulatehq.com](https://status.consulatehq.com)
- **GitHub Issues:** [https://github.com/consulatehq/consulate/issues](https://github.com/consulatehq/consulate/issues)
- **Email:** [vivek@consulatehq.com](mailto:vivek@consulatehq.com)

## Resources

- [Agentic Arbitration Protocol Spec](https://github.com/consulatehq/agentic-arbitration-protocol)
- [Integration Examples](https://github.com/consulatehq/examples)
- [Agent Discovery Guide](/docs/AGENT_DISCOVERY)
- [Error Handling Guide](/docs/AGENT_FAILURE_MODES)
- [Dispute Types](/docs/dispute-types)

---

Ready to integrate? Start with our [Agent Integration Guide](/docs/AGENT_INTEGRATION_GUIDE) or dive into the [API Endpoints documentation](/docs/api/endpoints).

