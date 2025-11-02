import { query } from "./_generated/server";
import { v } from "convex/values";

// Dispute-related event types (for activity feeds)
const DISPUTE_EVENT_TYPES = [
  "AGENT_REGISTERED",
  "DISPUTE_FILED",
  "EVIDENCE_SUBMITTED",
  "CASE_STATUS_UPDATED"
];

// Query recent dispute activity events (filters out admin/audit events)
export const getDisputeActivityEvents = query({
  args: {
    limit: v.optional(v.number()),
    afterTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let events;
    if (args.afterTimestamp) {
      events = await ctx.db.query("events")
        .withIndex("by_timestamp", (q) => q.gt("timestamp", args.afterTimestamp!))
        .order("desc")
        .filter((q) => {
          // Only include dispute-related events
          return q.or(
            q.eq(q.field("type"), "AGENT_REGISTERED"),
            q.eq(q.field("type"), "DISPUTE_FILED"),
            q.eq(q.field("type"), "EVIDENCE_SUBMITTED"),
            q.eq(q.field("type"), "CASE_STATUS_UPDATED")
          );
        })
        .take(args.limit ?? 50);
    } else {
      events = await ctx.db.query("events")
        .withIndex("by_timestamp")
        .order("desc")
        .filter((q) => {
          // Only include dispute-related events
          return q.or(
            q.eq(q.field("type"), "AGENT_REGISTERED"),
            q.eq(q.field("type"), "DISPUTE_FILED"),
            q.eq(q.field("type"), "EVIDENCE_SUBMITTED"),
            q.eq(q.field("type"), "CASE_STATUS_UPDATED")
          );
        })
        .take(args.limit ?? 50);
    }

    // Enrich events with case data for DISPUTE_FILED events
    return await Promise.all(
      events.map(async (event) => {
        if (event.type === "DISPUTE_FILED" && event.caseId) {
          const caseData = await ctx.db.get(event.caseId);

          // Also fetch payment dispute data if this is a payment dispute (type=PAYMENT case)
          let paymentDisputeData = undefined;
          if (event.caseId && caseData?.type === "PAYMENT") {
            paymentDisputeData = {
              amount: caseData.amount || 0,
              currency: caseData.currency || "USD",
              pricingTier: caseData.paymentDetails?.pricingTier || "micro",
              disputeFee: caseData.paymentDetails?.disputeFee || 0,
              isMicroDispute: (caseData.amount || 0) < 1,
            };
          }

          return {
            ...event,
            caseData,
            paymentDispute: paymentDisputeData
          };
        }
        return event;
      })
    );
  }
});

