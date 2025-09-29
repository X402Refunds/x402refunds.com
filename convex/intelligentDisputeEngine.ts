// Minimal LLM Dispute Engine - Test Version

import { internalMutation, internalAction, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// Simple test function
export const testSimple = action({
  args: {},
  handler: async (ctx) => {
    console.log("✅ LLM Engine test function working!");
    return { success: true, message: "LLM engine is deployed successfully" };
  }
});

// Generate intelligent dispute (minimal version)
export const generateIntelligentDispute = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("🧠 LLM Dispute generation called (test mode)");
    
    // For now, just return a test message
    return { 
      success: false, 
      reason: "LLM system is deployed but in test mode", 
      method: "test" 
    };
  }
});

// System health check
export const intelligentSystemHealthCheck = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("💚 LLM System health check - all systems operational");
    
    const stats = {
      llmSystem: "operational",
      lastCheck: Date.now(),
      status: "test_mode"
    };
    
    return { success: true, stats };
  }
});