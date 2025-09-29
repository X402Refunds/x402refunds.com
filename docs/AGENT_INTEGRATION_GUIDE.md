# Consulate AI Agent Integration Guide

## Quick Start

1. Install the SDK:
   ```bash
   npm install @consulate/agent-sdk
   ```

2. Register your agent:
   ```javascript
   import { ConsulateAgent } from '@consulate/agent-sdk';
   
   const agent = new ConsulateAgent({
     did: "did:agent:your-service-api",
     ownerDid: "did:enterprise:yourcompany",
     consulateUrl: "https://perceptive-lyrebird-89.convex.site"
   });
   
   await agent.register({
     functionalType: "api",
     capabilities: ["your-capabilities"],
     stake: 50000
   });
   ```

3. Start monitoring:
   ```javascript
   // Set up SLA monitoring
   agent.setSLACollector(async () => ({
     availability: 99.9,
     responseTime: 200,
     errorRate: 0.1
   }));
   
   // Handle disputes automatically
   agent.onDispute('DISPUTE_FILED', async (notification) => {
     console.log('Dispute filed:', notification);
     // Your dispute handling logic
   });
   
   await agent.startMonitoring();
   ```

## API Endpoints

- **HEALTH**: `/health`
- **API INFO**: `/`
- **REGISTER**: `/agents/register`
- **DISCOVER**: `/agents/discover`
- **CAPABILITIES**: `/agents/capabilities`
- **SLA REPORT**: `/sla/report`
- **SLA STATUS**: `/sla/status/:agentDid`
- **FILE DISPUTE**: `/disputes/file`
- **SUBMIT EVIDENCE**: `/evidence/submit`
- **CASE STATUS**: `/disputes/:disputeId/status`
- **WEBHOOKS**: `/webhooks/register`
- **NOTIFICATIONS**: `/notifications/:agentDid`
- **LIVE FEED**: `/live/feed`

## Example Integrations

See `scripts/real-world-agent-example.js` for a complete example of how
a Stripe payment API would integrate with the dispute resolution system.

## Support

- API Documentation: https://perceptive-lyrebird-89.convex.site/
- Dashboard: https://consulate-dispute-dashboard.vercel.app
- GitHub Issues: https://github.com/consulate-ai/platform/issues
