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

// RAPID CONSTITUTION BUILDING MODE - Speed up until constitution is complete
crons.interval(
  "rapid-constitution-building",
  { minutes: 2 }, // Every 2 minutes - rapid constitutional development
  api.institutionalAgents.agentOrchestrator.runInstitutionalGovernanceRound
);

// Cleanup expired memories every 6 hours  
crons.interval(
  "cleanup-expired-memories",
  { hours: 6 },
  api.constitutionalAgents.cleanupExpiredMemories
);

export default crons;