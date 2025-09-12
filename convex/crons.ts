import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily transparency batch - compute Merkle root and submit to Rekor
crons.daily(
  "daily transparency batch",
  { hourUTC: 2, minuteUTC: 0 }, // 2 AM UTC
  internal.transparency.dailyBatch
);

// Hourly agent cleanup - expire session and ephemeral agents
crons.hourly(
  "cleanup expired agents",
  { minuteUTC: 30 }, // 30 minutes past each hour
  internal.agents.cleanupExpiredAgents
);

// Panel deadline sweep and reputation decay - TODO: implement these functions
// For now, these are handled by the court engine directly

export default crons;
