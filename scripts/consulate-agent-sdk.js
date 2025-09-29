/**
 * Consulate Agent SDK
 * 
 * Simple client library for AI agents to integrate with the Consulate
 * dispute resolution platform.
 * 
 * Usage:
 *   import { ConsulateAgent } from './consulate-agent-sdk.js';
 *   
 *   const agent = new ConsulateAgent({
 *     did: "did:agent:my-service-api",
 *     ownerDid: "did:enterprise:mycompany",
 *     consulateUrl: "https://consulate.ai"
 *   });
 *   
 *   await agent.register({ functionalType: "api", stake: 50000 });
 *   await agent.startMonitoring();
 */

import fetch from 'node-fetch';
import crypto from 'crypto';

export class ConsulateAgent {
  constructor(config) {
    this.config = {
      did: config.did,
      ownerDid: config.ownerDid,
      secret: config.secret || this._generateSecret(),
      consulateUrl: (config.consulateUrl || "https://consulate.ai").replace(/\/$/, ''),
      webhookUrl: config.webhookUrl,
      debug: config.debug || false
    };

    this.isRegistered = false;
    this.isMonitoring = false;
    this.metrics = new Map();
    this.disputeHandlers = new Map();

    if (this.config.debug) {
      console.log(`🔧 ConsulateAgent initialized for ${this.config.did}`);
    }
  }

  // =================================================================
  // AGENT LIFECYCLE MANAGEMENT
  // =================================================================

  /**
   * Register this agent with the Consulate platform
   */
  async register(registrationConfig = {}) {
    this._log(`🤖 Registering agent: ${this.config.did}`);
    
    const payload = {
      did: this.config.did,
      ownerDid: this.config.ownerDid,
      citizenshipTier: registrationConfig.citizenshipTier || "verified",
      functionalType: registrationConfig.functionalType || "api",
      specialization: registrationConfig.specialization,
      stake: registrationConfig.stake || 50000,
      ...registrationConfig
    };

    const response = await this._apiRequest('POST', '/agents/register', payload);
    
    if (response.error) {
      throw new Error(`Registration failed: ${response.error}`);
    }

    this.isRegistered = true;
    this._log(`✅ Agent registered successfully with ID: ${response}`);
    
    return response;
  }

  /**
   * Update agent capabilities and SLA profile
   */
  async updateCapabilities(capabilities, slaProfile) {
    this._ensureRegistered();
    
    const response = await this._apiRequest('POST', '/agents/capabilities', {
      agentDid: this.config.did,
      capabilities,
      slaProfile,
      endpoint: this.config.webhookUrl
    });

    this._log(`📢 Capabilities updated: ${capabilities.length} capabilities, SLA active: ${!!slaProfile}`);
    return response;
  }

  /**
   * Start monitoring for disputes and SLA violations
   */
  async startMonitoring(options = {}) {
    this._ensureRegistered();
    
    if (this.isMonitoring) {
      this._log(`⚠️ Agent is already monitoring`);
      return;
    }

    this.monitoringOptions = {
      slaReportInterval: options.slaReportInterval || 30000, // 30 seconds
      disputeCheckInterval: options.disputeCheckInterval || 15000, // 15 seconds
      autoDefense: options.autoDefense !== false, // default true
      ...options
    };

    this.isMonitoring = true;

    // Register webhook if provided
    if (this.config.webhookUrl) {
      await this.registerWebhook(this.config.webhookUrl, options.webhookEvents);
    }

    // Start monitoring loops
    this._startSLAReporting();
    this._startDisputeMonitoring();

    this._log(`🔍 Monitoring started - SLA reports every ${this.monitoringOptions.slaReportInterval}ms`);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.isMonitoring = false;
    this._log(`🛑 Monitoring stopped for ${this.config.did}`);
  }

  // =================================================================
  // AGENT DISCOVERY & NETWORKING
  // =================================================================

  /**
   * Discover other agents by capabilities or functional type
   */
  async discoverAgents(searchCriteria = {}) {
    const {
      capabilities = [],
      functionalTypes = [],
      location = null,
      excludeSelf = true
    } = searchCriteria;

    const response = await this._apiRequest('POST', '/agents/discover', {
      agentDid: this.config.did,
      capabilities,
      functionalTypes,
      location,
      excludeSelf
    });

    this._log(`🔍 Discovered ${response.discovered || 0} agents matching criteria`);
    return response.agents || [];
  }

  /**
   * Get detailed info about a specific agent
   */
  async getAgentInfo(agentDid) {
    // This would typically call GET /agents/:did endpoint
    const agents = await this.discoverAgents({ excludeSelf: false });
    return agents.find(agent => agent.did === agentDid) || null;
  }

  // =================================================================
  // SLA MONITORING & REPORTING
  // =================================================================

