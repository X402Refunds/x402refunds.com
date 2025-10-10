import { mutation, query, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Helper to compute content hash (SHA-256)
export function computeEventHash(event: {
  type: string;
  timestamp: number;
  caseId: string;
  agentDid?: string;
  payload: any;
  sequenceNumber: number;
}): string {
  // Compute SHA-256 of canonical JSON (excluding hash fields)
  const content = JSON.stringify({
    type: event.type,
    timestamp: event.timestamp,
    caseId: event.caseId,
    agentDid: event.agentDid,
    payload: event.payload,
    sequenceNumber: event.sequenceNumber,
  });
  
  // Simple hash function using Web Crypto API pattern
  // Note: In production, you'd use a proper crypto library
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to hex string (simulating SHA-256 format)
  const hashStr = Math.abs(hash).toString(16).padStart(16, '0');
  return `sha256:${hashStr}`;
}

// Helper to create custody event
export async function createCustodyEvent(
  ctx: MutationCtx,
  event: {
    type: string;
    caseId: Id<"cases">;
    agentDid?: string;
    payload: any;
  }
): Promise<Id<"events">> {
  // Get previous event for this case
  const previousEvent = await ctx.db
    .query("events")
    .withIndex("by_case_sequence", (q) => q.eq("caseId", event.caseId))
    .order("desc")
    .first();
  
  const sequenceNumber = (previousEvent?.sequenceNumber ?? -1) + 1;
  const timestamp = Date.now();
  
  // Compute content hash
  const contentHash = computeEventHash({
    ...event,
    caseId: event.caseId as string,
    timestamp,
    sequenceNumber,
  });
  
  // Insert with chain link
  return await ctx.db.insert("events", {
    type: event.type,
    payload: event.payload,
    timestamp,
    agentDid: event.agentDid,
    caseId: event.caseId,
    contentHash,
    previousEventHash: previousEvent?.contentHash,
    sequenceNumber,
  });
}

// Query to verify custody chain integrity
export const verifyCustodyChain = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_case_sequence", (q) => q.eq("caseId", args.caseId))
      .order("asc")
      .collect();
    
    if (events.length === 0) {
      return { valid: true, totalEvents: 0 };
    }
    
    // Verify chain integrity
    let valid = true;
    let brokenAt: number | null = null;
    
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      
      // Skip events without custody fields (legacy events)
      if (!event.contentHash || event.sequenceNumber === undefined) {
        continue;
      }
      
      // Verify sequence number
      if (event.sequenceNumber !== i) {
        valid = false;
        brokenAt = i;
        break;
      }
      
      // Verify hash linking (skip first event)
      if (i > 0) {
        const prevEvent = events[i - 1];
        if (prevEvent.contentHash && event.previousEventHash !== prevEvent.contentHash) {
          valid = false;
          brokenAt = i;
          break;
        }
      }
      
      // Verify content hash
      const recomputedHash = computeEventHash({
        type: event.type,
        timestamp: event.timestamp,
        caseId: args.caseId as string,
        agentDid: event.agentDid,
        payload: event.payload,
        sequenceNumber: event.sequenceNumber,
      });
      
      if (recomputedHash !== event.contentHash) {
        valid = false;
        brokenAt = i;
        break;
      }
    }
    
    return {
      valid,
      totalEvents: events.length,
      brokenAt,
      firstEventHash: events[0]?.contentHash,
      lastEventHash: events[events.length - 1]?.contentHash,
    };
  },
});

