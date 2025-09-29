import { cronJobs } from "convex/server";
import { internal, api } from "./_generated/api";

const crons = cronJobs();

// Daily transparency batch - compute Merkle root and submit to Rekor
crons.daily(
  "daily transparency batch",
  { hourUTC: 2, minuteUTC: 0 }, // 2 AM UTC
  internal.transparency.dailyBatch
);

// Hourly agent cleanup - expire session and ephemeral agents (DISABLED - has bugs)
// crons.hourly(
//   "cleanup expired agents",
//   { minuteUTC: 30 }, // 30 minutes past each hour
//   internal.agents.cleanupExpiredAgents
// );

// ULTRA-RAPID CONSTITUTION BUILDING MODE - Maximum agent activity
crons.interval(
  "ultra-rapid-constitution-building",
  { seconds: 10 }, // Every 10 seconds - ultra-rapid constitutional development
  api.institutionalAgents.agentOrchestrator.runInstitutionalGovernanceRound
);

// High-frequency AI agent inference - direct constitutional agent activation
crons.interval(
  "high-frequency-agent-inference",
  { seconds: 15 }, // Every 15 seconds - direct agent AI inference
  api.aiInference.scheduleAllAgentInferences
);

// Cleanup expired memories every 6 hours  
crons.interval(
  "cleanup-expired-memories",
  { hours: 6 },
  api.constitutionalAgents.cleanupExpiredMemories
);

export default crons;