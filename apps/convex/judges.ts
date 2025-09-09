import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Judge agent interfaces
export interface JudgeAgent {
  id: string;
  did: string;
  name: string;
  specialties: string[];
  reputation: number;
  casesJudged: number;
  status: "active" | "inactive";
  createdAt: number;
}

export interface JudgeVote {
  judgeId: string;
  panelId: string;
  code: string;
  reasons: string;
  confidence: number;
  submittedAt: number;
}

export interface PanelAssignment {
  caseId: string;
  panelId: string;
  judgeIds: string[];
  assignedAt: number;
  dueAt: number;
  status: "assigned" | "voting" | "completed";
}

// Judge management functions
export const registerJudge = mutation({
  args: {
    did: v.string(),
    name: v.string(),
    specialties: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if judge already exists
    const existingJudge = await ctx.db
      .query("judges")
      .withIndex("by_did", (q: any) => q.eq("did", args.did))
      .first();

    if (existingJudge) {
      throw new Error("Judge already registered");
    }

    const judgeData = {
      did: args.did,
      name: args.name,
      specialties: args.specialties,
      reputation: 100, // Starting reputation
      casesJudged: 0,
      status: "active" as const,
      createdAt: Date.now(),
    };

    const judgeId = await ctx.db.insert("judges", judgeData);

    await ctx.db.insert("events", {
      type: "JUDGE_REGISTERED",
      payload: { judgeId, did: args.did, name: args.name },
      ts: Date.now(),
    });

    return judgeId;
  },
});

// Panel assignment for complex cases
export const assignPanel = mutation({
  args: {
    caseId: v.id("cases"),
    panelSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const panelSize = args.panelSize || 3;

    // Get available judges
    const availableJudges = await ctx.db
      .query("judges")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .collect();

    if (availableJudges.length < panelSize) {
      throw new Error(`Insufficient judges available: need ${panelSize}, have ${availableJudges.length}`);
    }

    // Simple random selection for now (TODO: improve with reputation/specialty matching)
    const selectedJudges = availableJudges
      .sort(() => Math.random() - 0.5)
      .slice(0, panelSize);

    const now = Date.now();
    const dueAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

    const panelData = {
      judgeIds: selectedJudges.map(j => j.did),
      assignedAt: now,
      dueAt,
    };

    const panelId = await ctx.db.insert("panels", panelData);

    // Update case with panel assignment
    await ctx.db.patch(args.caseId, { 
      panelId,
      status: "PANELED" as const 
    });

    // Log assignment
    await ctx.db.insert("events", {
      type: "PANEL_ASSIGNED",
      payload: {
        caseId: args.caseId,
        panelId,
        judgeIds: selectedJudges.map(j => j.did),
        dueAt,
      },
      ts: now,
    });

    return panelId;
  },
});

// Judge voting function  
export const submitVote = mutation({
  args: {
    panelId: v.id("panels"),
    judgeId: v.string(),
    code: v.string(),
    reasons: v.string(),
    confidence: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get panel
    const panel = await ctx.db.get(args.panelId);
    if (!panel) {
      throw new Error("Panel not found");
    }

    // Check if judge is assigned to this panel
    if (!panel.judgeIds.includes(args.judgeId)) {
      throw new Error("Judge not assigned to this panel");
    }

    // Check if judge already voted
    const existingVote = panel.votes?.find(v => v.judgeId === args.judgeId);
    if (existingVote) {
      throw new Error("Judge has already voted on this panel");
    }

    // Create vote
    const vote = {
      judgeId: args.judgeId,
      code: args.code,
      reasons: args.reasons,
    };

    // Update panel with vote
    const updatedVotes = panel.votes ? [...panel.votes, vote] : [vote];
    await ctx.db.patch(args.panelId, { votes: updatedVotes });

    // Update judge stats
    const judge = await ctx.db
      .query("judges")
      .withIndex("by_did", (q: any) => q.eq("did", args.judgeId))
      .first();

    if (judge) {
      await ctx.db.patch(judge._id, {
        casesJudged: judge.casesJudged + 1,
      });
    }

    // Log vote
    await ctx.db.insert("events", {
      type: "JUDGE_VOTE_SUBMITTED",
      payload: {
        panelId: args.panelId,
        judgeId: args.judgeId,
        code: args.code,
        confidence: args.confidence || 0.8,
      },
      ts: Date.now(),
    });

    // Check if panel is complete (all judges voted)
    if (updatedVotes.length === panel.judgeIds.length) {
      // Panel finalization will be handled by a cron job or manual trigger
      // TODO: Add cron job to check for complete panels and finalize them
    }

    return "vote_submitted";
  },
});

// Simple judge analysis (no external LLM calls for now)
export function analyzeCase(caseType: string): { code: string; reasons: string; confidence: number } {
  // Simple hardcoded logic for demo
  if (caseType.includes("SLA_VIOLATION")) {
    return {
      code: "UPHELD",
      reasons: "Clear SLA violation based on evidence timestamps",
      confidence: 0.9,
    };
  } else if (caseType.includes("FORMAT_VIOLATION")) {
    return {
      code: "UPHELD",
      reasons: "Format does not meet specifications", 
      confidence: 0.8,
    };
  } else {
    return {
      code: "DISMISSED",
      reasons: "Insufficient evidence provided",
      confidence: 0.7,
    };
  }
}

// Simple demo function to show judge functionality  
export const createDemoJudges = mutation({
  args: {},
  handler: async (ctx, args) => {
    const judges = [
      { did: "judge:alice", name: "Judge Alice", specialties: ["sla", "performance"] },
      { did: "judge:bob", name: "Judge Bob", specialties: ["format", "compliance"] },
      { did: "judge:charlie", name: "Judge Charlie", specialties: ["delivery", "general"] },
    ];

    const judgeIds = [];
    for (const judge of judges) {
      const judgeId = await ctx.db.insert("judges", {
        ...judge,
        reputation: 100,
        casesJudged: 0,
        status: "active" as const,
        createdAt: Date.now(),
      });
      judgeIds.push(judgeId);
    }

    return { message: "Demo judges created", judgeIds };
  },
});

// Get panel status
export const getPanelStatus = query({
  args: { panelId: v.id("panels") },
  handler: async (ctx, args) => {
    const panel = await ctx.db.get(args.panelId);
    if (!panel) return null;

    const isComplete = panel.votes && panel.votes.length === panel.judgeIds.length;
    const voteCounts = panel.votes?.reduce((acc, vote) => {
      acc[vote.code] = (acc[vote.code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      ...panel,
      isComplete,
      voteCounts,
      remainingVotes: panel.judgeIds.length - (panel.votes?.length || 0),
    };
  },
});

// Get judges
export const getJudges = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("judges")
        .withIndex("by_status", (q: any) => q.eq("status", args.status))
        .collect();
    } else {
      return await ctx.db.query("judges").collect();
    }
  },
});

export const getJudgeStats = query({
  args: { judgeId: v.string() },
  handler: async (ctx, args) => {
    const judge = await ctx.db
      .query("judges")
      .withIndex("by_did", (q: any) => q.eq("did", args.judgeId))
      .first();

    if (!judge) {
      return null;
    }

    // Get recent votes
    const recentVotes = await ctx.db
      .query("events")
      .withIndex("by_type", (q: any) => q.eq("type", "JUDGE_VOTE_SUBMITTED"))
      .filter((q: any) => q.eq(q.field("payload.judgeId"), args.judgeId))
      .order("desc")
      .take(10);

    return {
      ...judge,
      recentVotes: recentVotes.length,
    };
  },
});
