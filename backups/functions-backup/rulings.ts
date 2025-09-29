import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
// Types are validated by Convex schema

export const createRuling = mutation({
  args: {
    caseId: v.id("cases"),
    verdict: v.union(
      v.literal("UPHELD"),
      v.literal("DISMISSED"),
      v.literal("SPLIT"),
      v.literal("NEED_PANEL")
    ),
    code: v.string(),
    reasons: v.string(),
    auto: v.boolean(),
    proof: v.optional(v.object({
      merkleRoot: v.string(),
      rekorId: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // Check if case exists
    const case_ = await ctx.db.get(args.caseId);
    if (!case_) {
      throw new Error("Case not found");
    }

    // Check if ruling already exists
    const existingRuling = await ctx.db
      .query("rulings")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .first();

    if (existingRuling) {
      throw new Error("Ruling already exists for this case");
    }

    const ruling = {
      ...args,
      decidedAt: Date.now(),
    };

    const rulingId = await ctx.db.insert("rulings", ruling);

    // Update case status based on verdict
    let newStatus: "AUTORULED" | "PANELED" | "DECIDED" | "CLOSED";
    if (args.verdict === "NEED_PANEL") {
      newStatus = "PANELED";
    } else if (args.auto) {
      newStatus = "AUTORULED";
    } else {
      newStatus = "DECIDED";
    }

    await ctx.db.patch(args.caseId, { status: newStatus });

    // Create precedent if not NEED_PANEL
    if (args.verdict !== "NEED_PANEL") {
      const precedent = {
        code: args.code,
        summary: args.reasons.substring(0, 200) + (args.reasons.length > 200 ? "..." : ""),
        rulingId,
        timestamp: Date.now(),
      };

      await ctx.db.insert("precedents", precedent);
    }

    // Update reputation for parties
    await updatePartyReputations(ctx, case_, args.verdict);

    // Log event
    await ctx.db.insert("events", {
      type: "RULING_CREATED",
      payload: {
        rulingId,
        caseId: args.caseId,
        verdict: args.verdict,
        auto: args.auto,
      },
      timestamp: Date.now(),
    });

    return rulingId;
  },
});

async function updatePartyReputations(ctx: any, case_: any, verdict: string) {
  for (const agentDid of case_.parties) {
    let reputation = await ctx.db
      .query("reputation")
      .withIndex("by_agent", (q: any) => q.eq("agentDid", agentDid))
      .first();

    if (!reputation) {
      reputation = {
        agentDid,
        score: 100,
        strikes: 0,
        volume: 0,
        lastUpdate: Date.now(),
      };
    }

    // Update based on verdict
    let scoreChange = 0;
    let strikeChange = 0;

    switch (verdict) {
      case "UPHELD":
        // Complainant wins, defendant loses
        scoreChange = case_.parties[0] === agentDid ? 5 : -10;
        strikeChange = case_.parties[0] === agentDid ? 0 : 1;
        break;
      case "DISMISSED":
        // Defendant wins, complainant loses
        scoreChange = case_.parties[0] === agentDid ? -5 : 5;
        strikeChange = case_.parties[0] === agentDid ? 1 : 0;
        break;
      case "SPLIT":
        // No clear winner
        scoreChange = -1;
        break;
    }

    const updatedReputation = {
      ...reputation,
      score: Math.max(0, reputation.score + scoreChange),
      strikes: reputation.strikes + strikeChange,
      volume: reputation.volume + 1,
      lastUpdate: Date.now(),
    };

    if (reputation._id) {
      await ctx.db.patch(reputation._id, updatedReputation);
    } else {
      await ctx.db.insert("reputation", updatedReputation);
    }
  }
}

export const getRuling = query({
  args: { rulingId: v.id("rulings") },
  handler: async (ctx, args) => {
    const ruling = await ctx.db.get(args.rulingId);
    if (!ruling) return null;

    // Get associated case
    const case_ = await ctx.db.get(ruling.caseId);

    return {
      ...ruling,
      case: case_,
    };
  },
});

export const getRulingByCase = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rulings")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .first();
  },
});

export const getRecentRulings = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rulings")
      .withIndex("by_decided_at")
      .order("desc")
      .take(args.limit ?? 20);
  },
});

export const updateRulingProof = mutation({
  args: {
    rulingId: v.id("rulings"),
    merkleRoot: v.string(),
    rekorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ruling = await ctx.db.get(args.rulingId);
    if (!ruling) {
      throw new Error("Ruling not found");
    }

    await ctx.db.patch(args.rulingId, {
      proof: {
        merkleRoot: args.merkleRoot,
        rekorId: args.rekorId,
      },
    });

    // Log event
    await ctx.db.insert("events", {
      type: "RULING_PROOF_UPDATED",
      payload: {
        rulingId: args.rulingId,
        merkleRoot: args.merkleRoot,
        rekorId: args.rekorId,
      },
      timestamp: Date.now(),
    });

    return args.rulingId;
  },
});