// Query recent events for monitoring (includes ALL event types)
export const getRecentEvents = query({
  args: {
    limit: v.optional(v.number()),
    afterTimestamp: v.optional(v.number()),
    type: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    let events;
    if (args.afterTimestamp) {
      let query = ctx.db.query("events")
        .withIndex("by_timestamp", (q) => q.gt("timestamp", args.afterTimestamp!));

      if (args.type) {
        query = query.filter((q) => q.eq(q.field("type"), args.type));
      }

      events = await query.order("desc").take(args.limit ?? 50);
    } else {
      let query = ctx.db.query("events")
        .withIndex("by_timestamp");

      if (args.type) {
        query = query.filter((q) => q.eq(q.field("type"), args.type));
      }

      events = await query.order("desc").take(args.limit ?? 50);
    }

    // Enrich events with case data for DISPUTE_FILED events
    return await Promise.all(
      events.map(async (event) => {
        if (event.type === "DISPUTE_FILED" && event.caseId) {
          const caseData = await ctx.db.get(event.caseId);

          // Also fetch payment dispute data if this is a payment dispute (type=PAYMENT case)
          let paymentDisputeData = undefined;
          if (event.caseId && caseData?.type === "PAYMENT") {
            paymentDisputeData = {
              amount: caseData.amount || 0,
              currency: caseData.currency || "USD",
              pricingTier: caseData.paymentDetails?.pricingTier || "micro",
              disputeFee: caseData.paymentDetails?.disputeFee || 0,
              isMicroDispute: (caseData.amount || 0) < 1,
            };
          }

          return {
            ...event,
            caseData,
            paymentDispute: paymentDisputeData
          };
        }
        return event;
      })
    );
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

// Get system statistics from actual cases (not events)
export const getSystemStats = query({
  args: {
    hoursBack: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const hoursBack = args.hoursBack ?? 24;
    const cutoffTime = Date.now() - (hoursBack * 60 * 60 * 1000);
    
    // Count actual cases filed in the time period
    const recentCases = await ctx.db
      .query("cases")
      .withIndex("by_filed_at", (q) => q.gt("filedAt", cutoffTime))
      .collect();
    
    // Count resolved cases (DECIDED status) in the time period
    const resolvedCases = recentCases.filter(c =>
      c.status === "DECIDED" &&
      c.decidedAt &&
      c.decidedAt > cutoffTime
    );
    
    // Count events for activity metrics
    const recentEvents = await ctx.db
      .query("events")
      .withIndex("by_timestamp", (q) => q.gt("timestamp", cutoffTime))
      .collect();
    
    const stats = {
      totalEvents: recentEvents.length,
      agentRegistrations: recentEvents.filter(e => e.type === "AGENT_REGISTERED").length,
      disputesFiled: recentCases.length, // Count actual cases, not events
      evidenceSubmitted: recentEvents.filter(e => e.type === "EVIDENCE_SUBMITTED").length,
      casesResolved: resolvedCases.length, // Count actual resolved cases
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

// Get organization-specific events (for dashboard activity feed)
export const getOrganizationEvents = query({
  args: {
    organizationId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get all agents belonging to this organization
    const orgAgents = await ctx.db
      .query("agents")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    const orgAgentDids = new Set(orgAgents.map(a => a.did));

    // Get cases where org is the reviewer (Infrastructure Model - payment disputes via MCP)
    const reviewerCases = await ctx.db
      .query("cases")
      .withIndex("by_reviewer_org", (q) => q.eq("reviewerOrganizationId", args.organizationId))
      .collect();

    // Get all other cases and filter for org's agents
    const allCases = await ctx.db
      .query("cases")
      .collect();

    const orgCaseIds = new Set([
      // Cases where org is reviewer
      ...reviewerCases.map(c => c._id),
      // Cases where org's agents are involved
      ...allCases
        .filter(c =>
          (c.plaintiff && orgAgentDids.has(c.plaintiff)) ||
          (c.defendant && orgAgentDids.has(c.defendant))
        )
        .map(c => c._id)
    ]);

    // Get recent events
    const allEvents = await ctx.db
      .query("events")
      .withIndex("by_timestamp")
      .order("desc")
      .take(args.limit ?? 100); // Get more than needed, then filter

    // Filter events to only those relevant to this organization
    const relevantEvents = allEvents.filter(event => {
      // Include if event is about org's agent
      if (event.agentDid && orgAgentDids.has(event.agentDid)) {
        return true;
      }

      // Include if event is about org's case
      if (event.caseId && orgCaseIds.has(event.caseId)) {
        return true;
      }

      return false;
    });

    // Limit to requested count
    const limitedEvents = relevantEvents.slice(0, args.limit ?? 50);

    // Enrich events with case data
    return await Promise.all(
      limitedEvents.map(async (event) => {
        if (event.caseId) {
          const caseData = await ctx.db.get(event.caseId);

          // Fetch payment dispute data if applicable (type=PAYMENT case)
          let paymentDisputeData = undefined;
          if (event.caseId && caseData?.type === "PAYMENT") {
            paymentDisputeData = {
              amount: caseData.amount || 0,
              currency: caseData.currency || "USD",
              pricingTier: caseData.paymentDetails?.pricingTier || "micro",
              disputeFee: caseData.paymentDetails?.disputeFee || 0,
              isMicroDispute: (caseData.amount || 0) < 1,
            };
          }

          return {
            ...event,
            caseData,
            paymentDispute: paymentDisputeData
          };
        }
        return event;
      })
    );
  },
});

// Get organization-specific stats
export const getOrganizationStats = query({
  args: {
    organizationId: v.id("organizations"),
    hoursBack: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const hoursBack = args.hoursBack ?? 24;
    const cutoffTime = Date.now() - (hoursBack * 60 * 60 * 1000);

    // Get all agents belonging to this organization
    const orgAgents = await ctx.db
      .query("agents")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    const orgAgentDids = new Set(orgAgents.map(a => a.did));

    // Get all cases where org's agents are involved
    const allCases = await ctx.db
      .query("cases")
      .withIndex("by_filed_at", (q) => q.gt("filedAt", cutoffTime))
      .collect();

    const orgCases = allCases.filter(c =>
      (c.plaintiff && orgAgentDids.has(c.plaintiff)) ||
      (c.defendant && orgAgentDids.has(c.defendant))
    );

    // Get recent events for this org
    const allEvents = await ctx.db
      .query("events")
      .withIndex("by_timestamp", (q) => q.gt("timestamp", cutoffTime))
      .collect();

    const orgEvents = allEvents.filter(event => {
      if (event.agentDid && orgAgentDids.has(event.agentDid)) return true;
      if (event.caseId && orgCases.some(c => c._id === event.caseId)) return true;
      return false;
    });

    // Calculate stats
    const resolvedCases = orgCases.filter(c =>
      c.status === "DECIDED" &&
      c.decidedAt &&
      c.decidedAt > cutoffTime
    );

    // Calculate average resolution time for resolved cases
    let avgResolutionTimeMinutes = 0;
    if (resolvedCases.length > 0) {
      const totalResolutionTime = resolvedCases.reduce((sum, c) => {
        if (c.decidedAt) {
          return sum + (c.decidedAt - c.filedAt);
        }
        return sum;
      }, 0);
      avgResolutionTimeMinutes = (totalResolutionTime / resolvedCases.length) / (1000 * 60);
    }

    const pendingCases = orgCases.filter(c =>
      c.status === "FILED" || c.status === "IN_REVIEW"
    ).length;

    return {
      totalEvents: orgEvents.length,
      pendingCases,
      avgResolutionTimeMinutes,
      disputesFiled: orgCases.length,
      casesResolved: resolvedCases.length,
      timeRange: hoursBack,
      periodStart: cutoffTime,
      periodEnd: Date.now(),
    };
  },
});

// Get API key specific events (for audit trail)
export const getApiKeyEvents = query({
  args: {
    keyId: v.string(), // Can be either Id<"apiKeys"> or string representation
    eventTypes: v.optional(v.array(v.string())), // Filter by event types
  },
  handler: async (ctx, args) => {
    const allEvents = await ctx.db
      .query("events")
      .withIndex("by_timestamp")
      .order("desc")
      .collect();

    // Filter events related to this API key
    const filteredEvents = allEvents.filter(event => {
      const payload = event.payload as any;
      const matchesKey = payload?.keyId === args.keyId;

      if (!matchesKey) return false;

      // If event types filter provided, check it
      if (args.eventTypes && args.eventTypes.length > 0) {
        return args.eventTypes.includes(event.type);
      }

      return true;
    });

    return filteredEvents.map(event => ({
      _id: event._id,
      type: event.type,
      timestamp: event.timestamp,
      payload: event.payload,
      agentDid: event.agentDid,
      caseId: event.caseId,
    }));
  },
});
