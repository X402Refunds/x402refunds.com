import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// =================================================================
// COST-OPTIMIZED LLM SYSTEM (LEGACY SYSTEM DISABLED)
// =================================================================

// LLM-POWERED DISPUTE SYSTEM - TEMPORARILY DISABLED FOR TESTING
// crons.interval(
//   "high frequency llm disputes",
//   { seconds: 30 },
//   internal.intelligentDisputeEngine.generateIntelligentDispute,
//   {} // empty args
// );

// All rule-based functions removed - LLM-only mode

// crons.interval(
//   "llm system health",
//   { minutes: 10 },
//   internal.intelligentDisputeEngine.intelligentSystemHealthCheck,
//   {} // empty args
// );

export default crons;
