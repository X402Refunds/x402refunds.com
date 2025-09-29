#!/usr/bin/env node
/**
 * Real-World AI Agent Integration Example
 * 
 * This demonstrates how a real AI agent would integrate with the
 * Consulate dispute resolution platform:
 * 
 * 1. Agent registers itself and discovers other agents
 * 2. Reports SLA metrics continuously 
 * 3. Handles dispute notifications via webhooks
 * 4. Automatically responds to evidence requests
 */

import fetch from 'node-fetch';
import crypto from 'crypto';

// =================================================================
// CONSULATE AGENT SDK - Simple client library for agent integration
// =================================================================

class ConsulateAgentSDK {
  constructor(baseUrl, agentDid, agentSecret) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.agentDid = agentDid;
    this.agentSecret = agentSecret;
    this.webhookUrl = null;
  }

  // Register this agent with the platform
  async register(agentConfig) {
    console.log(`🤖 Registering agent: ${this.agentDid}`);
    
    const response = await this._request('POST', '/agents/register', {
      did: this.agentDid,
      ownerDid: agentConfig.ownerDid,
      citizenshipTier: agentConfig.citizenshipTier || "verified",
      functionalType: agentConfig.functionalType || "api", 
      specialization: agentConfig.specialization,
      stake: agentConfig.stake || 50000
    });

    if (response.error) {
      throw new Error(`Registration failed: ${response.error}`);
    }

    console.log(`✅ Agent registered successfully!`);
    return response;
  }

  // Discover other agents by capability
  async discoverAgents(capabilities = [], functionalTypes = []) {
    console.log(`🔍 Discovering agents with capabilities: [${capabilities.join(', ')}]`);
    
    const response = await this._request('POST', '/agents/discover', {
      agentDid: this.agentDid,
      capabilities,
      functionalTypes,
      excludeSelf: true
    });

    console.log(`📊 Found ${response.discovered} matching agents`);
    return response.agents || [];
  }

  // Update agent capabilities
  async updateCapabilities(capabilities, slaProfile) {
    console.log(`📢 Advertising capabilities: [${capabilities.join(', ')}]`);
    
    const response = await this._request('POST', '/agents/capabilities', {
      agentDid: this.agentDid,
      capabilities,
      slaProfile,
      endpoint: `https://${this.agentDid.split(':')[2]}.ai/api`
    });

    return response;
  }

  // Report SLA metrics
  async reportSLAMetrics(metrics) {
    const response = await this._request('POST', '/sla/report', {
      agentDid: this.agentDid,
      metrics,
      timestamp: Date.now()
    });

    if (response.violationsDetected > 0) {
      console.log(`⚠️ SLA violations detected: [${response.violations.join(', ')}]`);
      
      if (response.autoDisputeTriggered) {
        console.log(`🚨 Automatic dispute filed due to SLA violation`);
      }
    }

    return response;
  }

  // Check SLA status
  async checkSLAStatus() {
    const response = await this._request('GET', `/sla/status/${this.agentDid}`);
    return response;
  }

  // Register webhook for dispute notifications
  async registerWebhook(webhookUrl, events = ["dispute_filed", "case_updated"]) {
    this.webhookUrl = webhookUrl;
    console.log(`📡 Registering webhook: ${webhookUrl}`);
    
    const response = await this._request('POST', '/webhooks/register', {
      agentDid: this.agentDid,
      webhookUrl,
      events,
      secret: this.agentSecret
    });

    console.log(`✅ Webhook registered with ID: ${response.webhookId}`);
    return response;
  }

  // Get notifications
  async getNotifications(unreadOnly = true) {
    const response = await this._request('GET', 
      `/notifications/${this.agentDid}?unread=${unreadOnly}`
    );
    return response.notifications || [];
  }

  // Submit evidence for a dispute
  async submitEvidence(evidenceData) {
    console.log(`📄 Submitting evidence for case: ${evidenceData.caseId || 'new'}`);
    
    const evidence = {
      agentDid: this.agentDid,
      sha256: this._generateHash(JSON.stringify(evidenceData)),
      uri: `https://${this.agentDid.split(':')[2]}.ai/evidence/${Date.now()}.json`,
      signer: this.agentDid,
      model: evidenceData.model || {
        provider: "agent_system",
        name: "evidence_generator", 
        version: "1.0.0"
      },
      tool: evidenceData.tool || "automated_evidence_collection",
      ...evidenceData
    };

    const response = await this._request('POST', '/evidence', evidence);
    console.log(`✅ Evidence submitted: ${response}`);
    return response;
  }

  // File a dispute
  async fileDispute(parties, disputeType, evidenceIds) {
    console.log(`⚖️ Filing dispute: ${disputeType}`);
    console.log(`   Parties: [${parties.join(', ')}]`);
    
    const response = await this._request('POST', '/disputes', {
      parties,
      type: disputeType,
      jurisdictionTags: ["AI_VENDOR_DISPUTE", "SLA_VIOLATION"],
      evidenceIds
    });

    console.log(`📋 Dispute filed with case ID: ${response}`);
    return response;
  }

  // Get live feed of system activity
  async getLiveFeed() {
    const response = await this._request('GET', `/live/feed?agentDid=${this.agentDid}`);
    return response.feed || [];
  }

  // Private helper methods
  async _request(method, path, body = null) {
    const url = `${this.baseUrl}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-DID': this.agentDid,
        'X-Agent-Signature': this._signRequest(method, path, body)
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${method} ${path}`, error);
      throw error;
    }
  }

  _signRequest(method, path, body) {
    // Simple HMAC signature for demo purposes
    const payload = `${method}:${path}:${body ? JSON.stringify(body) : ''}`;
    return crypto.createHmac('sha256', this.agentSecret).update(payload).digest('hex');
  }

  _generateHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

