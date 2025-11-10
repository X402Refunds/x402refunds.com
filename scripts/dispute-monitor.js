#!/usr/bin/env node
/**
 * Real-Time AI Vendor Dispute Monitor
 * 
 * Shows live activity feed of:
 * - Disputes being filed
 * - Evidence being submitted  
 * - Court decisions being made
 * - Penalties being applied
 * - System performance metrics
 */

import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexClient(process.env.CONVEX_URL || "https://api.x402disputes.com");

class DisputeMonitor {
  constructor() {
    this.isRunning = false;
    this.lastEventTimestamp = Date.now();
    this.eventHistory = [];
    this.stats = {
      totalDisputes: 0,
      totalResolutions: 0,
      totalPenalties: 0,
      avgResolutionTime: 0,
      systemStartTime: Date.now()
    };
  }

  async start() {
    console.clear();
    console.log("🔍 AI Vendor Dispute Resolution Monitor");
    console.log("=" .repeat(80));
    console.log("   Real-time monitoring of automated dispute resolution");
    console.log("   Press Ctrl+C to stop\n");
    
    this.isRunning = true;
    
    // Start monitoring loops
    this.startEventMonitor();
    this.startStatsMonitor();
    this.startActivityFeed();
    
    console.log("✅ Monitor is LIVE - watching for disputes...\n");
  }

  startEventMonitor() {
    // Check for new events every 2 seconds
    const checkEvents = async () => {
      if (!this.isRunning) return;
      
      try {
        await this.checkNewEvents();
        setTimeout(checkEvents, 2000);
      } catch (error) {
        console.error("❌ Event monitoring error:", error.message);
        setTimeout(checkEvents, 5000);
      }
    };
    
    checkEvents();
  }

  async checkNewEvents() {
    // Get recent events
    const events = await client.query(api.events?.getRecentEvents, { 
      limit: 10,
      afterTimestamp: this.lastEventTimestamp
    });
    
    if (!events || events.length === 0) return;
    
    // Process new events
    for (const event of events.reverse()) {
      await this.processEvent(event);
      this.lastEventTimestamp = Math.max(this.lastEventTimestamp, event.timestamp);
    }
  }

  async processEvent(event) {
    const timestamp = new Date(event.timestamp).toLocaleTimeString();
    
    switch (event.type) {
      case "AGENT_REGISTERED":
        this.logEvent(`👤 ${timestamp} - Agent registered: ${this.getAgentName(event.payload.did)}`, "agent");
        break;
        
      case "EVIDENCE_SUBMITTED":
        this.logEvent(`📄 ${timestamp} - Evidence submitted by ${this.getAgentName(event.payload.agentDid)}`, "evidence");
        break;
        
      case "DISPUTE_FILED":
        this.stats.totalDisputes++;
        const parties = event.payload.parties.map(p => this.getAgentName(p)).join(" vs ");
        this.logEvent(`⚖️  ${timestamp} - DISPUTE FILED: ${parties} (${event.payload.type})`, "dispute");
        break;
        
      case "CASE_STATUS_UPDATED":
        if (event.payload.newStatus === "DECIDED") {
          this.stats.totalResolutions++;
          this.logEvent(`✅ ${timestamp} - Case resolved: ${event.payload.caseId}`, "resolution");
        }
        break;
        
      default:
        this.logEvent(`📋 ${timestamp} - ${event.type}: ${JSON.stringify(event.payload)}`, "system");
    }
    
    this.eventHistory.push({
      timestamp: event.timestamp,
      type: event.type,
      description: this.getEventDescription(event)
    });
    
    // Keep only last 50 events
    if (this.eventHistory.length > 50) {
      this.eventHistory.shift();
    }
  }

  startStatsMonitor() {
    // Update stats every 10 seconds
    const updateStats = async () => {
      if (!this.isRunning) return;
      
      try {
        await this.updateSystemStats();
        setTimeout(updateStats, 10000);
      } catch (error) {
        console.error("❌ Stats monitoring error:", error.message);
        setTimeout(updateStats, 15000);
      }
    };
    
    updateStats();
  }