  /**
   * Report current SLA metrics
   */
  async reportMetrics(metricsData) {
    this._ensureRegistered();
    
    const response = await this._apiRequest('POST', '/sla/report', {
      agentDid: this.config.did,
      metrics: metricsData,
      timestamp: Date.now()
    });

    // Store metrics locally
    this.metrics.set('latest', {
      ...metricsData,
      reportedAt: Date.now(),
      violations: response.violations || []
    });

    if (response.violationsDetected > 0) {
      this._log(`⚠️ SLA violations detected: [${response.violations.join(', ')}]`);
      this._handleSLAViolation(response);
    }

    return response;
  }

  /**
   * Get current SLA status and dispute history
   */
  async getSLAStatus() {
    const response = await this._apiRequest('GET', `/sla/status/${this.config.did}`);
    this._log(`📊 SLA Status: ${response.currentStanding} (Win rate: ${response.winRate}%)`);
    return response;
  }

  /**
   * Set up automatic SLA metric collection
   */
  setSLACollector(collectorFunction) {
    this.slaCollector = collectorFunction;
    this._log(`📊 SLA collector function registered`);
  }

  // =================================================================
  // DISPUTE MANAGEMENT
  // =================================================================

  /**
   * File a dispute against another agent
   */
  async fileDispute(targetAgentDid, disputeType, evidenceData) {
    this._log(`⚖️ Filing dispute against ${targetAgentDid}: ${disputeType}`);
    
    // First submit evidence
    const evidenceId = await this.submitEvidence(evidenceData);
    
    // Then file dispute
    const caseId = await this._apiRequest('POST', '/disputes', {
      parties: [targetAgentDid, this.config.did],
      type: disputeType,
      jurisdictionTags: ["AI_VENDOR_DISPUTE", "SLA_VIOLATION"],
      evidenceIds: [evidenceId]
    });

    this._log(`📋 Dispute filed with case ID: ${caseId}`);
    return caseId;
  }

  /**
   * Submit evidence for a dispute
   */
  async submitEvidence(evidenceData) {
    const evidence = {
      agentDid: this.config.did,
      sha256: this._generateHash(JSON.stringify(evidenceData)),
      uri: evidenceData.uri || `https://${this._extractAgentName()}.ai/evidence/${Date.now()}.json`,
      signer: this.config.did,
      model: evidenceData.model || {
        provider: "agent_system",
        name: "evidence_collector",
        version: "1.0.0"
      },
      tool: evidenceData.tool || "automated_evidence",
      caseId: evidenceData.caseId
    };

    const response = await this._apiRequest('POST', '/evidence', evidence);
    this._log(`📄 Evidence submitted: ${response}`);
    return response;
  }

  /**
   * Register a handler for specific dispute events
   */
  onDispute(eventType, handlerFunction) {
    if (!this.disputeHandlers.has(eventType)) {
      this.disputeHandlers.set(eventType, []);
    }
    this.disputeHandlers.get(eventType).push(handlerFunction);
    this._log(`🎯 Handler registered for ${eventType} events`);
  }

  // =================================================================
  // WEBHOOKS & NOTIFICATIONS
  // =================================================================

  /**
   * Register webhook for real-time notifications
   */
  async registerWebhook(webhookUrl, events = ["dispute_filed", "case_updated"]) {
    const response = await this._apiRequest('POST', '/webhooks/register', {
      agentDid: this.config.did,
      webhookUrl,
      events,
      secret: this.config.secret
    });

    this.config.webhookUrl = webhookUrl;
    this._log(`📡 Webhook registered: ${webhookUrl}`);
    return response;
  }

  /**
   * Get recent notifications
   */
  async getNotifications(unreadOnly = true) {
    const response = await this._apiRequest('GET', 
      `/notifications/${this.config.did}?unread=${unreadOnly}`
    );
    
    return response.notifications || [];
  }

  /**
   * Process webhook payload (call this from your webhook endpoint)
   */
  async processWebhookPayload(payload, signature) {
    // Verify signature
    const expectedSignature = this._signWebhookPayload(payload);
    if (signature !== expectedSignature) {
      throw new Error('Invalid webhook signature');
    }

    // Process notification
    await this._handleNotification(payload);
  }

  // =================================================================
  // REAL-TIME MONITORING
  // =================================================================

  /**
   * Get live system activity feed
   */
  async getLiveFeed(filters = {}) {
    const params = new URLSearchParams();
    if (filters.agentDid) params.set('agentDid', filters.agentDid);
    if (filters.eventTypes) params.set('types', filters.eventTypes.join(','));
    
    const response = await this._apiRequest('GET', `/live/feed?${params.toString()}`);
    return response.feed || [];
  }

  // =================================================================
  // PRIVATE HELPER METHODS
  // =================================================================