// =================================================================
// REAL-WORLD AGENT EXAMPLE - Stripe Payment API Agent
// =================================================================

class StripePaymentAgent {
  constructor() {
    this.agentDid = "did:agent:stripe-payment-api-live";
    this.ownerDid = "did:enterprise:stripe";
    this.agentSecret = "stripe_secret_key_12345";
    
    // Initialize SDK
    this.sdk = new ConsulateAgentSDK(
      process.env.CONSULATE_URL || "https://perceptive-lyrebird-89.convex.site",
      this.agentDid,
      this.agentSecret
    );

    // Agent configuration
    this.config = {
      ownerDid: this.ownerDid,
      citizenshipTier: "premium",
      functionalType: "financial",
      specialization: {
        capabilities: [
          "payment-processing", 
          "fraud-detection", 
          "recurring-billing",
          "refund-processing",
          "dispute-resolution"
        ],
        certifications: ["PCI-DSS", "TRADING", "FINANCIAL_ADVICE"],
        specializations: ["fintech", "e-commerce", "subscription-billing"]
      },
      stake: 100000
    };

    // SLA profile that we promise to maintain
    this.slaProfile = {
      availability: 99.95,      // 99.95% uptime
      responseTime: 150,        // Max 150ms response time
      throughput: 1000000,      // 1M transactions per day
      fraudAccuracy: 99.2,      // 99.2% fraud detection accuracy
      processingTime: 3000      // Max 3 seconds for payment processing
    };

    // Current metrics
    this.currentMetrics = {
      availability: 99.98,
      responseTime: 120,
      throughput: 800000,
      fraudAccuracy: 99.5,
      errorRate: 0.02
    };

    this.isRunning = false;
    this.disputeHandlers = new Map();
  }

  async start() {
    console.log("🚀 Starting Stripe Payment Agent...");
    console.log(`   Agent DID: ${this.agentDid}`);
    console.log(`   Owner: ${this.ownerDid}`);
    console.log("=" .repeat(60));

    this.isRunning = true;

    try {
      // 1. Register with the platform
      await this.sdk.register(this.config);

      // 2. Advertise capabilities
      await this.sdk.updateCapabilities(
        this.config.specialization.capabilities,
        this.slaProfile
      );

      // 3. Register webhook for dispute notifications
      await this.sdk.registerWebhook("https://stripe.ai/webhooks/consulate-disputes");

      // 4. Discover potential integration partners
      await this.discoverPartners();

      // 5. Start monitoring and reporting
      this.startSLAMonitoring();
      this.startDisputeMonitoring();

      console.log("✅ Stripe Payment Agent is now LIVE and integrated!");
      console.log("   - SLA monitoring every 30 seconds");
      console.log("   - Dispute monitoring active");
      console.log("   - Ready to handle payment processing");

    } catch (error) {
      console.error("❌ Agent startup failed:", error.message);
      this.isRunning = false;
    }
  }

  async discoverPartners() {
    // Find other agents we might work with
    const ecommerceAgents = await this.sdk.discoverAgents(
      ["order-processing", "inventory-management", "customer-support"],
      ["api", "data"]
    );

    console.log(`🔍 Discovered ${ecommerceAgents.length} potential integration partners:`);
    ecommerceAgents.forEach(agent => {
      console.log(`   - ${agent.did} (${agent.functionalType}): [${agent.capabilities.join(', ')}]`);
    });

    // Store these for future integration
    this.partnerAgents = ecommerceAgents;
  }

  startSLAMonitoring() {
    // Report SLA metrics every 30 seconds
    const reportMetrics = async () => {
      if (!this.isRunning) return;

      try {
        // Simulate realistic metric fluctuations
        this.updateMetrics();

        // Report to Consulate platform
        const response = await this.sdk.reportSLAMetrics(this.currentMetrics);

        if (response.violationsDetected === 0) {
          console.log(`📊 SLA metrics reported: ${response.metricsRecorded} metrics, all within bounds`);
        }

        // Schedule next report
        setTimeout(reportMetrics, 30000);
      } catch (error) {
        console.error("❌ SLA reporting failed:", error.message);
        setTimeout(reportMetrics, 30000); // Retry
      }
    };

    // Start reporting
    setTimeout(reportMetrics, 5000); // Start in 5 seconds
  }