  async updateSystemStats() {
    try {
      // Get current system status
      const cases = await client.query(api.cases.getRecentCases, { limit: 100 });
      const agents = await client.query(api.agents.getAgentsByType, { 
        agentType: "premium", 
        limit: 50 
      });
      
      const filedCases = cases.filter(c => c.status === "FILED");
      const decidedCases = cases.filter(c => c.status === "DECIDED");
      
      this.stats.totalDisputes = cases.length;
      this.stats.totalResolutions = decidedCases.length;
      this.stats.activeDisputes = filedCases.length;
      this.stats.activeAgents = agents.length;
      
      // Calculate resolution time
      if (decidedCases.length > 0) {
        const totalTime = decidedCases.reduce((sum, case_) => {
          return sum + (case_.ruling?.decidedAt - case_.filedAt);
        }, 0);
        this.stats.avgResolutionTime = Math.floor(totalTime / decidedCases.length / 1000); // seconds
      }
      
    } catch (error) {
      // Fallback for missing query functions
      console.log("   📊 Stats update skipped (system initializing)");
    }
  }

  startActivityFeed() {
    // Print activity summary every 15 seconds
    setInterval(() => {
      if (!this.isRunning) return;
      this.printActivitySummary();
    }, 15000);
  }

  printActivitySummary() {
    const runtime = Math.floor((Date.now() - this.stats.systemStartTime) / 1000);
    const disputeRate = runtime > 0 ? (this.stats.totalDisputes / (runtime / 60)).toFixed(1) : "0.0";
    const resolutionRate = runtime > 0 ? (this.stats.totalResolutions / (runtime / 60)).toFixed(1) : "0.0";
    
    console.log("\n" + "=".repeat(80));
    console.log("📊 SYSTEM ACTIVITY SUMMARY");
    console.log("=".repeat(80));
    console.log(`🕒 Runtime: ${Math.floor(runtime / 60)}m ${runtime % 60}s`);
    console.log(`⚖️  Total Disputes: ${this.stats.totalDisputes} (${disputeRate}/min)`);
    console.log(`✅ Resolutions: ${this.stats.totalResolutions} (${resolutionRate}/min)`);
    console.log(`⏳ Active Disputes: ${this.stats.activeDisputes || 0}`);
    console.log(`👥 Active Agents: ${this.stats.activeAgents || 0}`);
    console.log(`⏱️  Avg Resolution: ${this.stats.avgResolutionTime}s`);
    console.log(`🎯 Success Rate: ${this.getSuccessRate()}%`);
    console.log(`💰 Platform Revenue: $${this.calculatePlatformRevenue().toLocaleString()}`);
    
    // Show recent activity
    if (this.eventHistory.length > 0) {
      console.log("\n📋 RECENT ACTIVITY:");
      const recentEvents = this.eventHistory.slice(-5);
      recentEvents.forEach(event => {
        const time = new Date(event.timestamp).toLocaleTimeString();
        console.log(`   ${time} - ${event.description}`);
      });
    }
    
    console.log("\n" + "=".repeat(80));
  }

  logEvent(message, category = "general") {
    const colors = {
      agent: "\x1b[34m",    // Blue
      evidence: "\x1b[33m", // Yellow  
      dispute: "\x1b[31m",  // Red
      resolution: "\x1b[32m", // Green
      system: "\x1b[36m",   // Cyan
      general: "\x1b[37m"   // White
    };
    
    const reset = "\x1b[0m";
    const color = colors[category] || colors.general;
    
    console.log(`${color}${message}${reset}`);
  }

