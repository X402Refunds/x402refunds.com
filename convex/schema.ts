import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  owners: defineTable({
    did: v.string(),
    verificationTier: v.union(v.literal("basic"), v.literal("verified"), v.literal("premium")),
    pubkeys: v.array(v.string()),
    createdAt: v.number(),
  }).index("by_did", ["did"]),

  agents: defineTable({
    did: v.string(),
    ownerDid: v.string(),
    buildHash: v.string(),
    configHash: v.string(),
    tier: v.union(v.literal("basic"), v.literal("verified"), v.literal("premium")),
    stake: v.optional(v.number()),
    status: v.union(v.literal("active"), v.literal("suspended"), v.literal("banned")),
    createdAt: v.number(),
  })
    .index("by_did", ["did"])
    .index("by_owner", ["ownerDid"])
    .index("by_status", ["status"]),

  constitutions: defineTable({
    version: v.string(),
    policyHash: v.string(),
    bundleUrl: v.string(),
    signature: v.string(),
    activeFrom: v.number(),
    meta: v.object({
      title: v.string(),
      description: v.string(),
      author: v.string(),
    }),
  })
    .index("by_version", ["version"])
    .index("by_active_from", ["activeFrom"]),

  cases: defineTable({
    parties: v.array(v.string()), // agent DIDs
    status: v.union(
      v.literal("FILED"),
      v.literal("AUTORULED"),
      v.literal("PANELED"),
      v.literal("DECIDED"),
      v.literal("CLOSED")
    ),
    type: v.string(),
    filedAt: v.number(),
    jurisdictionTags: v.array(v.string()),
    evidenceIds: v.array(v.id("evidenceManifests")),
    panelId: v.optional(v.id("panels")),
    deadlines: v.object({
      panelDue: v.number(),
      appealDue: v.optional(v.number()),
    }),
  })
    .index("by_status", ["status"])
    .index("by_filed_at", ["filedAt"]),

  evidenceManifests: defineTable({
    caseId: v.optional(v.id("cases")),
    agentDid: v.string(),
    sha256: v.string(),
    uri: v.string(),
    signer: v.string(),
    ts: v.number(),
    model: v.object({
      provider: v.string(),
      name: v.string(),
      version: v.string(),
      seed: v.optional(v.number()),
      temp: v.optional(v.number()),
    }),
    tool: v.optional(v.string()),
  })
    .index("by_case", ["caseId"])
    .index("by_agent", ["agentDid"])
    .index("by_sha256", ["sha256"])
    .index("by_timestamp", ["ts"]),

  judges: defineTable({
    did: v.string(),
    name: v.string(),
    specialties: v.array(v.string()),
    reputation: v.number(),
    casesJudged: v.number(),
    status: v.union(v.literal("active"), v.literal("inactive")),
    createdAt: v.number(),
  })
    .index("by_did", ["did"])
    .index("by_status", ["status"]),

  panels: defineTable({
    judgeIds: v.array(v.string()),
    assignedAt: v.number(),
    dueAt: v.number(),
    votes: v.optional(v.array(v.object({
      judgeId: v.string(),
      code: v.string(),
      reasons: v.string(),
    }))),
  })
    .index("by_assigned_at", ["assignedAt"])
    .index("by_due_at", ["dueAt"]),

  rulings: defineTable({
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
    decidedAt: v.number(),
    proof: v.optional(v.object({
      merkleRoot: v.string(),
      rekorId: v.optional(v.string()),
    })),
  })
    .index("by_case", ["caseId"])
    .index("by_decided_at", ["decidedAt"])
    .index("by_verdict", ["verdict"]),

  precedents: defineTable({
    code: v.string(),
    summary: v.string(),
    rulingId: v.id("rulings"),
    ts: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_timestamp", ["ts"]),

  reputation: defineTable({
    agentDid: v.string(),
    score: v.number(),
    strikes: v.number(),
    volume: v.number(),
    lastUpdate: v.number(),
  }).index("by_agent", ["agentDid"]),

  events: defineTable({
    type: v.string(),
    payload: v.any(),
    ts: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_timestamp", ["ts"]),
});