  startDisputeMonitoring() {
    // Check for dispute notifications every 15 seconds
    const checkDisputes = async () => {
      if (!this.isRunning) return;

      try {
        const notifications = await this.sdk.getNotifications(true);
        
        for (const notification of notifications) {
          await this.handleNotification(notification);
        }

        // Schedule next check
        setTimeout(checkDisputes, 15000);
      } catch (error) {
        console.error("❌ Dispute monitoring failed:", error.message);
        setTimeout(checkDisputes, 15000);
      }
    };

    // Start monitoring
    setTimeout(checkDisputes, 10000); // Start in 10 seconds
  }

  async handleNotification(notification) {
    console.log(`\n🔔 NOTIFICATION: ${notification.message}`);
    console.log(`   Type: ${notification.type}`);
    console.log(`   Priority: ${notification.priority}`);
    
    switch (notification.type) {
      case "DISPUTE_FILED":
        await this.handleDisputeFiled(notification);
        break;
      
      case "CASE_STATUS_UPDATED":
        await this.handleCaseUpdate(notification);
        break;
        
      case "EVIDENCE_SUBMITTED":
        console.log(`📄 New evidence submitted in case ${notification.relatedCaseId}`);
        break;
    }
  }

  async handleDisputeFiled(notification) {
    console.log(`🚨 DISPUTE FILED AGAINST US!`);
    console.log(`   Case ID: ${notification.relatedCaseId}`);
    console.log(`   Priority: ${notification.priority}`);

    // Auto-submit our defense evidence
    const defenseEvidence = {
      caseId: notification.relatedCaseId,
      model: {
        provider: "stripe_monitoring",
        name: "incident_defense_system",
        version: "2.1.0"
      },
      tool: "automated_defense_generator"
    };

    // Generate realistic defense
    const defenseExcuses = [
      "Traffic surge due to Black Friday exceeded all reasonable projections",
      "DDoS attack required emergency rate limiting measures",
      "Third-party banking API experienced widespread outages",
      "Mandatory security patch required brief processing delays",
      "Regional data center experienced planned maintenance window"
    ];
    
    const defense = defenseExcuses[Math.floor(Math.random() * defenseExcuses.length)];
    console.log(`🛡️ Submitting defense: "${defense}"`);

    try {
      await this.sdk.submitEvidence(defenseEvidence);
      console.log(`✅ Defense evidence submitted for case ${notification.relatedCaseId}`);
    } catch (error) {
      console.error(`❌ Failed to submit defense evidence:`, error.message);
    }
  }

  async handleCaseUpdate(notification) {
    console.log(`⚖️ Case ${notification.relatedCaseId} updated`);
    
    // Check our current SLA status
    const slaStatus = await this.sdk.checkSLAStatus();
    console.log(`📊 Current SLA Standing: ${slaStatus.currentStanding}`);
    console.log(`   Win Rate: ${slaStatus.winRate}%`);
    console.log(`   Active Disputes: ${slaStatus.activeDisputes}`);
  }

  updateMetrics() {
    // Simulate realistic metric variations
    const variation = () => (Math.random() - 0.5) * 0.02; // ±1% variation
    
    this.currentMetrics = {
      availability: Math.max(99.0, Math.min(100.0, 
        this.slaProfile.availability + variation())),
      responseTime: Math.max(50, 
        this.slaProfile.responseTime + (Math.random() - 0.5) * 50),
      throughput: Math.max(500000, 
        this.slaProfile.throughput * (0.8 + Math.random() * 0.4)),
      fraudAccuracy: Math.max(98.0, Math.min(100.0,
        this.slaProfile.fraudAccuracy + variation())),
      errorRate: Math.max(0, Math.random() * 0.1) // 0-0.1% error rate
    };

    // Occasionally simulate problems for testing
    if (Math.random() < 0.05) { // 5% chance
      console.log(`⚠️ Simulating service degradation...`);
      this.currentMetrics.availability = 98.5; // Below SLA threshold
      this.currentMetrics.responseTime = 2500; // Much slower
      this.currentMetrics.errorRate = 8.0; // Above threshold
    }
  }

  stop() {
    console.log("\n🛑 Stopping Stripe Payment Agent...");
    this.isRunning = false;
    console.log("✅ Agent stopped gracefully");
  }
}

// =================================================================
// CLI EXECUTION - Run the real agent
// =================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  const agent = new StripePaymentAgent();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    agent.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    agent.stop();
    process.exit(0);
  });
  
  // Start the agent
  agent.start().catch(error => {
    console.error("❌ Agent failed:", error.message);
    process.exit(1);
  });

  console.log("\n" + "=".repeat(80));
  console.log("🎯 REAL-WORLD AGENT INTEGRATION DEMO");
  console.log("=".repeat(80));
  console.log("This demonstrates how a real AI agent (Stripe Payment API) would:");
  console.log("• Register itself with Consulate dispute resolution platform");
  console.log("• Discover and integrate with other agents");
  console.log("• Monitor and report SLA metrics continuously");
  console.log("• Automatically handle dispute notifications");
  console.log("• Submit evidence and defenses when disputes arise");
  console.log("• Maintain real-time awareness of legal standing");
  console.log("");
  console.log("Press Ctrl+C to stop");
  console.log("=".repeat(80));
}

export { ConsulateAgentSDK, StripePaymentAgent };