  getAgentName(did) {
    if (!did) return "Unknown";
    
    // Extract readable name from DID
    const parts = did.split(':');
    if (parts.length >= 3) {
      return parts[2].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    return did;
  }

  getEventDescription(event) {
    switch (event.type) {
      case "AGENT_REGISTERED":
        return `Agent ${this.getAgentName(event.payload.did)} joined the platform`;
      case "EVIDENCE_SUBMITTED":
        return `Evidence submitted for ${event.payload.functionalType} dispute`;
      case "DISPUTE_FILED":
        const parties = event.payload.parties.map(p => this.getAgentName(p)).join(" vs ");
        return `${parties} dispute filed (${event.payload.type})`;
      case "CASE_STATUS_UPDATED":
        return `Case status updated to ${event.payload.newStatus}`;
      default:
        return event.type.toLowerCase().replace(/_/g, ' ');
    }
  }

  getSuccessRate() {
    if (this.stats.totalDisputes === 0) return 100;
    return ((this.stats.totalResolutions / this.stats.totalDisputes) * 100).toFixed(1);
  }

  calculatePlatformRevenue() {
    // Platform takes 3% fee on resolved disputes
    // Estimate average dispute value at $50K
    const avgDisputeValue = 50000;
    const platformFeeRate = 0.03;
    return this.stats.totalResolutions * avgDisputeValue * platformFeeRate;
  }

  async showSystemHealth() {
    console.log("\n🏥 SYSTEM HEALTH CHECK");
    console.log("=".repeat(50));
    
    try {
      // Check database connectivity
      const healthCheck = await client.query(api.agents.getAgentsByType, { 
        agentType: "premium", 
        limit: 1 
      });
      console.log("✅ Database: Connected");
      
      // Check dispute processing
      const recentDisputes = await client.query(api.cases.getRecentCases, { limit: 5 });
      console.log(`✅ Dispute Engine: ${recentDisputes.length} recent cases`);
      
      // Check agent registration
      const activeAgents = this.stats.activeAgents || 0;
      console.log(`✅ Agent Network: ${activeAgents} active agents`);
      
      console.log("✅ Overall Status: OPERATIONAL");
      
    } catch (error) {
      console.log("❌ System Health: DEGRADED");
      console.log(`   Error: ${error.message}`);
    }
  }

  async showTopAgents() {
    console.log("\n👑 TOP PERFORMING AGENTS");
    console.log("=".repeat(50));
    
    try {
      const agents = await client.query(api.agents.getAgentsByType, { 
        agentType: "premium", 
        limit: 10 
      });
      
      agents.forEach((agent, index) => {
        const name = this.getAgentName(agent.did);
        const type = agent.functionalType || "general";
        const stake = agent.stake || 0;
        console.log(`${index + 1}. ${name} (${type}) - $${stake.toLocaleString()} staked`);
      });
      
    } catch (error) {
      console.log("❌ Unable to fetch agent data");
    }
  }

  async showActiveDisputes() {
    console.log("\n⚖️  ACTIVE DISPUTES");
    console.log("=".repeat(50));
    
    try {
      const activeCases = await client.query(api.cases.getCasesByStatus, { 
        status: "FILED", 
        limit: 10 
      });
      
      if (activeCases.length === 0) {
        console.log("   No active disputes (system is efficient! ✅)");
        return;
      }
      
      activeCases.forEach((case_, index) => {
        const parties = case_.parties.map(p => this.getAgentName(p)).join(" vs ");
        const age = Math.floor((Date.now() - case_.filedAt) / 1000);
        console.log(`${index + 1}. ${parties} (${case_.type}) - ${age}s ago`);
      });
      
    } catch (error) {
      console.log("❌ Unable to fetch dispute data");
    }
  }

  stop() {
    console.log("\n🛑 Stopping dispute monitor...");
    this.isRunning = false;
    
    console.log("\n📊 FINAL MONITORING REPORT:");
    console.log(`   Monitoring Duration: ${Math.floor((Date.now() - this.stats.systemStartTime) / 1000)}s`);
    console.log(`   Events Processed: ${this.eventHistory.length}`);
    console.log(`   Disputes Tracked: ${this.stats.totalDisputes}`);
    console.log(`   Resolutions Tracked: ${this.stats.totalResolutions}`);
    console.log("   Monitor Status: CLEAN SHUTDOWN ✅");
    
    process.exit(0);
  }
}

// CLI Commands
const commands = {
  monitor: () => {
    const monitor = new DisputeMonitor();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => monitor.stop());
    process.on('SIGTERM', () => monitor.stop());
    
    monitor.start().catch(error => {
      console.error("❌ Monitor startup failed:", error.message);
      process.exit(1);
    });
  },
  
  health: async () => {
    const monitor = new DisputeMonitor();
    await monitor.showSystemHealth();
    process.exit(0);
  },
  
  agents: async () => {
    const monitor = new DisputeMonitor();
    await monitor.showTopAgents();
    process.exit(0);
  },
  
  disputes: async () => {
    const monitor = new DisputeMonitor();
    await monitor.showActiveDisputes();
    process.exit(0);
  },
  
  help: () => {
    console.log("🔍 AI Vendor Dispute Monitor Commands:");
    console.log("");
    console.log("  monitor    - Start real-time monitoring (default)");
    console.log("  health     - Show system health check");
    console.log("  agents     - Show top performing agents");
    console.log("  disputes   - Show active disputes");
    console.log("  help       - Show this help message");
    console.log("");
    console.log("Examples:");
    console.log("  node dispute-monitor.js");
    console.log("  node dispute-monitor.js health");
    console.log("  node dispute-monitor.js agents");
    process.exit(0);
  }
};

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2] || "monitor";
  
  if (commands[command]) {
    commands[command]();
  } else {
    console.error(`❌ Unknown command: ${command}`);
    commands.help();
  }
}

export default DisputeMonitor;