  async _startSLAReporting() {
    const reportLoop = async () => {
      if (!this.isMonitoring) return;

      try {
        // Collect metrics if collector function is available
        if (this.slaCollector) {
          const metrics = await this.slaCollector();
          await this.reportMetrics(metrics);
        }

        // Schedule next report
        setTimeout(reportLoop, this.monitoringOptions.slaReportInterval);
      } catch (error) {
        this._log(`❌ SLA reporting error: ${error.message}`);
        setTimeout(reportLoop, this.monitoringOptions.slaReportInterval);
      }
    };

    // Start after a short delay
    setTimeout(reportLoop, 5000);
  }

  async _startDisputeMonitoring() {
    const monitorLoop = async () => {
      if (!this.isMonitoring) return;

      try {
        const notifications = await this.getNotifications(true);
        
        for (const notification of notifications) {
          await this._handleNotification(notification);
        }

        // Schedule next check
        setTimeout(monitorLoop, this.monitoringOptions.disputeCheckInterval);
      } catch (error) {
        this._log(`❌ Dispute monitoring error: ${error.message}`);
        setTimeout(monitorLoop, this.monitoringOptions.disputeCheckInterval);
      }
    };

    // Start after a short delay
    setTimeout(monitorLoop, 8000);
  }

  async _handleNotification(notification) {
    this._log(`🔔 Notification: ${notification.message || notification.type}`);

    // Call registered handlers
    const handlers = this.disputeHandlers.get(notification.type) || [];
    for (const handler of handlers) {
      try {
        await handler(notification);
      } catch (error) {
        this._log(`❌ Handler error for ${notification.type}: ${error.message}`);
      }
    }

    // Default handling
    switch (notification.type) {
      case 'DISPUTE_FILED':
        if (this.monitoringOptions.autoDefense) {
          await this._autoDefenseHandler(notification);
        }
        break;
    }
  }

  async _autoDefenseHandler(notification) {
    this._log(`🛡️ Auto-defense triggered for case: ${notification.relatedCaseId}`);
    
    const defenseEvidence = {
      caseId: notification.relatedCaseId,
      model: {
        provider: "agent_defense_system", 
        name: "automated_defense",
        version: "1.0.0"
      },
      tool: "auto_defense_generator"
    };

    try {
      await this.submitEvidence(defenseEvidence);
      this._log(`✅ Auto-defense evidence submitted`);
    } catch (error) {
      this._log(`❌ Auto-defense failed: ${error.message}`);
    }
  }

  async _handleSLAViolation(violationData) {
    this._log(`🚨 SLA violation detected: ${violationData.violations.join(', ')}`);
    
    // Emit event for custom handlers
    const handlers = this.disputeHandlers.get('SLA_VIOLATION') || [];
    for (const handler of handlers) {
      try {
        await handler(violationData);
      } catch (error) {
        this._log(`❌ SLA violation handler error: ${error.message}`);
      }
    }
  }

  async _apiRequest(method, path, body = null) {
    const url = `${this.config.consulateUrl}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-DID': this.config.did,
        'X-Agent-Signature': this._signRequest(method, path, body)
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      this._log(`❌ API request failed: ${method} ${path} - ${error.message}`);
      throw error;
    }
  }

  _signRequest(method, path, body) {
    const payload = `${method}:${path}:${body ? JSON.stringify(body) : ''}`;
    return crypto.createHmac('sha256', this.config.secret).update(payload).digest('hex');
  }

  _signWebhookPayload(payload) {
    return crypto.createHmac('sha256', this.config.secret)
                 .update(JSON.stringify(payload))
                 .digest('hex');
  }

  _generateHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  _generateSecret() {
    return crypto.randomBytes(32).toString('hex');
  }

  _extractAgentName() {
    return this.config.did.split(':')[2] || 'unknown-agent';
  }

  _ensureRegistered() {
    if (!this.isRegistered) {
      throw new Error('Agent must be registered before performing this operation');
    }
  }

  _log(message) {
    if (this.config.debug) {
      console.log(`[ConsulateAgent] ${message}`);
    }
  }
}

// =================================================================
// CONVENIENCE BUILDERS
// =================================================================

/**
 * Quick builder for API service agents
 */
export function createAPIAgent(config) {
  return new ConsulateAgent({
    ...config,
    functionalType: 'api',
    citizenshipTier: 'verified'
  });
}

/**
 * Quick builder for financial service agents
 */
export function createFinancialAgent(config) {
  return new ConsulateAgent({
    ...config,
    functionalType: 'financial',
    citizenshipTier: 'premium',
    specialization: {
      certifications: ['PCI-DSS', 'TRADING'],
      capabilities: ['payment-processing', 'fraud-detection'],
      ...config.specialization
    }
  });
}

/**
 * Quick builder for data processing agents
 */
export function createDataAgent(config) {
  return new ConsulateAgent({
    ...config,
    functionalType: 'data',
    citizenshipTier: 'verified',
    specialization: {
      certifications: ['SOC2', 'GDPR'],
      capabilities: ['data-processing', 'analytics'],
      ...config.specialization
    }
  });
}

export default ConsulateAgent;
