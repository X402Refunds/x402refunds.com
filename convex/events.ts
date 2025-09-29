import { query } from "./_generated/server";
import { v } from "convex/values";

// Query recent events for monitoring
export const getRecentEvents = query({
  args: {
    limit: v.optional(v.number()),
    afterTimestamp: v.optional(v.number()),
    type: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    if (args.afterTimestamp) {
      let query = ctx.db.query("events")
        .withIndex("by_timestamp", (q) => q.gt("timestamp", args.afterTimestamp!));
      
      if (args.type) {
        query = query.filter((q) => q.eq(q.field("type"), args.type));
      }
      
      return await query.order("desc").take(args.limit ?? 50);
    } else {
      let query = ctx.db.query("events")
        .withIndex("by_timestamp");
      
      if (args.type) {
        query = query.filter((q) => q.eq(q.field("type"), args.type));
      }
      
      return await query.order("desc").take(args.limit ?? 50);
    }
  }
});

// Query events by type
export const getEventsByType = query({
  args: {
    type: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("events")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .order("desc")
      .take(args.limit ?? 20);
  }
});

// Query events by agent
export const getEventsByAgent = query({
  args: {
    agentDid: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("events")
      .withIndex("by_agent", (q) => q.eq("agentDid", args.agentDid))
      .order("desc")
      .take(args.limit ?? 20);
  }
});

// Query events by case
export const getEventsByCase = query({
  args: {
    caseId: v.id("cases"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("events")
      .filter((q) => q.eq(q.field("caseId"), args.caseId))
      .order("desc")
      .take(args.limit ?? 20);
  }
});

// Get system statistics from events
export const getSystemStats = query({
  args: {
    hoursBack: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const hoursBack = args.hoursBack ?? 24;
    const cutoffTime = Date.now() - (hoursBack * 60 * 60 * 1000);
    
    const recentEvents = await ctx.db
      .query("events")
      .withIndex("by_timestamp", (q) => q.gt("timestamp", cutoffTime))
      .collect();
    
    const stats = {
      totalEvents: recentEvents.length,
      agentRegistrations: recentEvents.filter(e => e.type === "AGENT_REGISTERED").length,
      disputesFiled: recentEvents.filter(e => e.type === "DISPUTE_FILED").length,
      evidenceSubmitted: recentEvents.filter(e => e.type === "EVIDENCE_SUBMITTED").length,
      casesResolved: recentEvents.filter(e => e.type === "CASE_STATUS_UPDATED" && 
        (e.payload?.newStatus === "DECIDED" || e.payload?.newStatus === "PANELED")).length,
      timeRange: hoursBack,
      periodStart: cutoffTime,
      periodEnd: Date.now()
    };
    
    return stats;
  }
});

// Get event timeline for visualization
export const getEventTimeline = query({
  args: {
    hoursBack: v.optional(v.number()),
    bucketMinutes: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const hoursBack = args.hoursBack ?? 24;
    const bucketMinutes = args.bucketMinutes ?? 60; // 1-hour buckets by default
    const cutoffTime = Date.now() - (hoursBack * 60 * 60 * 1000);
    
    const events = await ctx.db
      .query("events")
      .withIndex("by_timestamp", (q) => q.gt("timestamp", cutoffTime))
      .collect();
    
    // Create timeline buckets
    const bucketMs = bucketMinutes * 60 * 1000;
    const buckets = new Map();
    
    // Initialize buckets
    for (let time = cutoffTime; time <= Date.now(); time += bucketMs) {
      buckets.set(time, {
        timestamp: time,
        totalEvents: 0,
        disputes: 0,
        resolutions: 0,
        evidence: 0
      });
    }
    
    // Fill buckets with events
    events.forEach(event => {
      const bucketTime = Math.floor(event.timestamp / bucketMs) * bucketMs;
      const bucket = buckets.get(bucketTime);
      
      if (bucket) {
        bucket.totalEvents++;
        
        switch (event.type) {
          case "DISPUTE_FILED":
            bucket.disputes++;
            break;
          case "CASE_STATUS_UPDATED":
            if (event.payload?.newStatus === "DECIDED" || event.payload?.newStatus === "PANELED") {
              bucket.resolutions++;
            }
            break;
          case "EVIDENCE_SUBMITTED":
            bucket.evidence++;
            break;
        }
      }
    });
    
    return Array.from(buckets.values());
  }
});
